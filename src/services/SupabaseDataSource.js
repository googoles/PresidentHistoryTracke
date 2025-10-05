import { supabase } from '../lib/supabaseClient';
import { IElectionDataSource } from './IElectionDataSource';

/**
 * Supabase Data Source
 *
 * Supabase PostgreSQL을 사용하여 클라우드 DB에 접근합니다.
 * 프로덕션 환경에서 사용됩니다.
 *
 * 특징:
 * - 실시간 데이터 동기화
 * - 확장 가능한 클라우드 스토리지
 * - Row Level Security (RLS)
 * - Full Text Search 지원
 */
export class SupabaseDataSource extends IElectionDataSource {
  constructor() {
    super();
    this.client = supabase;
  }

  /**
   * Supabase는 연결이 자동으로 관리되므로 init은 no-op
   */
  async init() {
    console.log('[Supabase] Using Supabase client');

    // Test connection
    const { error } = await this.client
      .from('candidates')
      .select('count', { count: 'exact', head: true });

    if (error) {
      console.error('[Supabase] Connection test failed:', error);
      throw error;
    }

    console.log('[Supabase] Connection successful');
  }

  /**
   * 선거구명으로 당선자 조회
   */
  async getWinnerByDistrict(districtName) {
    const { data, error } = await this.client
      .from('candidates')
      .select('*')
      .eq('sgg_name', districtName)
      .eq('is_winner', true)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
      console.error('[Supabase] Error fetching winner:', error);
      throw error;
    }

    return data || null;
  }

  /**
   * 후보자 ID로 공약 목록 조회
   */
  async getPledgesByCandidate(candidateId) {
    const { data, error } = await this.client
      .from('pledges')
      .select('*')
      .eq('hubo_id', candidateId)
      .order('pledge_order', { ascending: true });

    if (error) {
      console.error('[Supabase] Error fetching pledges:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * 지역별 당선자 목록 조회
   */
  async getWinnersByRegion(regionKey, districtNames) {
    if (!districtNames || districtNames.length === 0) {
      return [];
    }

    const { data, error } = await this.client
      .from('candidates')
      .select('*')
      .in('sgg_name', districtNames)
      .eq('is_winner', true)
      .order('sgg_name', { ascending: true });

    if (error) {
      console.error('[Supabase] Error fetching winners by region:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * 공약 이행 통계 조회
   */
  async getPledgeStatistics(candidateId) {
    const { data, error } = await this.client
      .from('pledges')
      .select('status')
      .eq('hubo_id', candidateId);

    if (error) {
      console.error('[Supabase] Error fetching pledge statistics:', error);
      throw error;
    }

    const stats = {
      total: data.length,
      completed: 0,
      inProgress: 0,
      pending: 0,
      suspended: 0
    };

    data.forEach(pledge => {
      if (pledge.status === '완료') stats.completed++;
      else if (pledge.status === '진행중') stats.inProgress++;
      else if (pledge.status === '준비중') stats.pending++;
      else if (pledge.status === '보류' || pledge.status === '중단') stats.suspended++;
    });

    return stats;
  }

  /**
   * 모든 당선자 조회
   */
  async getAllWinners() {
    const { data, error } = await this.client
      .from('candidates')
      .select('*')
      .eq('is_winner', true)
      .order('sgg_name', { ascending: true });

    if (error) {
      console.error('[Supabase] Error fetching all winners:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * 후보자 검색
   */
  async searchCandidates(searchQuery) {
    const { data, error } = await this.client
      .from('candidates')
      .select('*')
      .eq('is_winner', true)
      .or(`name.ilike.%${searchQuery}%,party_name.ilike.%${searchQuery}%,sgg_name.ilike.%${searchQuery}%`)
      .order('sgg_name', { ascending: true })
      .limit(50);

    if (error) {
      console.error('[Supabase] Error searching candidates:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * 정당별 당선자 목록
   */
  async getWinnersByParty(partyName) {
    const { data, error } = await this.client
      .from('candidates')
      .select('*')
      .eq('is_winner', true)
      .eq('party_name', partyName)
      .order('sgg_name', { ascending: true });

    if (error) {
      console.error('[Supabase] Error fetching winners by party:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * 공약 상태별 조회
   */
  async getPledgesByStatus(status) {
    const { data, error } = await this.client
      .from('pledges')
      .select(`
        *,
        candidates!inner (
          name,
          sgg_name,
          party_name,
          is_winner
        )
      `)
      .eq('status', status)
      .eq('candidates.is_winner', true)
      .order('last_updated', { ascending: false })
      .limit(100);

    if (error) {
      console.error('[Supabase] Error fetching pledges by status:', error);
      throw error;
    }

    // Flatten the nested structure
    return (data || []).map(pledge => ({
      ...pledge,
      candidate_name: pledge.candidates.name,
      sgg_name: pledge.candidates.sgg_name,
      party_name: pledge.candidates.party_name
    }));
  }

  /**
   * 선거 정보 조회
   */
  async getElection(electionId) {
    const { data, error } = await this.client
      .from('elections')
      .select('*')
      .eq('sg_id', electionId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('[Supabase] Error fetching election:', error);
      throw error;
    }

    return data || null;
  }

  /**
   * 정당 목록 조회
   */
  async getAllParties() {
    const { data, error } = await this.client
      .from('candidates')
      .select('party_name')
      .eq('is_winner', true)
      .not('party_name', 'is', null)
      .order('party_name', { ascending: true });

    if (error) {
      console.error('[Supabase] Error fetching parties:', error);
      throw error;
    }

    // Get unique party names
    const uniqueParties = [...new Set(data.map(r => r.party_name))];
    return uniqueParties;
  }

  /**
   * 후보자와 공약을 함께 조회
   */
  async getCandidateWithPledges(candidateId) {
    // Get candidate by district name
    const { data: candidate, error: candidateError } = await this.client
      .from('candidates')
      .select('*')
      .eq('sgg_name', candidateId)
      .eq('is_winner', true)
      .single();

    if (candidateError) {
      if (candidateError.code === 'PGRST116') return null;
      console.error('[Supabase] Error fetching candidate:', candidateError);
      throw candidateError;
    }

    if (!candidate) return null;

    const pledges = await this.getPledgesByCandidate(candidate.hubo_id);
    const statistics = await this.getPledgeStatistics(candidate.hubo_id);

    return {
      ...candidate,
      pledges,
      statistics
    };
  }

  /**
   * 모든 공약 조회 (당선자의 공약만)
   */
  async getAllPledges() {
    const { data, error } = await this.client
      .from('pledges')
      .select(`
        *,
        candidates!inner (
          name,
          sgg_name,
          party_name,
          is_winner
        )
      `)
      .eq('candidates.is_winner', true)
      .order('candidates(sgg_name)', { ascending: true })
      .order('pledge_order', { ascending: true });

    if (error) {
      console.error('[Supabase] Error fetching all pledges:', error);
      throw error;
    }

    // Flatten the nested structure
    return (data || []).map(pledge => ({
      ...pledge,
      candidate_name: pledge.candidates.name,
      sgg_name: pledge.candidates.sgg_name,
      party_name: pledge.candidates.party_name
    }));
  }

  /**
   * 연결 종료 (Supabase는 자동 관리)
   */
  async close() {
    console.log('[Supabase] Client connection is managed automatically');
  }
}

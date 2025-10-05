import initSqlJs from 'sql.js';
import { IElectionDataSource } from './IElectionDataSource';

/**
 * Local SQLite Database Data Source
 *
 * sql.js를 사용하여 브라우저에서 SQLite DB에 접근합니다.
 * 개발 및 디버깅 환경에서 빠른 프로토타이핑을 위해 사용됩니다.
 *
 * 특징:
 * - 네트워크 불필요 (오프라인 작동)
 * - DB 파일 직접 수정 가능
 * - 빠른 로컬 쿼리
 * - Supabase 전환 시 코드 변경 최소화
 */
export class LocalDBDataSource extends IElectionDataSource {
  /**
   * @param {string} dbPath - DB 파일 경로 (public/ 기준)
   */
  constructor(dbPath = '/data/election_data.db') {
    super();
    this.dbPath = dbPath;
    this.db = null;
    this.SQL = null;
  }

  /**
   * sql.js 초기화 및 DB 로드
   */
  async init() {
    console.log('[LocalDB] Initializing sql.js...');

    try {
      // sql.js WASM 모듈 로드
      this.SQL = await initSqlJs({
        locateFile: file => `https://sql.js.org/dist/${file}`
      });

      // DB 파일 fetch
      console.log(`[LocalDB] Loading database from ${this.dbPath}...`);
      const response = await fetch(this.dbPath);

      if (!response.ok) {
        throw new Error(`Failed to fetch DB: ${response.statusText}`);
      }

      const buffer = await response.arrayBuffer();
      this.db = new this.SQL.Database(new Uint8Array(buffer));

      console.log('[LocalDB] Database loaded successfully');

      // 테이블 존재 확인
      const tables = this._exec("SELECT name FROM sqlite_master WHERE type='table'");
      console.log('[LocalDB] Available tables:', tables.map(t => t.name));

    } catch (error) {
      console.error('[LocalDB] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * SQL 쿼리 실행 및 결과 파싱
   * @private
   */
  _exec(query, params = []) {
    if (!this.db) {
      throw new Error('Database not initialized. Call init() first.');
    }

    try {
      const results = this.db.exec(query, params);

      if (results.length === 0) {
        return [];
      }

      const { columns, values } = results[0];

      // 결과를 객체 배열로 변환
      return values.map(row => {
        const obj = {};
        columns.forEach((col, index) => {
          obj[col] = row[index];
        });
        return obj;
      });

    } catch (error) {
      console.error('[LocalDB] Query error:', error, '\nQuery:', query);
      throw error;
    }
  }

  /**
   * 선거구명으로 당선자 조회
   */
  async getWinnerByDistrict(districtName) {
    const query = `
      SELECT * FROM Candidates
      WHERE sgg_name = ? AND is_winner = 1
      LIMIT 1
    `;

    const results = this._exec(query, [districtName]);
    return results[0] || null;
  }

  /**
   * 후보자 ID로 공약 목록 조회
   */
  async getPledgesByCandidate(candidateId) {
    const query = `
      SELECT * FROM Pledges
      WHERE hubo_id = ?
      ORDER BY pledge_order ASC
    `;

    return this._exec(query, [candidateId]);
  }

  /**
   * 지역별 당선자 목록 조회
   * districts.json의 district name을 기준으로 조회
   */
  async getWinnersByRegion(regionKey, districtNames) {
    if (!districtNames || districtNames.length === 0) {
      return [];
    }

    // IN 절을 위한 placeholders 생성
    const placeholders = districtNames.map(() => '?').join(',');

    const query = `
      SELECT * FROM Candidates
      WHERE sgg_name IN (${placeholders}) AND is_winner = 1
      ORDER BY sgg_name ASC
    `;

    return this._exec(query, districtNames);
  }

  /**
   * 공약 이행 통계 조회
   */
  async getPledgeStatistics(candidateId) {
    const query = `
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = '완료' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = '진행중' THEN 1 ELSE 0 END) as inProgress,
        SUM(CASE WHEN status = '준비중' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = '보류' OR status = '중단' THEN 1 ELSE 0 END) as suspended
      FROM Pledges
      WHERE hubo_id = ?
    `;

    const results = this._exec(query, [candidateId]);
    return results[0] || {
      total: 0,
      completed: 0,
      inProgress: 0,
      pending: 0,
      suspended: 0
    };
  }

  /**
   * 모든 당선자 조회
   */
  async getAllWinners() {
    const query = `
      SELECT * FROM Candidates
      WHERE is_winner = 1
      ORDER BY sgg_name ASC
    `;

    return this._exec(query);
  }

  /**
   * 후보자 검색
   */
  async searchCandidates(searchQuery) {
    const query = `
      SELECT * FROM Candidates
      WHERE is_winner = 1
        AND (
          name LIKE ? OR
          party_name LIKE ? OR
          sgg_name LIKE ?
        )
      ORDER BY sgg_name ASC
      LIMIT 50
    `;

    const likePattern = `%${searchQuery}%`;
    return this._exec(query, [likePattern, likePattern, likePattern]);
  }

  /**
   * 정당별 당선자 목록
   */
  async getWinnersByParty(partyName) {
    const query = `
      SELECT * FROM Candidates
      WHERE is_winner = 1 AND party_name = ?
      ORDER BY sgg_name ASC
    `;

    return this._exec(query, [partyName]);
  }

  /**
   * 공약 상태별 조회
   */
  async getPledgesByStatus(status) {
    const query = `
      SELECT p.*, c.name as candidate_name, c.sgg_name, c.party_name
      FROM Pledges p
      JOIN Candidates c ON p.hubo_id = c.hubo_id
      WHERE p.status = ? AND c.is_winner = 1
      ORDER BY p.last_updated DESC
      LIMIT 100
    `;

    return this._exec(query, [status]);
  }

  /**
   * 선거 정보 조회
   */
  async getElection(electionId) {
    const query = `
      SELECT * FROM Elections
      WHERE sg_id = ?
      LIMIT 1
    `;

    const results = this._exec(query, [electionId]);
    return results[0] || null;
  }

  /**
   * 정당 목록 조회
   */
  async getAllParties() {
    const query = `
      SELECT DISTINCT party_name
      FROM Candidates
      WHERE is_winner = 1 AND party_name IS NOT NULL
      ORDER BY party_name ASC
    `;

    const results = this._exec(query);
    return results.map(r => r.party_name);
  }

  /**
   * 후보자와 공약을 함께 조회 (JOIN)
   */
  async getCandidateWithPledges(candidateId) {
    const candidate = await this.getWinnerByDistrict(candidateId);

    if (!candidate) {
      return null;
    }

    const pledges = await this.getPledgesByCandidate(candidate.hubo_id);
    const statistics = await this.getPledgeStatistics(candidate.hubo_id);

    return {
      ...candidate,
      pledges,
      statistics
    };
  }

  /**
   * 연결 종료
   */
  async close() {
    if (this.db) {
      this.db.close();
      this.db = null;
      console.log('[LocalDB] Database connection closed');
    }
  }
}

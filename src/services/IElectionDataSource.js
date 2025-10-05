/**
 * Election Data Source Interface
 *
 * 선거 데이터 소스의 공통 인터페이스를 정의합니다.
 * Local DB (sql.js)와 Supabase 모두 이 인터페이스를 구현하여
 * 개발 환경과 프로덕션 환경 간 무중단 전환을 지원합니다.
 *
 * @abstract
 */
export class IElectionDataSource {
  /**
   * 데이터 소스 초기화
   * Local DB: DB 파일 로드 및 sql.js 초기화
   * Supabase: 클라이언트 연결 확인
   */
  async init() {
    throw new Error('init() must be implemented');
  }

  /**
   * 선거구명으로 당선자 조회
   * @param {string} districtName - 선거구명 (예: "종로구", "강남구 갑")
   * @returns {Promise<Object|null>} 당선자 정보 또는 null
   */
  async getWinnerByDistrict(districtName) {
    throw new Error('getWinnerByDistrict() must be implemented');
  }

  /**
   * 후보자 ID로 공약 목록 조회
   * @param {number} candidateId - 후보자 고유 ID (hubo_id)
   * @returns {Promise<Array>} 공약 목록 배열
   */
  async getPledgesByCandidate(candidateId) {
    throw new Error('getPledgesByCandidate() must be implemented');
  }

  /**
   * 지역(광역)별 당선자 목록 조회
   * @param {string} regionKey - 지역 키 (예: "seoul", "busan")
   * @returns {Promise<Array>} 당선자 목록 배열
   */
  async getWinnersByRegion(regionKey) {
    throw new Error('getWinnersByRegion() must be implemented');
  }

  /**
   * 후보자의 공약 이행 통계 조회
   * @param {number} candidateId - 후보자 고유 ID
   * @returns {Promise<Object>} 통계 정보 { total, completed, inProgress, ... }
   */
  async getPledgeStatistics(candidateId) {
    throw new Error('getPledgeStatistics() must be implemented');
  }

  /**
   * 모든 당선자 목록 조회
   * @returns {Promise<Array>} 전체 당선자 목록
   */
  async getAllWinners() {
    throw new Error('getAllWinners() must be implemented');
  }

  /**
   * 후보자 검색 (이름, 정당, 선거구)
   * @param {string} query - 검색 쿼리
   * @returns {Promise<Array>} 검색 결과 배열
   */
  async searchCandidates(query) {
    throw new Error('searchCandidates() must be implemented');
  }

  /**
   * 정당별 당선자 목록 조회
   * @param {string} partyName - 정당명 (예: "더불어민주당", "국민의힘")
   * @returns {Promise<Array>} 당선자 목록
   */
  async getWinnersByParty(partyName) {
    throw new Error('getWinnersByParty() must be implemented');
  }

  /**
   * 공약 상태별 조회
   * @param {string} status - 공약 상태 (예: "준비중", "진행중", "완료")
   * @returns {Promise<Array>} 공약 목록
   */
  async getPledgesByStatus(status) {
    throw new Error('getPledgesByStatus() must be implemented');
  }

  /**
   * 선거 정보 조회
   * @param {string} electionId - 선거 ID (예: "20240410")
   * @returns {Promise<Object>} 선거 정보
   */
  async getElection(electionId) {
    throw new Error('getElection() must be implemented');
  }

  /**
   * 데이터베이스 연결 종료
   */
  async close() {
    throw new Error('close() must be implemented');
  }
}

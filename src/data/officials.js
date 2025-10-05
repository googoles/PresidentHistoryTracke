/**
 * Officials Data Provider - DB Based
 *
 * DB에서 당선자 정보를 가져와서 officials 형식으로 변환
 * 기존 officials.json 대체
 */

/**
 * DB 후보자 데이터를 officials 형식으로 변환
 *
 * @param {Object} candidate - DB Candidates 테이블의 row
 * @param {Array} pledges - 해당 후보자의 공약 목록
 * @param {Object} statistics - 공약 통계
 * @returns {Object} officials.json 형식의 객체
 */
export function transformCandidateToOfficial(candidate, pledges = [], statistics = {}) {
  if (!candidate) return null;

  // 선거구명에서 지역 추출 (예: "종로구" -> seoul)
  const regionKey = extractRegionKey(candidate.sgg_name);

  return {
    id: `rep-${candidate.hubo_id}`,
    name: candidate.name,
    position: `국회의원 (${candidate.sgg_name})`,
    party: candidate.party_name,
    term: '2024.05.30 ~ 2028.05.29',  // 제22대 국회 임기
    profileImage: `/images/representatives/${candidate.hubo_id}.jpg`,
    level: 'district',  // 선거구 레벨
    region: regionKey,
    district: candidate.sgg_name,

    // 선거 정보
    votes: candidate.votes_won,
    votePercentage: candidate.vote_percentage,
    age: candidate.age,
    gender: candidate.gender,
    job: candidate.job,
    education: candidate.edu,
    career: [candidate.career1, candidate.career2].filter(Boolean),

    // 공약 정보
    promiseIds: pledges.map(p => `pledge-${p.pledge_id}`),
    totalPromises: statistics.total || pledges.length,
    completedPromises: statistics.completed || 0,
    inProgressPromises: statistics.inProgress || 0,
    pendingPromises: statistics.pending || 0,
    suspendedPromises: statistics.suspended || 0
  };
}

/**
 * 선거구명에서 지역 키 추출
 */
function extractRegionKey(districtName) {
  // 서울
  if (districtName.includes('구') && !districtName.includes('시')) {
    return 'seoul';
  }

  // 경기도
  const gyeonggiCities = ['고양', '수원', '성남', '용인', '부천', '안산', '안양', '남양주', '화성', '평택', '의정부', '시흥', '파주', '김포', '광명', '광주', '군포', '오산', '이천', '양주', '안성', '구리', '포천', '의왕', '하남', '여주', '동두천', '과천'];
  if (gyeonggiCities.some(city => districtName.includes(city))) {
    return 'gyeonggi';
  }

  // 부산
  if (districtName.includes('부산') || ['해운대', '사하', '동래', '남구', '북구', '사상', '금정', '연제', '수영', '기장'].some(d => districtName.startsWith(d))) {
    return 'busan';
  }

  // 대구
  if (districtName.includes('대구') || ['달서', '달성', '수성'].some(d => districtName.startsWith(d))) {
    return 'daegu';
  }

  // 인천
  if (districtName.includes('인천') || ['계양', '부평', '남동', '연수', '중구·강화군·옹진군'].some(d => districtName.includes(d))) {
    return 'incheon';
  }

  // 광주
  if (districtName.includes('광주') && !districtName.includes('시')) {
    return 'gwangju';
  }

  // 대전
  if (districtName.includes('대전') || districtName.includes('유성') || districtName.includes('대덕')) {
    return 'daejeon';
  }

  // 울산
  if (districtName.includes('울산') || districtName.includes('울주')) {
    return 'ulsan';
  }

  // 세종
  if (districtName.includes('세종')) {
    return 'sejong';
  }

  // 강원
  if (['춘천', '원주', '강릉', '동해', '태백', '속초', '삼척', '홍천', '횡성', '영월', '평창', '정선', '철원', '화천', '양구', '인제', '고성', '양양'].some(city => districtName.includes(city))) {
    return 'gangwon';
  }

  // 충북
  if (['청주', '충주', '제천', '보은', '옥천', '영동', '증평', '진천', '괴산', '음성', '단양'].some(city => districtName.includes(city))) {
    return 'chungbuk';
  }

  // 충남
  if (['천안', '공주', '보령', '아산', '서산', '논산', '계룡', '당진', '금산', '부여', '서천', '청양', '홍성', '예산', '태안'].some(city => districtName.includes(city))) {
    return 'chungnam';
  }

  // 전북
  if (['전주', '군산', '익산', '정읍', '남원', '김제', '완주', '진안', '무주', '장수', '임실', '순창', '고창', '부안'].some(city => districtName.includes(city))) {
    return 'jeonbuk';
  }

  // 전남
  if (['목포', '여수', '순천', '나주', '광양', '담양', '곡성', '구례', '고흥', '보성', '화순', '장흥', '강진', '해남', '영암', '무안', '함평', '영광', '장성', '완도', '진도', '신안'].some(city => districtName.includes(city))) {
    return 'jeonnam';
  }

  // 경북
  if (['포항', '경주', '김천', '안동', '구미', '영주', '영천', '상주', '문경', '경산', '군위', '의성', '청송', '영양', '영덕', '청도', '고령', '성주', '칠곡', '예천', '봉화', '울진', '울릉'].some(city => districtName.includes(city))) {
    return 'gyeongbuk';
  }

  // 경남
  if (['창원', '진주', '통영', '사천', '김해', '밀양', '거제', '양산', '의령', '함안', '창녕', '고성', '남해', '하동', '산청', '함양', '거창', '합천'].some(city => districtName.includes(city))) {
    return 'gyeongnam';
  }

  // 제주
  if (districtName.includes('제주') || districtName.includes('서귀포')) {
    return 'jeju';
  }

  return 'unknown';
}

/**
 * 여러 후보자를 officials 배열로 변환
 */
export async function transformCandidatesToOfficials(dataSource, candidates) {
  const officials = [];

  for (const candidate of candidates) {
    const pledges = await dataSource.getPledgesByCandidate(candidate.hubo_id);
    const statistics = await dataSource.getPledgeStatistics(candidate.hubo_id);
    const official = transformCandidateToOfficial(candidate, pledges, statistics);

    if (official) {
      officials.push(official);
    }
  }

  return officials;
}

/**
 * Regions Data - DB Based
 *
 * 기존 하드코딩 데이터를 DB의 당선자 정보로 대체
 * 지역 정보는 districts.json과 DB의 당선자 정보를 조합하여 생성
 */

// 기본 지역 메타데이터 (인구, 타입 등은 유지)
export const regionMetadata = {
  national: {
    name: '대한민국',
    type: 'national',
    population: '51,628,117',
    districts: 254  // 전체 선거구 수
  },
  seoul: {
    name: '서울특별시',
    type: 'metropolitan',
    population: '9,720,846',
    districts: 48
  },
  busan: {
    name: '부산광역시',
    type: 'metropolitan',
    population: '3,349,016',
    districts: 18
  },
  daegu: {
    name: '대구광역시',
    type: 'metropolitan',
    population: '2,385,412',
    districts: 12
  },
  incheon: {
    name: '인천광역시',
    type: 'metropolitan',
    population: '2,948,375',
    districts: 14
  },
  gwangju: {
    name: '광주광역시',
    type: 'metropolitan',
    population: '1,441,611',
    districts: 8
  },
  daejeon: {
    name: '대전광역시',
    type: 'metropolitan',
    population: '1,452,251',
    districts: 7
  },
  ulsan: {
    name: '울산광역시',
    type: 'metropolitan',
    population: '1,121,592',
    districts: 6
  },
  sejong: {
    name: '세종특별자치시',
    type: 'special',
    population: '371,895',
    districts: 2
  },
  gyeonggi: {
    name: '경기도',
    type: 'province',
    population: '13,565,450',
    districts: 60
  },
  gangwon: {
    name: '강원특별자치도',
    type: 'special',
    population: '1,536,448',
    districts: 8
  },
  chungbuk: {
    name: '충청북도',
    type: 'province',
    population: '1,597,179',
    districts: 8
  },
  chungnam: {
    name: '충청남도',
    type: 'province',
    population: '2,119,257',
    districts: 11
  },
  jeonbuk: {
    name: '전북특별자치도',
    type: 'special',
    population: '1,786,855',
    districts: 10
  },
  jeonnam: {
    name: '전라남도',
    type: 'province',
    population: '1,832,803',
    districts: 10
  },
  gyeongbuk: {
    name: '경상북도',
    type: 'province',
    population: '2,626,609',
    districts: 13
  },
  gyeongnam: {
    name: '경상남도',
    type: 'province',
    population: '3,314,183',
    districts: 16
  },
  jeju: {
    name: '제주특별자치도',
    type: 'special',
    population: '674,635',
    districts: 3
  }
};

/**
 * 지역 키를 선거구명에서 추출
 * 예: "종로구" -> "seoul", "김해시 갑" -> "gyeongnam"
 */
export function getRegionKeyFromDistrict(districtName) {
  // districts.json에서 역매핑
  const districtToRegion = {
    // 서울 (48개)
    '종로구': 'seoul',
    '중구·성동구 갑': 'seoul',
    '중구·성동구 을': 'seoul',
    '용산구': 'seoul',
    '강남구 갑': 'seoul',
    '강남구 을': 'seoul',
    '강남구 병': 'seoul',
    // ... (254개 모두 매핑 - 실제로는 자동 생성 필요)
  };

  return districtToRegion[districtName] || null;
}

// 구버전 호환성을 위한 export (나중에 제거 예정)
export const regions = regionMetadata;

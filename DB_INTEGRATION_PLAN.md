# Election Database Integration Plan
제22대 국회의원 선거 데이터베이스 통합 계획서

## 📊 데이터베이스 스키마 분석

### 현재 DB 구조 (`data/election_data.db`)

```sql
-- 선거 정보 (1 row)
Elections
├── sg_id: "20240410" (선거코드)
├── election_name: "제22대 국회의원선거"
└── election_date: "2024-04-10"

-- 후보자 정보 (699 rows)
Candidates
├── hubo_id (후보자 고유ID)
├── sg_id (선거코드)
├── name (후보자명)
├── party_name (정당명)
├── sgg_name (선거구명) ⭐ 중요
├── gender, age, job, edu
├── career1, career2
├── is_winner (당선여부: 0/1) ⭐ 중요
├── votes_won (득표수)
└── vote_percentage (득표율)

-- 공약 정보 (7,523 rows)
Pledges
├── pledge_id (공약 고유ID)
├── hubo_id (후보자ID)
├── pledge_order (공약 순서)
├── pledge_realm (공약 분야)
├── pledge_title (공약 제목)
├── pledge_content (공약 내용)
├── status (이행상태: "준비중" 등) ⭐ 중요
└── last_updated (최종 업데이트)
```

### 데이터 통계
- **선거**: 1건 (제22대 국회의원선거)
- **후보자**: 699명 (당선자 약 300명, 낙선자 약 399명)
- **공약**: 7,523개 (평균 후보자당 10.7개)
- **선거구**: 254개 (전국)

---

## 🏗️ 개발 전략: Local → Supabase 마이그레이션

### 단계별 접근법
```
Phase 1: Local Development (빠른 프로토타입)
├── SQLite (election_data.db) 사용
├── 서비스 레이어 추상화 (DataSource 인터페이스)
└── UI 컴포넌트 개발 및 디버깅

Phase 2: Production (Supabase 배포)
├── Supabase 테이블 생성 및 마이그레이션
├── DataSource 구현체만 교체
└── UI 코드 변경 없음 ✅
```

### 추상화 레이어 설계
```javascript
// 인터페이스: src/services/IElectionDataSource.js
interface IElectionDataSource {
  getWinnerByDistrict(districtName)
  getPledgesByCandidate(candidateId)
  getWinnersByRegion(regionKey)
  getPledgeStatistics(candidateId)
}

// 구현 1: src/services/LocalDBDataSource.js (개발용)
class LocalDBDataSource implements IElectionDataSource {
  constructor(dbPath = './data/election_data.db')
}

// 구현 2: src/services/SupabaseDataSource.js (프로덕션)
class SupabaseDataSource implements IElectionDataSource {
  constructor(supabaseClient)
}

// 사용: src/contexts/ElectionDataContext.jsx
const dataSource = process.env.REACT_APP_USE_SUPABASE
  ? new SupabaseDataSource(supabaseClient)
  : new LocalDBDataSource();
```

**장점:**
- ✅ 로컬 개발 시 빠른 디버깅 (DB 파일 직접 수정)
- ✅ 네트워크 없이 개발 가능
- ✅ Supabase 전환 시 서비스 레이어만 교체
- ✅ UI 컴포넌트 코드 변경 불필요

---

## 🎯 현재 애플리케이션 구조

### 기존 데이터 모델 (`src/data/promises.json`)
```javascript
{
  "national": [
    {
      id: "nat-001",
      title: "250만호 주택 공급",
      category: "부동산정책",
      level: "national",
      officialId: "president-yoon",
      officialName: "윤석열",
      status: "진행중",
      progress: 42,
      startDate, targetDate,
      applicableRegions: ["seoul", "busan"],
      relatedArticles: [...],
      statistics: [...]
    }
  ],
  "regional": { ... }
}
```

### 지역 매핑 (`src/data/districts.json`)
```javascript
{
  "seoul": {
    "name": "서울특별시",
    "districts": [
      { "name": "종로구", "position": { "x": 45.5, "y": 23.2 } },
      // ... 48개 선거구
    ]
  }
  // ... 16개 광역단체
}
```

---

## 🔄 통합 전략

### Phase 1: 데이터 레이어 구축 (추상화 우선)

#### 1.1 데이터 소스 인터페이스 정의
**파일**: `src/services/IElectionDataSource.js`

```javascript
/**
 * 선거 데이터 소스 인터페이스
 * Local DB와 Supabase 모두 이 인터페이스를 구현
 */
export class IElectionDataSource {
  async getWinnerByDistrict(districtName) { throw new Error('Not implemented'); }
  async getPledgesByCandidate(candidateId) { throw new Error('Not implemented'); }
  async getWinnersByRegion(regionKey) { throw new Error('Not implemented'); }
  async getPledgeStatistics(candidateId) { throw new Error('Not implemented'); }
  async getAllWinners() { throw new Error('Not implemented'); }
  async searchCandidates(query) { throw new Error('Not implemented'); }
}
```

#### 1.2 Local DB 구현 (개발용)
**파일**: `src/services/LocalDBDataSource.js`

```javascript
import initSqlJs from 'sql.js';
import { IElectionDataSource } from './IElectionDataSource';

/**
 * SQLite 로컬 DB 데이터 소스 (개발 및 디버깅용)
 * - 빠른 프로토타입 개발
 * - 네트워크 불필요
 * - DB 파일 직접 수정 가능
 */
export class LocalDBDataSource extends IElectionDataSource {
  constructor(dbPath = '/data/election_data.db') {
    super();
    this.dbPath = dbPath;
    this.db = null;
  }

  async init() {
    const SQL = await initSqlJs({
      locateFile: file => `https://sql.js.org/dist/${file}`
    });

    const response = await fetch(this.dbPath);
    const buffer = await response.arrayBuffer();
    this.db = new SQL.Database(new Uint8Array(buffer));
  }

  async getWinnerByDistrict(districtName) {
    const query = `
      SELECT * FROM Candidates
      WHERE sgg_name = ? AND is_winner = 1
      LIMIT 1
    `;
    const result = this.db.exec(query, [districtName]);
    return this._parseResult(result)[0];
  }

  async getPledgesByCandidate(candidateId) {
    const query = `
      SELECT * FROM Pledges
      WHERE hubo_id = ?
      ORDER BY pledge_order ASC
    `;
    const result = this.db.exec(query, [candidateId]);
    return this._parseResult(result);
  }

  // ... 나머지 메서드 구현
}
```

#### 1.3 Supabase 구현 (프로덕션용)
**파일**: `src/services/SupabaseDataSource.js`

```javascript
import { IElectionDataSource } from './IElectionDataSource';

/**
 * Supabase 데이터 소스 (프로덕션)
 * - 실시간 업데이트
 * - 확장성
 * - 인증 및 권한 관리
 */
export class SupabaseDataSource extends IElectionDataSource {
  constructor(supabaseClient) {
    super();
    this.supabase = supabaseClient;
  }

  async getWinnerByDistrict(districtName) {
    const { data, error } = await this.supabase
      .from('candidates')
      .select('*')
      .eq('sgg_name', districtName)
      .eq('is_winner', true)
      .single();

    if (error) throw error;
    return data;
  }

  async getPledgesByCandidate(candidateId) {
    const { data, error } = await this.supabase
      .from('pledges')
      .select('*')
      .eq('hubo_id', candidateId)
      .order('pledge_order', { ascending: true });

    if (error) throw error;
    return data;
  }

  // ... 나머지 메서드 구현
}
```

**주요 기능**:
- `sgg_name` → `districts.json`의 `name` 매핑
- is_winner = 1인 후보자만 필터링
- Pledges 테이블과 JOIN하여 공약 데이터 제공
- **인터페이스 통일로 구현체 교체 가능**

#### 1.2 선거구명 매핑 테이블
**파일**: `src/data/districtMapping.json`

```json
{
  "종로구": { "region": "seoul", "districtIndex": 0 },
  "중구·성동구 갑": { "region": "seoul", "districtIndex": 1 },
  "김해시 갑": { "region": "gyeongnam", "districtIndex": 0 }
}
```

**이유**: DB의 `sgg_name`과 UI의 district name 정확한 매칭 필요

---

### Phase 2: UI 컴포넌트 확장

#### 2.1 선거구 상세 패널 추가
**컴포넌트**: `src/components/DistrictDetailPanel.jsx`

**표시 내용**:
```
┌─────────────────────────────────────┐
│ 📍 서울 종로구                       │
├─────────────────────────────────────┤
│ 🏛️ 국회의원                         │
│ • 이름: 곽상언 (더불어민주당)        │
│ • 득표율: 50.92% (44,713표)         │
│                                     │
│ 📋 주요 공약 (10개)                  │
│ 1. ✅ 달성: 지역 교통망 확충         │
│    └ 완료일: 2024-10-15             │
│ 2. 🔄 진행중: 청년 주택 공급 (65%)   │
│ 3. ⏸️ 준비중: 문화시설 건립          │
│                                     │
│ [전체 공약 보기 →]                   │
└─────────────────────────────────────┘
```

#### 2.2 StaticMapSelector 확장
```javascript
// 기존: 지역(province) 클릭 → zoom
// 추가: 선거구(district) 클릭 → DistrictDetailPanel 표시

const handleDistrictClick = async (district) => {
  const winner = await electionDB.getWinnerByDistrict(district.name);
  const pledges = await electionDB.getPledgesByCandidate(winner.hubo_id);

  setSelectedDistrict({
    ...district,
    winner,
    pledges
  });
};
```

---

### Phase 3: 데이터 통합 로직

#### 3.1 공약 상태 매핑
**DB → App 상태 변환**:
```javascript
const STATUS_MAPPING = {
  "준비중": { status: "미달성", progress: 0 },
  "진행중": { status: "진행중", progress: 50 },
  "완료": { status: "달성", progress: 100 },
  "보류": { status: "중단", progress: 0 }
};
```

#### 3.2 카테고리 매핑
**`pledge_realm` → `category` 변환**:
```javascript
const CATEGORY_MAPPING = {
  "교통": "교통인프라",
  "주택": "부동산정책",
  "복지": "복지정책",
  "교육": "교육정책",
  // ... 12개 카테고리 매핑
};
```

#### 3.3 통합 데이터 모델
```javascript
// 기존 promises.json (대통령/광역단체장 공약)
// + DB 데이터 (국회의원 공약)
const unifiedPromises = {
  national: [...presidentialPromises],  // 기존 유지
  regional: {
    seoul: {
      governor: [...governorPromises],   // 기존 유지
      districts: {
        "종로구": {
          representative: {
            name: "곽상언",
            party: "더불어민주당",
            votePercentage: 50.92
          },
          pledges: [
            {
              id: "pledge-4329",
              title: "빠르고 편리한 대중교통체계 구축",
              category: "교통인프라",
              status: "진행중",
              progress: 35,
              content: "...",
              lastUpdated: "2025-09-21"
            }
          ]
        }
      }
    }
  }
};
```

---

### Phase 4: 새로운 필터 및 검색 기능

#### 4.1 필터 옵션 확장
```javascript
// 기존: 지역, 카테고리, 상태
// 추가: 정당, 의원명, 선거구

<FilterPanel>
  <RegionFilter />
  <CategoryFilter />
  <StatusFilter />
  <PartyFilter />        {/* 🆕 */}
  <RepresentativeFilter /> {/* 🆕 */}
  <SearchBox placeholder="선거구 또는 의원명 검색" /> {/* 🆕 */}
</FilterPanel>
```

#### 4.2 검색 인덱스
**파일**: `src/utils/searchIndex.js`
```javascript
// 빠른 검색을 위한 인덱스
{
  byName: { "곽상언": { district: "종로구", ... } },
  byDistrict: { "종로구": { winner: {...}, pledges: [...] } },
  byParty: { "더불어민주당": [...winners] }
}
```

---

## 🔧 구현 단계별 계획 (Local First)

### ✅ Step 1: 추상화 레이어 구축 (1일)
1. `IElectionDataSource.js` 인터페이스 정의
2. `LocalDBDataSource.js` 구현 (sql.js 사용)
3. `ElectionDataContext.jsx` 생성 (Provider 패턴)
4. 환경변수 기반 DataSource 전환 로직

### ✅ Step 2: Local DB 통합 및 테스트 (1일)
5. sql.js 설치 및 설정
6. `districtMapping.json` 생성
7. Local DB 쿼리 테스트 및 디버깅
8. 성능 측정 및 캐싱 전략

### ✅ Step 3: UI 컴포넌트 (2-3일)
9. `DistrictDetailPanel.jsx` 컴포넌트 생성
10. `StaticMapSelector.jsx` district 클릭 이벤트 추가
11. 공약 카드에 의원 정보 표시
12. Context 사용하여 데이터 소싱

### ✅ Step 4: 데이터 통합 (2일)
13. 상태/카테고리 매핑 로직 구현
14. 통합 데이터 모델 구축
15. 캐싱 및 성능 최적화 (Local DB)

### ✅ Step 5: 필터 및 검색 (2일)
16. 정당/의원 필터 추가
17. 선거구 검색 기능 구현
18. 검색 인덱스 최적화

### ✅ Step 6: 통계 및 시각화 (2-3일)
19. 공약 이행률 통계 (정당별, 지역별)
20. 차트 컴포넌트 추가
21. 비교 분석 기능

### 🚀 Step 7: Supabase 마이그레이션 (2-3일)
22. Supabase 프로젝트 생성
23. 테이블 스키마 생성 (elections, candidates, pledges)
24. Local DB 데이터를 Supabase로 마이그레이션
25. `SupabaseDataSource.js` 구현 완료
26. 환경변수 전환 테스트
27. 프로덕션 배포

---

## 📈 예상 효과

### 데이터 규모
- **기존**: 대통령 공약 ~10개 + 광역단체장 공약 ~100개
- **추가**: 국회의원 공약 **7,523개**
- **증가율**: **약 68배 증가** 🚀

### 사용자 경험
1. **세밀한 지역 정보**: 광역→선거구 단위로 drill-down
2. **실제 선거 데이터**: 당선자 정보, 득표율 표시
3. **방대한 공약 추적**: 7,500개 이상의 공약 검색 가능
4. **정당별 비교**: 국민의힘 vs 더불어민주당 공약 이행률 비교

### 기술적 이점
- SQLite 사용으로 서버 비용 절감
- 로컬 DB로 빠른 쿼리 성능
- 확장 가능한 아키텍처 (차기 선거 데이터 추가 용이)

---

## ⚠️ 주요 고려사항

### 1. 성능
- **문제**: 7,523개 공약 렌더링 시 성능 저하
- **해결**: 가상 스크롤링, 페이지네이션, 레이지 로딩

### 2. 데이터 정합성
- **문제**: DB `sgg_name`과 `districts.json` name 불일치
- **해결**: 매핑 테이블 + 자동 검증 스크립트

### 3. 공약 상태 업데이트
- **문제**: DB의 `status`가 "준비중"으로 고정
- **해결**:
  - 수동 업데이트 UI 제공
  - 뉴스 크롤링으로 자동 업데이트 (향후)

### 4. 브라우저 호환성
- **문제**: SQLite는 서버 사이드에서만 동작
- **해결**:
  - ✅ **개발**: sql.js (WASM) → 브라우저에서 Local DB 실행
  - ✅ **프로덕션**: Supabase → 클라우드 PostgreSQL
  - ✅ **전환**: DataSource 인터페이스로 무중단 교체

### 5. 환경 전환
- **개발 환경**: `.env.development`
  ```
  REACT_APP_USE_SUPABASE=false
  REACT_APP_LOCAL_DB_PATH=/data/election_data.db
  ```
- **프로덕션 환경**: `.env.production`
  ```
  REACT_APP_USE_SUPABASE=true
  REACT_APP_SUPABASE_URL=https://xxx.supabase.co
  REACT_APP_SUPABASE_ANON_KEY=xxx
  ```

---

## 🎨 UI/UX 목업

### 지도 상호작용 플로우
```
[전국 지도 보기]
    ↓ (지역 클릭)
[서울 상세 지도 - 48개 선거구 마커]
    ↓ (선거구 마커 클릭)
[종로구 상세 패널 슬라이드인]
├── 당선자 정보
├── 득표율 바 차트
└── 공약 리스트 (10개)
    ↓ (공약 클릭)
[공약 상세 모달]
├── 전체 내용
├── 이행 진척도
└── 관련 기사
```

### 새로운 통계 대시보드
```
┌──────────────────────────────────────┐
│ 📊 공약 이행 현황 (전국)               │
├──────────────────────────────────────┤
│ 총 공약: 7,523개                      │
│ • ✅ 달성: 1,204개 (16%)              │
│ • 🔄 진행중: 3,876개 (51.5%)          │
│ • ⏸️ 준비중: 2,443개 (32.5%)         │
│                                      │
│ [정당별 비교] [지역별 비교] [분야별]   │
└──────────────────────────────────────┘
```

---

## 🚀 빠른 시작 (Quick Start)

### 1단계: DB 서비스 테스트
```bash
# 설치된 sqlite3 사용
node analyze_db.js

# 특정 선거구 조회 테스트
node -e "
const db = require('./src/services/electionDB');
db.getWinnerByDistrict('종로구').then(console.log);
"
```

### 2단계: 컴포넌트 통합
```javascript
// App.jsx
import { ElectionDBProvider } from './contexts/ElectionDBContext';

<ElectionDBProvider dbPath="./data/election_data.db">
  <StaticMapSelector
    onDistrictSelect={handleDistrictSelect}
  />
  {selectedDistrict && (
    <DistrictDetailPanel district={selectedDistrict} />
  )}
</ElectionDBProvider>
```

---

## 📝 다음 단계

### 즉시 시작 가능한 작업
1. ✅ **districtMapping.json 생성** (매핑 테이블)
2. ✅ **electionDB.js 서비스 구현** (DB 쿼리 레이어)
3. ✅ **sql.js 설치 및 브라우저 통합** (클라이언트 사이드 DB)

### 우선순위
- **High**: 1, 2, 3 (데이터 레이어 필수)
- **Medium**: 4, 5 (UI 개선)
- **Low**: 통계/비교 기능 (부가가치)

---

## 🎯 결론

이 DB 통합을 통해 **대통령 공약 추적기**에서 **전국 공약 추적 플랫폼**으로 진화합니다:

- ✅ 데이터 규모: 100개 → **7,600개** (76배)
- ✅ 정밀도: 광역 → **선거구 단위**
- ✅ 대표성: 대통령 + 광역단체장 → **+ 국회의원 300명**
- ✅ 가치: 중앙 정치 모니터링 → **풀뿌리 민주주의 감시**

**추정 개발 기간**: 2-3주
**핵심 기술**: SQLite, sql.js, React Context API

# Changelog

## 2025-10-05 - Database Integration Complete

### 주요 변경사항

#### 1. 데이터베이스 통합
- **LocalDBDataSource 구현 완료**
  - `sql.js`를 사용한 브라우저 내 SQLite DB 지원
  - `public/data/election_data.db` 경로에 DB 파일 배치
  - 모든 CRUD 메서드 구현 (getAllWinners, getPledgesByCandidate, getAllPledges 등)

#### 2. Context API 구조
- **ElectionDataContext 생성**
  - 전역 데이터 소스 관리
  - 로딩/에러 상태 처리
  - 환경변수 기반 데이터 소스 선택 (LocalDB/Supabase)

#### 3. Custom Hooks 추가
- **useDBPromises**: DB에서 공약 데이터 가져오기 및 변환
- **useDBOfficials**: 당선자 정보 및 통계 로드
- **useDBRegions**: 지역별 데이터 및 정당 통계 집계

#### 4. 데이터 변환 레이어
- **officials.js**: DB candidate → UI official 변환
- **promises.js**: DB pledges → UI promises 변환
- **regions.js**: 정적 region 메타데이터 제공

#### 5. 버그 수정
- React Hook 순서 에러 해결 (useMemo를 조건부 return 이전으로 이동)
- Context destructuring 수정 (모든 hooks에서 `{ dataSource }` 형태로 수정)
- DB 파일 경로 문제 해결 (data/ → public/data/)

### 파일 구조 변경

```
src/
├── contexts/
│   └── ElectionDataContext.jsx    [NEW] 데이터 소스 Context
├── hooks/
│   ├── useDBPromises.js           [NEW] 공약 데이터 hook
│   ├── useDBOfficials.js          [NEW] 당선자 데이터 hook
│   └── useDBRegions.js            [NEW] 지역 데이터 hook
├── services/
│   ├── IElectionDataSource.js     [기존] 인터페이스
│   └── LocalDBDataSource.js       [수정] getAllPledges 메서드 추가
├── data/
│   ├── officials.js               [NEW] 변환 함수
│   ├── promises.js                [NEW] 변환 함수
│   ├── regions.js                 [NEW] 정적 메타데이터
│   ├── officials.json.backup      [백업]
│   ├── promises.js.backup         [백업]
│   └── promises.json.backup       [백업]
└── App.jsx                        [수정] DB hooks 통합

public/
└── data/
    └── election_data.db           [NEW] SQLite 데이터베이스 파일
```

### 기술 스택
- React 18.2.0
- sql.js (SQLite in browser)
- Context API + Custom Hooks
- Tailwind CSS

### 다음 단계
- [ ] Supabase 데이터 소스 구현
- [ ] 공약 상세 페이지 개선
- [ ] 검색 성능 최적화
- [ ] 데이터 캐싱 전략

### 알려진 이슈
- 없음 (현재 버전에서 모든 주요 기능 정상 작동)

---

## 이전 버전

### 2025-10-04
- 웹팩 5 폴리필 에러 수정
- Dark mode 지원 추가
- 지도 클러스터링 및 팝업 선택 기능

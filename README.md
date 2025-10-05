# 대한민국 공약 추적 시스템 (Korea Promise Tracker)

대한민국 국회의원 및 지자체장의 공약 이행 현황을 추적하고 시각화하는 웹 애플리케이션입니다.

## 🎯 주요 기능

### 현재 구현된 기능
- ✅ **지역별 공약 조회**: 인터랙티브 SVG 지도로 17개 광역시/도 선택
- ✅ **국회의원 공약 추적**: 254명 당선자의 7,414개 공약 데이터
- ✅ **실시간 진행률 추적**: 각 공약의 진행 상태와 달성률 시각화
- ✅ **검색 및 필터링**: 정당별, 지역별, 키워드 검색 지원
- ✅ **페이지네이션**: 대용량 데이터 효율적 표시
- ✅ **다크모드**: 사용자 환경에 맞는 테마 자동 전환
- ✅ **반응형 디자인**: 모바일, 태블릿, 데스크톱 모든 기기 지원
- ✅ **클라우드 DB 연동**: Supabase PostgreSQL 완전 마이그레이션

### 다음 단계 계획
- 🔄 **실시간 데이터 동기화**: Supabase Realtime 구독
- 📊 **데이터 시각화**: Chart.js를 활용한 통계 차트
- 🔔 **알림 기능**: 공약 상태 변경 알림
- 👥 **사용자 인증**: Supabase Auth 연동
- 📱 **PWA 지원**: 오프라인 모드 및 앱 설치
- 🚀 **성능 최적화**: 이미지 최적화, 코드 스플리팅

## 🛠 기술 스택

### Frontend
- **Framework**: React 18.2.0
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Build Tool**: react-app-rewired (Webpack 5 polyfill)

### Backend & Database
- **Cloud Database**: Supabase (PostgreSQL)
  - 254명 후보자 데이터
  - 7,414개 공약 데이터
  - Row Level Security (RLS)
  - Full Text Search
- **Local Database**: SQLite (sql.js) - 개발/백업용
- **Data Layer**: 추상화된 DataSource 패턴

### DevOps
- **Version Control**: Git + GitHub
- **Hosting**: Vercel (예정)
- **CI/CD**: Vercel 자동 배포

## 📦 설치 및 실행

### 사전 요구사항
- Node.js 14.0.0 이상
- npm 또는 yarn

### 설치
```bash
npm install
```

### 환경 변수 설정

`.env.local` 파일을 생성하고 다음 내용을 추가하세요:

```bash
# Data Source Configuration
REACT_APP_USE_SUPABASE=true

# Supabase Configuration
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key-here

# For migration script (optional)
SUPABASE_SERVICE_KEY=your-service-role-key
```

**Note**: `.env.local` 파일은 Git에 포함되지 않습니다. `.env.example`을 참고하세요.

### 개발 서버 실행
```bash
npm start
```

브라우저에서 [http://localhost:3000](http://localhost:3000)으로 접속

### 프로덕션 빌드
```bash
npm run build
```

## 🗄 데이터베이스 아키텍처

### Supabase 스키마

**candidates** 테이블:
```sql
- hubo_id (BIGINT, PK)
- sg_id (TEXT)
- name (TEXT, NOT NULL)
- party_name (TEXT)
- sgg_name (TEXT) -- 선거구명
- gender (TEXT)
- age (INTEGER)
- job, edu, career1, career2 (TEXT)
- is_winner (BOOLEAN)
- votes_won (INTEGER)
- vote_percentage (REAL)
- metro_city (TEXT) -- 광역시/도
- created_at, updated_at (TIMESTAMP)
```

**pledges** 테이블:
```sql
- pledge_id (INTEGER, PK)
- hubo_id (BIGINT, FK → candidates)
- pledge_order (INTEGER)
- pledge_realm (VARCHAR) -- 분야
- pledge_title (VARCHAR, NOT NULL)
- pledge_content (TEXT)
- status (VARCHAR) -- 준비중/진행중/완료/보류/중단
- last_updated (TIMESTAMP)
- created_at, updated_at (TIMESTAMP)
```

### 데이터 마이그레이션

SQLite에서 Supabase로 데이터 마이그레이션:

```bash
# 1. Supabase에서 테이블 생성
# scripts/create_supabase_tables.sql 실행

# 2. 데이터 마이그레이션
node scripts/migrate_to_supabase.js
```

자세한 내용은 [SUPABASE_SETUP_GUIDE.md](./docs/SUPABASE_SETUP_GUIDE.md) 참고

## 📂 프로젝트 구조

```
PresidentHistoryTracker/
├── src/
│   ├── components/              # React 컴포넌트
│   │   ├── StaticMapSelector.jsx    # SVG 지도 선택기
│   │   ├── OfficialsList.jsx        # 국회의원 목록 (검색/필터/페이지네이션)
│   │   ├── OfficialDetail.jsx       # 국회의원 상세 (공약 목록)
│   │   └── DarkModeToggle.jsx       # 다크모드 토글
│   ├── contexts/                # Context API
│   │   ├── ElectionDataContext.jsx  # 데이터 소스 Context
│   │   └── DarkModeContext.jsx      # 다크모드 Context
│   ├── hooks/                   # Custom Hooks
│   │   ├── useDBPromises.js         # 공약 데이터 hook
│   │   ├── useDBOfficials.js        # 국회의원 데이터 hook
│   │   └── useDBRegions.js          # 지역 데이터 hook
│   ├── services/                # 데이터 소스 레이어
│   │   ├── IElectionDataSource.js   # 추상 인터페이스
│   │   ├── LocalDBDataSource.js     # SQLite 구현체
│   │   └── SupabaseDataSource.js    # Supabase 구현체 ✨ NEW
│   ├── lib/                     # 라이브러리 설정
│   │   └── supabaseClient.js        # Supabase 클라이언트
│   ├── data/                    # 변환 레이어
│   │   ├── officials.js             # DB → UI 변환
│   │   ├── promises.js              # DB → UI 변환
│   │   └── regions.js               # 지역 메타데이터
│   └── App.jsx                  # 메인 앱 컴포넌트
├── public/
│   ├── data/
│   │   └── election_data.db         # SQLite DB (백업용)
│   └── korea-map.svg                # 한국 지도 SVG
├── scripts/                     # 유틸리티 스크립트
│   ├── create_supabase_tables.sql   # Supabase 스키마
│   └── migrate_to_supabase.js       # 데이터 마이그레이션
├── docs/                        # 프로젝트 문서
│   ├── SUPABASE_SETUP_GUIDE.md      # Supabase 설정 가이드
│   ├── SUPABASE_MIGRATION_GUIDE.md  # 마이그레이션 가이드
│   ├── DB_INTEGRATION_PLAN.md       # DB 통합 계획
│   ├── CHANGELOG.md                 # 변경 이력
│   └── instruction.md               # 개발 지침
├── .env.local                   # 환경 변수 (Git 제외)
├── .env.example                 # 환경 변수 템플릿
├── CLAUDE.md                    # 프로젝트 컨텍스트
├── README.md                    # 프로젝트 소개
└── ROADMAP.md                   # 개발 로드맵
```

## 🎨 디자인 시스템

### 컬러 팔레트
- **Primary**: Blue-500 (#3B82F6)
- **국민의힘**: Red-600/Red-100
- **더불어민주당**: Blue-600/Blue-100
- **Dark Mode**: Slate-800/Slate-900

### 공약 상태별 색상
- **완료**: Green-600
- **진행중**: Blue-600
- **준비중**: Yellow-600
- **보류/중단**: Red-600

## 📈 개발 진행 상황

### Phase 1: 기초 구현 ✅
- [x] React 프로젝트 초기화
- [x] Tailwind CSS 설정
- [x] 기본 컴포넌트 구조
- [x] SVG 지도 통합

### Phase 2: 데이터베이스 연동 ✅
- [x] SQLite 데이터베이스 생성
- [x] sql.js 브라우저 통합
- [x] Webpack 5 polyfill 설정
- [x] DataSource 추상화 레이어
- [x] Custom Hooks 구현

### Phase 3: UI/UX 개선 ✅
- [x] 지역별 필터링
- [x] 검색 기능
- [x] 페이지네이션
- [x] 다크모드
- [x] 반응형 디자인

### Phase 4: 클라우드 마이그레이션 ✅
- [x] Supabase 프로젝트 생성
- [x] 스키마 설계 및 테이블 생성
- [x] SQLite → Supabase 데이터 마이그레이션
- [x] SupabaseDataSource 구현
- [x] 환경 변수 설정
- [x] 프로덕션 준비 완료

### Phase 5: 배포 및 최적화 (현재)
- [x] Vercel 배포
- [ ] 도메인 연결
- [ ] 성능 최적화
- [ ] SEO 최적화
- [ ] 모니터링 설정

### Phase 6: 고급 기능 (계획)
- [ ] 실시간 데이터 동기화
- [ ] 사용자 인증 (Supabase Auth)
- [ ] 공약 업데이트 알림
- [ ] 데이터 시각화 (Chart.js)
- [ ] 공약 북마크/공유
- [ ] PWA 지원

## 🚀 배포

### Vercel 배포 (권장)

1. Vercel 계정 생성 및 GitHub 연동
2. 프로젝트 Import
3. 환경 변수 설정:
   ```
   REACT_APP_USE_SUPABASE=true
   REACT_APP_SUPABASE_URL=https://kwxisnnhonijmllwmwfa.supabase.co
   REACT_APP_SUPABASE_ANON_KEY=your-anon-key
   ```
4. Deploy 버튼 클릭

### 자동 배포
- `main` 브랜치에 push하면 자동으로 배포됩니다
- 브랜치별 프리뷰 배포 지원

## 📊 데이터 현황

- **총 후보자 수**: 254명 (당선자)
- **총 공약 수**: 7,414개
- **광역시/도**: 17개 지역
- **정당**: 국민의힘, 더불어민주당 외 다수

## 🔧 개발 가이드

### 데이터 소스 전환

**로컬 SQLite 사용**:
```bash
REACT_APP_USE_SUPABASE=false
```

**Supabase 사용**:
```bash
REACT_APP_USE_SUPABASE=true
```

### 새로운 DataSource 추가

1. `IElectionDataSource.js` 인터페이스 구현
2. `ElectionDataContext.jsx`에 새 DataSource 추가
3. 환경 변수로 전환 로직 구현

### 스키마 변경

1. Supabase SQL Editor에서 스키마 수정
2. `scripts/create_supabase_tables.sql` 업데이트
3. 마이그레이션 스크립트 업데이트
4. DataSource 메서드 수정

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.

## 📧 연락처

프로젝트 관련 문의사항은 Issues 탭을 이용해주세요.

---

**Last Updated**: 2025-10-06
**Version**: 1.0.0 (Supabase Migration Complete)

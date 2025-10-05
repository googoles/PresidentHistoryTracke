# 대한민국 공약 추적 시스템 (Korea Promise Tracker)

대한민국 대통령 및 지자체장의 공약 이행 현황을 추적하고 시각화하는 웹 애플리케이션입니다.

## 주요 기능

- **지역별 공약 조회**: 대통령 공약 및 17개 시도별 지자체장 공약 확인
- **실시간 진행률 추적**: 각 공약의 진행 상태와 달성률 시각화
- **필터링 및 검색**: 분야별, 상태별, 키워드별 공약 검색
- **통계 대시보드**: 전체 공약 이행률 및 상태별 통계 제공
- **반응형 디자인**: 모바일, 태블릿, 데스크톱 모든 기기 지원

## 기술 스택

- **Frontend**: React 18, Tailwind CSS
- **Icons**: Lucide React
- **Database**: SQLite (sql.js) + Supabase (준비중)
- **State Management**: Context API + Custom Hooks
- **Hosting**: AWS S3 + CloudFront (준비중)

## 설치 및 실행

### 사전 요구사항
- Node.js 14.0.0 이상
- npm 또는 yarn

### 설치
```bash
npm install
```

### 개발 서버 실행
```bash
npm start
```

브라우저에서 [http://localhost:3000](http://localhost:3000)으로 접속

### 프로덕션 빌드
```bash
npm run build
```

## 프로젝트 구조

```
PresidentHistoryTracker/
├── src/
│   ├── components/         # React 컴포넌트
│   │   ├── StaticMapSelector.jsx  # SVG 지도 선택기
│   │   ├── PromiseCard.jsx        # 공약 카드
│   │   ├── FilterPanel.jsx        # 필터 패널
│   │   ├── StatsOverview.jsx      # 통계 대시보드
│   │   ├── OfficialsList.jsx      # 당선자 목록
│   │   └── OfficialDetail.jsx     # 당선자 상세
│   ├── contexts/           # Context API
│   │   ├── ElectionDataContext.jsx  # 데이터 소스 Context
│   │   └── DarkModeContext.jsx      # 다크모드 Context
│   ├── hooks/              # Custom Hooks
│   │   ├── useDBPromises.js       # 공약 데이터 hook
│   │   ├── useDBOfficials.js      # 당선자 데이터 hook
│   │   └── useDBRegions.js        # 지역 데이터 hook
│   ├── services/           # 데이터 소스 레이어
│   │   ├── IElectionDataSource.js   # 인터페이스
│   │   └── LocalDBDataSource.js     # SQLite 구현
│   ├── data/               # 데이터 변환 레이어
│   │   ├── officials.js    # DB → UI 변환 (당선자)
│   │   ├── promises.js     # DB → UI 변환 (공약)
│   │   └── regions.js      # 지역 메타데이터
│   ├── utils/              # 유틸리티 함수
│   │   └── helpers.js      # 헬퍼 함수
│   └── App.jsx             # 메인 앱 컴포넌트
├── public/
│   ├── data/
│   │   └── election_data.db    # SQLite 데이터베이스
│   ├── korea-map.svg           # 한국 지도 SVG
│   └── index.html
├── data/                   # 원본 데이터 (백업)
│   └── election_data.db
├── package.json
├── CHANGELOG.md            # 변경 이력
└── README.md
```

## 환경 변수 설정

`.env.development` 파일에서 데이터 소스를 설정할 수 있습니다:

```bash
# 로컬 DB 사용 (기본값)
REACT_APP_USE_SUPABASE=false
REACT_APP_LOCAL_DB_PATH=/data/election_data.db

# Supabase 사용 시 (미구현)
# REACT_APP_USE_SUPABASE=true
# REACT_APP_SUPABASE_URL=your_supabase_url
# REACT_APP_SUPABASE_ANON_KEY=your_anon_key
```

### 테스트 모드

DB 연동 테스트를 위해 쿼리 파라미터를 사용할 수 있습니다:

```
http://localhost:3000?test=election-db
```

## 공약 상태

- **달성**: 공약이 완전히 이행됨
- **진행중**: 현재 진행 중인 공약
- **부분달성**: 일부만 달성된 공약
- **미달성**: 목표 기한 내 달성하지 못한 공약
- **중단**: 진행이 중단된 공약

## 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.

## 연락처

프로젝트 관련 문의사항은 Issues 탭을 이용해주세요.
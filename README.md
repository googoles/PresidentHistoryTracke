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
- **Database**: Firebase Firestore (준비중)
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
korea-promise-tracker/
├── src/
│   ├── components/         # React 컴포넌트
│   │   ├── RegionSelector.jsx
│   │   ├── PromiseCard.jsx
│   │   ├── FilterPanel.jsx
│   │   └── StatsOverview.jsx
│   ├── data/              # 정적 데이터
│   │   ├── regions.js     # 지역 정보
│   │   ├── promises.js    # 공약 데이터
│   │   └── categories.js  # 카테고리 및 설정
│   ├── utils/             # 유틸리티 함수
│   │   ├── firebase.js    # Firebase 설정
│   │   └── helpers.js     # 헬퍼 함수
│   └── App.jsx           # 메인 앱 컴포넌트
├── public/               # 정적 파일
├── package.json          # 프로젝트 설정
└── README.md            # 프로젝트 문서
```

## 환경 변수 설정

`.env` 파일을 생성하고 다음 변수들을 설정하세요:

```
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_auth_domain
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_storage_bucket
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
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
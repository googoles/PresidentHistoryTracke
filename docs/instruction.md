# 대한민국 공약 추적 시스템 MVP 개발 Instructions

## 프로젝트 개요
**프로젝트명**: Korea Promise Tracker MVP  
**목표**: 대한민국 대통령 및 지자체장 공약 이행 현황을 추적하는 웹 애플리케이션 개발  
**기술 스택**: React + Firebase + AWS Hosting  

## 핵심 요구사항

### 1. 기본 구조
```
korea-promise-tracker/
├── src/
│   ├── components/
│   │   ├── RegionSelector.jsx
│   │   ├── PromiseCard.jsx
│   │   ├── FilterPanel.jsx
│   │   └── StatsOverview.jsx
│   ├── data/
│   │   ├── regions.js
│   │   ├── promises.js
│   │   └── categories.js
│   ├── utils/
│   │   ├── firebase.js
│   │   └── helpers.js
│   └── App.jsx
├── public/
├── package.json
└── README.md
```

### 2. 데이터 모델

#### 지역 데이터 (regions.js)
```javascript
export const regions = {
  seoul: {
    name: '서울특별시',
    type: 'metropolitan',
    leader: '오세훈',
    party: '국민의힘',
    term: '2022-2026',
    population: '9,720,846',
    districts: 25
  },
  busan: {
    name: '부산광역시',
    type: 'metropolitan', 
    leader: '박형준',
    party: '국민의힘',
    term: '2022-2026',
    population: '3,349,016',
    districts: 16
  },
  // 추가 지역들...
};
```

#### 공약 데이터 (promises.js)
```javascript
export const promises = {
  national: [
    {
      id: 'nat-001',
      title: '250만호 주택 공급',
      category: '부동산정책',
      level: 'national',
      description: '5년간 250만호 이상 주택 공급으로 주택 시장 안정화',
      status: '진행중', // 달성, 진행중, 부분달성, 미달성, 중단
      progress: 35,
      startDate: '2022-05-10',
      targetDate: '2027-05-09',
      applicableRegions: ['seoul', 'busan', 'incheon', 'gyeonggi'],
      relatedArticles: [
        {
          title: '윤석열 정부 2년차 공약 이행률 19%',
          url: 'https://www.newstof.com/news/articleView.html?idxno=22702',
          date: '2024-05-31',
          source: '뉴스톱'
        }
      ],
      statistics: [
        { label: '공급된 주택', value: '875,000', unit: '호' },
        { label: '목표 대비', value: '35', unit: '%' }
      ]
    }
  ],
  seoul: [
    {
      id: 'seoul-001',
      title: '상생주택 7만호 공급',
      category: '주거정책',
      level: 'local',
      description: '주거취약계층을 위한 상생주택 7만호 공급',
      status: '진행중',
      progress: 25,
      startDate: '2022-07-01',
      targetDate: '2026-06-30',
      relatedArticles: [
        {
          title: '오세훈 서울시장 공약 62% 전면 수정 필요',
          url: 'https://greentransport.org/news/?bmode=view&idx=15615856',
          date: '2023-07-04',
          source: '녹색교통운동'
        }
      ],
      statistics: [
        { label: '공급 완료', value: '17,500', unit: '호' },
        { label: '진행률', value: '25', unit: '%' }
      ]
    }
  ]
  // 지역별 공약들...
};
```

### 3. 핵심 컴포넌트 개발

#### RegionSelector 컴포넌트
- 지역 선택 카드 UI
- 선택된 지역 하이라이트
- 지역별 기본 정보 표시 (인구, 단체장, 정당)

#### PromiseCard 컴포넌트  
- 공약 제목, 설명, 진행률 표시
- 진행률 프로그레스 바
- 상태별 색상 구분 (달성: 초록, 진행중: 파랑, 미달성: 빨강)
- 관련 기사 링크
- 통계 데이터 표시

#### FilterPanel 컴포넌트
- 공약 수준 필터 (대통령/지자체)
- 분야별 필터 (주거, 교통, 복지 등)
- 상태별 필터 (달성, 진행중 등)
- 검색 기능

#### StatsOverview 컴포넌트
- 전체 공약 개수
- 상태별 공약 통계
- 이행률 원형 차트 또는 프로그레스 바

### 4. 상태 관리
```javascript
// App.jsx에서 사용할 상태
const [selectedRegion, setSelectedRegion] = useState('seoul');
const [selectedLevel, setSelectedLevel] = useState('all'); // all, national, local
const [selectedCategory, setSelectedCategory] = useState('all');
const [selectedStatus, setSelectedStatus] = useState('all');
const [searchTerm, setSearchTerm] = useState('');
```

### 5. 유틸리티 함수

#### helpers.js
```javascript
export const getStatusColor = (status) => {
  const colors = {
    '달성': 'text-green-600 bg-green-100',
    '진행중': 'text-blue-600 bg-blue-100', 
    '부분달성': 'text-yellow-600 bg-yellow-100',
    '미달성': 'text-red-600 bg-red-100',
    '중단': 'text-gray-600 bg-gray-100'
  };
  return colors[status] || colors['중단'];
};

export const calculateAchievementRate = (promises) => {
  const achieved = promises.filter(p => p.status === '달성').length;
  return promises.length > 0 ? Math.round((achieved / promises.length) * 100) : 0;
};

export const filterPromises = (promises, filters) => {
  return promises.filter(promise => {
    const matchesLevel = filters.level === 'all' || promise.level === filters.level;
    const matchesCategory = filters.category === 'all' || promise.category === filters.category;
    const matchesStatus = filters.status === 'all' || promise.status === filters.status;
    const matchesSearch = promise.title.toLowerCase().includes(filters.searchTerm.toLowerCase());
    return matchesLevel && matchesCategory && matchesStatus && matchesSearch;
  });
};
```

### 6. Firebase 설정

#### firebase.js
```javascript
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  // Firebase 설정값들
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
```

### 7. 스타일링
- **Tailwind CSS** 사용
- 반응형 디자인 (모바일 우선)
- 색상 팔레트:
  - Primary: Blue (#3B82F6)
  - Success: Green (#10B981) 
  - Warning: Yellow (#F59E0B)
  - Error: Red (#EF4444)
  - Gray: (#6B7280)

### 8. 초기 데이터
다음 데이터로 MVP 시작:
- **대통령 공약**: 5개 (주택공급, 부모급여, 디지털정부, 병사봉급, 정시확대)
- **서울시 공약**: 5개 (상생주택, GTX-A, 중곡의료타운, 동행매력특별시, 따릉이확대)
- **부산시 공약**: 3개 (세계박람회대비, 부산신항확장, 해운대재개발)
- **경기도 공약**: 3개 (기본소득, 평택브레인시티, 김포골드라인)

### 9. 개발 우선순위

#### Phase 1 (1주차)
1. 프로젝트 초기 설정 (Create React App + Tailwind)
2. 기본 레이아웃 및 컴포넌트 구조
3. 정적 데이터로 UI 구현
4. RegionSelector와 PromiseCard 기본 기능

#### Phase 2 (2주차) 
1. 필터링 기능 구현
2. 검색 기능 추가
3. 통계 대시보드 완성
4. 반응형 디자인 적용

#### Phase 3 (3주차)
1. Firebase 연동
2. 데이터 CRUD 기능
3. 관리자 페이지 (공약 추가/수정)
4. 배포 준비

### 10. 성능 최적화
- React.memo로 불필요한 리렌더링 방지
- useMemo로 필터링 결과 캐싱
- Lazy loading으로 초기 로딩 시간 단축
- 이미지 최적화 (WebP 포맷)

### 11. 테스트 전략
- 단위 테스트: Jest + React Testing Library
- 통합 테스트: 주요 사용자 플로우
- E2E 테스트: Cypress (선택사항)

### 12. 배포 설정
- **Frontend**: AWS S3 + CloudFront
- **Backend**: Firebase Functions
- **Database**: Firestore
- **도메인**: Route 53 + ACM 인증서

### 13. 환경 변수
```
REACT_APP_FIREBASE_API_KEY=
REACT_APP_FIREBASE_AUTH_DOMAIN=
REACT_APP_FIREBASE_PROJECT_ID=
REACT_APP_FIREBASE_STORAGE_BUCKET=
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=
REACT_APP_FIREBASE_APP_ID=
```

### 14. Package.json 의존성
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "firebase": "^10.7.1",
    "lucide-react": "^0.263.1",
    "tailwindcss": "^3.4.0"
  },
  "devDependencies": {
    "@testing-library/react": "^13.4.0",
    "@testing-library/jest-dom": "^5.16.4",
    "jest": "^27.5.1"
  }
}
```

### 15. 추가 고려사항
- SEO 최적화 (React Helmet)
- PWA 기능 (오프라인 지원)
- 다크모드 지원
- 접근성(a11y) 준수
- 에러 바운더리 구현
- 로딩 스피너 및 스켈레톤 UI

## 완료 조건
✅ 지역 선택 기능  
✅ 공약 목록 표시  
✅ 필터링 및 검색  
✅ 통계 대시보드  
✅ 반응형 디자인  
✅ Firebase 연동  
✅ AWS 배포  

이 Instruction을 따라 개발하면 사용자가 직관적으로 대한민국 공약 현황을 파악할 수 있는 MVP가 완성됩니다.
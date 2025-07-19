# President History Tracker - Project Context

## Project Overview
This is a React-based web application that tracks presidential and local government promises in South Korea. It displays promise fulfillment status with interactive region selection via both grid and map views.

## Key Features
- **Promise Tracking**: Monitors national and local government promises with progress percentages
- **Interactive Map**: SVG-based map of South Korea with clickable regions
- **Multi-level Governance**: Tracks promises at national, metropolitan, and provincial levels
- **Real-time Status**: Shows promise status (달성/진행중/부분달성/미달성/중단)
- **Filtering System**: Filter by region, category, status, and search terms

## Tech Stack
- React 18.2.0
- Tailwind CSS for styling
- Firebase for backend (optional)
- Lucide React for icons
- Custom SVG map for region selection

## Data Structure
- **Promises**: Stored in `src/data/promises.json` with 16 total promises
- **Regions**: 17 administrative regions defined in `src/data/regions.js`
- **Categories**: 12 policy categories (부동산정책, 복지정책, etc.)

## Important Commands
```bash
# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build

# Run tests
npm test
```

## Project Structure
```
src/
├── components/
│   ├── FilterPanel.jsx      # Filtering controls
│   ├── PromiseCard.jsx      # Individual promise display
│   ├── RegionSelector.jsx   # Grid-based region selector
│   ├── StaticMapSelector.jsx # SVG map-based region selector
│   └── StatsOverview.jsx    # Statistics summary
├── data/
│   ├── promises.json        # Promise data
│   ├── regions.js           # Region metadata
│   └── categories.js        # Category definitions
└── utils/
    └── helpers.js           # Utility functions

public/
└── korea-map.svg           # Administrative divisions map
```

## Key Implementation Details

### Region Selection
- Two view modes: Grid view and Map view
- SVG map uses group IDs matching Korean administrative division names
- Region keys map: '서울특별시' → 'seoul', '경기도' → 'gyeonggi', etc.

### Promise Data Format
```json
{
  "id": "nat-001",
  "title": "250만호 주택 공급",
  "category": "부동산정책",
  "level": "national",
  "status": "진행중",
  "progress": 35,
  "startDate": "2022-05-10",
  "targetDate": "2027-05-09",
  "relatedArticles": [...],
  "statistics": [...]
}
```

### Styling Approach
- Tailwind CSS utility classes
- Responsive design with mobile-first approach
- Color coding: 국민의힘 (red), 더불어민주당 (blue)
- Region types: Metropolitan (violet), Province (emerald), Special (amber)

## Recent Updates
- Separated promises data from JavaScript into JSON format
- Implemented static SVG map selector as alternative to dynamic maps
- Fixed layout issues with map display and button positioning
- Added view toggle between grid and map interfaces

## Known Issues & Considerations
- Map requires proper SVG with Korean administrative region group IDs
- No external map API keys needed (uses static SVG)
- Bilingual content (Korean) - handle text encoding properly

## Future Enhancements
- Add promise timeline visualization
- Implement data persistence with Firebase
- Add export functionality for promise data
- Create admin interface for promise updates
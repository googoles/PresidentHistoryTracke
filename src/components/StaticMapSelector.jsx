import React, { useState, useEffect, useRef } from 'react';
import { regions } from '../data/regions';

// Mapping from SVG group IDs to our region keys
const SVG_TO_REGION_MAP = {
  '서울특별시': 'seoul',
  '부산광역시': 'busan', 
  '대구광역시': 'daegu',
  '인천광역시': 'incheon',
  '광주광역시': 'gwangju',
  '대전광역시': 'daejeon',
  '울산광역시': 'ulsan',
  '세종특별자치시': 'sejong',
  '경기도': 'gyeonggi',
  '강원도': 'gangwon',
  '충청북도': 'chungbuk',
  '충청남도': 'chungnam',
  '전라북도': 'jeonbuk',
  '전라남도': 'jeonnam',
  '경상북도': 'gyeongbuk',
  '경상남도': 'gyeongnam',
  '제주특별자치도': 'jeju'
};

const StaticMapSelector = ({ selectedRegion, onRegionSelect }) => {
  const [svgContent, setSvgContent] = useState('');
  const [hoveredRegion, setHoveredRegion] = useState(null);
  const svgRef = useRef(null);

  useEffect(() => {
    // Load SVG content
    fetch('/korea-map.svg')
      .then(response => response.text())
      .then(content => {
        setSvgContent(content);
      })
      .catch(error => {
        console.error('Error loading SVG map:', error);
      });
  }, []);

  useEffect(() => {
    if (!svgContent || !svgRef.current) return;

    const svgElement = svgRef.current;
    
    // Find all region groups and add interactivity
    Object.keys(SVG_TO_REGION_MAP).forEach(svgRegionId => {
      const regionKey = SVG_TO_REGION_MAP[svgRegionId];
      const groupElement = svgElement.querySelector(`g[id="${svgRegionId}"]`);
      
      if (groupElement) {
        // Style the region based on selection state
        const isSelected = selectedRegion === regionKey;
        const isHovered = hoveredRegion === regionKey;
        
        // Apply styles to all paths within the group
        const paths = groupElement.querySelectorAll('path, polygon');
        paths.forEach(path => {
          path.style.cursor = 'pointer';
          path.style.transition = 'all 0.2s ease';
          
          if (isSelected) {
            path.style.fill = '#3B82F6'; // blue-500
            path.style.stroke = '#1E40AF'; // blue-800
            path.style.strokeWidth = '1.5';
          } else if (isHovered) {
            path.style.fill = '#93C5FD'; // blue-300
            path.style.stroke = '#3B82F6'; // blue-500
            path.style.strokeWidth = '1';
          } else {
            // Default styling based on region type
            const region = regions[regionKey];
            if (region) {
              switch (region.type) {
                case 'metropolitan':
                  path.style.fill = '#8B5CF6'; // violet-500
                  break;
                case 'special':
                  path.style.fill = '#F59E0B'; // amber-500
                  break;
                default:
                  path.style.fill = '#10B981'; // emerald-500
              }
            } else {
              path.style.fill = '#9CA3AF'; // gray-400
            }
            path.style.stroke = '#FFFFFF';
            path.style.strokeWidth = '0.5';
          }
        });

        // Add event listeners
        const handleClick = (e) => {
          e.preventDefault();
          e.stopPropagation();
          onRegionSelect(regionKey);
        };

        const handleMouseEnter = () => setHoveredRegion(regionKey);
        const handleMouseLeave = () => setHoveredRegion(null);

        groupElement.addEventListener('click', handleClick);
        groupElement.addEventListener('mouseenter', handleMouseEnter);
        groupElement.addEventListener('mouseleave', handleMouseLeave);

        // Cleanup function will be called when component unmounts or dependencies change
        return () => {
          groupElement.removeEventListener('click', handleClick);
          groupElement.removeEventListener('mouseenter', handleMouseEnter);
          groupElement.removeEventListener('mouseleave', handleMouseLeave);
        };
      }
    });
  }, [svgContent, selectedRegion, hoveredRegion, onRegionSelect]);

  const handleNationalSelect = () => {
    onRegionSelect('national');
  };

  if (!svgContent) {
    return (
      <div className="mb-8">
        <div className="flex items-center justify-center h-96 bg-gray-100 rounded-lg">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">지도를 불러오는 중...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-8">
      <div className="mb-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-800">지역 선택</h2>
          <button
            onClick={handleNationalSelect}
            className={`px-4 py-2 rounded-lg transition-all duration-200 flex items-center ${
              selectedRegion === 'national'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path d="M4 3a2 2 0 100 4h12a2 2 0 100-4H4z" />
              <path fillRule="evenodd" d="M3 8h14v7a2 2 0 01-2 2H5a2 2 0 01-2-2V8zm5 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
            전국
          </button>
        </div>
        
        <div className="relative bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex justify-center">
            <div 
              ref={svgRef}
              className="w-full max-w-xs"
              style={{ height: 'auto' }}
              dangerouslySetInnerHTML={{ __html: svgContent }}
            />
          </div>
          
          {/* Hover tooltip */}
          {hoveredRegion && regions[hoveredRegion] && (
            <div className="absolute top-4 left-4 bg-white border border-gray-200 rounded-lg shadow-lg p-3 pointer-events-none z-10">
              <h3 className="font-semibold text-gray-800 mb-1">
                {regions[hoveredRegion].name}
              </h3>
              <div className="space-y-1 text-xs text-gray-600">
                <p><span className="font-medium">단체장:</span> {regions[hoveredRegion].leader}</p>
                <p>
                  <span className="font-medium">정당:</span>{' '}
                  <span className={regions[hoveredRegion].party === '국민의힘' ? 'text-red-600' : 'text-blue-600'}>
                    {regions[hoveredRegion].party}
                  </span>
                </p>
                <p><span className="font-medium">인구:</span> {regions[hoveredRegion].population}명</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 text-sm text-gray-600">
        <div className="flex items-center space-x-6 flex-wrap">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-violet-500 rounded-sm mr-2"></div>
            <span>광역시</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-emerald-500 rounded-sm mr-2"></div>
            <span>도</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-amber-500 rounded-sm mr-2"></div>
            <span>특별자치</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-blue-500 rounded-sm mr-2"></div>
            <span>선택됨</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaticMapSelector;
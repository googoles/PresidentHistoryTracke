import React, { useState, useMemo } from 'react';
import Map, { Marker, Popup } from 'react-map-gl';
import { MapPin, Users, Building2 } from 'lucide-react';
import { regions } from '../data/regions';

const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_TOKEN;

const REGION_COORDINATES = {
  national: { lat: 36.5, lng: 127.7, zoom: 6.5 },
  seoul: { lat: 37.5665, lng: 126.9780, zoom: 10 },
  busan: { lat: 35.1796, lng: 129.0756, zoom: 10 },
  daegu: { lat: 35.8714, lng: 128.6014, zoom: 10 },
  incheon: { lat: 37.4563, lng: 126.7052, zoom: 10 },
  gwangju: { lat: 35.1595, lng: 126.8526, zoom: 10 },
  daejeon: { lat: 36.3504, lng: 127.3845, zoom: 10 },
  ulsan: { lat: 35.5384, lng: 129.3114, zoom: 10 },
  sejong: { lat: 36.4800, lng: 127.2890, zoom: 10 },
  gyeonggi: { lat: 37.4138, lng: 127.5183, zoom: 9 },
  gangwon: { lat: 37.8228, lng: 128.1555, zoom: 8.5 },
  chungbuk: { lat: 36.8, lng: 127.7, zoom: 9 },
  chungnam: { lat: 36.5184, lng: 126.8000, zoom: 9 },
  jeonbuk: { lat: 35.7175, lng: 127.1530, zoom: 9 },
  jeonnam: { lat: 34.8679, lng: 126.991, zoom: 8.5 },
  gyeongbuk: { lat: 36.4919, lng: 128.8889, zoom: 8 },
  gyeongnam: { lat: 35.4606, lng: 128.2132, zoom: 8.5 },
  jeju: { lat: 33.4996, lng: 126.5312, zoom: 10 }
};

const MapRegionSelector = ({ selectedRegion, onRegionSelect }) => {
  const [viewState, setViewState] = useState({
    longitude: 127.7,
    latitude: 36.5,
    zoom: 6.5
  });
  const [hoveredRegion, setHoveredRegion] = useState(null);

  const getRegionTypeIcon = (type) => {
    switch (type) {
      case 'national':
        return <Building2 className="w-5 h-5" />;
      case 'metropolitan':
        return <MapPin className="w-5 h-5" />;
      default:
        return <Users className="w-5 h-5" />;
    }
  };

  const getMarkerColor = (regionKey, regionType) => {
    if (selectedRegion === regionKey) return '#3B82F6'; // blue-500
    if (regionType === 'national') return '#EF4444'; // red-500
    if (regionType === 'metropolitan') return '#8B5CF6'; // violet-500
    return '#10B981'; // emerald-500
  };

  const markers = useMemo(() => {
    return Object.entries(regions)
      .filter(([key]) => key !== 'national')
      .map(([key, region]) => {
        const coords = REGION_COORDINATES[key];
        if (!coords) return null;

        return (
          <Marker
            key={key}
            longitude={coords.lng}
            latitude={coords.lat}
            anchor="center"
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              onRegionSelect(key);
              setViewState(prev => ({
                ...prev,
                longitude: coords.lng,
                latitude: coords.lat,
                zoom: coords.zoom
              }));
            }}
          >
            <div
              className={`cursor-pointer transition-all duration-200 hover:scale-110 ${
                selectedRegion === key ? 'scale-125' : ''
              }`}
              onMouseEnter={() => setHoveredRegion(key)}
              onMouseLeave={() => setHoveredRegion(null)}
              style={{
                width: selectedRegion === key ? '16px' : '12px',
                height: selectedRegion === key ? '16px' : '12px',
                backgroundColor: getMarkerColor(key, region.type),
                borderRadius: '50%',
                border: '2px solid white',
                boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
              }}
            />
          </Marker>
        );
      })
      .filter(Boolean);
  }, [selectedRegion, onRegionSelect]);

  const handleRegionClick = (regionKey) => {
    onRegionSelect(regionKey);
    if (regionKey === 'national') {
      setViewState({
        longitude: 127.7,
        latitude: 36.5,
        zoom: 6.5
      });
    } else {
      const coords = REGION_COORDINATES[regionKey];
      if (coords) {
        setViewState(prev => ({
          ...prev,
          longitude: coords.lng,
          latitude: coords.lat,
          zoom: coords.zoom
        }));
      }
    }
  };

  if (!MAPBOX_TOKEN) {
    return (
      <div className="mb-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
          <p className="text-yellow-800">
            지도를 표시하려면 Mapbox API 토큰이 필요합니다. 
            <code className="bg-yellow-100 px-2 py-1 rounded text-sm ml-1">
              REACT_APP_MAPBOX_TOKEN
            </code> 환경변수를 설정해주세요.
          </p>
        </div>
        
        {/* Fallback to grid view */}
        <h2 className="text-2xl font-bold mb-6 text-gray-800">지역 선택</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {Object.entries(regions).map(([key, region]) => (
            <div
              key={key}
              onClick={() => handleRegionClick(key)}
              className={`cursor-pointer rounded-lg border-2 p-4 transition-all duration-200 hover:shadow-lg ${
                selectedRegion === key
                  ? 'border-blue-500 bg-blue-50 shadow-md'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className={`${selectedRegion === key ? 'text-blue-600' : 'text-gray-600'}`}>
                  {getRegionTypeIcon(region.type)}
                </div>
              </div>
              <h3 className={`font-semibold text-lg mb-1 ${
                selectedRegion === key ? 'text-blue-900' : 'text-gray-800'
              }`}>
                {region.name}
              </h3>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-800">지역 선택</h2>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => handleRegionClick('national')}
            className={`px-4 py-2 rounded-lg transition-all duration-200 ${
              selectedRegion === 'national'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Building2 className="w-4 h-4 inline mr-2" />
            전국
          </button>
        </div>
      </div>

      <div className="relative h-96 rounded-lg overflow-hidden border border-gray-200">
        <Map
          {...viewState}
          onMove={evt => setViewState(evt.viewState)}
          mapboxAccessToken={MAPBOX_TOKEN}
          style={{ width: '100%', height: '100%' }}
          mapStyle="mapbox://styles/mapbox/streets-v12"
          attributionControl={false}
        >
          {markers}

          {hoveredRegion && (
            <Popup
              longitude={REGION_COORDINATES[hoveredRegion]?.lng}
              latitude={REGION_COORDINATES[hoveredRegion]?.lat}
              anchor="top"
              onClose={() => setHoveredRegion(null)}
              closeButton={false}
              className="region-popup"
            >
              <div className="p-2 min-w-[200px]">
                <div className="flex items-center mb-2">
                  <div className="text-gray-600 mr-2">
                    {getRegionTypeIcon(regions[hoveredRegion]?.type)}
                  </div>
                  <h3 className="font-semibold text-gray-800">
                    {regions[hoveredRegion]?.name}
                  </h3>
                </div>
                <div className="space-y-1 text-xs text-gray-600">
                  <p><span className="font-medium">단체장:</span> {regions[hoveredRegion]?.leader}</p>
                  <p>
                    <span className="font-medium">정당:</span>{' '}
                    <span className={regions[hoveredRegion]?.party === '국민의힘' ? 'text-red-600' : 'text-blue-600'}>
                      {regions[hoveredRegion]?.party}
                    </span>
                  </p>
                  <p><span className="font-medium">인구:</span> {regions[hoveredRegion]?.population}명</p>
                </div>
              </div>
            </Popup>
          )}
        </Map>
      </div>

      <div className="mt-4 text-sm text-gray-600">
        <div className="flex items-center space-x-6">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
            <span>국가</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-violet-500 rounded-full mr-2"></div>
            <span>광역시</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-emerald-500 rounded-full mr-2"></div>
            <span>도/특별자치</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
            <span>선택됨</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapRegionSelector;
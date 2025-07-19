import React from 'react';
import { MapPin, Users, Building2 } from 'lucide-react';
import { regions } from '../data/regions';

const RegionSelector = ({ selectedRegion, onRegionSelect }) => {
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

  const getRegionTypeLabel = (type) => {
    switch (type) {
      case 'national':
        return '대한민국';
      case 'metropolitan':
        return '광역시';
      case 'province':
        return '도';
      case 'special':
        return '특별자치';
      default:
        return '';
    }
  };

  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">지역 선택</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {Object.entries(regions).map(([key, region]) => (
          <div
            key={key}
            onClick={() => onRegionSelect(key)}
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
              <span className="text-xs text-gray-500">{getRegionTypeLabel(region.type)}</span>
            </div>
            <h3 className={`font-semibold text-lg mb-1 ${
              selectedRegion === key ? 'text-blue-900' : 'text-gray-800'
            }`}>
              {region.name}
            </h3>
            <div className="space-y-1">
              <p className="text-xs text-gray-600">
                <span className="font-medium">단체장:</span> {region.leader}
              </p>
              <p className="text-xs text-gray-600">
                <span className="font-medium">정당:</span>{' '}
                <span className={region.party === '국민의힘' ? 'text-red-600' : 'text-blue-600'}>
                  {region.party}
                </span>
              </p>
              <p className="text-xs text-gray-600">
                <span className="font-medium">인구:</span> {region.population}명
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RegionSelector;
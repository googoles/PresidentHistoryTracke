import React from 'react';
import { X } from 'lucide-react';

const DistrictPopup = ({ districts, position, onSelect, onClose, regionName }) => {
  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-30 z-40"
        onClick={onClose}
      />

      {/* Popup */}
      <div
        className="fixed z-50 bg-white dark:bg-slate-800 rounded-lg shadow-2xl border border-gray-200 dark:border-slate-600 p-4 max-w-sm"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          transform: 'translate(-50%, -50%)',
          maxHeight: '400px',
          overflow: 'auto'
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-200 dark:border-slate-600">
          <h3 className="font-semibold text-gray-900 dark:text-slate-100">
            {regionName} 선거구 선택
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
          >
            <X className="w-4 h-4 text-gray-500 dark:text-slate-400" />
          </button>
        </div>

        {/* District List */}
        <div className="space-y-2">
          {districts.map((district, index) => (
            <button
              key={index}
              onClick={() => {
                onSelect(district);
                onClose();
              }}
              className="w-full text-left px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:border-blue-500 dark:hover:border-blue-400 transition-all duration-200"
            >
              <div className="text-sm font-medium text-gray-900 dark:text-slate-100">
                {district.name}
              </div>
            </button>
          ))}
        </div>
      </div>
    </>
  );
};

export default DistrictPopup;

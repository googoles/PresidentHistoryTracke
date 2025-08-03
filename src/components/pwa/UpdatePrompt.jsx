import React from 'react';
import { RefreshCw, X } from 'lucide-react';

const UpdatePrompt = ({ onUpdate, onDismiss }) => {
  return (
    <div className="fixed top-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-white rounded-lg shadow-xl border border-gray-200 p-4 z-50 animate-slide-down">
      <div className="flex items-start justify-between">
        <div className="flex items-start">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
            <RefreshCw className="w-5 h-5 text-green-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              새로운 버전이 있습니다
            </h3>
            <p className="text-sm text-gray-600 mb-3">
              최신 기능과 개선사항을 사용하려면 앱을 업데이트하세요.
            </p>
            <div className="flex gap-2">
              <button
                onClick={onUpdate}
                className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
              >
                지금 업데이트
              </button>
              <button
                onClick={onDismiss}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 text-sm font-medium"
              >
                나중에
              </button>
            </div>
          </div>
        </div>
        <button
          onClick={onDismiss}
          className="ml-2 text-gray-400 hover:text-gray-600"
          aria-label="닫기"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default UpdatePrompt;
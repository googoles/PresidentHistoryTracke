import React from 'react';
import { Calendar, ExternalLink, TrendingUp, BarChart3 } from 'lucide-react';
import { statusConfig } from '../data/categories';

const PromiseCard = ({ promise }) => {
  const getProgressBarColor = () => {
    return statusConfig[promise.status]?.progressColor || 'bg-gray-500';
  };

  const getStatusBadge = () => {
    const config = statusConfig[promise.status] || statusConfig['중단'];
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
        {promise.status}
      </span>
    );
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 border-l-4 ${statusConfig[promise.status]?.borderColor || 'border-gray-500'} hover:shadow-lg transition-shadow duration-200`}>
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-bold text-gray-800 mb-2">{promise.title}</h3>
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <span className="bg-gray-100 px-2 py-1 rounded">{promise.category}</span>
            <span className="bg-gray-100 px-2 py-1 rounded">
              {promise.level === 'national' ? '대통령 공약' : '지자체 공약'}
            </span>
          </div>
        </div>
        {getStatusBadge()}
      </div>

      <p className="text-gray-700 mb-4">{promise.description}</p>

      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-600">진행률</span>
          <span className="text-sm font-bold text-gray-800">{promise.progress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all duration-500 ${getProgressBarColor()}`}
            style={{ width: `${promise.progress}%` }}
          />
        </div>
      </div>

      <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
        <div className="flex items-center gap-1">
          <Calendar className="w-4 h-4" />
          <span>시작: {formatDate(promise.startDate)}</span>
        </div>
        <div className="flex items-center gap-1">
          <Calendar className="w-4 h-4" />
          <span>목표: {formatDate(promise.targetDate)}</span>
        </div>
      </div>

      {promise.statistics && promise.statistics.length > 0 && (
        <div className="grid grid-cols-2 gap-4 mb-4">
          {promise.statistics.map((stat, index) => (
            <div key={index} className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <BarChart3 className="w-4 h-4 text-gray-500" />
                <span className="text-xs text-gray-600">{stat.label}</span>
              </div>
              <p className="text-lg font-bold text-gray-800">
                {stat.value}
                <span className="text-sm font-normal text-gray-600 ml-1">{stat.unit}</span>
              </p>
            </div>
          ))}
        </div>
      )}

      {promise.relatedArticles && promise.relatedArticles.length > 0 && (
        <div className="border-t pt-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            관련 기사
          </h4>
          <div className="space-y-2">
            {promise.relatedArticles.map((article, index) => (
              <a
                key={index}
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-2 text-sm text-blue-600 hover:text-blue-800 group"
              >
                <ExternalLink className="w-3 h-3 mt-1 flex-shrink-0 group-hover:text-blue-800" />
                <div>
                  <p className="font-medium">{article.title}</p>
                  <p className="text-xs text-gray-500">
                    {article.source} · {article.date}
                  </p>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PromiseCard;
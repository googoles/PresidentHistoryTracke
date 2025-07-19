export const categories = [
  { id: 'all', name: '전체', icon: '📋' },
  { id: '부동산정책', name: '부동산', icon: '🏠' },
  { id: '주거정책', name: '주거', icon: '🏘️' },
  { id: '복지정책', name: '복지', icon: '🤝' },
  { id: '교통정책', name: '교통', icon: '🚇' },
  { id: '디지털정책', name: '디지털', icon: '💻' },
  { id: '국방정책', name: '국방', icon: '🛡️' },
  { id: '교육정책', name: '교육', icon: '🎓' },
  { id: '도시재생', name: '도시재생', icon: '🏙️' },
  { id: '국제행사', name: '국제행사', icon: '🌐' },
  { id: '항만정책', name: '항만', icon: '⚓' },
  { id: '산업정책', name: '산업', icon: '🏭' }
];

export const statusConfig = {
  '달성': {
    color: 'text-green-600 bg-green-100',
    bgColor: 'bg-green-500',
    borderColor: 'border-green-500',
    progressColor: 'bg-green-500'
  },
  '진행중': {
    color: 'text-blue-600 bg-blue-100',
    bgColor: 'bg-blue-500',
    borderColor: 'border-blue-500',
    progressColor: 'bg-blue-500'
  },
  '부분달성': {
    color: 'text-yellow-600 bg-yellow-100',
    bgColor: 'bg-yellow-500',
    borderColor: 'border-yellow-500',
    progressColor: 'bg-yellow-500'
  },
  '미달성': {
    color: 'text-red-600 bg-red-100',
    bgColor: 'bg-red-600',
    borderColor: 'border-red-600',
    progressColor: 'bg-red-600'
  },
  '중단': {
    color: 'text-gray-600 bg-gray-100',
    bgColor: 'bg-gray-500',
    borderColor: 'border-gray-500',
    progressColor: 'bg-gray-500'
  }
};
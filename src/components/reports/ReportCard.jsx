import React, { useState, useEffect } from 'react';
import { 
  ThumbsUp, 
  ThumbsDown, 
  MapPin, 
  Calendar, 
  User, 
  ExternalLink, 
  Shield, 
  ShieldCheck,
  FileText,
  Camera,
  Link2,
  AlertCircle,
  Flag,
  MoreHorizontal
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { reportOperations, dbUtils } from '../../utils/database';

const ReportCard = ({ report, onVoteChange, compact = false }) => {
  const { user, isAuthenticated } = useAuth();
  const [userVote, setUserVote] = useState(null);
  const [voteCount, setVoteCount] = useState(report.upvotes || 0);
  const [voting, setVoting] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  // Report type configurations
  const reportTypeConfig = {
    progress_update: {
      icon: FileText,
      label: '진행 업데이트',
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-100 dark:bg-blue-900/20',
      borderColor: 'border-blue-200 dark:border-blue-700'
    },
    news: {
      icon: Link2,
      label: '관련 뉴스',
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-100 dark:bg-green-900/20',
      borderColor: 'border-green-200 dark:border-green-700'
    },
    photo: {
      icon: Camera,
      label: '현장 사진',
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-100 dark:bg-purple-900/20',
      borderColor: 'border-purple-200 dark:border-purple-700'
    },
    concern: {
      icon: AlertCircle,
      label: '우려사항',
      color: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-100 dark:bg-orange-900/20',
      borderColor: 'border-orange-200 dark:border-orange-700'
    }
  };

  const config = reportTypeConfig[report.report_type] || reportTypeConfig.progress_update;
  const TypeIcon = config.icon;

  // Load user's vote for this report
  useEffect(() => {
    const loadUserVote = async () => {
      if (!isAuthenticated || !user) return;

      try {
        const { data, error } = await reportOperations.getUserReportVote(report.id, user.id);
        if (!error && data) {
          setUserVote(data.vote_type);
        }
      } catch (err) {
        console.error('Failed to load user vote:', err);
      }
    };

    loadUserVote();
  }, [report.id, user, isAuthenticated]);

  // Handle vote
  const handleVote = async (voteType) => {
    if (!isAuthenticated || voting) return;

    setVoting(true);
    
    try {
      let result;
      
      if (userVote === voteType) {
        // Remove vote if clicking same vote type
        result = await reportOperations.removeReportVote(report.id, user.id);
        if (!result.error) {
          setUserVote(null);
          setVoteCount(prev => voteType === 'upvote' ? prev - 1 : prev);
        }
      } else {
        // Add or change vote
        result = await reportOperations.voteOnReport(report.id, user.id, voteType);
        if (!result.error) {
          const previousVote = userVote;
          setUserVote(voteType);
          
          // Update vote count
          setVoteCount(prev => {
            let newCount = prev;
            if (previousVote === 'upvote') newCount -= 1;
            if (voteType === 'upvote') newCount += 1;
            return newCount;
          });
        }
      }

      if (result.error) {
        throw new Error(result.error.message);
      }

      // Notify parent component
      if (onVoteChange) {
        onVoteChange(report.id, voteType, userVote);
      }

    } catch (err) {
      console.error('Failed to vote on report:', err);
    } finally {
      setVoting(false);
    }
  };

  // Handle media click
  const handleMediaClick = () => {
    if (report.media_url) {
      if (report.report_type === 'news') {
        window.open(report.media_url, '_blank', 'noopener,noreferrer');
      } else {
        // For images/videos, could open in modal or lightbox
        window.open(report.media_url, '_blank');
      }
    }
  };

  // Handle report flag
  const handleFlag = async () => {
    // This would implement report flagging functionality
    console.log('Flag report:', report.id);
    setShowMenu(false);
  };

  // Render media content
  const renderMedia = () => {
    if (!report.media_url) return null;

    if (report.report_type === 'news') {
      return (
        <button
          onClick={handleMediaClick}
          className="flex items-center gap-2 mt-3 p-3 bg-gray-50 dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 transition-colors w-full text-left"
        >
          <ExternalLink className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-blue-600 dark:text-blue-400 truncate">
              뉴스 기사 보기
            </p>
            <p className="text-xs text-gray-500 dark:text-slate-400 truncate">
              {report.media_url}
            </p>
          </div>
        </button>
      );
    }

    // For images/videos
    const isVideo = report.media_url.includes('.mp4') || report.media_url.includes('.webm');
    
    return (
      <div className="mt-3">
        <button
          onClick={handleMediaClick}
          className="relative rounded-lg overflow-hidden border border-gray-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 transition-colors w-full"
        >
          {isVideo ? (
            <video
              src={report.media_url}
              className="w-full h-48 object-cover"
              poster="" // Could add video thumbnail
            />
          ) : (
            <img
              src={report.media_url}
              alt="Report media"
              className="w-full h-48 object-cover"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          )}
          <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-10 transition-opacity" />
        </button>
      </div>
    );
  };

  return (
    <div className={`bg-white dark:bg-slate-800 rounded-lg border ${config.borderColor} ${compact ? 'p-4' : 'p-6'}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-3 flex-1">
          {/* User Avatar */}
          <div className="flex-shrink-0">
            {report.profile?.avatar_url ? (
              <img
                src={report.profile.avatar_url}
                alt={report.profile.full_name || report.profile.username}
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <div className="w-8 h-8 bg-gray-300 dark:bg-slate-600 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-gray-600 dark:text-slate-300" />
              </div>
            )}
          </div>

          {/* Report Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-medium text-gray-800 dark:text-slate-100">
                {report.profile?.full_name || report.profile?.username || '익명'}
              </span>
              <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${config.bgColor} ${config.color}`}>
                <TypeIcon className="w-3 h-3" />
                <span>{config.label}</span>
              </div>
              {report.verified && (
                <div className="flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-full text-xs">
                  <ShieldCheck className="w-3 h-3" />
                  <span>검증됨</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-slate-400">
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span>{dbUtils.getRelativeTime(report.created_at)}</span>
              </div>
              {report.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  <span>{report.location}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Menu */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded transition-colors"
            aria-label="메뉴"
          >
            <MoreHorizontal className="w-4 h-4 text-gray-500 dark:text-slate-400" />
          </button>
          
          {showMenu && (
            <div className="absolute right-0 top-full mt-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-lg py-1 z-10 min-w-32">
              <button
                onClick={handleFlag}
                className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center gap-2"
              >
                <Flag className="w-3 h-3" />
                신고
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="mb-4">
        <h4 className="font-semibold text-gray-800 dark:text-slate-100 mb-2 leading-tight">
          {report.title}
        </h4>
        <p className="text-gray-700 dark:text-slate-300 leading-relaxed text-sm">
          {compact && report.content.length > 150 
            ? `${report.content.slice(0, 150)}...`
            : report.content
          }
        </p>
      </div>

      {/* Media */}
      {renderMedia()}

      {/* Verification Info */}
      {report.verified && report.verified_by_profile && (
        <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-700">
          <div className="flex items-center gap-2 text-sm">
            <Shield className="w-4 h-4 text-green-600 dark:text-green-400" />
            <span className="text-green-700 dark:text-green-300">
              {report.verified_by_profile.full_name || report.verified_by_profile.username}님이 검증했습니다
            </span>
            {report.verified_at && (
              <span className="text-green-600 dark:text-green-400 text-xs">
                • {dbUtils.getRelativeTime(report.verified_at)}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-slate-700">
        <div className="flex items-center gap-4">
          {/* Upvote */}
          <button
            onClick={() => handleVote('upvote')}
            disabled={!isAuthenticated || voting}
            className={`flex items-center gap-1 px-2 py-1 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              userVote === 'upvote'
                ? 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/20'
                : 'text-gray-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/10'
            }`}
            aria-label="도움이 됨"
          >
            <ThumbsUp className="w-4 h-4" />
            <span className="text-sm">{voteCount}</span>
          </button>

          {/* Downvote */}
          <button
            onClick={() => handleVote('downvote')}
            disabled={!isAuthenticated || voting}
            className={`flex items-center gap-1 px-2 py-1 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              userVote === 'downvote'
                ? 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/20'
                : 'text-gray-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10'
            }`}
            aria-label="도움이 안됨"
          >
            <ThumbsDown className="w-4 h-4" />
          </button>
        </div>

        {!isAuthenticated && (
          <p className="text-xs text-gray-500 dark:text-slate-400">
            로그인하여 평가해보세요
          </p>
        )}
      </div>

      {/* Click overlay to close menu */}
      {showMenu && (
        <div
          className="fixed inset-0 z-5"
          onClick={() => setShowMenu(false)}
          aria-hidden="true"
        />
      )}
    </div>
  );
};

export default ReportCard;
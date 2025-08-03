import { supabase } from './supabase';

// Social sharing configuration
const SOCIAL_CONFIG = {
  baseUrl: process.env.REACT_APP_BASE_URL || window.location.origin,
  defaultImage: '/images/korea-promise-tracker-og.jpg',
  siteName: '대한민국 공약 추적 시스템',
  twitterHandle: '@korea_promises'
};

// Generate Open Graph meta tags for promises
export const generatePromiseMetaTags = (promise, userRating = null, communityStats = null) => {
  const url = `${SOCIAL_CONFIG.baseUrl}/promise/${promise.id}`;
  const title = `${promise.title} - 공약 추적`;
  const description = generatePromiseDescription(promise, userRating, communityStats);
  const image = generatePromiseImage(promise, communityStats);

  return {
    title,
    description,
    url,
    image,
    ogTags: {
      'og:type': 'article',
      'og:title': title,
      'og:description': description,
      'og:url': url,
      'og:image': image,
      'og:site_name': SOCIAL_CONFIG.siteName,
      'og:locale': 'ko_KR',
      'article:author': promise.level === 'national' ? '대한민국 대통령' : promise.region,
      'article:section': promise.category,
      'article:tag': `${promise.status},${promise.category},${promise.level}`
    },
    twitterTags: {
      'twitter:card': 'summary_large_image',
      'twitter:site': SOCIAL_CONFIG.twitterHandle,
      'twitter:title': title,
      'twitter:description': description,
      'twitter:image': image,
      'twitter:url': url
    }
  };
};

// Generate dynamic description based on promise data and community engagement
const generatePromiseDescription = (promise, userRating, communityStats) => {
  let description = `${promise.title}\n\n`;
  
  // Add progress information
  description += `📊 진행 상황: ${promise.status} (${promise.progress}%)\n`;
  
  // Add target date
  if (promise.targetDate) {
    const targetDate = new Date(promise.targetDate);
    description += `🎯 목표일: ${targetDate.toLocaleDateString('ko-KR')}\n`;
  }
  
  // Add community engagement if available
  if (communityStats) {
    description += `\n💬 시민 참여: `;
    if (communityStats.totalComments > 0) {
      description += `댓글 ${communityStats.totalComments}개 `;
    }
    if (communityStats.averageRating > 0) {
      description += `평점 ${communityStats.averageRating}/5.0 `;
    }
    if (communityStats.totalRatings > 0) {
      description += `(${communityStats.totalRatings}명 참여)`;
    }
  }
  
  // Add user's rating if available
  if (userRating) {
    description += `\n⭐ 내 평가: ${userRating}/5.0`;
  }
  
  description += `\n\n🏛️ 대한민국 공약 추적 시스템에서 더 자세한 정보를 확인해보세요.`;
  
  return description.trim();
};

// Generate social media image URL (would integrate with image generation service)
const generatePromiseImage = (promise, communityStats) => {
  // For now, return default image. In production, this would generate dynamic images
  return `${SOCIAL_CONFIG.baseUrl}/api/social-image/promise/${promise.id}?${new URLSearchParams({
    title: promise.title,
    status: promise.status,
    progress: promise.progress,
    category: promise.category,
    level: promise.level,
    ...(communityStats && {
      comments: communityStats.totalComments,
      rating: communityStats.averageRating
    })
  }).toString()}`;
};

// Share promise via Web Share API or fallback to clipboard
export const sharePromise = async (promise, userRating = null, additionalData = {}) => {
  try {
    // Get community stats for richer sharing
    const communityStats = await getCommunityStats(promise.id);
    
    // Generate sharing content
    const metaTags = generatePromiseMetaTags(promise, userRating, communityStats);
    const shareData = {
      title: metaTags.title,
      text: metaTags.description,
      url: metaTags.url
    };

    // Track sharing attempt
    await trackSocialShare(promise.id, 'attempted', additionalData);

    // Try Web Share API first (mobile devices)
    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      await navigator.share(shareData);
      await trackSocialShare(promise.id, 'native', additionalData);
      return { success: true, method: 'native' };
    }

    // Fallback to clipboard
    const shareText = `${shareData.title}\n\n${shareData.text}\n\n${shareData.url}`;
    await navigator.clipboard.writeText(shareText);
    await trackSocialShare(promise.id, 'clipboard', additionalData);
    return { success: true, method: 'clipboard' };

  } catch (error) {
    console.error('Share failed:', error);
    await trackSocialShare(promise.id, 'failed', { ...additionalData, error: error.message });
    
    // Ultimate fallback - open share URL
    const fallbackUrl = generateFallbackShareUrl(promise);
    window.open(fallbackUrl, '_blank');
    return { success: true, method: 'fallback' };
  }
};

// Share to specific social platforms
export const shareToPlatform = async (platform, promise, userRating = null) => {
  const communityStats = await getCommunityStats(promise.id);
  const metaTags = generatePromiseMetaTags(promise, userRating, communityStats);
  
  let shareUrl = '';
  
  switch (platform) {
    case 'twitter':
      shareUrl = `https://twitter.com/intent/tweet?${new URLSearchParams({
        text: `${metaTags.title}\n\n${promise.status} (${promise.progress}%)`,
        url: metaTags.url,
        hashtags: `공약추적,${promise.category},${promise.level === 'national' ? '국정공약' : '지방공약'}`
      }).toString()}`;
      break;
      
    case 'facebook':
      shareUrl = `https://www.facebook.com/sharer/sharer.php?${new URLSearchParams({
        u: metaTags.url,
        quote: metaTags.description
      }).toString()}`;
      break;
      
    case 'linkedin':
      shareUrl = `https://www.linkedin.com/sharing/share-offsite/?${new URLSearchParams({
        url: metaTags.url,
        title: metaTags.title,
        summary: metaTags.description
      }).toString()}`;
      break;
      
    case 'telegram':
      shareUrl = `https://t.me/share/url?${new URLSearchParams({
        url: metaTags.url,
        text: `${metaTags.title}\n\n${metaTags.description}`
      }).toString()}`;
      break;
      
    case 'whatsapp':
      shareUrl = `https://wa.me/?${new URLSearchParams({
        text: `${metaTags.title}\n\n${metaTags.url}`
      }).toString()}`;
      break;
      
    case 'kakao':
      // KakaoTalk sharing would require Kakao SDK integration
      shareUrl = `kakaotalk://send?${new URLSearchParams({
        text: `${metaTags.title}\n\n${metaTags.url}`
      }).toString()}`;
      break;
      
    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }
  
  // Track platform-specific sharing
  await trackSocialShare(promise.id, platform, { platform });
  
  // Open sharing URL
  window.open(shareUrl, '_blank', 'width=600,height=400');
  return { success: true, method: platform };
};

// Get community statistics for a promise
const getCommunityStats = async (promiseId) => {
  try {
    // Get comments count
    const { count: commentsCount } = await supabase
      .from('comments')
      .select('*', { count: 'exact', head: true })
      .eq('promise_id', promiseId);

    // Get ratings data
    const { data: ratings, count: ratingsCount } = await supabase
      .from('promise_ratings')
      .select('rating', { count: 'exact' })
      .eq('promise_id', promiseId);

    // Calculate average rating
    const averageRating = ratings && ratings.length > 0
      ? (ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length).toFixed(1)
      : 0;

    // Get reports count
    const { count: reportsCount } = await supabase
      .from('citizen_reports')
      .select('*', { count: 'exact', head: true })
      .eq('promise_id', promiseId);

    return {
      totalComments: commentsCount || 0,
      totalRatings: ratingsCount || 0,
      totalReports: reportsCount || 0,
      averageRating: parseFloat(averageRating),
      totalEngagement: (commentsCount || 0) + (ratingsCount || 0) + (reportsCount || 0)
    };
  } catch (error) {
    console.error('Error fetching community stats:', error);
    return {
      totalComments: 0,
      totalRatings: 0,
      totalReports: 0,
      averageRating: 0,
      totalEngagement: 0
    };
  }
};

// Track social sharing events
const trackSocialShare = async (promiseId, method, additionalData = {}) => {
  try {
    await supabase
      .from('social_shares')
      .insert({
        promise_id: promiseId,
        share_method: method,
        user_agent: navigator.userAgent,
        referrer: document.referrer,
        timestamp: new Date().toISOString(),
        additional_data: additionalData
      });
  } catch (error) {
    console.error('Error tracking social share:', error);
  }
};

// Generate fallback share URL for unsupported browsers
const generateFallbackShareUrl = (promise) => {
  return `mailto:?subject=${encodeURIComponent(`공약 공유: ${promise.title}`)}&body=${encodeURIComponent(
    `${promise.title}\n\n` +
    `진행 상황: ${promise.status} (${promise.progress}%)\n\n` +
    `자세한 내용: ${SOCIAL_CONFIG.baseUrl}/promise/${promise.id}\n\n` +
    `대한민국 공약 추적 시스템에서 확인해보세요.`
  )}`;
};

// Create shareable promise card (for social media images)
export const createShareableCard = async (promise, options = {}) => {
  const {
    includeRating = true,
    includeProgress = true,
    includeComments = true,
    theme = 'light',
    size = 'large' // 'small', 'medium', 'large'
  } = options;

  // This would integrate with a service like Puppeteer or Canvas API
  // to generate dynamic social media cards
  const cardConfig = {
    width: size === 'large' ? 1200 : size === 'medium' ? 600 : 400,
    height: size === 'large' ? 630 : size === 'medium' ? 315 : 210,
    promise,
    theme,
    includeRating,
    includeProgress,
    includeComments,
    watermark: SOCIAL_CONFIG.siteName
  };

  // For now, return a placeholder URL
  // In production, this would call an image generation service
  return `${SOCIAL_CONFIG.baseUrl}/api/generate-card?${new URLSearchParams(cardConfig).toString()}`;
};

// Check if content is trending/viral
export const analyzeViralPotential = async (promiseId, timeWindow = '24h') => {
  try {
    const hoursBack = timeWindow === '1h' ? 1 : timeWindow === '6h' ? 6 : 24;
    const startTime = new Date(Date.now() - (hoursBack * 60 * 60 * 1000));

    // Get recent engagement
    const { count: recentComments } = await supabase
      .from('comments')
      .select('*', { count: 'exact', head: true })
      .eq('promise_id', promiseId)
      .gte('created_at', startTime.toISOString());

    const { count: recentRatings } = await supabase
      .from('promise_ratings')
      .select('*', { count: 'exact', head: true })
      .eq('promise_id', promiseId)
      .gte('created_at', startTime.toISOString());

    const { count: recentShares } = await supabase
      .from('social_shares')
      .select('*', { count: 'exact', head: true })
      .eq('promise_id', promiseId)
      .gte('timestamp', startTime.toISOString());

    // Calculate viral score
    const recentEngagement = (recentComments || 0) + (recentRatings || 0);
    const shareRate = (recentShares || 0) / Math.max(recentEngagement, 1);
    const velocity = recentEngagement / hoursBack;

    const viralScore = Math.round(
      (velocity * 10) + 
      (shareRate * 50) + 
      (recentShares * 5)
    );

    const isViral = viralScore > 50;
    const isTrending = viralScore > 20;

    return {
      isViral,
      isTrending,
      viralScore,
      metrics: {
        recentComments: recentComments || 0,
        recentRatings: recentRatings || 0,
        recentShares: recentShares || 0,
        velocity,
        shareRate: shareRate.toFixed(2)
      }
    };
  } catch (error) {
    console.error('Error analyzing viral potential:', error);
    return {
      isViral: false,
      isTrending: false,
      viralScore: 0,
      metrics: {
        recentComments: 0,
        recentRatings: 0,
        recentShares: 0,
        velocity: 0,
        shareRate: '0.00'
      }
    };
  }
};

// Generate SEO-optimized meta tags for the main page
export const generatePageMetaTags = (pageType = 'home', data = {}) => {
  let title, description, keywords;

  switch (pageType) {
    case 'home':
      title = '대한민국 공약 추적 시스템 - 대통령 및 지자체장 공약 이행 현황';
      description = '대한민국 대통령과 광역단체장의 공약 이행 현황을 실시간으로 추적하고 시민들의 의견을 공유할 수 있는 플랫폼입니다. 투명한 정치를 위한 시민 참여형 모니터링 시스템.';
      keywords = '공약추적,대통령공약,지자체공약,공약이행,정치투명성,시민참여,정책모니터링';
      break;
      
    case 'analytics':
      title = '공약 추적 분석 대시보드 - 실시간 시민 참여도 및 트렌드 분석';
      description = '전국 지자체별 공약 이행률, 시민 참여도, 만족도를 실시간으로 분석하고 비교할 수 있는 데이터 대시보드입니다.';
      keywords = '공약분석,데이터대시보드,시민참여도,지역비교,공약통계,트렌드분석';
      break;
      
    case 'region':
      title = `${data.regionName} 공약 현황 - 대한민국 공약 추적 시스템`;
      description = `${data.regionName} ${data.leader} 단체장의 공약 이행 현황과 시민들의 평가를 확인하세요. 실시간 공약 진행률과 시민 의견을 한눈에 볼 수 있습니다.`;
      keywords = `${data.regionName},${data.leader},지방공약,공약이행률,시민평가`;
      break;
      
    default:
      title = '대한민국 공약 추적 시스템';
      description = '투명하고 책임감 있는 정치를 위한 공약 추적 플랫폼';
      keywords = '공약추적,정치투명성,시민참여';
  }

  return {
    title,
    description,
    keywords,
    ogTags: {
      'og:type': 'website',
      'og:title': title,
      'og:description': description,
      'og:site_name': SOCIAL_CONFIG.siteName,
      'og:locale': 'ko_KR',
      'og:image': SOCIAL_CONFIG.defaultImage
    },
    twitterTags: {
      'twitter:card': 'summary_large_image',
      'twitter:site': SOCIAL_CONFIG.twitterHandle,
      'twitter:title': title,
      'twitter:description': description,
      'twitter:image': SOCIAL_CONFIG.defaultImage
    }
  };
};

export default {
  generatePromiseMetaTags,
  sharePromise,
  shareToplatform: shareToplatform,
  createShareableCard,
  analyzeViralPotential,
  generatePageMetaTags,
  getCommunityStats: getCommunityStats
};
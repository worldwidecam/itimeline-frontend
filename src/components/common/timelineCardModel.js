const toNumber = (value, fallback = 0) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
};

const toTrimmedString = (value, fallback = '') => {
  const normalized = String(value || '').trim();
  return normalized || fallback;
};

const normalizeMediaUrl = (url) => {
  if (!url) return '';
  const trimmed = String(url).trim();
  // Replace absolute localhost backend URLs with relative paths to hit the Vite proxy
  return trimmed.replace(/^https?:\/\/localhost:5000\//, '/');
};

export function normalizeTimelineCardData(timeline) {
  const raw = timeline || {};
  const timelineType = String(raw?.timeline_type || 'hashtag').toLowerCase();
  const isCommunity = timelineType === 'community';
  const isPersonal = timelineType === 'personal';
  const isHashtag = timelineType === 'hashtag';

  const timelineId = toNumber(raw?.id, 0);
  const timelineName = toTrimmedString(raw?.name, 'Timeline');
  const typeLabel = isCommunity ? 'Community Timeline' : isPersonal ? 'Personal Timeline' : 'Hashtag Timeline';

  const memberCount = toNumber(raw?.member_count ?? raw?.memberCount ?? 0, 0);
  const followerCount = toNumber(
    raw?.follow_count
    ?? raw?.followers_count
    ?? raw?.follower_count
    ?? raw?.followersCount
    ?? 0,
    0,
  );
  const popularityCount = toNumber(raw?.popularity_count ?? 0, 0);

  const audienceCount = isCommunity
    ? (memberCount || followerCount || popularityCount)
    : (followerCount || memberCount || popularityCount);
  const audienceLabel = isCommunity ? 'Members' : 'Followers';

  const portraitCoverUrl = normalizeMediaUrl(raw?.cover_portrait_image_url);
  const fallbackCoverUrl = normalizeMediaUrl(
    raw?.cover_image_url
    || raw?.banner_url
    || raw?.cover_url
    || raw?.background_image_url,
  );
  const hasPortraitCover = Boolean(portraitCoverUrl);
  const coverImageUrl = isCommunity
    ? portraitCoverUrl
    : ((isPersonal || isHashtag) ? (portraitCoverUrl || fallbackCoverUrl) : fallbackCoverUrl);

  return {
    id: timelineId,
    name: timelineName,
    type: timelineType,
    isCommunity,
    isPersonal,
    isHashtag,
    typeLabel,
    memberCount,
    followerCount,
    popularityCount,
    audienceCount,
    audienceLabel,
    portraitCoverUrl,
    hasPortraitCover,
    portraitCoverPosition: {
      x: toNumber(raw?.cover_portrait_x, 50),
      y: toNumber(raw?.cover_portrait_y, 50),
    },
    portraitCoverZoom: toNumber(raw?.cover_portrait_zoom, 1),
    fallbackCoverUrl,
    coverImageUrl,
    isImagePrivilegeEnabled: raw?.cover_upload_enabled !== false,
    description: toTrimmedString(raw?.description),
    createdAt: raw?.created_at || null,
    raw,
  };
}

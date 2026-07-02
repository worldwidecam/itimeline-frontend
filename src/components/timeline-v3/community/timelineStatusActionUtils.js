export const STATUS_ACTION_TYPE_MAP = {
  bronze_action: 'bronze',
  silver_action: 'silver',
  gold_action: 'gold',
};

export const STATUS_VARIANT_MAP = {
  good: {
    icon: '#2e7d32',
    hover: '#1b5e20',
    header: 'linear-gradient(180deg, #2e7d32 0%, #4caf50 100%)',
    body: 'linear-gradient(180deg, #b7e3c0 0%, #edf7ef 100%)',
    text: '#1b5e20',
    label: 'GOOD NEWS',
    tooltip: 'View good news',
    layout: 'portrait',
  },
  bad: {
    icon: '#c62828',
    hover: '#8e0000',
    header: 'linear-gradient(180deg, #c62828 0%, #ef5350 100%)',
    body: 'linear-gradient(180deg, #f6b7b7 0%, #fdeaea 100%)',
    text: '#8e0000',
    label: 'BAD NEWS',
    tooltip: 'View bad news',
    layout: 'portrait',
  },
  bronze_action: {
    icon: '#cd7f32',
    hover: '#a46122',
    header: 'linear-gradient(180deg, #8d5524 0%, #cd7f32 100%)',
    body: 'linear-gradient(180deg, #f4d4b4 0%, #fdf3e8 100%)',
    text: '#5f3815',
    label: 'BRONZE ACTION',
    tooltip: 'View bronze action status',
    layout: 'landscape',
  },
  silver_action: {
    icon: '#9e9e9e',
    hover: '#757575',
    header: 'linear-gradient(180deg, #8f8f95 0%, #cfcfd6 100%)',
    body: 'linear-gradient(180deg, #ececf0 0%, #fbfbfd 100%)',
    text: '#4a4a52',
    label: 'SILVER ACTION',
    tooltip: 'View silver action status',
    layout: 'landscape',
  },
  gold_action: {
    icon: '#d4af37',
    hover: '#a67c00',
    header: 'linear-gradient(180deg, #b8860b 0%, #f1c84c 100%)',
    body: 'linear-gradient(180deg, #ffe59a 0%, #fff8df 100%)',
    text: '#6f5300',
    label: 'GOLD ACTION',
    tooltip: 'View gold action status',
    layout: 'landscape',
  },
};

export const formatActionSchedule = (dateValue, options = {}) => {
  if (!dateValue) return null;
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return null;

  const includeDayLabel = options?.includeDayLabel === true;

  return {
    dateLabel: date.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    }),
    timeLabel: date.toLocaleTimeString(undefined, {
      hour: 'numeric',
      minute: '2-digit',
    }),
    dayLabel: includeDayLabel ? date.toLocaleDateString(undefined, { weekday: 'long' }) : null,
  };
};

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const getActionProgressMeta = (action) => {
  const progress = action?.progress;
  if (!progress) return { label: '', ratio: 0, isUnlocked: false };

  const ratioRaw = Number(progress?.progress_ratio ?? progress?.ratio ?? progress?.percent ?? 0);
  const ratioFromRaw = Math.max(0, Math.min(1, Number.isFinite(ratioRaw) ? ratioRaw : 0));
  const isUnlocked = progress?.is_unlocked !== false;

  if (progress.threshold_type === 'members') {
    const usesAdditional = progress?.current_additional_members != null || progress?.goal_additional_members != null;
    const current = toNumber(
      usesAdditional ? progress.current_additional_members : (progress.current_members ?? progress.current),
      0,
    );
    const goal = toNumber(
      usesAdditional
        ? progress.goal_additional_members
        : (progress.threshold_value ?? progress.required_members ?? progress.goal_members),
      0,
    );
    const ratio = goal <= 0 ? ratioFromRaw : Math.min(1, Math.max(0, current / goal));

    return {
      label: goal > 0
        ? `${current}/${goal} ${usesAdditional ? 'additional members' : 'members'}`
        : '',
      ratio,
      isUnlocked,
    };
  }

  if (progress.threshold_type === 'votes') {
    const current = toNumber(progress.current_votes ?? progress.current, 0);
    const goal = toNumber(progress.goal_votes ?? progress.threshold_value ?? progress.required_votes, 0);
    const ratio = goal <= 0 ? ratioFromRaw : Math.min(1, Math.max(0, current / goal));

    return {
      label: goal > 0 ? `${current}/${goal} votes` : '',
      ratio,
      isUnlocked,
    };
  }

  return {
    label: '',
    ratio: ratioFromRaw,
    isUnlocked,
  };
};

export const canVoteForAction = (action) => 
  action?.progress?.threshold_type === 'votes' || 
  action?.progress?.thresholdType === 'votes';

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Chip,
  Button,
  useTheme,
  alpha,
  Divider,
  Stack,
  Tooltip,
  LinearProgress
} from '@mui/material';
import {
  AccountTree as HierarchyIcon,
  EmojiEvents as TrophyIcon,
  Info as InfoIcon,
  Security as SecurityIcon,
  CheckCircle as CheckCircleIcon,
  Groups as GroupsIcon,
  LocalCafe as CoffeeIcon,
  Store as StoreIcon,
  Business as BusinessIcon,
  Lock as LockIcon,
  LockOpen as LockOpenIcon,
  SwapHoriz as FlipIcon,
  Flag as FlagIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import ActionCard from '../timeline-v3/community/ActionCard';

/**
 * FlipActionCard
 * Interactive card that renders the locked goal face initially, and smoothly flips in 3D
 * when clicked to show the unlocked active ActionCard with live voting controls.
 */
const FlipActionCard = ({
  tier,
  title,
  lockedDescription,
  currentMembers,
  requiredMembers,
  action,
  onVote,
  isFlipped,
  onToggleFlip,
  isDark
}) => {
  const colors = {
    bronze: {
      accent: '#cd7f32',
      bg: isDark ? 'linear-gradient(145deg, #2d2520, #1a1512)' : 'linear-gradient(145deg, #f8f0e8, #e6d0c0)',
      edge: isDark ? 'rgba(205,127,50,0.35)' : 'rgba(205,127,50,0.45)',
      strip: 'linear-gradient(90deg, #cd7f32, #e1a66b, #cd7f32)',
    },
    silver: {
      accent: '#c0c0c0',
      bg: isDark ? 'linear-gradient(145deg, #2d2d32, #1a1a1f)' : 'linear-gradient(145deg, #f8f8fa, #e6e6e9)',
      edge: isDark ? 'rgba(192,192,192,0.3)' : 'rgba(192,192,192,0.42)',
      strip: 'linear-gradient(90deg, #c0c0c0, #e6e6e6, #c0c0c0)',
    },
    gold: {
      accent: '#ffd700',
      bg: isDark ? 'linear-gradient(145deg, #2d2a20, #19160f)' : 'linear-gradient(145deg, #f8f3e6, #eadcb0)',
      edge: isDark ? 'rgba(212,175,55,0.35)' : 'rgba(212,175,55,0.45)',
      strip: 'linear-gradient(90deg, #d4af37, #f5d970, #d4af37)',
    }
  }[tier];

  const ratio = Math.min(1, currentMembers / requiredMembers);

  return (
    <Box
      sx={{
        perspective: '1200px',
        width: '100%',
        minHeight: { xs: 320, md: 340 },
        cursor: 'pointer',
        position: 'relative'
      }}
      onClick={onToggleFlip}
    >
      <motion.div
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.55, ease: [0.4, 0.2, 0.2, 1] }}
        style={{
          width: '100%',
          minHeight: 340,
          transformStyle: 'preserve-3d',
          position: 'relative'
        }}
      >
        {/* FRONT: BLURRED LOCKED FACE (Visible by default) */}
        <Card
          sx={{
            position: 'relative',
            width: '100%',
            minHeight: { xs: 320, md: 340 },
            borderRadius: 2.5,
            background: colors.bg,
            border: `1px solid ${colors.edge}`,
            boxShadow: isDark
              ? `0 10px 24px rgba(0,0,0,0.45), 0 0 0 1px ${colors.edge}`
              : `0 8px 20px rgba(0,0,0,0.08), 0 0 0 1px ${colors.edge}`,
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            p: 3,
            pb: 2,
            zIndex: isFlipped ? 0 : 2,
            visibility: isFlipped ? 'hidden' : 'visible',
            pointerEvents: isFlipped ? 'none' : 'auto',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '4px',
              background: colors.strip,
              zIndex: 4,
            },
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: `0 14px 28px ${alpha(colors.accent, 0.35)}`,
            }
          }}
        >
          {/* Layer 1: Blurred ghost content of the action in the background */}
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              p: 2.5,
              pt: 3,
              filter: 'blur(5px)',
              WebkitFilter: 'blur(5px)',
              opacity: isDark ? 0.35 : 0.5,
              pointerEvents: 'none',
              userSelect: 'none',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              zIndex: 1,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <FlagIcon sx={{ color: colors.accent, fontSize: '1.2rem' }} />
              <Typography sx={{ fontWeight: 800, textTransform: 'uppercase', color: colors.accent, fontSize: '0.9rem', letterSpacing: '0.5px' }}>
                {title} ACTION
              </Typography>
            </Box>
            <Box sx={{ my: 'auto', textAlign: 'center', px: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5, lineHeight: 1.25 }}>
                {action?.title}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.85, fontSize: '0.85rem' }}>
                {action?.description}
              </Typography>
            </Box>
            <Box sx={{ width: '80%', mx: 'auto', height: 8, bgcolor: alpha(colors.accent, 0.4), borderRadius: 999 }} />
          </Box>

          {/* Layer 2: Frosted glass backdrop overlay */}
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              bgcolor: isDark ? 'rgba(15, 18, 25, 0.75)' : 'rgba(255, 255, 255, 0.72)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              zIndex: 2,
              pointerEvents: 'none',
            }}
          />

          {/* Layer 3: IN-FLOW Content sitting above the frosted overlay */}
          <Box sx={{ position: 'relative', zIndex: 3, textAlign: 'center', mt: 0.5 }}>
            <LockIcon
              sx={{
                fontSize: 42,
                color: colors.accent,
                filter: `drop-shadow(0 0 10px ${alpha(colors.accent, 0.65)})`,
                mb: 0.8
              }}
            />
            <Typography variant="h5" sx={{ fontWeight: 900, letterSpacing: '1px', color: colors.accent }}>
              {title}
            </Typography>
            <Typography variant="body2" sx={{ mt: 1.2, color: isDark ? 'rgba(255,255,255,0.92)' : 'rgba(0,0,0,0.85)', fontWeight: 600 }}>
              {lockedDescription}
            </Typography>
          </Box>

          <Box sx={{ position: 'relative', zIndex: 3, mt: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.8 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                Agreement Progress
              </Typography>
              <Typography variant="caption" sx={{ color: colors.accent, fontWeight: 700 }}>
                {currentMembers} / {requiredMembers} members
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={Math.round(ratio * 100)}
              sx={{
                height: 8,
                borderRadius: 999,
                bgcolor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                '& .MuiLinearProgress-bar': {
                  bgcolor: colors.accent,
                }
              }}
            />
          </Box>

          <Typography
            variant="caption"
            sx={{
              position: 'relative',
              zIndex: 3,
              display: 'block',
              textAlign: 'center',
              fontSize: '0.72rem',
              color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)',
              mt: 2,
              userSelect: 'none'
            }}
          >
            Tap card to preview unlocked 🔓
          </Typography>
        </Card>

        {/* BACK: UNLOCKED FACE (Visible when flipped) */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            transform: 'rotateY(180deg)',
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            zIndex: isFlipped ? 2 : 0,
            visibility: isFlipped ? 'visible' : 'hidden',
            pointerEvents: isFlipped ? 'auto' : 'none',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Box sx={{ flexGrow: 1, position: 'relative', display: 'flex', flexDirection: 'column', height: '100%' }}>
            <ActionCard
              action={action}
              onVote={(e) => {
                e?.stopPropagation?.();
                onVote();
              }}
              displayMode="list"
            />
            <Typography
              variant="caption"
              sx={{
                display: 'block',
                textAlign: 'center',
                fontSize: '0.72rem',
                color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
                mt: 1,
                pb: 0.5,
                zIndex: 2,
                position: 'relative',
                userSelect: 'none'
              }}
            >
              Tap card to lock 🔒
            </Typography>
          </Box>
        </Box>
      </motion.div>
    </Box>
  );
};

export default function LandingCommunityShowcase() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  // Tree progression level: 0 = General Community (Baristas), 1 = Companies, 2 = Stores
  // Default to 0 (1. Baristas) per user request
  const [treeLevel, setTreeLevel] = useState(0);

  // Single-card flip state: null (all locked) or 'bronze' | 'silver' | 'gold'
  const [flippedTier, setFlippedTier] = useState(null);
  const handleToggleFlip = (tier) => setFlippedTier(prev => (prev === tier ? null : tier));

  // Interactive demo votes on the action cards (initialized to match required member milestones)
  const [votes, setVotes] = useState({
    bronze: 7,
    silver: 65,
    gold: 320
  });
  const [hasVoted, setHasVoted] = useState({});

  const handleDemoVote = (tier) => {
    if (hasVoted[tier]) return;
    setVotes(prev => ({ ...prev, [tier]: prev[tier] + 1 }));
    setHasVoted(prev => ({ ...prev, [tier]: true }));
  };

  // Mock actions using genuine ActionCard formatting with progress.is_unlocked = true so ActionCard renders unlocked content
  const bronzeAction = {
    action_type: 'bronze',
    title: 'Create Community group chat!',
    description: 'Hit this link and join our Discord.',
    due_date: new Date(Date.now() + 86400000 * 2).toISOString(),
    current_count: votes.bronze,
    target_count: 10,
    vote_count: votes.bronze,
    is_voted: Boolean(hasVoted.bronze),
    progress: {
      is_unlocked: true,
      ratio: votes.bronze / 10,
      label: `${votes.bronze}/10 agreed`
    }
  };

  const silverAction = {
    action_type: 'silver',
    title: 'Local Coffee shop!',
    description: 'We are going to make local coffee shop our meeting place.',
    due_date: new Date(Date.now() + 86400000 * 6).toISOString(),
    current_count: votes.silver,
    target_count: 100,
    vote_count: votes.silver,
    is_voted: Boolean(hasVoted.silver),
    progress: {
      is_unlocked: true,
      ratio: Math.min(1, votes.silver / 100),
      label: `${votes.silver}/100 agreed`
    }
  };

  const goldAction = {
    action_type: 'gold',
    title: 'Walkout!',
    description: "We have all the employees as members! It's time, let's walk off!",
    due_date: new Date(Date.now() + 86400000 * 14).toISOString(),
    current_count: votes.gold,
    target_count: 1000,
    vote_count: votes.gold,
    is_voted: Boolean(hasVoted.gold),
    progress: {
      is_unlocked: true,
      ratio: Math.min(1, votes.gold / 1000),
      label: `${votes.gold}/1,000 agreed`
    }
  };

  return (
    <Box sx={{ width: '100%', maxWidth: '1200px', mx: 'auto', display: 'flex', flexDirection: 'column', gap: 5 }}>
      {/* SECTION 1: Community Hierarchy & Theory Board Lineage Tree */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2.5, md: 4 },
          borderRadius: 3,
          background: isDark
            ? 'linear-gradient(135deg, rgba(22, 27, 34, 0.98), rgba(13, 17, 23, 0.98))'
            : 'linear-gradient(135deg, #ffffff, #f8f9fa)',
          border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
          boxShadow: isDark ? '0 12px 30px rgba(0,0,0,0.5)' : '0 8px 24px rgba(0,0,0,0.06)'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
          <HierarchyIcon sx={{ color: 'primary.main', fontSize: 28 }} />
          <Typography variant="h5" sx={{ fontWeight: 800 }}>
            Communities working Together
          </Typography>
          <Chip label="Visual Aid" size="small" color="primary" variant="outlined" sx={{ fontWeight: 600 }} />
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Each community you join might want you to join more smaller communities as well. The more you join, the more voice we can have as that Community.
        </Typography>

        <Grid container spacing={3} alignItems="stretch">
          {/* LEFT: Tree Level Selector (Baristas -> The Companies -> The Stores) */}
          <Grid item xs={12} md={4}>
            <Stack spacing={2} sx={{ height: '100%', justifyContent: 'center' }}>
              {/* Level 0: 1. Baristas */}
              <Box
                onClick={() => setTreeLevel(0)}
                sx={{
                  p: 2,
                  borderRadius: 2,
                  cursor: 'pointer',
                  transition: 'all 0.25s ease',
                  border: `2px solid ${treeLevel === 0 ? theme.palette.primary.main : isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
                  background: treeLevel === 0
                    ? (isDark ? 'rgba(69, 104, 220, 0.18)' : 'rgba(69, 104, 220, 0.1)')
                    : (isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'),
                  '&:hover': { transform: 'translateX(4px)' }
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CoffeeIcon sx={{ color: '#8d6e63' }} /> 1. Baristas
                  </Typography>
                  <Chip label="General" size="small" sx={{ height: 20, fontSize: '0.7rem' }} />
                </Box>
                <Typography variant="caption" color="text.secondary">
                  Imagine this community as the biggest GENERAL community.
                </Typography>
              </Box>

              {/* Level 1: 2. The Companies */}
              <Box
                onClick={() => setTreeLevel(1)}
                sx={{
                  p: 2,
                  borderRadius: 2,
                  cursor: 'pointer',
                  transition: 'all 0.25s ease',
                  border: `2px solid ${treeLevel === 1 ? theme.palette.primary.main : isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
                  background: treeLevel === 1
                    ? (isDark ? 'rgba(69, 104, 220, 0.18)' : 'rgba(69, 104, 220, 0.1)')
                    : (isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'),
                  '&:hover': { transform: 'translateX(4px)' }
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <BusinessIcon sx={{ color: '#4caf50' }} /> 2. The Companies
                  </Typography>
                  <Chip label="Workplace" size="small" color="secondary" sx={{ height: 20, fontSize: '0.7rem' }} />
                </Box>
                <Typography variant="caption" color="text.secondary">
                  Now imagine workers from these communities joining their respective workplaces.
                </Typography>
              </Box>

              {/* Level 2: 3. The Stores */}
              <Box
                onClick={() => setTreeLevel(2)}
                sx={{
                  p: 2,
                  borderRadius: 2,
                  cursor: 'pointer',
                  transition: 'all 0.25s ease',
                  border: `2px solid ${treeLevel === 2 ? theme.palette.primary.main : isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
                  background: treeLevel === 2
                    ? (isDark ? 'rgba(69, 104, 220, 0.18)' : 'rgba(69, 104, 220, 0.1)')
                    : (isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'),
                  '&:hover': { transform: 'translateX(4px)' }
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <StoreIcon sx={{ color: '#ff7043' }} /> 3. The Stores
                  </Typography>
                  <Chip label="Local Shop" size="small" color="success" sx={{ height: 20, fontSize: '0.7rem' }} />
                </Box>
                <Typography variant="caption" color="text.secondary">
                  And finally, you join your exact local store. Where you and your real-life coworkers take action together.
                </Typography>
              </Box>
            </Stack>
          </Grid>

          {/* RIGHT: Dynamic Lineage Tree Canvas */}
          <Grid item xs={12} md={8}>
            <Box
              sx={{
                width: '100%',
                minHeight: '440px',
                borderRadius: 3,
                p: 3,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: treeLevel === 0 ? 'center' : 'flex-start',
                alignItems: 'center',
                position: 'relative',
                overflow: 'hidden',
                background: isDark
                  ? 'radial-gradient(rgba(255, 255, 255, 0.12) 1px, #0b1017 1px)'
                  : 'radial-gradient(rgba(0, 0, 0, 0.12) 1px, #f4f6f8 1px)',
                backgroundSize: '24px 24px',
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
                transition: 'all 0.4s ease'
              }}
            >
              {/* TRUNK / GENERAL COMMUNITY NODE */}
              <motion.div
                layout
                transition={{ type: 'spring', stiffness: 260, damping: 25 }}
                style={{ zIndex: 3, width: '100%', maxWidth: '340px' }}
              >
                <Card
                  sx={{
                    p: 2,
                    textAlign: 'center',
                    background: isDark ? 'linear-gradient(135deg, #271d17, #19120e)' : '#ffffff',
                    border: '2px solid #8d6e63',
                    boxShadow: '0 8px 24px rgba(141, 110, 99, 0.25)',
                    borderRadius: 2.5
                  }}
                >
                  <Typography variant="caption" sx={{ color: '#bcaaa4', fontWeight: 700, letterSpacing: '0.5px' }}>
                    ☕ BIG GENERAL COMMUNITY
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 800, mt: 0.5, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                    Baristas United
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                    14,250 Baristas • Sharing knowledge & resources
                  </Typography>
                </Card>
              </motion.div>

              {/* BRANCHES / THE COMPANIES (Grow out when treeLevel >= 1) */}
              <AnimatePresence>
                {treeLevel >= 1 && (
                  <motion.div
                    initial={{ opacity: 0, y: -20, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.9 }}
                    transition={{ duration: 0.35, ease: 'easeOut' }}
                    style={{ width: '100%', zIndex: 2 }}
                  >
                    {/* SVG Connector Branch Stem */}
                    <Box sx={{ width: '100%', height: '36px', display: 'flex', justifyContent: 'center' }}>
                      <svg width="100%" height="36" style={{ overflow: 'visible' }}>
                        <line x1="50%" y1="0" x2="50%" y2="18" stroke="#4caf50" strokeWidth="2.5" />
                        <line x1="20%" y1="18" x2="80%" y2="18" stroke="#4caf50" strokeWidth="2.5" />
                        <line x1="20%" y1="18" x2="20%" y2="36" stroke="#4caf50" strokeWidth="2.5" />
                        <line x1="50%" y1="18" x2="50%" y2="36" stroke="#4caf50" strokeWidth="2.5" />
                        <line x1="80%" y1="18" x2="80%" y2="36" stroke="#4caf50" strokeWidth="2.5" />
                      </svg>
                    </Box>

                    {/* 3 Company Nodes */}
                    <Grid container spacing={1.5} justifyContent="center">
                      <Grid item xs={4}>
                        <Card sx={{ p: 1.5, textAlign: 'center', opacity: 0.75, borderRadius: 2 }}>
                          <Typography variant="caption" sx={{ fontWeight: 700 }}>Pete's Coffee</Typography>
                          <Typography variant="caption" color="text.secondary" display="block">1,420 workers</Typography>
                        </Card>
                      </Grid>

                      <Grid item xs={4}>
                        <Card
                          sx={{
                            p: 1.5,
                            textAlign: 'center',
                            borderRadius: 2,
                            border: '2px solid #4caf50',
                            background: isDark ? 'rgba(76, 175, 80, 0.15)' : 'rgba(76, 175, 80, 0.08)',
                            boxShadow: '0 4px 14px rgba(76, 175, 80, 0.3)'
                          }}
                        >
                          <Typography variant="caption" sx={{ fontWeight: 800, color: '#4caf50' }}>Star-cups Workers</Typography>
                          <Typography variant="caption" color="text.secondary" display="block">2,840 workers (Selected)</Typography>
                        </Card>
                      </Grid>

                      <Grid item xs={4}>
                        <Card sx={{ p: 1.5, textAlign: 'center', opacity: 0.75, borderRadius: 2 }}>
                          <Typography variant="caption" sx={{ fontWeight: 700 }}>Dutch Brews</Typography>
                          <Typography variant="caption" color="text.secondary" display="block">3,150 workers</Typography>
                        </Card>
                      </Grid>
                    </Grid>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* LEAVES / THE STORES (Sprout out when treeLevel === 2) */}
              <AnimatePresence>
                {treeLevel === 2 && (
                  <motion.div
                    initial={{ opacity: 0, y: -15, scale: 0.85 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -15, scale: 0.85 }}
                    transition={{ duration: 0.35, ease: 'easeOut', delay: 0.1 }}
                    style={{ width: '100%', zIndex: 1, marginTop: '8px' }}
                  >
                    {/* SVG Connector Leaf Stems branching from Star-cups */}
                    <Box sx={{ width: '100%', height: '32px', display: 'flex', justifyContent: 'center' }}>
                      <svg width="100%" height="32" style={{ overflow: 'visible' }}>
                        <line x1="50%" y1="0" x2="50%" y2="16" stroke="#66bb6a" strokeWidth="2" strokeDasharray="3 3" />
                        <line x1="28%" y1="16" x2="72%" y2="16" stroke="#66bb6a" strokeWidth="2" strokeDasharray="3 3" />
                        <line x1="28%" y1="16" x2="28%" y2="32" stroke="#66bb6a" strokeWidth="2" strokeDasharray="3 3" />
                        <line x1="50%" y1="16" x2="50%" y2="32" stroke="#66bb6a" strokeWidth="2" strokeDasharray="3 3" />
                        <line x1="72%" y1="16" x2="72%" y2="32" stroke="#66bb6a" strokeWidth="2" strokeDasharray="3 3" />
                      </svg>
                    </Box>

                    {/* 3 Local Store Nodes */}
                    <Grid container spacing={1.5} justifyContent="center">
                      <Grid item xs={3.8}>
                        <Card sx={{ p: 1.2, textAlign: 'center', opacity: 0.8, borderRadius: 2 }}>
                          <Typography variant="caption" sx={{ fontWeight: 600 }}>SF Store #12</Typography>
                          <Typography variant="caption" color="text.secondary" display="block">36 baristas</Typography>
                        </Card>
                      </Grid>

                      <Grid item xs={4.4}>
                        <Card
                          sx={{
                            p: 1.5,
                            textAlign: 'center',
                            borderRadius: 2,
                            border: '2px solid #ff7043',
                            background: isDark ? 'linear-gradient(135deg, rgba(255, 112, 67, 0.2), rgba(0,0,0,0.4))' : '#ffffff',
                            boxShadow: '0 6px 18px rgba(255, 112, 67, 0.35)'
                          }}
                        >
                          <Chip label="100% Union Store" size="small" color="warning" sx={{ height: 18, fontSize: '0.65rem', fontWeight: 800, mb: 0.5 }} />
                          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#ff7043' }}>
                            Fresno Store #452
                          </Typography>
                          <Typography variant="caption" color="text.secondary" display="block">
                            48 Coworkers (Local Store Floor)
                          </Typography>
                        </Card>
                      </Grid>

                      <Grid item xs={3.8}>
                        <Card sx={{ p: 1.2, textAlign: 'center', opacity: 0.8, borderRadius: 2 }}>
                          <Typography variant="caption" sx={{ fontWeight: 600 }}>Sacramento #88</Typography>
                          <Typography variant="caption" color="text.secondary" display="block">42 baristas</Typography>
                        </Card>
                      </Grid>
                    </Grid>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Bottom Canvas Helper */}
              <Box sx={{ mt: 'auto', pt: 2, textAlign: 'center' }}>
                <Typography variant="caption" color="text.secondary">
                  {treeLevel === 0 && '☕ 1. All baristas belong to the big general community.'}
                  {treeLevel === 1 && '🏢 2. Baristas branch into their specific company (Star-cups, Pete’s, Dutch Brews).'}
                  {treeLevel === 2 && '🏪 3. Baristas join their exact local store to vote and work together with coworkers.'}
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* SECTION 2: Set goals for your community, and achieve them with your numbers */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2.5, md: 4 },
          borderRadius: 3,
          background: isDark
            ? 'linear-gradient(135deg, rgba(22, 27, 34, 0.98), rgba(13, 17, 23, 0.98))'
            : 'linear-gradient(135deg, #ffffff, #f8f9fa)',
          border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
          boxShadow: isDark ? '0 12px 30px rgba(0,0,0,0.5)' : '0 8px 24px rgba(0,0,0,0.06)'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1, flexWrap: 'wrap' }}>
          <TrophyIcon sx={{ color: '#ffd700', fontSize: 28 }} />
          <Typography variant="h5" sx={{ fontWeight: 800 }}>
            Set goals for your community, and achieve them with your numbers
          </Typography>
          <Chip label="Action Cards" size="small" sx={{ fontWeight: 600, bgcolor: 'rgba(255,215,0,0.15)', color: isDark ? '#ffd700' : '#8B6F1F' }} />
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Action cards unlock when enough members agree to participate. Click any card below to flip between locked and unlocked:
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <FlipActionCard
              tier="bronze"
              title="BRONZE"
              lockedDescription="Action LOCKED until 10 members agree to participate"
              currentMembers={votes.bronze}
              requiredMembers={10}
              action={bronzeAction}
              onVote={() => handleDemoVote('bronze')}
              isFlipped={flippedTier === 'bronze'}
              onToggleFlip={() => handleToggleFlip('bronze')}
              isDark={isDark}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <FlipActionCard
              tier="silver"
              title="SILVER"
              lockedDescription="Action LOCKED until 100 members agree to participate"
              currentMembers={votes.silver}
              requiredMembers={100}
              action={silverAction}
              onVote={() => handleDemoVote('silver')}
              isFlipped={flippedTier === 'silver'}
              onToggleFlip={() => handleToggleFlip('silver')}
              isDark={isDark}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <FlipActionCard
              tier="gold"
              title="GOLD"
              lockedDescription="Action LOCKED until 1,000 members agree to participate"
              currentMembers={votes.gold}
              requiredMembers={1000}
              action={goldAction}
              onVote={() => handleDemoVote('gold')}
              isFlipped={flippedTier === 'gold'}
              onToggleFlip={() => handleToggleFlip('gold')}
              isDark={isDark}
            />
          </Grid>
        </Grid>
      </Paper>

      {/* SECTION 3 & 4: Helpful Notes & Info & Member Protection */}
      <Grid container spacing={3}>
        {/* Helpful Notes & Info */}
        <Grid item xs={12} md={6}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              height: '100%',
              borderRadius: 3,
              background: isDark
                ? 'linear-gradient(135deg, rgba(22, 27, 34, 0.98), rgba(13, 17, 23, 0.98))'
                : 'linear-gradient(135deg, #ffffff, #f8f9fa)',
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
              <InfoIcon sx={{ color: 'info.main' }} />
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                Community Info Cards
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Organizers can pin key links, group chats, and reminders right at the top so no coworker misses them:
            </Typography>

            <Stack spacing={2}>
              <Card sx={{ p: 2, bgcolor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', borderLeft: '4px solid #5865F2' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  💬 Join our community Discord!
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  Hit this link to join our private store group chat and get live shift updates: <Box component="span" sx={{ color: '#5865F2', fontWeight: 600, textDecoration: 'underline' }}>discord.gg/fresno-coffee</Box>
                </Typography>
              </Card>

              <Card sx={{ p: 2, bgcolor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', borderLeft: '4px solid #4568dc' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  📢 Remember!
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  Get your entire workgroup to join the community. The more coworkers we have in here, the more voting power we have to unlock our goals!
                </Typography>
              </Card>
            </Stack>
          </Paper>
        </Grid>

        {/* Member Protection */}
        <Grid item xs={12} md={6}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              height: '100%',
              borderRadius: 3,
              background: isDark
                ? 'linear-gradient(135deg, rgba(22, 27, 34, 0.98), rgba(13, 17, 23, 0.98))'
                : 'linear-gradient(135deg, #ffffff, #f8f9fa)',
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
              <SecurityIcon sx={{ color: 'success.main' }} />
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                Protecting our Members
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Built so your community stays safe and private for real coworkers only:
            </Typography>

            <Stack spacing={2}>
              <Card sx={{ p: 2, bgcolor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', borderLeft: '4px solid #2e7d32' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'success.main' }}>
                  🔒 Real Coworkers Only
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  Members have to be approved before they can enter, so bosses and outsiders can't spy on what we're planning.
                </Typography>
              </Card>

              <Card sx={{ p: 2, bgcolor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', borderLeft: '4px solid #ed6c02' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'warning.main' }}>
                  🛡️ Private Posts Stay Private
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  Posts made inside a private community stay hidden from the public timeline. Only approved members can see them.
                </Typography>
              </Card>
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}


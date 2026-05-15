import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Tabs, Tab, Table, TableHead, TableRow, TableCell, TableBody, TableContainer,
  Chip, IconButton, CircularProgress, Button, Typography,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  FormControl, InputLabel, Select, MenuItem, Stack
} from '@mui/material';
import FlagIcon from '@mui/icons-material/Flag';
import { getTimelineIcon } from '../../utils/timelineIcons';
import { displayUsername } from '../../utils/usernameDisplay';
import UserAvatar from '../common/UserAvatar';
import api from '../../utils/api';
import config from '../../config';
import { useNavigate } from 'react-router-dom';

// Helper hook for fetching paginated timeline data
const useAdminTimelines = (type) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cursor, setCursor] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const fetch = useCallback(async (reset = false) => {
    try {
      setLoading(true);
      const currentCursor = reset ? 0 : cursor;
      const response = await api.get('/api/v1/admin/timelines', {
        params: {
          limit: 20,
          cursor: currentCursor,
          type: type === 'all' ? undefined : type
        }
      });

      const newData = response.data?.data || [];
      setData(prev => reset ? newData : [...prev, ...newData]);
      setHasMore(response.data?.next_cursor !== null);
      setCursor(response.data?.next_cursor || 0);
      setError('');
    } catch (err) {
      console.error('[AdminTimelines] Fetch Error:', err);
      setError('Failed to fetch timelines');
    } finally {
      setLoading(false);
    }
  }, [type, cursor]);

  useEffect(() => {
    fetch(true);
  }, [type]);

  return { data, loading, error, hasMore, loadMore: () => fetch(false) };
};

export default function TimelineListTab() {
  const [tab, setTab] = useState('all');
  const { data, loading, error, hasMore, loadMore } = useAdminTimelines(tab);
  const navigate = useNavigate();

  // Report Dialog State
  const [reportOpen, setReportOpen] = useState(false);
  const [reportingId, setReportingId] = useState(null);
  const [reportCategory, setReportCategory] = useState('');
  const [reportReason, setReportReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleOpenReport = (id) => {
    setReportingId(id);
    setReportCategory('');
    setReportReason('');
    setReportOpen(true);
  };

  const handleSubmitReport = async () => {
    if (!reportCategory || !reportReason.trim()) {
      alert('Please select a category and provide a reason.');
      return;
    }
    try {
      setSubmitting(true);
      await api.post('/api/v1/reports', {
        subject_type: 'timeline',
        subject_id: reportingId,
        reason: reportCategory,
        details: reportReason
      });
      alert('Report submitted successfully.');
      setReportOpen(false);
    } catch (err) {
      console.error('Report Error:', err);
      alert('Failed to submit report.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderRow = (row) => {
    const ownerAvatarUrl = row.owner.avatar_key ? `${config.API_URL}/media/${row.owner.avatar_key}` : null;
    const coverKey = row.cover_landscape_key || row.cover_portrait_key;
    const coverUrl = coverKey ? `${config.API_URL}/media/${coverKey}` : null;
    
    // Background style using a tint overlay to simulate opacity
    const rowBackground = coverUrl 
      ? `linear-gradient(rgba(15, 23, 42, 0.9), rgba(15, 23, 42, 0.9)), url("${coverUrl}")` 
      : 'none';

    return (
      <TableRow 
        key={row.id} 
        hover 
        sx={{ 
          backgroundImage: rowBackground,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          transition: 'all 0.2s',
          '& td': { borderBottom: '1px solid rgba(255,255,255,0.05)', py: 2 },
          '&:hover': { 
            backgroundImage: coverUrl 
              ? `linear-gradient(rgba(15, 23, 42, 0.82), rgba(15, 23, 42, 0.82)), url("${coverUrl}")` 
              : 'rgba(255,255,255,0.03)',
          }
        }}
      >
        <TableCell align="center" sx={{ width: 70, px: 1 }}>
          <Box sx={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 32,
            height: 32,
            borderRadius: '50%',
            bgcolor: 'rgba(255,255,255,0.05)',
            color: 'primary.main',
            boxShadow: 'inset 0 0 10px rgba(0,0,0,0.2)'
          }}>
            {getTimelineIcon(row.type)}
          </Box>
        </TableCell>

        <TableCell sx={{ minWidth: 200, px: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Button
              variant="text"
              onClick={() => window.open(`/timeline-v3/${row.id}`, '_blank')}
              sx={{
                textTransform: 'none',
                fontWeight: 700,
                color: 'text.primary',
                fontSize: '0.9rem',
                textAlign: 'left',
                justifyContent: 'flex-start',
                p: 0,
                minWidth: 0,
                display: 'block',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                '&:hover': { color: 'primary.main', bgcolor: 'transparent' }
              }}
            >
              {row.name}
            </Button>
            <Typography variant="caption" sx={{ opacity: 0.4, fontSize: '0.65rem', mt: 0.5, letterSpacing: '0.05em' }}>
              ID: #{row.id}
            </Typography>
          </Box>
        </TableCell>

        <TableCell sx={{ minWidth: 240, px: 2 }}>
          <Box
            onClick={() => navigate(`/profile/${row.owner.username}`)}
            sx={{
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
              p: 0.5,
              borderRadius: 2,
              width: 'fit-content',
              transition: 'all 0.2s',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.08)', transform: 'translateX(4px)' }
            }}
          >
            <UserAvatar
              size={32}
              avatarUrl={ownerAvatarUrl}
              name={row.owner.display_username}
              id={row.owner.id}
              userColor={row.owner.user_color}
              isRestricted={row.owner.is_restricted}
              isSuspended={row.owner.is_suspended}
            />
            <Box ml={1.5} sx={{ overflow: 'hidden' }}>
              <Typography variant="body2" sx={{ fontWeight: 700, lineHeight: 1.2, fontSize: '0.85rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                {displayUsername(row.owner.display_username)}
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.5, display: 'block', fontSize: '0.7rem' }}>
                @{row.owner.username}
              </Typography>
            </Box>
          </Box>
        </TableCell>

        <TableCell align="right" sx={{ width: 100, px: 2, fontWeight: 800, color: 'primary.light', fontFamily: '"JetBrains Mono", monospace' }}>
          {row.member_count?.toLocaleString()}
        </TableCell>

        <TableCell align="center" sx={{ width: 120, px: 1 }}>
          <Chip
            label={row.visibility?.toUpperCase()}
            size="small"
            sx={{
              fontWeight: 900,
              fontSize: '0.6rem',
              height: 20,
              letterSpacing: '0.05em',
              bgcolor: row.visibility === 'public' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(249, 115, 22, 0.1)',
              color: row.visibility === 'public' ? '#4ade80' : '#fb923c',
              border: '1px solid currentColor'
            }}
          />
        </TableCell>

        <TableCell align="center" sx={{ width: 120, px: 1 }}>
          <Chip
            label={row.is_active ? 'ACTIVE' : 'BANNED'}
            size="small"
            sx={{
              fontWeight: 900,
              fontSize: '0.6rem',
              height: 20,
              letterSpacing: '0.05em',
              bgcolor: row.is_active ? 'rgba(59, 130, 246, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              color: row.is_active ? '#60a5fa' : '#f87171',
              border: '1px solid currentColor'
            }}
          />
        </TableCell>

        <TableCell align="center" sx={{ width: 80, px: 1 }}>
          <IconButton
            onClick={() => handleOpenReport(row.id)}
            size="small"
            sx={{
              color: 'rgba(255,255,255,0.2)',
              transition: 'all 0.2s',
              '&:hover': { color: '#ef4444', bgcolor: 'rgba(239, 68, 68, 0.1)', transform: 'scale(1.1)' }
            }}
          >
            <FlagIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </TableCell>
      </TableRow>
    );
  };

  return (
    <Box sx={{ p: { xs: 1, md: 3 }, maxWidth: '1600px', margin: '0 auto' }}>
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h5" sx={{ fontWeight: 900, letterSpacing: '-0.03em', background: 'linear-gradient(45deg, #fff 30%, #aaa 90%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Timeline Moderation
        </Typography>
        <Typography variant="caption" sx={{ opacity: 0.5, fontWeight: 600 }}>
          {data.length} timelines listed
        </Typography>
      </Box>

      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        centered
        sx={{
          mb: 4,
          '& .MuiTabs-indicator': { height: 4, borderRadius: '4px 4px 0 0', bgcolor: 'primary.main' },
          '& .MuiTab-root': {
            textTransform: 'none',
            minWidth: { xs: 80, sm: 120 },
            fontSize: '0.95rem',
            fontWeight: 600,
            color: 'rgba(255,255,255,0.4)',
            '&.Mui-selected': { color: '#fff' }
          }
        }}
      >
        <Tab label="All" value="all" />
        <Tab label="Hashtags" value="hashtag" />
        <Tab label="Communities" value="community" />
        <Tab label="Personals" value="personal" />
      </Tabs>

      <TableContainer
        sx={{
          width: '100%',
          overflowX: 'auto',
          borderRadius: 4,
          bgcolor: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          '&::-webkit-scrollbar': { height: 8 },
          '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 4 },
        }}
      >
        <Table size="medium" sx={{ minWidth: 950 }}>
          <TableHead>
            <TableRow sx={{
              bgcolor: 'rgba(0,0,0,0.4)',
              '& th': {
                borderBottom: '1px solid rgba(255,255,255,0.15)',
                fontWeight: 900,
                color: 'rgba(255,255,255,0.4)',
                textTransform: 'uppercase',
                fontSize: '0.65rem',
                letterSpacing: '0.15em',
                py: 2.5
              }
            }}>
              <TableCell align="center" sx={{ width: 70, px: 1 }}>Type</TableCell>
              <TableCell sx={{ minWidth: 200, px: 2 }}>Timeline Name</TableCell>
              <TableCell sx={{ minWidth: 240, px: 2 }}>Owner / Creator</TableCell>
              <TableCell align="right" sx={{ width: 100, px: 2 }}>Followers</TableCell>
              <TableCell align="center" sx={{ width: 120, px: 1 }}>Visibility</TableCell>
              <TableCell align="center" sx={{ width: 120, px: 1 }}>Mod Status</TableCell>
              <TableCell align="center" sx={{ width: 80, px: 1 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.length > 0 ? (
              data.map(renderRow)
            ) : !loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 10, opacity: 0.5, fontWeight: 600 }}>
                  No timelines found in this category.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </TableContainer>

      {loading && (
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress size={32} />
        </Box>
      )}

      {!loading && data.length === 0 && (
        <Box p={8} textAlign="center">
          <Typography sx={{ opacity: 0.5 }}>No timelines found in this category.</Typography>
        </Box>
      )}

      {!loading && hasMore && (
        <Box display="flex" justifyContent="center" p={3}>
          <Button
            onClick={loadMore}
            variant="outlined"
            sx={{ borderRadius: 10, px: 4, fontWeight: 700 }}
          >
            Load More
          </Button>
        </Box>
      )}

      {/* Report Dialog */}
      <Dialog open={reportOpen} onClose={() => setReportOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Report Timeline</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <Typography variant="body2" sx={{ opacity: 0.7 }}>
              Explain why this timeline should be reviewed by a moderator.
            </Typography>
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={reportCategory}
                label="Category"
                onChange={(e) => setReportCategory(e.target.value)}
              >
                <MenuItem value="Spam">Spam</MenuItem>
                <MenuItem value="Harassment">Harassment</MenuItem>
                <MenuItem value="Inappropriate Content">Inappropriate Content</MenuItem>
                <MenuItem value="Hate Speech">Hate Speech</MenuItem>
                <MenuItem value="Copyright Violation">Copyright Violation</MenuItem>
                <MenuItem value="Other">Other</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Reason Details"
              multiline
              rows={4}
              fullWidth
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              placeholder="Provide specific details about the violation..."
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setReportOpen(false)} sx={{ fontWeight: 700 }}>Cancel</Button>
          <Button
            onClick={handleSubmitReport}
            variant="contained"
            color="error"
            disabled={submitting}
            sx={{ fontWeight: 800, borderRadius: 2 }}
          >
            {submitting ? 'Submitting...' : 'Submit Report'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

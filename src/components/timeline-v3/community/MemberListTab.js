import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Box, 
  Typography, 
  Paper,
  Divider,
  Avatar,
  Chip,
  Skeleton,
  useTheme,
  Card,
  CardContent,
  Snackbar,
  Alert,
  IconButton,
  TextField,
  InputAdornment,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import SortIcon from '@mui/icons-material/Sort';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import PersonIcon from '@mui/icons-material/Person';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import CommunityDotTabs from './CommunityDotTabs';
import FlagIcon from '@mui/icons-material/Flag';
import LockIcon from '@mui/icons-material/Lock';
import QuoteDisplay from './QuoteDisplay';

const MemberListTab = () => {
  const { id } = useParams();
  const theme = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [members, setMembers] = useState([]);
  const [goldAction, setGoldAction] = useState(null);
  const [bronzeAction, setBronzeAction] = useState(null);
  const [silverAction, setSilverAction] = useState(null);
  const [isGoldActionLoading, setIsGoldActionLoading] = useState(true);
  const [isBronzeActionLoading, setIsBronzeActionLoading] = useState(true);
  const [isSilverActionLoading, setIsSilverActionLoading] = useState(true);
  
  // Custom quote for fallback display
  const [customQuote, setCustomQuote] = useState({
    text: "Those who make Peaceful Revolution impossible, will make violent Revolution inevitable.",
    author: "John F. Kennedy"
  });
  
  // Action requirement states
  const [goldActionLocked, setGoldActionLocked] = useState(false);
  const [silverActionLocked, setSilverActionLocked] = useState(false);
  const [bronzeActionLocked, setBronzeActionLocked] = useState(false);
  
  // Community membership thresholds for displaying tiered actions
  const [memberThresholds, setMemberThresholds] = useState({
    silver: 10, // Show silver action when community has at least 10 members
    gold: 25    // Show gold action when community has at least 25 members
  });
  
  // Determine which actions to display based on membership count
  const [showSilverAction, setShowSilverAction] = useState(false);
  const [showGoldAction, setShowGoldAction] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  
  // Quote display state
  const [communityQuote, setCommunityQuote] = useState({
    text: "Those who make Peaceful Revolution impossible, will make violent Revolution inevitable.",
    author: "John F. Kennedy"
  });
  
  // Member management state
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  
  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAnchorEl, setFilterAnchorEl] = useState(null);
  const [sortAnchorEl, setSortAnchorEl] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all'); // 'all', 'admin', 'moderator', 'member'
  const [sortBy, setSortBy] = useState('name-asc'); // 'name-asc', 'name-desc', 'date-asc', 'date-desc'
  
  // Handle role change for a member (promote/demote)
  const handleRoleChange = (memberId, newRole) => {
    // In a real implementation, this would be an API call
    setMembers(prevMembers => 
      prevMembers.map(member => 
        member.id === memberId 
          ? { ...member, role: newRole } 
          : member
      )
    );
    
    // Show success message
    const actionText = newRole === 'moderator' ? 'promoted to moderator' : 'demoted to member';
    const memberName = members.find(m => m.id === memberId)?.name || 'Member';
    setSnackbarMessage(`${memberName} ${actionText} successfully`);
    setSnackbarSeverity('success');
    setSnackbarOpen(true);
  };
  
  // Handle removing a member from the community
  const handleRemoveMember = (memberId) => {
    // In a real implementation, this would be an API call
    setMembers(prevMembers => prevMembers.filter(member => member.id !== memberId));
    
    // Show success message
    const memberName = members.find(m => m.id === memberId)?.name || 'Member';
    setSnackbarMessage(`${memberName} removed from community`);
    setSnackbarSeverity('info');
    setSnackbarOpen(true);
    
    // Update action visibility based on new member count
    const newMemberCount = members.length - 1;
    setShowSilverAction(newMemberCount >= memberThresholds.silver);
    setShowGoldAction(newMemberCount >= memberThresholds.gold);
  };
  
  // Handle snackbar close
  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') return;
    setSnackbarOpen(false);
  };
  
  // Handle search input change
  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };
  
  // Handle filter menu open
  const handleFilterClick = (event) => {
    setFilterAnchorEl(event.currentTarget);
  };
  
  // Handle filter menu close
  const handleFilterClose = () => {
    setFilterAnchorEl(null);
  };
  
  // Handle filter selection
  const handleFilterSelect = (filter) => {
    setActiveFilter(filter);
    handleFilterClose();
  };
  
  // Handle sort menu open
  const handleSortClick = (event) => {
    setSortAnchorEl(event.currentTarget);
  };
  
  // Handle sort menu close
  const handleSortClose = () => {
    setSortAnchorEl(null);
  };
  
  // Handle sort selection
  const handleSortSelect = (sort) => {
    setSortBy(sort);
    handleSortClose();
  };
  
  // Filter and sort members
  const getFilteredAndSortedMembers = useCallback(() => {
    // First apply search filter
    let filteredMembers = members.filter(member => 
      member.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    // Then apply role filter
    if (activeFilter !== 'all') {
      filteredMembers = filteredMembers.filter(member => member.role === activeFilter);
    }
    
    // Then apply sorting
    return filteredMembers.sort((a, b) => {
      switch(sortBy) {
        case 'name-asc':
          return a.name.localeCompare(b.name);
        case 'name-desc':
          return b.name.localeCompare(a.name);
        case 'date-asc':
          return new Date(a.joinDate) - new Date(b.joinDate);
        case 'date-desc':
          return new Date(b.joinDate) - new Date(a.joinDate);
        default:
          return 0;
      }
    });
  }, [members, searchTerm, activeFilter, sortBy]);
  
  const observer = useRef();

  // Simulated data loading
  useEffect(() => {
    // Simulate loading data
    setTimeout(() => {
      setIsLoading(false);
      setMembers([
        { id: 1, name: 'John Doe', role: 'Admin', joinDate: '2023-01-15', avatar: '/avatars/avatar1.jpg' },
        { id: 2, name: 'Jane Smith', role: 'Moderator', joinDate: '2023-02-20', avatar: '/avatars/avatar2.jpg' },
        { id: 3, name: 'Alice Johnson', role: 'Member', joinDate: '2023-03-10', avatar: '/avatars/avatar3.jpg' },
        { id: 4, name: 'Bob Williams', role: 'Member', joinDate: '2023-04-05', avatar: '/avatars/avatar4.jpg' },
        { id: 5, name: 'Charlie Brown', role: 'Member', joinDate: '2023-05-22', avatar: '/avatars/avatar5.jpg' },
        { id: 6, name: 'Diana Prince', role: 'SiteOwner', joinDate: '2023-01-01', avatar: '/avatars/avatar6.jpg' },
      ]);
    }, 1500);
    
    // Load action settings from localStorage
    try {
      const savedSettings = localStorage.getItem('communitySettings');
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        
        // Set community quote if available
        if (settings.communityQuote) {
          setCustomQuote(settings.communityQuote);
        }
        
        // Load actions with a slight delay to simulate API loading
        setTimeout(() => {
          setIsGoldActionLoading(false);
          if (settings.goldAction) {
            setGoldAction(settings.goldAction);
            
            // Check if gold action should be locked based on threshold
            const memberCount = 6; // Simulated member count, would come from API
            if (settings.goldAction.thresholdType === 'members' && 
                settings.goldAction.thresholdValue > memberCount) {
              setGoldActionLocked(true);
              setShowGoldAction(true); // Show it but in locked state
            } else {
              setGoldActionLocked(false);
              setShowGoldAction(true); // Show it in active state
            }
          }
        }, 1800);
        
        setTimeout(() => {
          setIsSilverActionLoading(false);
          if (settings.silverAction) {
            setSilverAction(settings.silverAction);
            
            // Check if silver action should be locked based on threshold
            const memberCount = 6; // Simulated member count, would come from API
            if (settings.silverAction.thresholdType === 'members' && 
                settings.silverAction.thresholdValue > memberCount) {
              setSilverActionLocked(true);
              setShowSilverAction(true); // Show it but in locked state
            } else {
              setSilverActionLocked(false);
              setShowSilverAction(true); // Show it in active state
            }
          }
        }, 2000);
        
        setTimeout(() => {
          setIsBronzeActionLoading(false);
          if (settings.bronzeAction) {
            setBronzeAction(settings.bronzeAction);
            
            // Check if bronze action should be locked based on threshold
            const memberCount = 6; // Simulated member count, would come from API
            if (settings.bronzeAction.thresholdType === 'members' && 
                settings.bronzeAction.thresholdValue > memberCount) {
              setBronzeActionLocked(true);
            } else {
              setBronzeActionLocked(false);
            }
          }
        }, 2200);
      } else {
        // No settings found, set loading to false
        setIsGoldActionLoading(false);
        setIsSilverActionLoading(false);
        setIsBronzeActionLoading(false);
        setTimeout(() => {
          // Simulate network delay
        }, 1000);
      }
    } catch (error) {
      console.error('Error loading community settings:', error);
      // Set loading to false in case of error
      setIsGoldActionLoading(false);
      setIsSilverActionLoading(false);
      setIsBronzeActionLoading(false);
    }
  }, []);
  
  // Load more members function for infinite scroll
  const loadMoreMembers = useCallback(() => {
    if (isLoadingMore) return;
    
    setIsLoadingMore(true);
    
    // Simulate API call with delay
    setTimeout(() => {
      // Generate new members with incrementing IDs
      const baseId = members.length + 1;
      const newMembers = Array(5).fill().map((_, index) => {
        const id = baseId + index;
        return {
          id,
          name: `Member ${id}`,
          role: ['member', 'member', 'member', 'moderator'][Math.floor(Math.random() * 4)], // Mostly members, occasional moderator
          avatar: `https://i.pravatar.cc/150?img=${(id % 70) + 1}`, // Cycle through available avatars
          joinDate: new Date(Date.now() - Math.random() * 10000000000).toISOString().split('T')[0] // Random recent date
        };
      });
      
      setMembers(prev => [...prev, ...newMembers]);
      setPage(prev => prev + 1);
      setIsLoadingMore(false);
      
      // After page 3, simulate end of data
      if (page >= 3) {
        setHasMore(false);
      }
    }, 800);
  }, [members, page, isLoadingMore]);
  
  // Intersection observer for infinite scroll
  const lastMemberElementRef = useCallback(node => {
    if (isLoading || isLoadingMore) return;
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        loadMoreMembers();
      }
    }, { threshold: 0.5 });
    
    if (node) observer.current.observe(node);
  }, [isLoading, isLoadingMore, hasMore, loadMoreMembers]);

  // Role chip styling
  const getRoleColor = (role) => {
    switch(role) {
      case 'siteOwner':
        return { bg: theme.palette.mode === 'dark' ? '#9c27b0' : '#e040fb', text: '#fff' }; // Purple for site owner
      case 'admin':
        return { bg: theme.palette.error.main, text: '#fff' }; // Red for admin
      case 'moderator':
        return { bg: theme.palette.warning.main, text: '#000' }; // Yellow/orange for moderator
      default: // member
        return { bg: theme.palette.primary.main, text: '#fff' }; // Blue for regular member
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 100,
        damping: 12
      }
    }
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', px: 2, pb: 4 }}>
      {/* Gold Action Section */}
      {showGoldAction ? (
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          {!isGoldActionLoading && !goldAction ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <QuoteDisplay 
                quote={communityQuote.text}
                author={communityQuote.author}
                variant="gold"
              />
            </motion.div>
          ) : (
            <Card
              sx={{
              position: 'relative',
              mb: 3,
              mt: 1,
              borderRadius: 2,
              background: `linear-gradient(145deg, 
                ${theme.palette.mode === 'dark' ? '#2d2a20' : '#f8f3e2'}, 
                ${theme.palette.mode === 'dark' ? '#1a1712' : '#e6d7b0'})`,
              boxShadow: theme.palette.mode === 'dark' 
                ? '0 10px 20px rgba(0,0,0,0.4), inset 0 0 10px rgba(255,215,0,0.1), 0 0 0 1px rgba(255,215,0,0.2)'
                : '0 10px 20px rgba(0,0,0,0.1), inset 0 0 10px rgba(255,215,0,0.2), 0 0 0 1px rgba(255,215,0,0.3)',
              overflow: 'hidden',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '4px',
                background: 'linear-gradient(90deg, #ffd700, #ffec99, #ffd700)',
                boxShadow: '0 0 10px rgba(255,215,0,0.5)'
              }
            }}
          >
            <CardContent sx={{ p: 3 }}>
              {isGoldActionLoading ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Skeleton variant="circular" width={24} height={24} />
                    <Skeleton variant="text" width={180} height={32} />
                  </Box>
                  <Skeleton variant="text" width="90%" height={24} />
                  <Skeleton variant="text" width="60%" height={24} />
                </Box>
              ) : goldAction ? (
                <>
                  {/* Locked overlay - only shown when goldActionLocked is true */}
                  {goldActionLocked && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.6)',
                        backdropFilter: 'blur(4px)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        zIndex: 10,
                        p: 3,
                        borderRadius: 2
                      }}
                    >
                      <LockIcon 
                        sx={{ 
                          fontSize: 40, 
                          color: '#ffd700',
                          mb: 2,
                          filter: 'drop-shadow(0 0 5px rgba(255,215,0,0.5))'
                        }} 
                      />
                      <Typography 
                        variant="h6" 
                        align="center"
                        sx={{ 
                          color: '#fff',
                          textShadow: '0 0 5px rgba(0,0,0,0.5)',
                          mb: 1
                        }}
                      >
                        Gold Action Locked
                      </Typography>
                      <Typography 
                        variant="body2" 
                        align="center"
                        sx={{ 
                          color: 'rgba(255,255,255,0.8)',
                          maxWidth: '80%'
                        }}
                      >
                        This action requires {goldAction.thresholdValue} members to unlock.
                        Currently: 6 members
                      </Typography>
                    </Box>
                  )}
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                    <FlagIcon 
                      sx={{ 
                        mr: 1.5, 
                        color: '#ffd700',
                        filter: 'drop-shadow(0 0 2px rgba(255,215,0,0.5))'
                      }} 
                    />
                    <Typography 
                      variant="h6" 
                      component="h2"
                      sx={{ 
                        fontFamily: '"Playfair Display", serif',
                        fontWeight: 700,
                        letterSpacing: '0.5px',
                        color: theme.palette.mode === 'dark' ? '#ffd700' : '#8B6F1F',
                        textShadow: theme.palette.mode === 'dark' 
                          ? '0 0 5px rgba(255,215,0,0.3)' 
                          : '0 0 2px rgba(139,111,31,0.2)'
                      }}
                    >
                      GOLD ACTION
                    </Typography>
                  </Box>
                  
                  <Typography 
                    variant="h5" 
                    gutterBottom
                    sx={{ 
                      fontWeight: 600,
                      color: theme.palette.mode === 'dark' ? '#fff' : '#000'
                    }}
                  >
                    {goldAction.title}
                  </Typography>
                  
                  <Typography 
                    variant="body1"
                    sx={{ 
                      mb: 1.5,
                      color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)'
                    }}
                  >
                    {goldAction.description}
                  </Typography>
                  
                  <Box 
                    sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      mt: 2,
                      pt: 1,
                      borderTop: '1px solid',
                      borderColor: theme.palette.mode === 'dark' ? 'rgba(255,215,0,0.2)' : 'rgba(139,111,31,0.2)'
                    }}
                  >
                    <Typography variant="caption" sx={{ fontStyle: 'italic' }}>
                      Set by {goldAction.createdBy}
                    </Typography>
                    
                    <Chip 
                      label={`Due: ${new Date(goldAction.dueDate).toLocaleDateString()}`}
                      size="small"
                      sx={{
                        bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,215,0,0.15)' : 'rgba(255,215,0,0.2)',
                        color: theme.palette.mode === 'dark' ? '#ffd700' : '#8B6F1F',
                        border: '1px solid',
                        borderColor: theme.palette.mode === 'dark' ? 'rgba(255,215,0,0.3)' : 'rgba(139,111,31,0.3)',
                        '& .MuiChip-label': { px: 1 }
                      }}
                    />
                  </Box>
                </>
              ) : null}
            </CardContent>
          </Card>
          )}
        </motion.div>
      ) : (
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <Card
            sx={{
              position: 'relative',
              mb: 3,
              mt: 1,
              borderRadius: 2,
              background: theme.palette.mode === 'dark' ? 'rgba(45,42,32,0.6)' : 'rgba(248,243,226,0.6)',
              boxShadow: theme.palette.mode === 'dark' 
                ? '0 8px 16px rgba(0,0,0,0.3)'
                : '0 8px 16px rgba(0,0,0,0.1)',
              p: 3,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: 180
            }}
          >
            <Typography variant="h6" color="text.secondary" sx={{ textAlign: 'center', mb: 1.5 }}>
              Gold actions unlock when the community reaches {memberThresholds.gold} members
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mb: 1 }}>
              Grow your community to unlock premium community features and gold actions
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center', fontStyle: 'italic' }}>
              Currently {members.length} member{members.length !== 1 ? 's' : ''}
            </Typography>
          </Card>
        </motion.div>
      )}
      
      {/* Bronze and Silver Actions Row */}
      <motion.div
        initial={{ y: -15, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
      >
        <Box sx={{ 
          display: 'flex', 
          gap: 2, 
          mb: 3,
          flexDirection: { xs: 'column', sm: 'row' }
        }}>
          {/* Bronze Action or Quote Fallback */}
          {!isBronzeActionLoading && !bronzeAction ? (
            <QuoteDisplay 
              quote={communityQuote.text}
              author={communityQuote.author}
              variant="bronze"
            />
          ) : (
            <Card
              sx={{
                flex: 1,
                position: 'relative',
                borderRadius: 2,
                background: `linear-gradient(145deg, 
                  ${theme.palette.mode === 'dark' ? '#2d2520' : '#f8f0e8'}, 
                  ${theme.palette.mode === 'dark' ? '#1a1512' : '#e6d0c0'})`,
                boxShadow: theme.palette.mode === 'dark' 
                  ? '0 8px 16px rgba(0,0,0,0.4), inset 0 0 8px rgba(205,127,50,0.1), 0 0 0 1px rgba(205,127,50,0.2)'
                  : '0 8px 16px rgba(0,0,0,0.1), inset 0 0 8px rgba(205,127,50,0.2), 0 0 0 1px rgba(205,127,50,0.3)',
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '3px',
                  background: 'linear-gradient(90deg, #cd7f32, #e1a66b, #cd7f32)',
                  boxShadow: '0 0 8px rgba(205,127,50,0.5)'
                }
              }}
            >
              <CardContent sx={{ p: 2 }}>
                {isBronzeActionLoading ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Skeleton variant="circular" width={20} height={20} />
                      <Skeleton variant="text" width={140} height={24} />
                    </Box>
                    <Skeleton variant="text" width="90%" height={20} />
                  </Box>
                ) : bronzeAction ? (
                  <>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <FlagIcon 
                        sx={{ 
                          mr: 1, 
                          color: '#cd7f32',
                          fontSize: '1.1rem',
                          filter: 'drop-shadow(0 0 2px rgba(205,127,50,0.5))'
                        }} 
                      />
                      <Typography 
                        variant="subtitle1" 
                        component="h3"
                        sx={{ 
                          fontFamily: '"Playfair Display", serif',
                          fontWeight: 700,
                          fontSize: '0.9rem',
                          letterSpacing: '0.5px',
                          color: theme.palette.mode === 'dark' ? '#cd7f32' : '#8B5A2B',
                          textShadow: theme.palette.mode === 'dark' 
                            ? '0 0 4px rgba(205,127,50,0.3)' 
                            : '0 0 2px rgba(139,90,43,0.2)'
                        }}
                      >
                        BRONZE ACTION
                      </Typography>
                    </Box>
                    
                    <Typography 
                      variant="h6" 
                      gutterBottom
                      sx={{ 
                        fontWeight: 600,
                        fontSize: '1rem',
                        color: theme.palette.mode === 'dark' ? '#fff' : '#000'
                      }}
                    >
                      {bronzeAction.title}
                    </Typography>
                    
                    <Typography 
                      variant="body2"
                      sx={{ 
                        mb: 1,
                        fontSize: '0.8rem',
                        color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)'
                      }}
                    >
                      {bronzeAction.description}
                    </Typography>
                    
                    <Box 
                      sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        mt: 1,
                        pt: 1,
                        borderTop: '1px solid',
                        borderColor: theme.palette.mode === 'dark' ? 'rgba(205,127,50,0.2)' : 'rgba(139,90,43,0.2)'
                      }}
                    >
                      <Typography variant="caption" sx={{ fontStyle: 'italic', fontSize: '0.7rem' }}>
                        By {bronzeAction.createdBy}
                      </Typography>
                      
                      <Chip 
                        label={`Due: ${new Date(bronzeAction.dueDate).toLocaleDateString()}`}
                        size="small"
                        sx={{
                          bgcolor: theme.palette.mode === 'dark' ? 'rgba(205,127,50,0.15)' : 'rgba(205,127,50,0.2)',
                          color: theme.palette.mode === 'dark' ? '#cd7f32' : '#8B5A2B',
                          border: '1px solid',
                          borderColor: theme.palette.mode === 'dark' ? 'rgba(205,127,50,0.3)' : 'rgba(139,90,43,0.3)',
                          '& .MuiChip-label': { px: 1, fontSize: '0.65rem' }
                        }}
                      />
                    </Box>
                  </>
                ) : null}
              </CardContent>
            </Card>
          )}
          
          {/* Silver Action - Only shown when membership threshold is met */}
          {showSilverAction ? (
            !isSilverActionLoading && !silverAction ? (
              <Box sx={{
                flex: 1,
                ml: { xs: 0, sm: 2 },
                mt: { xs: 2, sm: 0 },
              }}>
                <QuoteDisplay 
                  quote={communityQuote.text}
                  author={communityQuote.author}
                  variant="silver"
                />
              </Box>
            ) : (
              <Card
                sx={{
                  flex: 1,
                  position: 'relative',
                  borderRadius: 2,
                  ml: { xs: 0, sm: 2 },
                  mt: { xs: 2, sm: 0 },
                  background: `linear-gradient(145deg, 
                    ${theme.palette.mode === 'dark' ? '#2d2d32' : '#f8f8fa'}, 
                    ${theme.palette.mode === 'dark' ? '#1a1a1f' : '#e6e6e9'})`,
                  boxShadow: theme.palette.mode === 'dark' 
                    ? '0 8px 16px rgba(0,0,0,0.4), inset 0 0 8px rgba(192,192,192,0.1), 0 0 0 1px rgba(192,192,192,0.2)'
                    : '0 8px 16px rgba(0,0,0,0.1), inset 0 0 8px rgba(192,192,192,0.2), 0 0 0 1px rgba(192,192,192,0.3)',
                  overflow: 'hidden',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '3px',
                    background: 'linear-gradient(90deg, #c0c0c0, #e6e6e6, #c0c0c0)',
                    boxShadow: '0 0 8px rgba(192,192,192,0.5)'
                  }
                }}
              >
                <CardContent sx={{ p: 2 }}>
                  {isSilverActionLoading ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Skeleton variant="circular" width={20} height={20} />
                        <Skeleton variant="text" width={140} height={24} />
                      </Box>
                      <Skeleton variant="text" width="90%" height={20} />
                    </Box>
                  ) : silverAction ? (
                    <>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <FlagIcon 
                          sx={{ 
                            mr: 1, 
                            color: '#c0c0c0',
                            fontSize: '1.1rem',
                            filter: 'drop-shadow(0 0 2px rgba(192,192,192,0.5))'
                          }} 
                        />
                        <Typography 
                          variant="subtitle1" 
                          component="h3"
                          sx={{ 
                            fontFamily: '"Playfair Display", serif',
                            fontWeight: 700,
                            fontSize: '0.9rem',
                            letterSpacing: '0.5px',
                            color: theme.palette.mode === 'dark' ? '#c0c0c0' : '#707070',
                            textShadow: theme.palette.mode === 'dark' 
                              ? '0 0 4px rgba(192,192,192,0.3)' 
                              : '0 0 2px rgba(112,112,112,0.2)'
                          }}
                        >
                          SILVER ACTION
                        </Typography>
                      </Box>
                      
                      <Typography 
                        variant="h6" 
                        gutterBottom
                        sx={{ 
                          fontWeight: 600,
                          fontSize: '1rem',
                          color: theme.palette.mode === 'dark' ? '#fff' : '#000'
                        }}
                      >
                        {silverAction.title}
                      </Typography>
                      
                      <Typography 
                        variant="body2"
                        sx={{ 
                          mb: 1,
                          fontSize: '0.8rem',
                          color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)'
                        }}
                      >
                        {silverAction.description}
                      </Typography>
                      
                      <Box 
                        sx={{ 
                          display: 'flex', 
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          mt: 1,
                          pt: 1,
                          borderTop: '1px solid',
                          borderColor: theme.palette.mode === 'dark' ? 'rgba(192,192,192,0.2)' : 'rgba(112,112,112,0.2)'
                        }}
                      >
                        <Typography variant="caption" sx={{ fontStyle: 'italic', fontSize: '0.7rem' }}>
                          By {silverAction.createdBy}
                        </Typography>
                        
                        <Chip 
                          label={`Due: ${new Date(silverAction.dueDate).toLocaleDateString()}`}
                          size="small"
                          sx={{
                            bgcolor: theme.palette.mode === 'dark' ? 'rgba(192,192,192,0.15)' : 'rgba(192,192,192,0.2)',
                            color: theme.palette.mode === 'dark' ? '#c0c0c0' : '#707070',
                            border: '1px solid',
                            borderColor: theme.palette.mode === 'dark' ? 'rgba(192,192,192,0.3)' : 'rgba(112,112,112,0.3)',
                            '& .MuiChip-label': { px: 1, fontSize: '0.65rem' }
                          }}
                        />
                      </Box>
                    </>
                  ) : null}
                </CardContent>
              </Card>
            )
          ) : (
            <Card
              sx={{
                flex: 1,
                position: 'relative',
                borderRadius: 2,
                ml: { xs: 0, sm: 2 },
                mt: { xs: 2, sm: 0 },
                background: theme.palette.mode === 'dark' ? 'rgba(45,45,50,0.6)' : 'rgba(248,248,250,0.6)',
                boxShadow: theme.palette.mode === 'dark' 
                  ? '0 8px 16px rgba(0,0,0,0.3)'
                  : '0 8px 16px rgba(0,0,0,0.1)',
                p: 2,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: 150
              }}
            >
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mb: 1 }}>
                Silver actions unlock when the community reaches {memberThresholds.silver} members
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center', fontStyle: 'italic' }}>
                Currently {members.length} member{members.length !== 1 ? 's' : ''}
              </Typography>
            </Card>
          )}
        </Box>
      </motion.div>
      
      {/* Community Dot Tabs */}
      <CommunityDotTabs 
        timelineId={id} 
      />
      
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <Paper 
          elevation={2} 
          sx={{ 
            p: 3, 
            mt: 2, 
            borderRadius: 2,
            bgcolor: 'background.paper',
            overflow: 'hidden'
          }}
        >
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.4 }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Typography variant="h5" component="h1">
                Community Members
              </Typography>
              <Box 
                component="span"
                sx={{ 
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  ml: 2,
                  px: 1.5,
                  py: 0.5,
                  borderRadius: 10,
                  fontSize: '0.875rem',
                  fontWeight: 'medium',
                  bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
                  color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.7)'
                }}
              >
                {isLoading ? (
                  <Skeleton width={30} height={24} sx={{ borderRadius: 1 }} />
                ) : (
                  `${members.length} ${members.length === 1 ? 'member' : 'members'}`
                )}
              </Box>
            </Box>
            
            <Typography variant="subtitle1" color="text.secondary" gutterBottom>
              Members of this community timeline
            </Typography>
          </motion.div>
          
          <Divider sx={{ my: 2 }} />
          
          {/* Search, Filter, and Sort Controls */}
          <Box sx={{ mb: 3, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, alignItems: { xs: 'stretch', sm: 'center' } }}>
            <TextField
              placeholder="Search members..."
              variant="outlined"
              size="small"
              fullWidth
              value={searchTerm}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
              sx={{ flexGrow: 1 }}
            />
            
            <Box sx={{ display: 'flex', gap: 1 }}>
              <IconButton 
                size="small" 
                onClick={handleFilterClick}
                color={activeFilter !== 'all' ? 'primary' : 'default'}
                sx={{ border: 1, borderColor: 'divider', borderRadius: 1 }}
                aria-label="Filter members"
                aria-controls="filter-menu"
                aria-haspopup="true"
              >
                <FilterListIcon fontSize="small" />
              </IconButton>
              
              <IconButton 
                size="small" 
                onClick={handleSortClick}
                color={sortBy !== 'name-asc' ? 'primary' : 'default'}
                sx={{ border: 1, borderColor: 'divider', borderRadius: 1 }}
                aria-label="Sort members"
                aria-controls="sort-menu"
                aria-haspopup="true"
              >
                <SortIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>
          
          {/* Filter Menu */}
          <Menu
            id="filter-menu"
            anchorEl={filterAnchorEl}
            open={Boolean(filterAnchorEl)}
            onClose={handleFilterClose}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
          >
            <MenuItem onClick={() => handleFilterSelect('all')} selected={activeFilter === 'all'}>
              <ListItemText primary="All Members" />
            </MenuItem>
            <MenuItem onClick={() => handleFilterSelect('admin')} selected={activeFilter === 'admin'}>
              <ListItemIcon>
                <AdminPanelSettingsIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Admins" />
            </MenuItem>
            <MenuItem onClick={() => handleFilterSelect('moderator')} selected={activeFilter === 'moderator'}>
              <ListItemIcon>
                <PersonIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Moderators" />
            </MenuItem>
            <MenuItem onClick={() => handleFilterSelect('member')} selected={activeFilter === 'member'}>
              <ListItemIcon>
                <PersonIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Members" />
            </MenuItem>
          </Menu>
          
          {/* Sort Menu */}
          <Menu
            id="sort-menu"
            anchorEl={sortAnchorEl}
            open={Boolean(sortAnchorEl)}
            onClose={handleSortClose}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
          >
            <MenuItem onClick={() => handleSortSelect('name-asc')} selected={sortBy === 'name-asc'}>
              <ListItemIcon>
                <ArrowUpwardIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Name (A-Z)" />
            </MenuItem>
            <MenuItem onClick={() => handleSortSelect('name-desc')} selected={sortBy === 'name-desc'}>
              <ListItemIcon>
                <ArrowDownwardIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Name (Z-A)" />
            </MenuItem>
            <MenuItem onClick={() => handleSortSelect('date-asc')} selected={sortBy === 'date-asc'}>
              <ListItemIcon>
                <CalendarTodayIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Join Date (Oldest)" />
            </MenuItem>
            <MenuItem onClick={() => handleSortSelect('date-desc')} selected={sortBy === 'date-desc'}>
              <ListItemIcon>
                <CalendarTodayIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Join Date (Newest)" />
            </MenuItem>
          </Menu>
          
          {isLoading ? (
            // Loading skeleton
            <Box sx={{ mt: 3 }}>
              {[1, 2, 3, 4, 5].map((item) => (
                <Box key={item} sx={{ display: 'flex', alignItems: 'center', mb: 2, p: 1 }}>
                  <Skeleton variant="circular" width={40} height={40} sx={{ mr: 2 }} />
                  <Box sx={{ width: '100%' }}>
                    <Skeleton variant="text" width="40%" height={24} />
                    <Skeleton variant="text" width="20%" height={20} />
                  </Box>
                </Box>
              ))}
            </Box>
          ) : (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {members.map((member, index) => {
                const roleColor = getRoleColor(member.role);
                const isLastElement = index === members.length - 1;
                
                return (
                  <motion.div 
                    key={member.id} 
                    variants={itemVariants}
                    ref={isLastElement ? lastMemberElementRef : null}
                  >
                    <Box 
                      sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        p: 1.5,
                        borderRadius: 1,
                        mb: 1.5,
                        '&:hover': {
                          bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)'
                        },
                        transition: 'background-color 0.2s ease'
                      }}
                    >
                      <Avatar 
                        src={member.avatar} 
                        alt={member.name}
                        sx={{ 
                          width: 48, 
                          height: 48, 
                          mr: 2,
                          boxShadow: '0 0 0 2px ' + roleColor.bg,
                          cursor: 'pointer',
                          transition: 'transform 0.2s ease',
                          '&:hover': {
                            transform: 'scale(1.05)'
                          }
                        }}
                        onClick={() => window.open(`/profile/${member.id}`, '_blank')}
                      />
                      <Box sx={{ flexGrow: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="subtitle1">{member.name}</Typography>
                          
                          {/* Member management actions */}
                          <Box sx={{ 
                            display: 'flex', 
                            opacity: 0,
                            transition: 'opacity 0.2s ease',
                            '.MuiBox-root:hover > &': {
                              opacity: 1
                            }
                          }}>
                            {member.role !== 'admin' && (
                              <>
                                {member.role === 'moderator' ? (
                                  <Chip
                                    label="Demote"
                                    size="small"
                                    color="default"
                                    variant="outlined"
                                    onClick={() => handleRoleChange(member.id, 'member')}
                                    sx={{ 
                                      mr: 1, 
                                      fontSize: '0.7rem',
                                      height: 24,
                                      '&:hover': {
                                        bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'
                                      }
                                    }}
                                  />
                                ) : (
                                  <Chip
                                    label="Promote"
                                    size="small"
                                    color="primary"
                                    variant="outlined"
                                    onClick={() => handleRoleChange(member.id, 'moderator')}
                                    sx={{ 
                                      mr: 1, 
                                      fontSize: '0.7rem',
                                      height: 24,
                                      '&:hover': {
                                        bgcolor: theme.palette.mode === 'dark' ? 'rgba(25,118,210,0.1)' : 'rgba(25,118,210,0.05)'
                                      }
                                    }}
                                  />
                                )}
                                <Chip
                                  label="Remove"
                                  size="small"
                                  color="error"
                                  variant="outlined"
                                  onClick={() => handleRemoveMember(member.id)}
                                  sx={{ 
                                    fontSize: '0.7rem',
                                    height: 24,
                                    '&:hover': {
                                      bgcolor: theme.palette.mode === 'dark' ? 'rgba(211,47,47,0.1)' : 'rgba(211,47,47,0.05)'
                                    }
                                  }}
                                />
                              </>
                            )}
                          </Box>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                          <Chip 
                            label={member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                            size="small"
                            sx={{ 
                              bgcolor: roleColor.bg, 
                              color: roleColor.text,
                              mr: 1,
                              fontSize: '0.7rem',
                              height: 20
                            }}
                          />
                          <Typography variant="caption" color="text.secondary">
                            Joined {new Date(member.joinDate).toLocaleDateString()}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
          
          {/* Loading more indicator */}
          {isLoadingMore && (
            <Box sx={{ py: 2, display: 'flex', justifyContent: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ display: 'inline-block', position: 'relative', width: 20, height: 20 }}>
                  <Box
                    component="span"
                    sx={{
                      position: 'absolute',
                      width: '100%',
                      height: '100%',
                      borderRadius: '50%',
                      border: '2px solid',
                      borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)',
                      borderTopColor: theme.palette.primary.main,
                      animation: 'spin 1s linear infinite',
                      '@keyframes spin': {
                        '0%': { transform: 'rotate(0deg)' },
                        '100%': { transform: 'rotate(360deg)' }
                      }
                    }}
                  />
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Loading more members...
                </Typography>
              </Box>
            </Box>
          )}
          
          {/* End of list message */}
          {!hasMore && members.length > 0 && (
            <Box sx={{ py: 3, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                You've reached the end of the member list
              </Typography>
            </Box>
          )}
        </Paper>
      </motion.div>
    </Box>
  );
};

export default MemberListTab;

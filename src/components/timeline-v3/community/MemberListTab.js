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
  CardContent
} from '@mui/material';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import CommunityDotTabs from './CommunityDotTabs';
import FlagIcon from '@mui/icons-material/Flag';

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
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const observer = useRef();

  // Simulated data loading
  useEffect(() => {
    // In a real implementation, this would be an API call
    const loadMembers = () => {
      setTimeout(() => {
        const initialMembers = [
          { id: 1, name: 'Jane Cooper', role: 'admin', avatar: 'https://i.pravatar.cc/150?img=1', joinDate: '2025-01-15' },
          { id: 2, name: 'Wade Warren', role: 'moderator', avatar: 'https://i.pravatar.cc/150?img=2', joinDate: '2025-02-03' },
          { id: 3, name: 'Esther Howard', role: 'member', avatar: 'https://i.pravatar.cc/150?img=3', joinDate: '2025-03-21' },
          { id: 4, name: 'Cameron Williamson', role: 'member', avatar: 'https://i.pravatar.cc/150?img=4', joinDate: '2025-04-08' },
          { id: 5, name: 'Brooklyn Simmons', role: 'member', avatar: 'https://i.pravatar.cc/150?img=5', joinDate: '2025-05-12' }
        ];
        setMembers(initialMembers);
        setIsLoading(false);
      }, 1200); // Simulate network delay
    };

    // Simulated gold action loading
    const loadGoldAction = () => {
      setTimeout(() => {
        setGoldAction({
          title: "Community Showcase Week",
          description: "Share your best timeline events for a chance to be featured on our homepage!",
          dueDate: "2025-06-15",
          createdBy: "Jane Cooper",
          priority: "high"
        });
        setIsGoldActionLoading(false);
      }, 800); // Simulate network delay
    };
    
    // Simulated bronze action loading
    const loadBronzeAction = () => {
      setTimeout(() => {
        setBronzeAction({
          title: "Timeline Cleanup",
          description: "Help organize and tag events to improve searchability",
          dueDate: "2025-06-20",
          createdBy: "Wade Warren",
          priority: "medium"
        });
        setIsBronzeActionLoading(false);
      }, 1000); // Simulate network delay
    };
    
    // Simulated silver action loading
    const loadSilverAction = () => {
      setTimeout(() => {
        setSilverAction({
          title: "Member Welcome",
          description: "Greet new members and help them get started",
          dueDate: "2025-06-25",
          createdBy: "Esther Howard",
          priority: "medium"
        });
        setIsSilverActionLoading(false);
      }, 1200); // Simulate network delay
    };

    loadMembers();
    loadGoldAction();
    loadBronzeAction();
    loadSilverAction();
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
      case 'admin':
        return { bg: theme.palette.error.main, text: '#fff' };
      case 'moderator':
        return { bg: theme.palette.warning.main, text: '#000' };
      default:
        return { bg: theme.palette.primary.main, text: '#fff' };
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
      {/* Gold Action Plaque */}
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
            ) : (
              <Typography variant="body1" color="text.secondary">
                No gold community action set.
              </Typography>
            )}
          </CardContent>
        </Card>
      </motion.div>
      
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
          {/* Bronze Action */}
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
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No bronze community action set.
                </Typography>
              )}
            </CardContent>
          </Card>
          
          {/* Silver Action */}
          <Card
            sx={{
              flex: 1,
              position: 'relative',
              borderRadius: 2,
              background: `linear-gradient(145deg, 
                ${theme.palette.mode === 'dark' ? '#2d2d33' : '#f8f8fa'}, 
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
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No silver community action set.
                </Typography>
              )}
            </CardContent>
          </Card>
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
            // Member list
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
                        <Typography variant="subtitle1">{member.name}</Typography>
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

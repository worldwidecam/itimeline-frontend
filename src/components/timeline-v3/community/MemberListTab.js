import React, { useState, useEffect } from 'react';
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
  const [currentAction, setCurrentAction] = useState(null);
  const [isActionLoading, setIsActionLoading] = useState(true);

  // Simulated data loading
  useEffect(() => {
    // In a real implementation, this would be an API call
    const loadMembers = () => {
      setTimeout(() => {
        setMembers([
          { id: 1, name: 'Jane Cooper', role: 'admin', avatar: 'https://i.pravatar.cc/150?img=1', joinDate: '2025-01-15' },
          { id: 2, name: 'Wade Warren', role: 'moderator', avatar: 'https://i.pravatar.cc/150?img=2', joinDate: '2025-02-03' },
          { id: 3, name: 'Esther Howard', role: 'member', avatar: 'https://i.pravatar.cc/150?img=3', joinDate: '2025-03-21' },
          { id: 4, name: 'Cameron Williamson', role: 'member', avatar: 'https://i.pravatar.cc/150?img=4', joinDate: '2025-04-08' },
          { id: 5, name: 'Brooklyn Simmons', role: 'member', avatar: 'https://i.pravatar.cc/150?img=5', joinDate: '2025-05-12' }
        ]);
        setIsLoading(false);
      }, 1200); // Simulate network delay
    };

    // Simulated current action loading
    const loadCurrentAction = () => {
      setTimeout(() => {
        setCurrentAction({
          title: "Community Showcase Week",
          description: "Share your best timeline events for a chance to be featured on our homepage!",
          dueDate: "2025-06-15",
          createdBy: "Jane Cooper",
          priority: "high"
        });
        setIsActionLoading(false);
      }, 800); // Simulate network delay
    };

    loadMembers();
    loadCurrentAction();
  }, []);

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
      {/* Current Action Plaque */}
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
            {isActionLoading ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Skeleton variant="circular" width={24} height={24} />
                  <Skeleton variant="text" width={180} height={32} />
                </Box>
                <Skeleton variant="text" width="90%" height={24} />
                <Skeleton variant="text" width="60%" height={24} />
              </Box>
            ) : currentAction ? (
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
                    CURRENT ACTION
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
                  {currentAction.title}
                </Typography>
                
                <Typography 
                  variant="body1"
                  sx={{ 
                    mb: 1.5,
                    color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)'
                  }}
                >
                  {currentAction.description}
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
                    Set by {currentAction.createdBy}
                  </Typography>
                  
                  <Chip 
                    label={`Due: ${new Date(currentAction.dueDate).toLocaleDateString()}`}
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
                No current community action set.
              </Typography>
            )}
          </CardContent>
        </Card>
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
            <Typography variant="h5" component="h1" gutterBottom>
              Community Members
            </Typography>
            
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
              {members.map((member) => {
                const roleColor = getRoleColor(member.role);
                return (
                  <motion.div key={member.id} variants={itemVariants}>
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
                          boxShadow: '0 0 0 2px ' + roleColor.bg
                        }}
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
        </Paper>
      </motion.div>
    </Box>
  );
};

export default MemberListTab;

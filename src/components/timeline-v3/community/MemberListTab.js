import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper,
  Divider,
  Avatar,
  Chip,
  Skeleton,
  useTheme
} from '@mui/material';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import CommunityDotTabs from './CommunityDotTabs';

const MemberListTab = () => {
  const { id } = useParams();
  const theme = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [members, setMembers] = useState([]);

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

    loadMembers();
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
      {/* Community Dot Tabs - Always visible at the top */}
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

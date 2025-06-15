import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Tabs,
  Tab,
  Divider,
  TextField,
  FormControlLabel,
  Switch,
  Button,
  Alert,
  Skeleton,
  useTheme,
  Avatar,
  Chip,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle
} from '@mui/material';
import SecurityIcon from '@mui/icons-material/Security';
import PeopleIcon from '@mui/icons-material/People';
import SettingsIcon from '@mui/icons-material/Settings';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import PersonRemoveIcon from '@mui/icons-material/PersonRemove';
import ForumIcon from '@mui/icons-material/Forum';
import FlagIcon from '@mui/icons-material/Flag';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import ShieldIcon from '@mui/icons-material/Shield';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import ModeratorIcon from '@mui/icons-material/VerifiedUser';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import CommunityDotTabs from './CommunityDotTabs';

const AdminPanel = () => {
  const { id } = useParams();
  const [tabValue, setTabValue] = useState(0);
  const [memberTabValue, setMemberTabValue] = useState(0); // 0 = Active Members, 1 = Blocked Members
  const [isLoading, setIsLoading] = useState(true);
  const [timelineData, setTimelineData] = useState(null);
  const [isPrivate, setIsPrivate] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [members, setMembers] = useState([]);
  const [blockedMembers, setBlockedMembers] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmUnblockDialogOpen, setConfirmUnblockDialogOpen] = useState(false);
  const [confirmBlockDialogOpen, setConfirmBlockDialogOpen] = useState(false);
  const [actionType, setActionType] = useState('');  // 'remove', 'block', or 'unblock'
  
  // State for reported posts
  const [reportedPosts, setReportedPosts] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);
  const [confirmPostActionDialogOpen, setConfirmPostActionDialogOpen] = useState(false);
  const [postActionType, setPostActionType] = useState(''); // 'delete' or 'safeguard'
  const [isPostLoading, setIsPostLoading] = useState(true);
  const theme = useTheme();

  // Simulated data loading
  useEffect(() => {
    // In a real implementation, this would be an API call
    const loadTimelineData = () => {
      setTimeout(() => {
        setTimelineData({
          name: 'USC',
          description: 'University of Southern California community timeline',
          visibility: 'public',
          createdAt: '2025-01-10',
          memberCount: 42
        });
        setIsLoading(false);
      }, 1000); // Simulate network delay
    };
    
    // Simulated member data loading
    const loadMembers = () => {
      // Generate 15 members with different roles
      const mockMembers = Array(15).fill().map((_, index) => {
        // Determine role - make first one admin, some moderators, rest members
        let role = 'member';
        if (index === 0) role = 'admin';
        else if (index < 3) role = 'moderator';
        
        return {
          id: index + 1,
          name: `Member ${index + 1}`,
          role: role,
          avatar: `https://i.pravatar.cc/150?img=${(index % 70) + 1}`, // Cycle through available avatars
          joinDate: new Date(Date.now() - Math.random() * 10000000000).toISOString().split('T')[0] // Random recent date
        };
      });
      
      setMembers(mockMembers);
    };
    
    // Simulated blocked members data loading
    const loadBlockedMembers = () => {
      // Generate 5 blocked members
      const mockBlockedMembers = Array(5).fill().map((_, index) => {
        const id = 100 + index; // Use different ID range to avoid conflicts
        return {
          id,
          name: `Blocked User ${index + 1}`,
          avatar: `https://i.pravatar.cc/150?img=${((id + 20) % 70) + 1}`, // Different avatar set
          blockedDate: new Date(Date.now() - Math.random() * 5000000000).toISOString().split('T')[0], // Random recent date
          reason: [
            'Spam content',
            'Inappropriate behavior',
            'Multiple community guideline violations',
            'Harassment',
            'Fake account'
          ][index % 5] // Cycle through reasons
        };
      });
      
      setBlockedMembers(mockBlockedMembers);
    };
    
    // Simulated reported posts data loading
    const loadReportedPosts = () => {
      // Generate 8 reported posts with different statuses
      const reportReasons = [
        'Inappropriate content',
        'Spam',
        'Misinformation',
        'Harassment',
        'Hate speech',
        'Violence',
        'Copyright violation',
        'Other'
      ];
      
      const eventTypes = ['remark', 'media', 'link', 'milestone'];
      
      const mockReportedPosts = Array(8).fill().map((_, index) => {
        // Create different statuses - most pending, some reviewing, few resolved
        let status = 'pending';
        let assignedTo = null;
        
        if (index < 2) {
          status = 'reviewing';
          // Assign to a moderator (index 1 or 2 from members)
          const modIndex = (index % 2) + 1;
          assignedTo = {
            id: modIndex + 1,
            name: `Member ${modIndex + 1}`,
            avatar: `https://i.pravatar.cc/150?img=${((modIndex) % 70) + 1}`
          };
        } else if (index === 7) {
          status = 'resolved';
          // Assign to admin
          assignedTo = {
            id: 1,
            name: 'Member 1',
            avatar: `https://i.pravatar.cc/150?img=${1}`
          };
        }
        
        // Random reporter from members (not admin or mods)
        const reporterId = Math.floor(Math.random() * 12) + 4; // Members 4-15
        
        return {
          id: `post${index + 1}`,
          title: `Reported ${eventTypes[index % eventTypes.length]} ${index + 1}`,
          content: `This is a reported ${eventTypes[index % eventTypes.length]} that may violate community guidelines.`,
          reportedBy: {
            id: reporterId,
            name: `Member ${reporterId}`,
            avatar: `https://i.pravatar.cc/150?img=${(reporterId % 70) + 1}`
          },
          reportDate: new Date(Date.now() - Math.random() * 2000000000).toISOString(), // Within last ~3 weeks
          reportReason: reportReasons[index % reportReasons.length],
          status: status,
          assignedTo: assignedTo,
          eventType: eventTypes[index % eventTypes.length],
          eventId: `event${100 + index}`
        };
      });
      
      setReportedPosts(mockReportedPosts);
      setIsPostLoading(false);
    };

    loadTimelineData();
    loadMembers();
    loadBlockedMembers();
    loadReportedPosts();
  }, []);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  const handleMemberTabChange = (event, newValue) => {
    setMemberTabValue(newValue);
  };
  
  const handleVisibilityChange = (event) => {
    const newValue = event.target.checked;
    setIsPrivate(newValue);
    
    // Show warning when switching to private
    if (newValue) {
      setShowWarning(true);
    } else {
      setShowWarning(false);
    }
  };
  
  // Handle opening the confirmation dialog for different actions
  const handleOpenConfirmDialog = (member, action) => {
    setSelectedMember(member);
    setActionType(action);
    
    if (action === 'remove') {
      setConfirmDialogOpen(true);
    } else if (action === 'block') {
      setConfirmBlockDialogOpen(true);
    } else if (action === 'unblock') {
      setConfirmUnblockDialogOpen(true);
    }
  };
  
  // Handle closing the confirmation dialogs
  const handleCloseConfirmDialog = () => {
    setConfirmDialogOpen(false);
    setConfirmBlockDialogOpen(false);
    setConfirmUnblockDialogOpen(false);
    setSelectedMember(null);
    setActionType('');
  };
  
  // Handle removing a member
  const handleRemoveMember = () => {
    // In a real implementation, this would be an API call
    setMembers(members.filter(m => m.id !== selectedMember.id));
    setConfirmDialogOpen(false);
    
    // Update the member count in timeline data
    if (timelineData) {
      setTimelineData({
        ...timelineData,
        memberCount: timelineData.memberCount - 1
      });
    }
  };
  
  // Handle blocking a member
  const handleBlockMember = () => {
    // In a real implementation, this would be an API call
    // 1. Remove from members list
    const memberToBlock = members.find(m => m.id === selectedMember.id);
    setMembers(members.filter(m => m.id !== selectedMember.id));
    
    // 2. Add to blocked members with current date and default reason
    const blockedMember = {
      ...memberToBlock,
      blockedDate: new Date().toISOString().split('T')[0],
      reason: 'Blocked by administrator'
    };
    
    setBlockedMembers([...blockedMembers, blockedMember]);
    setConfirmBlockDialogOpen(false);
    
    // 3. Update the member count in timeline data
    if (timelineData) {
      setTimelineData({
        ...timelineData,
        memberCount: timelineData.memberCount - 1
      });
    }
  };
  
  // Handle unblocking a member
  const handleUnblockMember = () => {
    // In a real implementation, this would be an API call
    // 1. Remove from blocked members list
    const memberToUnblock = blockedMembers.find(m => m.id === selectedMember.id);
    setBlockedMembers(blockedMembers.filter(m => m.id !== selectedMember.id));
    
    // 2. Add back to members with original data (minus the blocked-specific fields)
    const { blockedDate, reason, ...memberData } = memberToUnblock;
    const unblockMember = {
      ...memberData,
      role: 'member', // Reset to basic member role
      joinDate: new Date().toISOString().split('T')[0] // Reset join date to today
    };
    
    setMembers([...members, unblockMember]);
    setConfirmUnblockDialogOpen(false);
    
    // 3. Update the member count in timeline data
    if (timelineData) {
      setTimelineData({
        ...timelineData,
        memberCount: timelineData.memberCount + 1
      });
    }
  };
  
  // Get role color styling
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

  // Tab content components with animations
  const MemberManagementTab = () => (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit={{ opacity: 0, y: 20 }}
    >
      {isLoading ? (
        // Loading skeleton
        <Box sx={{ mt: 2 }}>
          {[1, 2, 3].map((item) => (
            <Box key={item} sx={{ mb: 3 }}>
              <Skeleton variant="text" width="60%" height={28} sx={{ mb: 1 }} />
              <Skeleton variant="text" width="40%" height={20} />
              <Skeleton variant="rectangular" width="100%" height={60} sx={{ mt: 2, borderRadius: 1 }} />
            </Box>
          ))}
        </Box>
      ) : (
        // Member management content
        <>
          <motion.div variants={itemVariants}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>Member Roles</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Assign roles to members to grant them different permissions
              </Typography>
              
              <Box sx={{ 
                p: 2, 
                bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                borderRadius: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <PeopleIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
                  <Typography>{timelineData?.memberCount || 0} Members</Typography>
                </Box>
                <Button variant="outlined" size="small">Manage Roles</Button>
              </Box>
            </Box>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>Pending Requests</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Review and approve membership requests
              </Typography>
              
              <Box sx={{ 
                p: 2, 
                bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                borderRadius: 1,
                textAlign: 'center'
              }}>
                <Typography variant="body2" color="text.secondary">
                  No pending membership requests
                </Typography>
              </Box>
            </Box>
          </motion.div>
          
          <motion.div variants={itemVariants}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>Community Members</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Manage community members and their roles
              </Typography>
              
              <Paper 
                elevation={0} 
                sx={{ 
                  bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                  borderRadius: 2,
                  overflow: 'hidden'
                }}
              >
                {/* Member management tabs */}
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                  <Tabs 
                    value={memberTabValue} 
                    onChange={handleMemberTabChange}
                    variant="fullWidth"
                    sx={{ 
                      minHeight: 48,
                      '& .MuiTab-root': {
                        minHeight: 48,
                        py: 1.5
                      }
                    }}
                  >
                    <Tab 
                      label={<Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <PeopleIcon sx={{ mr: 1, fontSize: '1.1rem' }} />
                        <Typography variant="button" sx={{ fontWeight: memberTabValue === 0 ? 'bold' : 'normal' }}>
                          Active Members ({members.length})
                        </Typography>
                      </Box>} 
                      sx={{ textTransform: 'none' }}
                    />
                    <Tab 
                      label={<Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <DeleteOutlineIcon sx={{ mr: 1, fontSize: '1.1rem' }} />
                        <Typography variant="button" sx={{ fontWeight: memberTabValue === 1 ? 'bold' : 'normal' }}>
                          Blocked Users ({blockedMembers.length})
                        </Typography>
                      </Box>} 
                      sx={{ textTransform: 'none' }}
                    />
                  </Tabs>
                </Box>
                
                {/* Active Members Tab */}
                {memberTabValue === 0 && (
                  <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
                    {members.length === 0 ? (
                      <Box sx={{ p: 3, textAlign: 'center' }}>
                        <Typography variant="body2" color="text.secondary">
                          No active members
                        </Typography>
                      </Box>
                    ) : (
                      members.map((member) => {
                        const roleColor = getRoleColor(member.role);
                        
                        return (
                          <Box 
                            key={member.id}
                            sx={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              p: 2,
                              borderBottom: '1px solid',
                              borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                              '&:last-child': {
                                borderBottom: 'none'
                              },
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
                            />
                            <Box sx={{ display: 'flex', ml: 'auto' }}>
                                <IconButton 
                                  size="small" 
                                  color="error"
                                  onClick={() => handleOpenConfirmDialog(member, 'remove')}
                                  title="Remove from community"
                                  sx={{ 
                                    mr: 1,
                                    '&:hover': {
                                      bgcolor: 'rgba(211, 47, 47, 0.1)'
                                    }
                                  }}
                                >
                                  <PersonRemoveIcon />
                                </IconButton>
                                <IconButton 
                                  size="small" 
                                  color="error"
                                  onClick={() => handleOpenConfirmDialog(member, 'block')}
                                  title="Block from community"
                                  sx={{ 
                                    ml: 1,
                                    '&:hover': {
                                      bgcolor: 'rgba(211, 47, 47, 0.1)'
                                    }
                                  }}
                                >
                                  <DeleteOutlineIcon />
                                </IconButton>
                              </Box>
                          </Box>
                        );
                      })
                    )}
                  </Box>
                )}
                
                {/* Blocked Members Tab */}
                {memberTabValue === 1 && (
                  <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
                    {blockedMembers.length === 0 ? (
                      <Box sx={{ p: 3, textAlign: 'center' }}>
                        <Typography variant="body2" color="text.secondary">
                          No blocked users
                        </Typography>
                      </Box>
                    ) : (
                      blockedMembers.map((member) => (
                        <Box 
                          key={member.id}
                          sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            p: 2,
                            borderBottom: '1px solid',
                            borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                            '&:last-child': {
                              borderBottom: 'none'
                            },
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
                              filter: 'grayscale(100%)',
                              opacity: 0.7,
                              border: '2px solid',
                              borderColor: theme.palette.mode === 'dark' ? 'rgba(255,0,0,0.3)' : 'rgba(211,47,47,0.3)'
                            }}
                          />
                          <Box sx={{ flexGrow: 1 }}>
                            <Typography variant="subtitle1" sx={{ 
                              display: 'flex',
                              alignItems: 'center',
                              color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)'
                            }}>
                              {member.name}
                              <Chip 
                                label="Blocked"
                                size="small"
                                sx={{ 
                                  ml: 1,
                                  bgcolor: theme.palette.mode === 'dark' ? 'rgba(211,47,47,0.2)' : 'rgba(211,47,47,0.1)',
                                  color: theme.palette.error.main,
                                  fontSize: '0.7rem',
                                  height: 20
                                }}
                              />
                            </Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column', mt: 0.5 }}>
                              <Typography variant="caption" color="text.secondary">
                                Blocked on {new Date(member.blockedDate).toLocaleDateString()}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                Reason: {member.reason}
                              </Typography>
                            </Box>
                          </Box>
                          
                          <IconButton 
                            size="small" 
                            color="primary"
                            onClick={() => handleOpenConfirmDialog(member, 'unblock')}
                            title="Unblock user"
                            sx={{ 
                              ml: 1,
                              '&:hover': {
                                bgcolor: 'rgba(25, 118, 210, 0.1)'
                              }
                            }}
                          >
                            <Typography variant="button" sx={{ fontSize: '0.7rem', fontWeight: 'bold' }}>
                              UNBLOCK
                            </Typography>
                          </IconButton>
                        </Box>
                      ))
                    )}
                  </Box>
                )}
              </Paper>
            </Box>
          </motion.div>
        </>
      )}
    </motion.div>
  );

  // SettingsTab is defined as a standalone component at the bottom of this file

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', px: 2, pb: 4 }}>
      {/* Timeline Name Display - Centered */}
      {timelineData && (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mb: 3, mt: 2 }}>
          <Typography variant="h5" component="h1" sx={{ fontWeight: 'medium' }}>
            <Box component="span" sx={{ fontFamily: 'Lobster, cursive', mr: 0.5, color: 'primary.main' }}>i-</Box>
            {timelineData.name}
          </Typography>
        </Box>
      )}
      
      {/* Community Dot Tabs - Always visible at the top */}
      <CommunityDotTabs 
        timelineId={id} 
      />
      
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        {/* Remove Member Confirmation Dialog */}
        <Dialog
          open={confirmDialogOpen}
          onClose={handleCloseConfirmDialog}
          aria-labelledby="remove-member-dialog-title"
          aria-describedby="remove-member-dialog-description"
        >
          <DialogTitle id="remove-member-dialog-title">
            Remove {selectedMember?.name} from community?
          </DialogTitle>
          <DialogContent>
            <DialogContentText id="remove-member-dialog-description">
              This action will remove {selectedMember?.name} from this community timeline. 
              They will no longer have access to community content or be able to participate 
              in community activities. This action cannot be undone.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseConfirmDialog} color="primary">
              Cancel
            </Button>
            <Button 
              onClick={handleRemoveMember} 
              color="error" 
              variant="contained"
              startIcon={<DeleteOutlineIcon />}
            >
              Remove Member
            </Button>
          </DialogActions>
        </Dialog>
        
        {/* Block Member Confirmation Dialog */}
        <Dialog
          open={confirmBlockDialogOpen}
          onClose={handleCloseConfirmDialog}
          aria-labelledby="block-member-dialog-title"
          aria-describedby="block-member-dialog-description"
        >
          <DialogTitle id="block-member-dialog-title">
            Block {selectedMember?.name} from community?
          </DialogTitle>
          <DialogContent>
            <DialogContentText id="block-member-dialog-description">
              This action will remove {selectedMember?.name} from this community timeline and add them to the blocked list. 
              They will no longer have access to community content and will not be able to rejoin without admin approval.
              You can unblock them later if needed.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseConfirmDialog} color="primary">
              Cancel
            </Button>
            <Button 
              onClick={handleBlockMember} 
              color="error" 
              variant="contained"
              startIcon={<PersonRemoveIcon />}
            >
              Block Member
            </Button>
          </DialogActions>
        </Dialog>
        
        {/* Unblock Member Confirmation Dialog */}
        <Dialog
          open={confirmUnblockDialogOpen}
          onClose={handleCloseConfirmDialog}
          aria-labelledby="unblock-member-dialog-title"
          aria-describedby="unblock-member-dialog-description"
        >
          <DialogTitle id="unblock-member-dialog-title">
            Unblock {selectedMember?.name}?
          </DialogTitle>
          <DialogContent>
            <DialogContentText id="unblock-member-dialog-description">
              This action will unblock {selectedMember?.name} and add them back to the community as a regular member. 
              They will regain access to community content and be able to participate in community activities.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseConfirmDialog} color="primary">
              Cancel
            </Button>
            <Button 
              onClick={handleUnblockMember} 
              color="primary" 
              variant="contained"
            >
              Unblock Member
            </Button>
          </DialogActions>
        </Dialog>
        
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
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <SecurityIcon sx={{ mr: 1, color: 'error.main' }} />
            <Typography variant="h5" component="h1">
              Admin Panel
            </Typography>
          </Box>
          <Divider sx={{ my: 2 }} />
          
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            sx={{ mb: 3 }}
            TabIndicatorProps={{
              style: {
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
              }
            }}
          >
            <Tab 
              label="Manage Members" 
              icon={<PeopleIcon />} 
              iconPosition="start"
              sx={{ 
                transition: 'all 0.3s ease',
                minHeight: 48,
                '&.Mui-selected': {
                  fontWeight: 'bold'
                }
              }}
            />
            <Tab 
              label="Manage Posts" 
              icon={<ForumIcon />} 
              iconPosition="start"
              sx={{ 
                transition: 'all 0.3s ease',
                minHeight: 48,
                '&.Mui-selected': {
                  fontWeight: 'bold'
                }
              }}
            />
            <Tab 
              label="Settings" 
              icon={<SettingsIcon />} 
              iconPosition="start"
              sx={{ 
                transition: 'all 0.3s ease',
                minHeight: 48,
                '&.Mui-selected': {
                  fontWeight: 'bold'
                }
              }}
            />
          </Tabs>
          
          <Box sx={{ p: 1 }}>
            <AnimatePresence mode="wait">
              {tabValue === 0 && <MemberManagementTab key="members" />}
              {tabValue === 1 && <ManagePostsTab key="posts" />}
              {tabValue === 2 && <SettingsTab key="settings" />}
            </AnimatePresence>
          </Box>
        </Paper>
      </motion.div>
    </Box>
  );
};

// Manage Posts Tab Component
const ManagePostsTab = () => {
  const theme = useTheme();
  const [postTabValue, setPostTabValue] = useState(0); // 0 = All, 1 = Pending, 2 = Reviewing, 3 = Resolved
  const [selectedPost, setSelectedPost] = useState(null);
  const [confirmPostActionDialogOpen, setConfirmPostActionDialogOpen] = useState(false);
  const [postActionType, setPostActionType] = useState(''); // 'delete' or 'safeguard'
  
  // Mock data for reported posts
  const [reportedPosts, setReportedPosts] = useState([
    {
      id: '1',
      eventType: 'Media',
      status: 'pending',
      reportDate: '2 days ago',
      reporter: {
        id: 'reporter-1',
        name: 'John Doe',
        avatar: 'https://i.pravatar.cc/150?img=1'
      },
      reason: 'Inappropriate content',
      assignedModerator: null,
      resolution: null
    },
    {
      id: '2',
      eventType: 'Remark',
      status: 'reviewing',
      reportDate: '3 days ago',
      reporter: {
        id: 'reporter-2',
        name: 'Jane Smith',
        avatar: 'https://i.pravatar.cc/150?img=2'
      },
      reason: 'Harassment',
      assignedModerator: {
        id: 'mod-1',
        name: 'Alex Johnson',
        avatar: 'https://i.pravatar.cc/150?img=3'
      },
      resolution: null
    },
    {
      id: '3',
      eventType: 'Media',
      status: 'resolved',
      reportDate: '5 days ago',
      reporter: {
        id: 'reporter-3',
        name: 'Mike Wilson',
        avatar: 'https://i.pravatar.cc/150?img=4'
      },
      reason: 'Copyright violation',
      assignedModerator: {
        id: 'mod-2',
        name: 'Sarah Parker',
        avatar: 'https://i.pravatar.cc/150?img=5'
      },
      resolution: 'deleted'
    },
    {
      id: '4',
      eventType: 'Remark',
      status: 'pending',
      reportDate: '1 day ago',
      reporter: {
        id: 'reporter-4',
        name: 'Chris Taylor',
        avatar: 'https://i.pravatar.cc/150?img=6'
      },
      reason: 'Spam content',
      assignedModerator: null,
      resolution: null
    }
  ])
  
  // Handle post tab change
  const handlePostTabChange = (event, newValue) => {
    setPostTabValue(newValue);
  };
  
  // Handle opening the confirmation dialog for different post actions
  const handleOpenPostActionDialog = (post, action) => {
    setSelectedPost(post);
    setPostActionType(action);
    setConfirmPostActionDialogOpen(true);
  };
  
  // Handle closing the confirmation dialog
  const handleClosePostActionDialog = () => {
    setConfirmPostActionDialogOpen(false);
    setSelectedPost(null);
    setPostActionType('');
  };
  
  // Handle accepting a report for review
  const handleAcceptReport = (post) => {
    // In a real implementation, this would be an API call
    const updatedPosts = reportedPosts.map(p => {
      if (p.id === post.id) {
        return {
          ...p,
          status: 'reviewing',
          assignedModerator: {
            id: 'current-user-id',
            name: 'Current User',
            avatar: 'https://i.pravatar.cc/150?img=5'
          }
        };
      }
      return p;
    });
    
    setReportedPosts(updatedPosts);
  };
  
  // Handle deleting a reported post
  const handleDeletePost = () => {
    // In a real implementation, this would be an API call
    const updatedPosts = reportedPosts.map(p => {
      if (p.id === selectedPost.id) {
        return {
          ...p,
          status: 'resolved',
          resolution: 'deleted'
        };
      }
      return p;
    });
    
    setReportedPosts(updatedPosts);
    setConfirmPostActionDialogOpen(false);
  };
  
  // Handle safeguarding a post
  const handleSafeguardPost = () => {
    // In a real implementation, this would be an API call
    const updatedPosts = reportedPosts.map(p => {
      if (p.id === selectedPost.id) {
        return {
          ...p,
          status: 'resolved',
          resolution: 'safeguarded'
        };
      }
      return p;
    });
    
    setReportedPosts(updatedPosts);
    setConfirmPostActionDialogOpen(false);
  };
  
  // Filter posts based on selected tab
  const filteredPosts = reportedPosts.filter(post => {
    if (postTabValue === 0) return true; // All posts
    if (postTabValue === 1) return post.status === 'pending'; // Pending posts
    if (postTabValue === 2) return post.status === 'reviewing'; // Reviewing posts
    if (postTabValue === 3) return post.status === 'resolved'; // Resolved posts
    return true;
  });
  
  // Count posts by status for tab badges
  const pendingCount = reportedPosts.filter(post => post.status === 'pending').length;
  const reviewingCount = reportedPosts.filter(post => post.status === 'reviewing').length;
  const resolvedCount = reportedPosts.filter(post => post.status === 'resolved').length;
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <FlagIcon sx={{ mr: 1, color: 'warning.main' }} />
        <Typography variant="h6" component="h2">
          Reported Posts
        </Typography>
      </Box>
      
      {/* Post Management Tabs */}
      <Tabs 
        value={postTabValue} 
        onChange={handlePostTabChange}
        sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab label={`All (${reportedPosts.length})`} />
        <Tab 
          label={`Pending (${pendingCount})`} 
          sx={{ 
            color: pendingCount > 0 ? 'warning.main' : 'inherit',
            fontWeight: pendingCount > 0 ? 'bold' : 'normal'
          }} 
        />
        <Tab 
          label={`Reviewing (${reviewingCount})`} 
          sx={{ 
            color: reviewingCount > 0 ? 'info.main' : 'inherit',
            fontWeight: reviewingCount > 0 ? 'bold' : 'normal'
          }} 
        />
        <Tab 
          label={`Resolved (${resolvedCount})`} 
          sx={{ 
            color: resolvedCount > 0 ? 'success.main' : 'inherit',
            fontWeight: resolvedCount > 0 ? 'bold' : 'normal'
          }} 
        />
      </Tabs>
      
      {/* Reported Posts List */}
      <Box sx={{ maxHeight: 500, overflow: 'auto' }}>
        {filteredPosts.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              No reported posts in this category
            </Typography>
          </Box>
        ) : (
          <Box>
            {filteredPosts.map((post) => {
              // Determine status color
              let statusColor = {
                text: '#6B7280',
                bg: '#F3F4F6',
                icon: null
              };
              
              if (post.status === 'pending') {
                statusColor = {
                  text: '#D97706',
                  bg: '#FEF3C7',
                  icon: <FlagIcon fontSize="small" />
                };
              } else if (post.status === 'reviewing') {
                statusColor = {
                  text: '#2563EB',
                  bg: '#DBEAFE',
                  icon: <ShieldIcon fontSize="small" />
                };
              } else if (post.status === 'resolved') {
                statusColor = {
                  text: '#059669',
                  bg: '#D1FAE5',
                  icon: <CheckCircleIcon fontSize="small" />
                };
              }
              
              return (
                <Paper 
                  key={post.id}
                  elevation={1}
                  sx={{
                    p: 2,
                    mb: 2,
                    borderLeft: '4px solid',
                    borderColor: post.status === 'pending' ? 'warning.main' : 
                                post.status === 'reviewing' ? 'info.main' : 'success.main',
                    transition: 'transform 0.2s ease',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: 3
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="subtitle1" component="div" sx={{ fontWeight: 500 }}>
                        {post.eventType} Event
                      </Typography>
                      <Chip 
                        label={post.status.charAt(0).toUpperCase() + post.status.slice(1)}
                        size="small"
                        icon={statusColor.icon}
                        sx={{ 
                          ml: 2,
                          bgcolor: statusColor.bg,
                          color: statusColor.text,
                          fontWeight: 500
                        }}
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      Reported {post.reportDate}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Reporter:</strong> {post.reporter.name}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Reason:</strong> {post.reason}
                    </Typography>
                    {post.assignedModerator && (
                      <Typography variant="body2">
                        <strong>Assigned to:</strong> {post.assignedModerator.name}
                      </Typography>
                    )}
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                    {post.status === 'pending' && (
                      <Button
                        variant="outlined"
                        size="small"
                        color="primary"
                        startIcon={<ShieldIcon />}
                        onClick={() => handleAcceptReport(post)}
                        sx={{ mr: 1 }}
                      >
                        Accept for Review
                      </Button>
                    )}
                    
                    {post.status !== 'resolved' && (
                      <>
                        <Button
                          variant="outlined"
                          size="small"
                          color="error"
                          startIcon={<CancelIcon />}
                          onClick={() => handleOpenPostActionDialog(post, 'delete')}
                          sx={{ mr: 1 }}
                        >
                          Delete Post
                        </Button>
                        <Button
                          variant="outlined"
                          size="small"
                          color="success"
                          startIcon={<CheckCircleIcon />}
                          onClick={() => handleOpenPostActionDialog(post, 'safeguard')}
                        >
                          Safeguard Post
                        </Button>
                      </>
                    )}
                    
                    {post.status === 'resolved' && (
                      <Typography variant="body2" color="text.secondary">
                        Resolution: <strong>{post.resolution || 'Unknown'}</strong>
                      </Typography>
                    )}
                  </Box>
                </Paper>
              );
            })}
          </Box>
        )}
      </Box>
      
      {/* Post Action Confirmation Dialog */}
      <Dialog
        open={confirmPostActionDialogOpen}
        onClose={handleClosePostActionDialog}
        aria-labelledby="post-action-dialog-title"
        aria-describedby="post-action-dialog-description"
      >
        <DialogTitle id="post-action-dialog-title">
          {postActionType === 'delete' ? 'Delete Reported Post?' : 'Safeguard Post?'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="post-action-dialog-description">
            {postActionType === 'delete' ? 
              'This action will permanently remove this post from the timeline. This action cannot be undone.' : 
              'This action will mark the post as reviewed and safe, dismissing the report. The post will remain visible on the timeline.'}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePostActionDialog} color="primary">
            Cancel
          </Button>
          <Button 
            onClick={postActionType === 'delete' ? handleDeletePost : handleSafeguardPost} 
            color={postActionType === 'delete' ? 'error' : 'success'} 
            variant="contained"
            startIcon={postActionType === 'delete' ? <CancelIcon /> : <CheckCircleIcon />}
          >
            {postActionType === 'delete' ? 'Delete Post' : 'Safeguard Post'}
          </Button>
        </DialogActions>
      </Dialog>
    </motion.div>
  );
};

// Member Management Tab Component
const MemberManagementTab = () => {
  const theme = useTheme();
  const [memberTabValue, setMemberTabValue] = useState(0); // 0 = Active Members, 1 = Blocked Members
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [actionType, setActionType] = useState(''); // 'remove' or 'block' or 'unblock'
  
  // Mock data for members
  const [members, setMembers] = useState([
    {
      id: '1',
      name: 'John Doe',
      avatar: 'https://i.pravatar.cc/150?img=1',
      role: 'admin',
      joinDate: '2 months ago'
    },
    {
      id: '2',
      name: 'Jane Smith',
      avatar: 'https://i.pravatar.cc/150?img=2',
      role: 'moderator',
      joinDate: '1 month ago'
    },
    {
      id: '3',
      name: 'Mike Wilson',
      avatar: 'https://i.pravatar.cc/150?img=3',
      role: 'member',
      joinDate: '3 weeks ago'
    },
    {
      id: '4',
      name: 'Sarah Parker',
      avatar: 'https://i.pravatar.cc/150?img=4',
      role: 'member',
      joinDate: '2 weeks ago'
    }
  ]);
  
  // Mock data for blocked members
  const [blockedMembers, setBlockedMembers] = useState([
    {
      id: '5',
      name: 'Alex Johnson',
      avatar: 'https://i.pravatar.cc/150?img=5',
      blockedDate: '1 week ago',
      reason: 'Spam content'
    },
    {
      id: '6',
      name: 'Chris Taylor',
      avatar: 'https://i.pravatar.cc/150?img=6',
      blockedDate: '3 days ago',
      reason: 'Harassment'
    }
  ]);
  
  // Handle opening the confirmation dialog
  const handleOpenConfirmDialog = (member, action) => {
    setSelectedMember(member);
    setActionType(action);
    setConfirmDialogOpen(true);
  };
  
  // Handle closing the confirmation dialog
  const handleCloseConfirmDialog = () => {
    setConfirmDialogOpen(false);
    setSelectedMember(null);
    setActionType('');
  };
  
  // Get color based on role
  const getRoleColor = (role) => {
    if (role === 'admin') {
      return {
        text: '#D97706',
        bg: '#FEF3C7'
      };
    } else if (role === 'moderator') {
      return {
        text: '#2563EB',
        bg: '#DBEAFE'
      };
    } else {
      return {
        text: '#6B7280',
        bg: '#F3F4F6'
      };
    }
  };
  
  const handleMemberTabChange = (event, newValue) => {
    setMemberTabValue(newValue);
  };
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Member Management Tabs */}
      <Tabs 
        value={memberTabValue} 
        onChange={handleMemberTabChange}
        sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab label="Active Members" />
        <Tab label="Blocked Members" />
      </Tabs>
      
      {/* Active Members Tab */}
      {memberTabValue === 0 && (
        <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
          {members.length === 0 ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                No members yet
              </Typography>
            </Box>
          ) : (
            <Box>
              {members.map((member) => {
                // Determine role color
                let roleColor = {
                  text: '#6B7280',
                  bg: '#F3F4F6'
                };
                
                if (member.role === 'admin') {
                  roleColor = {
                    text: '#B91C1C',
                    bg: '#FEE2E2'
                  };
                } else if (member.role === 'moderator') {
                  roleColor = {
                    text: '#2563EB',
                    bg: '#DBEAFE'
                  };
                }
                
                return (
                  <Box 
                    key={member.id}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      p: 2,
                      borderBottom: 1,
                      borderColor: 'divider',
                      '&:last-child': {
                        borderBottom: 'none'
                      },
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
                    />
                    <Box sx={{ display: 'flex', ml: 'auto' }}>
                        <IconButton 
                          size="small" 
                          color="error"
                          onClick={() => handleOpenConfirmDialog(member, 'remove')}
                          title="Remove from community"
                          sx={{ 
                            mr: 1,
                            '&:hover': {
                              bgcolor: 'rgba(211, 47, 47, 0.1)'
                            }
                          }}
                        >
                          <PersonRemoveIcon />
                        </IconButton>
                        <IconButton 
                          size="small" 
                          color="error"
                          onClick={() => handleOpenConfirmDialog(member, 'block')}
                          title="Block from community"
                          sx={{ 
                            ml: 1,
                            '&:hover': {
                              bgcolor: 'rgba(211, 47, 47, 0.1)'
                            }
                          }}
                        >
                          <DeleteOutlineIcon />
                        </IconButton>
                      </Box>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="subtitle1" component="div">
                        {member.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Joined {member.joinDate}
                      </Typography>
                    </Box>
                    <Chip 
                      label={member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                      size="small"
                      icon={
                        member.role === 'admin' ? 
                          <AdminPanelSettingsIcon fontSize="small" /> : 
                        member.role === 'moderator' ? 
                          <ModeratorIcon fontSize="small" /> : 
                          null
                      }
                      sx={{ 
                        bgcolor: roleColor.bg,
                        color: roleColor.text,
                        fontWeight: 500,
                        mr: 2
                      }}
                    />
                  </Box>
                );
              })}
            </Box>
          )}
        </Box>
      )}
      
      {/* Blocked Members Tab */}
      {memberTabValue === 1 && (
        <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
          {blockedMembers.length === 0 ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                No blocked users
              </Typography>
            </Box>
          ) : (
            <Box>
              {blockedMembers.map((member) => (
                <Box 
                  key={member.id}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    p: 2,
                    borderBottom: 1,
                    borderColor: 'divider',
                    '&:last-child': {
                      borderBottom: 'none'
                    },
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
                      filter: 'grayscale(100%)',
                      opacity: 0.7
                    }}
                  />
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="subtitle1" component="div" sx={{ opacity: 0.7 }}>
                      {member.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Blocked on {member.blockedDate}
                    </Typography>
                    <Typography variant="body2" color="error" sx={{ mt: 0.5 }}>
                      Reason: {member.reason}
                    </Typography>
                  </Box>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => handleOpenConfirmDialog(member, 'unblock')}
                    sx={{ ml: 2 }}
                  >
                    Unblock
                  </Button>
                </Box>
              ))}
            </Box>
          )}
        </Box>
      )}
      
      {/* Member Action Confirmation Dialog */}
      <Dialog
        open={confirmDialogOpen}
        onClose={handleCloseConfirmDialog}
        aria-labelledby="member-action-dialog-title"
        aria-describedby="member-action-dialog-description"
      >
        <DialogTitle id="member-action-dialog-title">
          {actionType === 'remove' ? 'Remove Member?' : 
           actionType === 'block' ? 'Block Member?' : 'Unblock Member?'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="member-action-dialog-description">
            {actionType === 'remove' && 'This will remove the member from the community. They can rejoin later if the community is public.'}
            {actionType === 'block' && 'This will block the member from the community. They will not be able to view or participate in this community.'}
            {actionType === 'unblock' && 'This will unblock the member. They will be able to rejoin the community if it is public.'}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseConfirmDialog} color="primary">
            Cancel
          </Button>
          <Button 
            onClick={() => {
              // In a real implementation, these would be API calls
              if (actionType === 'remove') {
                setMembers(members.filter(m => m.id !== selectedMember.id));
              } else if (actionType === 'block') {
                setMembers(members.filter(m => m.id !== selectedMember.id));
                setBlockedMembers([...blockedMembers, {
                  ...selectedMember,
                  blockedDate: 'Just now',
                  reason: 'Manual block by admin'
                }]);
              } else if (actionType === 'unblock') {
                setBlockedMembers(blockedMembers.filter(m => m.id !== selectedMember.id));
              }
              handleCloseConfirmDialog();
            }} 
            color={actionType === 'unblock' ? 'primary' : 'error'} 
            variant="contained"
          >
            {actionType === 'remove' ? 'Remove' : 
             actionType === 'block' ? 'Block' : 'Unblock'}
          </Button>
        </DialogActions>
      </Dialog>
    </motion.div>
  );
};

// Settings Tab Component
const SettingsTab = () => {
  const theme = useTheme();
  const [isPrivate, setIsPrivate] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  
  // Mock data for timeline
  const [timelineData, setTimelineData] = useState({
    id: '123',
    name: 'Community Timeline',
    description: 'A community timeline for sharing events and media related to our community.',
    memberCount: 42,
    createdDate: 'January 15, 2025',
    visibility: 'public',
    owner: {
      id: '1',
      name: 'John Doe'
    }
  });
  
  // Handle visibility change
  const handleVisibilityChange = (event) => {
    const newValue = event.target.checked;
    setIsPrivate(newValue);
    
    // Show warning when switching to private
    if (newValue) {
      setShowWarning(true);
    } else {
      setShowWarning(false);
    }
  };
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Timeline Settings */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <SettingsIcon sx={{ mr: 1, color: 'primary.main' }} />
        <Typography variant="h6" component="h2">
          Timeline Settings
        </Typography>
      </Box>
      
      {/* Timeline Info */}
      {timelineData && (
        <>
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0 }
            }}
            initial="hidden"
            animate="visible"
            transition={{ duration: 0.5 }}
          >
            <Box sx={{ mb: 4 }}>
              <Typography variant="subtitle1" gutterBottom>
                Timeline Description
              </Typography>
              
              <Box sx={{ mt: 2 }}>
                
                <TextField
                  fullWidth
                  label="Description"
                  variant="outlined"
                  multiline
                  rows={3}
                  value={timelineData.description || ''}
                  sx={{ mb: 3 }}
                />
                
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="body1">
                    Member Count: <strong>{timelineData.memberCount}</strong>
                  </Typography>
                  <Typography variant="body1">
                    Created: <strong>{timelineData.createdDate}</strong>
                  </Typography>
                </Box>
              </Box>
            </Box>
          </motion.div>
          
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0 }
            }}
            initial="hidden"
            animate="visible"
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Box sx={{ mb: 4 }}>
              <Typography variant="subtitle1" gutterBottom>
                Privacy Settings
              </Typography>
              
              <Box sx={{ mt: 2 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={isPrivate}
                      onChange={handleVisibilityChange}
                      color="primary"
                    />
                  }
                  label="Private Timeline"
                />
                
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {isPrivate ? 
                    "Only approved members can view and contribute to this timeline." : 
                    "Anyone can view this timeline, but only members can contribute."}
                </Typography>
                
                <AnimatePresence>
                  {showWarning && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Alert severity="warning" sx={{ mt: 2 }}>
                        Switching to private mode has a 10-day cooldown period before you can switch back.
                      </Alert>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Box>
            </Box>
          </motion.div>

          <motion.div
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0 }
            }}
            initial="hidden"
            animate="visible"
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
              <Button variant="contained" color="primary">
                Save Changes
              </Button>
            </Box>
          </motion.div>
        </>
      )}
    </motion.div>
  );
};

export default AdminPanel;

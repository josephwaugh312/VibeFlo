import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { Box, Typography, Avatar, Paper, TextField, Button, Divider, Container, IconButton, Grid, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { Edit as EditIcon, Save as SaveIcon, Cancel as CancelIcon, Camera as CameraIcon } from '@mui/icons-material';
import { AvatarSelector } from '../components/profile';

// Import Material UI icons that could be used as avatars
import PersonIcon from '@mui/icons-material/Person';
import EmojiEmotionsIcon from '@mui/icons-material/EmojiEmotions';
import FaceIcon from '@mui/icons-material/Face';
import Pets from '@mui/icons-material/Pets';
import MoodIcon from '@mui/icons-material/Mood';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew';
import HeadphonesIcon from '@mui/icons-material/Headphones';
import SportsEsportsIcon from '@mui/icons-material/SportsEsports';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import Diversity3Icon from '@mui/icons-material/Diversity3';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import { SvgIconProps } from '@mui/material/SvgIcon';

// Map of icon identifiers to icon components
const iconMap: { [key: string]: React.ComponentType<SvgIconProps> } = {
  'person': PersonIcon,
  'emoji': EmojiEmotionsIcon,
  'face': FaceIcon,
  'pets': Pets,
  'mood': MoodIcon,
  'play': PlayArrowIcon,
  'power': PowerSettingsNewIcon,
  'headphones': HeadphonesIcon,
  'sports': SportsEsportsIcon,
  'music': MusicNoteIcon,
  'diversity': Diversity3Icon,
  'fire': LocalFireDepartmentIcon,
};

// Custom icon component with proper typing
const DynamicIcon: React.FC<{ iconName: string }> = ({ iconName }) => {
  const IconComponent = iconMap[iconName] || PersonIcon;
  return <IconComponent sx={{ fontSize: 50 }} />;
};

const formatDate = (dateString?: string): string => {
  if (!dateString) return 'Unknown date';
  
  try {
    // Create a date object from the string
    const date = new Date(dateString);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      console.error('Invalid date string:', dateString);
      return 'Unknown date';
    }
    
    // Format: "January 15, 2023"
    return new Intl.DateTimeFormat('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }).format(date);
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Unknown date';
  }
};

const Profile: React.FC = () => {
  const { user, updateProfile, changePassword, deleteAccount, isLoading, refreshUserData, isAuthenticated } = useAuth();
  const [editMode, setEditMode] = useState(false);
  const [passwordEditMode, setPasswordEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [avatarSelectorOpen, setAvatarSelectorOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    bio: '',
    avatarUrl: '',
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Update form data when user data changes
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        username: user.username || '',
        email: user.email || '',
        bio: user.bio || '',
        avatarUrl: user.avatarUrl || '',
      });
    }
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handlePasswordInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordForm({
      ...passwordForm,
      [name]: value,
    });
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    setSaving(true);
    try {
      // Only update changed fields
      const updatedData: {[key: string]: string} = {};
      
      if (formData.name !== user.name) updatedData.name = formData.name;
      if (formData.username !== user.username) updatedData.username = formData.username;
      if (formData.email !== user.email) updatedData.email = formData.email;
      if (formData.bio !== user.bio) updatedData.bio = formData.bio;
      // Always include avatar URL if it's been changed
      if (formData.avatarUrl !== user.avatarUrl) {
        updatedData.avatarUrl = formData.avatarUrl;
        console.log('Profile: Avatar URL changed to:', formData.avatarUrl);
      }
      
      console.log('Data being sent to updateProfile:', updatedData);
      
      if (Object.keys(updatedData).length > 0) {
        // Store current avatar URL in localStorage to ensure it persists
        // even if the server response doesn't include it
        if (updatedData.avatarUrl) {
          try {
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
              const userData = JSON.parse(storedUser);
              userData.avatarUrl = updatedData.avatarUrl;
              localStorage.setItem('user', JSON.stringify(userData));
              console.log('Profile: Stored avatar URL in localStorage:', updatedData.avatarUrl);
            }
          } catch (e) {
            console.error('Profile: Error storing avatar URL in localStorage:', e);
          }
        }
        
        const updatedUser = await updateProfile(updatedData);
        console.log('Response from updateProfile:', updatedUser);
        
        // Double-check that avatar URL is preserved
        if (updatedData.avatarUrl && !updatedUser.avatarUrl) {
          console.log('Profile: Avatar URL missing in response, manually adding it');
          updatedUser.avatarUrl = updatedData.avatarUrl;
          
          // Update localStorage with the correct avatar URL
          try {
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
              const userData = JSON.parse(storedUser);
              userData.avatarUrl = updatedData.avatarUrl;
              localStorage.setItem('user', JSON.stringify(userData));
              console.log('Profile: Re-stored avatar URL in localStorage after update');
            }
          } catch (e) {
            console.error('Profile: Error re-storing avatar URL in localStorage:', e);
          }
        }
        
        // Explicitly update the form data with the response from the server
        setFormData({
          name: updatedUser.name || '',
          username: updatedUser.username || '',
          email: updatedUser.email || '',
          bio: updatedUser.bio || '',
          avatarUrl: updatedUser.avatarUrl || '',
        });
        toast.success('Profile updated successfully');
      }
      
      setEditMode(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile. Note: usernames can only contain letters, numbers, and underscores.');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    // Validate password inputs
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    // Check for password complexity requirements
    const hasUppercase = /[A-Z]/.test(passwordForm.newPassword);
    const hasLowercase = /[a-z]/.test(passwordForm.newPassword);
    const hasNumber = /[0-9]/.test(passwordForm.newPassword);

    if (!hasUppercase || !hasLowercase || !hasNumber) {
      toast.error('Password must include at least one uppercase letter, one lowercase letter, and one number');
      return;
    }

    setSaving(true);
    try {
      await changePassword(passwordForm.currentPassword, passwordForm.newPassword);
      setPasswordEditMode(false);
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error) {
      console.error('Error changing password:', error);
      // Toast error is already handled in the auth context
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = () => {
    setAvatarSelectorOpen(true);
  };

  const handleAvatarSelect = (avatarUrl: string) => {
    console.log('Selected avatar URL:', avatarUrl);
    
    // Always update local state for visual feedback
    setFormData({
      ...formData,
      avatarUrl
    });
    
    // Only save to server if in edit mode - will be saved with other profile changes
    if (!editMode) {
      return;
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      toast.error('Please enter your password to confirm account deletion');
      return;
    }

    setIsDeleting(true);
    try {
      await deleteAccount(deletePassword);
      // No need to reset state or close dialog as the user will be redirected after deletion
    } catch (error) {
      console.error('Error deleting account:', error);
      // Toast error is already handled in the auth context
      setIsDeleting(false);
    }
  };

  // Render the avatar display element as a memoized component
  const AvatarDisplay = React.useMemo(() => {
    return function AvatarDisplayComponent() {
      if (formData.avatarUrl) {
        if (formData.avatarUrl.startsWith('icon:')) {
          // It's an icon avatar
          const iconKey = formData.avatarUrl.replace('icon:', '');
          return (
            <Avatar
              sx={{ 
                width: 100, 
                height: 100,
                bgcolor: 'primary.main',
                color: 'white'
              }}
            >
              <DynamicIcon iconName={iconKey} />
            </Avatar>
          );
        } else if (formData.avatarUrl.startsWith('linear-gradient')) {
          // It's a gradient
          return (
            <Avatar
              sx={{ 
                width: 100, 
                height: 100,
                background: formData.avatarUrl,
                fontSize: '2rem'
              }}
            >
              {user!.name?.charAt(0) || user!.username?.charAt(0) || '?'}
            </Avatar>
          );
        } else {
          // It's a regular URL avatar
          return (
            <Avatar
              src={formData.avatarUrl}
              sx={{ 
                width: 100, 
                height: 100,
              }}
            />
          );
        }
      } else {
        // Default: Show initials
        return (
          <Avatar
            sx={{ 
              width: 100, 
              height: 100,
              bgcolor: 'secondary.main',
              fontSize: '2rem'
            }}
          >
            {user!.name?.charAt(0) || user!.username?.charAt(0) || '?'}
          </Avatar>
        );
      }
    };
  }, [user, formData.avatarUrl]);

  if (isLoading) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" my={4}>
          <Typography>Loading profile information...</Typography>
        </Box>
      </Container>
    );
  }

  if (!user) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" my={4}>
          <Typography>Please log in to view your profile</Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 4, color: 'white', textAlign: 'center' }}>
        My Profile
      </Typography>

      {/* Profile Overview Card */}
      <Paper elevation={3} sx={{ p: 4, mb: 4, bgcolor: 'rgba(30, 30, 30, 0.9)', color: 'white', borderRadius: 2 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid component="div" sx={{ gridColumn: { xs: 'span 12', sm: 'span 3' }, display: 'flex', justifyContent: { xs: 'center', sm: 'flex-start' } }}>
            <Box position="relative">
              <AvatarDisplay />
              <IconButton 
                size="small"
                sx={{ 
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  bgcolor: 'primary.main',
                  '&:hover': { bgcolor: 'primary.dark' },
                  color: 'white',
                  '&.Mui-disabled': {
                    bgcolor: 'rgba(255, 255, 255, 0.12)',
                  }
                }}
                onClick={handleAvatarUpload}
                disabled={!editMode}
                data-testid="camera-icon-button"
              >
                <CameraIcon fontSize="small" />
              </IconButton>
            </Box>
          </Grid>
          <Grid component="div" sx={{ gridColumn: 'span auto', textAlign: { xs: 'center', sm: 'left' }, mt: { xs: 2, sm: 0 } }}>
            <Typography variant="h5" gutterBottom>
              {user.name}
            </Typography>
            <Typography variant="body1" sx={{ color: 'gray.400' }}>
              @{user.username}
            </Typography>
            <Typography variant="body2" sx={{ mt: 1, color: 'gray.500' }}>
              Member since {user.created_at ? formatDate(user.created_at) : 'Unknown date'}
            </Typography>
          </Grid>
          <Grid component="div" sx={{ gridColumn: { xs: 'span 12', sm: 'span 3' }, mt: { xs: 3, sm: 0 }, display: 'flex', justifyContent: { xs: 'center', sm: 'flex-end' } }}>
            {!editMode ? (
              <Button
                startIcon={<EditIcon />}
                variant="outlined"
                onClick={() => setEditMode(true)}
                sx={{ 
                  color: 'white',
                  borderColor: 'white',
                  '&:hover': { borderColor: 'primary.main', color: 'primary.main' }
                }}
              >
                Edit Profile
              </Button>
            ) : (
              <Box display="flex" gap={1}>
                <Button
                  startIcon={<CancelIcon />}
                  variant="outlined"
                  onClick={() => setEditMode(false)}
                  sx={{ 
                    color: 'white',
                    borderColor: 'white',
                    '&:hover': { borderColor: 'error.main', color: 'error.main' }
                  }}
                >
                  Cancel
                </Button>
                <Button
                  startIcon={<SaveIcon />}
                  variant="contained"
                  onClick={handleSaveProfile}
                  disabled={saving}
                  sx={{ bgcolor: 'primary.main' }}
                >
                  Save
                </Button>
              </Box>
            )}
          </Grid>
        </Grid>
      </Paper>

      {/* Profile Information Section */}
      <Paper elevation={3} sx={{ p: 4, mb: 4, bgcolor: 'rgba(30, 30, 30, 0.9)', color: 'white', borderRadius: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">Profile Information</Typography>
        </Box>
        <Divider sx={{ mb: 3, bgcolor: 'rgba(255,255,255,0.1)' }} />

        <Grid container spacing={3}>
          <Grid component="div" sx={{ gridColumn: { xs: 'span 12', md: 'span 6' } }}>
            <TextField
              fullWidth
              label="Full Name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              disabled={!editMode}
              variant="outlined"
              margin="normal"
              InputProps={{
                sx: { 
                  color: 'white',
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  borderRadius: 1,
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                    borderWidth: 1,
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(255, 255, 255, 0.5)',
                    borderWidth: 1.5,
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'primary.main',
                    borderWidth: 2,
                  },
                }
              }}
              InputLabelProps={{
                sx: { 
                  color: 'rgba(255, 255, 255, 0.7)',
                  '&.Mui-focused': {
                    color: 'primary.main',
                  },
                },
                shrink: true,
              }}
            />
          </Grid>
          <Grid component="div" sx={{ gridColumn: { xs: 'span 12', md: 'span 6' } }}>
            <TextField
              fullWidth
              label="Username"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              disabled={!editMode}
              variant="outlined"
              margin="normal"
              helperText={editMode ? "Username can only contain letters, numbers, and underscores" : ""}
              InputProps={{
                sx: { 
                  color: 'white',
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  borderRadius: 1,
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                    borderWidth: 1,
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(255, 255, 255, 0.5)',
                    borderWidth: 1.5,
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'primary.main',
                    borderWidth: 2,
                  },
                }
              }}
              InputLabelProps={{
                sx: { 
                  color: 'rgba(255, 255, 255, 0.7)',
                  '&.Mui-focused': {
                    color: 'primary.main',
                  },
                },
                shrink: true,
              }}
              FormHelperTextProps={{
                sx: {
                  color: 'rgba(255, 255, 255, 0.5)',
                }
              }}
            />
          </Grid>
          <Grid component="div" sx={{ gridColumn: 'span 12' }}>
            <TextField
              fullWidth
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              disabled={!editMode}
              variant="outlined"
              margin="normal"
              InputProps={{
                sx: { 
                  color: 'white',
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  borderRadius: 1,
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                    borderWidth: 1,
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(255, 255, 255, 0.5)',
                    borderWidth: 1.5,
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'primary.main',
                    borderWidth: 2,
                  },
                }
              }}
              InputLabelProps={{
                sx: { 
                  color: 'rgba(255, 255, 255, 0.7)',
                  '&.Mui-focused': {
                    color: 'primary.main',
                  },
                },
                shrink: true,
              }}
            />
          </Grid>
          <Grid component="div" sx={{ gridColumn: 'span 12' }}>
            <TextField
              fullWidth
              label="Bio/Personal Motto"
              name="bio"
              value={formData.bio}
              onChange={handleInputChange}
              disabled={!editMode}
              variant="outlined"
              margin="normal"
              multiline
              rows={3}
              inputProps={{ maxLength: 150 }}
              placeholder="Tell us something about yourself or add your personal motto..."
              helperText={`${formData.bio?.length || 0}/150 characters`}
              InputProps={{
                sx: { 
                  color: 'white',
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  borderRadius: 1,
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                    borderWidth: 1,
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(255, 255, 255, 0.5)',
                    borderWidth: 1.5,
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'primary.main',
                    borderWidth: 2,
                  },
                }
              }}
              InputLabelProps={{
                sx: { 
                  color: 'rgba(255, 255, 255, 0.7)',
                  '&.Mui-focused': {
                    color: 'primary.main',
                  },
                },
                shrink: true,
              }}
              FormHelperTextProps={{
                sx: {
                  color: 'rgba(255, 255, 255, 0.5)',
                  textAlign: 'right',
                  mr: 1
                }
              }}
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Account Security Section */}
      <Paper elevation={3} sx={{ p: 4, mb: 4, bgcolor: 'rgba(30, 30, 30, 0.9)', color: 'white', borderRadius: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">Account Security</Typography>
          {!passwordEditMode ? (
            <Button
              startIcon={<EditIcon />}
              variant="outlined"
              onClick={() => setPasswordEditMode(true)}
              sx={{ 
                color: 'white',
                borderColor: 'white',
                '&:hover': { borderColor: 'primary.main', color: 'primary.main' }
              }}
            >
              Change Password
            </Button>
          ) : (
            <Box display="flex" gap={1}>
              <Button
                startIcon={<CancelIcon />}
                variant="outlined"
                onClick={() => {
                  setPasswordEditMode(false);
                  setPasswordForm({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: '',
                  });
                }}
                sx={{ 
                  color: 'white',
                  borderColor: 'white',
                  '&:hover': { borderColor: 'error.main', color: 'error.main' }
                }}
              >
                Cancel
              </Button>
              <Button
                startIcon={<SaveIcon />}
                variant="contained"
                onClick={handlePasswordChange}
                disabled={saving}
                sx={{ bgcolor: 'primary.main' }}
              >
                Update
              </Button>
            </Box>
          )}
        </Box>
        <Divider sx={{ mb: 3, bgcolor: 'rgba(255,255,255,0.1)' }} />

        {passwordEditMode ? (
          <Grid container spacing={3}>
            <Grid component="div" sx={{ gridColumn: 'span 12' }}>
              <TextField
                fullWidth
                label="Current Password"
                name="currentPassword"
                type="password"
                value={passwordForm.currentPassword}
                onChange={handlePasswordInputChange}
                variant="outlined"
                margin="normal"
                required
                InputProps={{
                  sx: { 
                    color: 'white',
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    borderRadius: 1,
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(255, 255, 255, 0.3)',
                      borderWidth: 1,
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(255, 255, 255, 0.5)',
                      borderWidth: 1.5,
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'primary.main',
                      borderWidth: 2,
                    },
                  }
                }}
                InputLabelProps={{
                  sx: { 
                    color: 'rgba(255, 255, 255, 0.7)',
                    '&.Mui-focused': {
                      color: 'primary.main',
                    },
                  },
                  shrink: true,
                }}
              />
            </Grid>
            <Grid component="div" sx={{ gridColumn: { xs: 'span 12', md: 'span 6' } }}>
              <TextField
                fullWidth
                label="New Password"
                name="newPassword"
                type="password"
                value={passwordForm.newPassword}
                onChange={handlePasswordInputChange}
                variant="outlined"
                margin="normal"
                required
                InputProps={{
                  sx: { 
                    color: 'white',
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    borderRadius: 1,
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(255, 255, 255, 0.3)',
                      borderWidth: 1,
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(255, 255, 255, 0.5)',
                      borderWidth: 1.5,
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'primary.main',
                      borderWidth: 2,
                    },
                  }
                }}
                InputLabelProps={{
                  sx: { 
                    color: 'rgba(255, 255, 255, 0.7)',
                    '&.Mui-focused': {
                      color: 'primary.main',
                    },
                  },
                  shrink: true,
                }}
              />
            </Grid>
            <Grid component="div" sx={{ gridColumn: { xs: 'span 12', md: 'span 6' } }}>
              <TextField
                fullWidth
                label="Confirm New Password"
                name="confirmPassword"
                type="password"
                value={passwordForm.confirmPassword}
                onChange={handlePasswordInputChange}
                variant="outlined"
                margin="normal"
                required
                InputProps={{
                  sx: { 
                    color: 'white',
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    borderRadius: 1,
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(255, 255, 255, 0.3)',
                      borderWidth: 1,
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(255, 255, 255, 0.5)',
                      borderWidth: 1.5,
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'primary.main',
                      borderWidth: 2,
                    },
                  }
                }}
                InputLabelProps={{
                  sx: { 
                    color: 'rgba(255, 255, 255, 0.7)',
                    '&.Mui-focused': {
                      color: 'primary.main',
                    },
                  },
                  shrink: true,
                }}
              />
            </Grid>
            <Grid component="div" sx={{ gridColumn: 'span 12' }}>
              <Typography variant="body2" sx={{ color: 'gray.500', mt: 1 }}>
                Password must be at least 6 characters long.
              </Typography>
            </Grid>
          </Grid>
        ) : (
          <Typography variant="body1">
            Secure your account by regularly updating your password. Your password should be at least 6 characters long and include a mix of letters, numbers, and special characters.
          </Typography>
        )}
      </Paper>

      {/* Account Management Section */}
      <Paper elevation={3} sx={{ p: 4, bgcolor: 'rgba(30, 30, 30, 0.9)', color: 'white', borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom align="center">Account Management</Typography>
        <Divider sx={{ mb: 4, bgcolor: 'rgba(255,255,255,0.1)' }} />
        
        <Grid container spacing={2} justifyContent="center">
          <Grid component="div" sx={{ gridColumn: 'span 12', maxWidth: 500 }}>
            <Box display="flex" flexDirection="column" alignItems="center" textAlign="center">
              <Button 
                variant="outlined" 
                color="error" 
                sx={{ 
                  mt: 2,
                  mb: 1,
                  maxWidth: 400,
                  width: "100%",
                  color: 'error.main',
                  borderColor: 'error.main',
                  py: 1.5,
                  '&:hover': {
                    backgroundColor: 'rgba(211, 47, 47, 0.1)',
                    borderColor: 'error.dark',
                  }
                }}
                onClick={() => setDeleteDialogOpen(true)}
              >
                Delete Account
              </Button>
              <Typography variant="caption" sx={{ display: "block", mt: 1, color: 'gray.500', maxWidth: 450, mb: 2 }}>
                Warning: Deleting your account will permanently remove all your data including stats, themes, and settings.
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Avatar Selector Dialog */}
      <AvatarSelector 
        open={avatarSelectorOpen}
        onClose={() => setAvatarSelectorOpen(false)}
        onSelect={handleAvatarSelect}
        currentAvatar={formData.avatarUrl}
      />

      {/* Delete Account Confirmation Dialog */}
      <Dialog 
        open={deleteDialogOpen} 
        onClose={() => !isDeleting && setDeleteDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { bgcolor: '#333', borderRadius: 2 }
        }}
      >
        <DialogTitle sx={{ bgcolor: '#333', color: 'white', borderBottom: '1px solid rgba(255,255,255,0.1)', pb: 2 }}>
          Confirm Account Deletion
        </DialogTitle>
        <DialogContent sx={{ bgcolor: '#333', color: 'white', pt: 3 }}>
          <Typography variant="body1" paragraph>
            Are you sure you want to permanently delete your account? This action cannot be undone.
          </Typography>
          <Typography variant="body2" paragraph sx={{ color: 'error.light', bgcolor: 'rgba(211, 47, 47, 0.1)', p: 2, borderRadius: 1 }}>
            All your data including playlists, profile information, and settings will be permanently removed.
          </Typography>
          <TextField
            fullWidth
            label="Enter your password to confirm"
            type="password"
            value={deletePassword}
            onChange={(e) => setDeletePassword(e.target.value)}
            margin="dense"
            required
            InputProps={{
              sx: { 
                color: 'white',
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                borderRadius: 1,
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(255, 255, 255, 0.3)',
                  borderWidth: 1,
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(255, 255, 255, 0.5)',
                  borderWidth: 1.5,
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'error.main',
                  borderWidth: 2,
                },
              }
            }}
            InputLabelProps={{
              sx: { 
                color: 'rgba(255, 255, 255, 0.7)',
                '&.Mui-focused': {
                  color: 'error.main',
                },
              },
              shrink: true,
            }}
          />
        </DialogContent>
        <DialogActions sx={{ bgcolor: '#333', color: 'white', px: 3, pb: 3, pt: 1, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <Button 
            onClick={() => {
              setDeleteDialogOpen(false);
              setDeletePassword('');
            }}
            disabled={isDeleting}
            sx={{ 
              color: 'white',
              '&:hover': {
                bgcolor: 'rgba(255, 255, 255, 0.08)',
              }
            }}
          >
            Cancel
          </Button>
          <Button 
            variant="contained" 
            color="error" 
            onClick={handleDeleteAccount}
            disabled={isDeleting}
            sx={{
              px: 3,
              '&:hover': {
                bgcolor: 'error.dark',
              }
            }}
          >
            {isDeleting ? 'Deleting...' : 'Delete My Account'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Profile; 
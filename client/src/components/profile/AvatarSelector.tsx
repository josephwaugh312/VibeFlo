import React, { useState } from 'react';
import { Box, Dialog, DialogContent, Grid, Avatar, IconButton, Typography, Button, DialogActions, Tab, Tabs } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
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

// Define avatar colors
const avatarColors = [
  '#1976d2', // blue
  '#388e3c', // green
  '#f57c00', // orange
  '#d32f2f', // red
  '#7b1fa2', // purple
  '#0097a7', // teal
  '#fbc02d', // yellow
  '#5d4037', // brown
  '#455a64', // blue-grey
  '#c2185b', // pink
  '#00796b', // dark teal
  '#689f38', // light green
];

// Define avatar data for colors
const colorAvatars = avatarColors.map((color, index) => ({
  id: `color-${index}`,
  type: 'color',
  value: color,
  label: `Color ${index + 1}`
}));

// Define icon avatars
const iconAvatars = [
  { id: 'avatar-person', type: 'icon', value: 'person', label: 'Person', icon: <PersonIcon /> },
  { id: 'avatar-emoji', type: 'icon', value: 'emoji', label: 'Emoji', icon: <EmojiEmotionsIcon /> },
  { id: 'avatar-face', type: 'icon', value: 'face', label: 'Face', icon: <FaceIcon /> },
  { id: 'avatar-pets', type: 'icon', value: 'pets', label: 'Pets', icon: <Pets /> },
  { id: 'avatar-mood', type: 'icon', value: 'mood', label: 'Mood', icon: <MoodIcon /> },
  { id: 'avatar-play', type: 'icon', value: 'play', label: 'Play', icon: <PlayArrowIcon /> },
  { id: 'avatar-power', type: 'icon', value: 'power', label: 'Power', icon: <PowerSettingsNewIcon /> },
  { id: 'avatar-headphones', type: 'icon', value: 'headphones', label: 'Headphones', icon: <HeadphonesIcon /> },
  { id: 'avatar-sports', type: 'icon', value: 'sports', label: 'Games', icon: <SportsEsportsIcon /> },
  { id: 'avatar-music', type: 'icon', value: 'music', label: 'Music', icon: <MusicNoteIcon /> },
  { id: 'avatar-diversity', type: 'icon', value: 'diversity', label: 'Diversity', icon: <Diversity3Icon /> },
  { id: 'avatar-fire', type: 'icon', value: 'fire', label: 'Fire', icon: <LocalFireDepartmentIcon /> },
];

// Define gradient avatars
const gradientAvatars = [
  { id: 'gradient-blue', type: 'gradient', value: 'linear-gradient(135deg, #1976d2, #64b5f6)', label: 'Blue Gradient' },
  { id: 'gradient-green', type: 'gradient', value: 'linear-gradient(135deg, #388e3c, #81c784)', label: 'Green Gradient' },
  { id: 'gradient-orange', type: 'gradient', value: 'linear-gradient(135deg, #f57c00, #ffb74d)', label: 'Orange Gradient' },
  { id: 'gradient-red', type: 'gradient', value: 'linear-gradient(135deg, #d32f2f, #e57373)', label: 'Red Gradient' },
  { id: 'gradient-purple', type: 'gradient', value: 'linear-gradient(135deg, #7b1fa2, #ba68c8)', label: 'Purple Gradient' },
  { id: 'gradient-teal', type: 'gradient', value: 'linear-gradient(135deg, #0097a7, #4dd0e1)', label: 'Teal Gradient' },
  { id: 'gradient-yellow', type: 'gradient', value: 'linear-gradient(135deg, #fbc02d, #fff176)', label: 'Yellow Gradient' },
  { id: 'gradient-brown', type: 'gradient', value: 'linear-gradient(135deg, #5d4037, #a1887f)', label: 'Brown Gradient' },
  { id: 'gradient-blue-grey', type: 'gradient', value: 'linear-gradient(135deg, #455a64, #90a4ae)', label: 'Blue Grey Gradient' },
  { id: 'gradient-pink', type: 'gradient', value: 'linear-gradient(135deg, #c2185b, #f06292)', label: 'Pink Gradient' },
  { id: 'gradient-cyan', type: 'gradient', value: 'linear-gradient(135deg, #00796b, #4db6ac)', label: 'Cyan Gradient' },
  { id: 'gradient-lime', type: 'gradient', value: 'linear-gradient(135deg, #689f38, #aed581)', label: 'Lime Gradient' },
];

// All avatar categories
const avatarCategories = [
  { id: 'icons', label: 'Icons', avatars: iconAvatars },
  { id: 'colors', label: 'Colors', avatars: colorAvatars },
  { id: 'gradients', label: 'Gradients', avatars: gradientAvatars },
];

interface AvatarSelectorProps {
  open: boolean;
  onClose: () => void;
  onSelect: (avatarUrl: string) => void;
  currentAvatar?: string;
}

const AvatarSelector: React.FC<AvatarSelectorProps> = ({ 
  open, 
  onClose, 
  onSelect,
  currentAvatar
}) => {
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(currentAvatar || null);
  const [tabIndex, setTabIndex] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabIndex(newValue);
  };

  const handleSelectAvatar = (avatar: any) => {
    let value;
    
    if (avatar.type === 'color') {
      value = avatar.value; // Just the color code
    } else if (avatar.type === 'icon') {
      value = `icon:${avatar.value}`; // Prefix with icon:
    } else if (avatar.type === 'gradient') {
      value = avatar.value; // The gradient string
    }
    
    setSelectedAvatar(value);
  };

  const handleConfirm = () => {
    if (selectedAvatar) {
      onSelect(selectedAvatar);
      onClose();
    }
  };
  
  // Find which avatar is selected and render the appropriate display
  const getAvatarDisplay = (avatar: any) => {
    if (avatar.type === 'color') {
      // It's a color
      return (
        <Avatar 
          sx={{ 
            width: 64, 
            height: 64,
            bgcolor: avatar.value,
            fontSize: '1.5rem',
            fontWeight: 'bold'
          }}
        >
          {avatar.label.charAt(0)}
        </Avatar>
      );
    } else if (avatar.type === 'icon') {
      // It's an icon
      return (
        <Avatar 
          sx={{ 
            width: 64, 
            height: 64,
            bgcolor: '#333',
            color: 'white',
            fontSize: '1.5rem'
          }}
        >
          {avatar.icon}
        </Avatar>
      );
    } else if (avatar.type === 'gradient') {
      // It's a gradient
      return (
        <Avatar 
          sx={{ 
            width: 64, 
            height: 64,
            background: avatar.value,
            fontSize: '1.5rem',
            fontWeight: 'bold'
          }}
        >
          {avatar.label.charAt(0)}
        </Avatar>
      );
    }
  };

  const isSelected = (avatar: any) => {
    if (!selectedAvatar) return false;
    
    if (avatar.type === 'color' || avatar.type === 'gradient') {
      return selectedAvatar === avatar.value;
    } else if (avatar.type === 'icon') {
      return selectedAvatar === `icon:${avatar.value}`;
    }
    
    return false;
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      PaperProps={{
        sx: {
          bgcolor: 'rgba(30, 30, 30, 0.95)',
          color: 'white',
          borderRadius: 2,
        }
      }}
    >
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        p: 2,
        pb: 1
      }}>
        <Typography variant="h6" component="div">Choose an Avatar</Typography>
        <IconButton onClick={onClose} size="small" sx={{ color: 'white' }}>
          <CloseIcon />
        </IconButton>
      </Box>
      
      <Tabs 
        value={tabIndex} 
        onChange={handleTabChange}
        centered
        sx={{ 
          borderBottom: 1, 
          borderColor: 'divider',
          '& .MuiTab-root': { 
            color: 'rgba(255, 255, 255, 0.7)',
            '&.Mui-selected': { 
              color: 'primary.main',
            }
          }
        }}
      >
        {avatarCategories.map((category, index) => (
          <Tab key={category.id} label={category.label} />
        ))}
      </Tabs>
      
      <DialogContent>
        <Grid container spacing={2}>
          {avatarCategories[tabIndex].avatars.map((avatar) => (
            <Grid component="div" sx={{ gridColumn: 'span 3' }} key={avatar.id}>
              <Box 
                data-testid="avatar-option"
                onClick={() => handleSelectAvatar(avatar)}
                sx={{ 
                  display: 'flex',
                  justifyContent: 'center',
                  p: 1,
                  cursor: 'pointer',
                  border: isSelected(avatar) ? '2px solid' : '2px solid transparent',
                  borderColor: 'primary.main',
                  borderRadius: 2,
                  transition: 'all 0.2s',
                  '&:hover': {
                    bgcolor: 'rgba(255, 255, 255, 0.1)',
                  }
                }}
              >
                {getAvatarDisplay(avatar)}
              </Box>
            </Grid>
          ))}
        </Grid>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button 
          onClick={onClose}
          variant="outlined"
          sx={{
            color: 'white',
            borderColor: 'rgba(255, 255, 255, 0.5)',
            '&:hover': {
              borderColor: 'white',
              bgcolor: 'rgba(255, 255, 255, 0.1)',
            }
          }}
        >
          Cancel
        </Button>
        <Button 
          onClick={handleConfirm}
          variant="contained"
          disabled={!selectedAvatar}
          sx={{
            bgcolor: 'primary.main',
            fontWeight: 'bold',
            fontSize: '1rem',
            px: 3,
            '&:hover': {
              bgcolor: 'primary.dark',
            },
            '&.Mui-disabled': {
              bgcolor: 'rgba(255, 255, 255, 0.12)',
              color: 'rgba(255, 255, 255, 0.3)',
            }
          }}
        >
          Apply Avatar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AvatarSelector; 
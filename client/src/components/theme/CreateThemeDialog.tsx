import React, { useState, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  FormControlLabel,
  Switch,
  CircularProgress,
  Divider,
  Alert
} from '@mui/material';
import { Add, CloudUpload, InsertLink } from '@mui/icons-material';
import { useTheme } from '../../context/ThemeContext';
import { toast } from 'react-hot-toast';

interface CreateThemeDialogProps {
  open: boolean;
  onClose: () => void;
}

const MAX_FILE_SIZE = 1024 * 1024; // 1MB in bytes

const CreateThemeDialog: React.FC<CreateThemeDialogProps> = ({ 
  open, 
  onClose
}) => {
  const { createCustomTheme } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isPublic, setIsPublic] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadMethod, setUploadMethod] = useState<'url' | 'file'>('url');
  const [fileError, setFileError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [errors, setErrors] = useState<{
    name?: string;
    imageUrl?: string;
    imageFile?: string;
  }>({});
  
  const resetForm = () => {
    setName('');
    setDescription('');
    setImageUrl('');
    setImageFile(null);
    setPreviewUrl(null);
    setIsPublic(false);
    setPrompt('');
    setErrors({});
    setFileError(null);
    setUploadMethod('url');
  };
  
  const handleClose = () => {
    resetForm();
    onClose();
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    
    if (!e.target.files || e.target.files.length === 0) {
      setImageFile(null);
      setPreviewUrl(null);
      return;
    }
    
    const file = e.target.files[0];
    
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      setFileError(`File size exceeds 1MB limit (${(file.size / (1024 * 1024)).toFixed(2)}MB)`);
      setImageFile(null);
      setPreviewUrl(null);
      return;
    }
    
    setImageFile(file);
    
    // Create a preview URL for the image
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };
  
  const validateForm = () => {
    const newErrors: {
      name?: string;
      imageUrl?: string;
      imageFile?: string;
    } = {};
    
    if (!name.trim()) {
      newErrors.name = 'Theme name is required';
    }
    
    if (uploadMethod === 'url' && !imageUrl.trim()) {
      newErrors.imageUrl = 'Image URL is required';
    }
    
    if (uploadMethod === 'file' && !imageFile) {
      newErrors.imageFile = 'Image file is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      // If using file upload, convert to base64 for storage
      let finalImageUrl = imageUrl;
      
      if (uploadMethod === 'file' && imageFile && previewUrl) {
        finalImageUrl = previewUrl;
      }
      
      await createCustomTheme({
        name: name.trim(),
        description: description.trim() || undefined,
        image_url: finalImageUrl.trim(),
        is_public: isPublic,
        prompt: prompt.trim() || undefined
      });
      
      toast.success('Custom theme created successfully!');
      handleClose();
    } catch (error) {
      console.error('Error creating theme:', error);
      toast.error('Failed to create custom theme');
    } finally {
      setIsSubmitting(false);
    }
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '12px',
          background: 'linear-gradient(135deg, rgba(40, 40, 50, 0.95) 0%, rgba(22, 22, 28, 0.98) 100%)',
          boxShadow: '0 12px 30px rgba(0, 0, 0, 0.5)',
          color: 'white',
          overflow: 'hidden'
        }
      }}
    >
      <DialogTitle 
        sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1.5,
          background: 'linear-gradient(90deg, rgba(103, 58, 183, 0.2) 0%, rgba(103, 58, 183, 0) 100%)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          p: 2.5
        }}
      >
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            backgroundColor: 'rgba(103, 58, 183, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
          }}
        >
          <Add color="inherit" />
        </Box>
        <Typography variant="subtitle1" sx={{ fontWeight: 500, fontSize: '1.25rem' }}>
          Create New Theme
        </Typography>
      </DialogTitle>
      
      <DialogContent sx={{ px: 3, pt: 3, pb: 1 }}>
        <Typography 
          variant="body2" 
          color="rgba(255, 255, 255, 0.7)" 
          sx={{ mb: 3 }}
        >
          Create your own custom background theme. You can use an image URL from the web or upload an image from your device (max 1MB).
        </Typography>
        
        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            label="Theme Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter theme name"
            margin="normal"
            error={!!errors.name}
            helperText={errors.name}
            required
            disabled={isSubmitting}
            variant="outlined"
            sx={{
              '& .MuiOutlinedInput-root': {
                color: 'white',
                '& fieldset': {
                  borderColor: 'rgba(255, 255, 255, 0.2)',
                },
                '&:hover fieldset': {
                  borderColor: 'rgba(255, 255, 255, 0.3)',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#673ab7',
                },
              },
              '& .MuiInputLabel-root': {
                color: 'rgba(255, 255, 255, 0.7)',
              },
              '& .MuiFormHelperText-root': {
                color: theme => theme.palette.error.main,
              }
            }}
          />
          
          <TextField
            fullWidth
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter theme description"
            margin="normal"
            multiline
            rows={2}
            disabled={isSubmitting}
            variant="outlined"
            sx={{
              '& .MuiOutlinedInput-root': {
                color: 'white',
                '& fieldset': {
                  borderColor: 'rgba(255, 255, 255, 0.2)',
                },
                '&:hover fieldset': {
                  borderColor: 'rgba(255, 255, 255, 0.3)',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#673ab7',
                },
              },
              '& .MuiInputLabel-root': {
                color: 'rgba(255, 255, 255, 0.7)',
              }
            }}
          />
          
          <Box sx={{ mt: 3, mb: 1 }}>
            <Typography 
              variant="subtitle2" 
              gutterBottom
              sx={{ color: 'rgba(255, 255, 255, 0.9)' }}
            >
              Image Source
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <Button 
                fullWidth 
                variant={uploadMethod === 'url' ? 'contained' : 'outlined'}
                onClick={() => setUploadMethod('url')}
                startIcon={<InsertLink />}
                disabled={isSubmitting}
                sx={{
                  py: 1.2,
                  backgroundColor: uploadMethod === 'url' ? 'rgba(103, 58, 183, 0.8)' : 'transparent',
                  borderColor: 'rgba(103, 58, 183, 0.5)',
                  '&:hover': {
                    backgroundColor: uploadMethod === 'url' ? 'rgba(103, 58, 183, 0.9)' : 'rgba(103, 58, 183, 0.1)',
                    borderColor: uploadMethod === 'url' ? undefined : 'rgba(103, 58, 183, 0.7)'
                  }
                }}
              >
                Use Image URL
              </Button>
              
              <Button 
                fullWidth 
                variant={uploadMethod === 'file' ? 'contained' : 'outlined'}
                onClick={() => setUploadMethod('file')}
                startIcon={<CloudUpload />}
                disabled={isSubmitting}
                sx={{
                  py: 1.2,
                  backgroundColor: uploadMethod === 'file' ? 'rgba(103, 58, 183, 0.8)' : 'transparent',
                  borderColor: 'rgba(103, 58, 183, 0.5)',
                  '&:hover': {
                    backgroundColor: uploadMethod === 'file' ? 'rgba(103, 58, 183, 0.9)' : 'rgba(103, 58, 183, 0.1)',
                    borderColor: uploadMethod === 'file' ? undefined : 'rgba(103, 58, 183, 0.7)'
                  }
                }}
              >
                Upload Image
              </Button>
            </Box>
            
            <Divider sx={{ mb: 2, borderColor: 'rgba(255, 255, 255, 0.1)' }} />
          </Box>
          
          {uploadMethod === 'url' ? (
            <TextField
              fullWidth
              label="Image URL"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="Enter image URL"
              margin="normal"
              error={!!errors.imageUrl}
              helperText={errors.imageUrl}
              required
              disabled={isSubmitting}
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  color: 'white',
                  '& fieldset': {
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                  },
                  '&:hover fieldset': {
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#673ab7',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: 'rgba(255, 255, 255, 0.7)',
                },
                '& .MuiFormHelperText-root': {
                  color: theme => theme.palette.error.main,
                }
              }}
            />
          ) : (
            <Box sx={{ mb: 2 }}>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                style={{ display: 'none' }}
                disabled={isSubmitting}
              />
              
              <Button
                variant="outlined"
                color="primary"
                onClick={triggerFileInput}
                startIcon={<CloudUpload />}
                disabled={isSubmitting}
                fullWidth
                sx={{ 
                  py: 1.5,
                  borderColor: 'rgba(103, 58, 183, 0.5)',
                  color: 'white',
                  '&:hover': {
                    borderColor: 'rgba(103, 58, 183, 0.8)',
                    backgroundColor: 'rgba(103, 58, 183, 0.1)'
                  }
                }}
              >
                {imageFile ? 'Change Image' : 'Select Image (Max 1MB)'}
              </Button>
              
              {fileError && (
                <Alert 
                  severity="error" 
                  sx={{ 
                    mt: 1,
                    backgroundColor: 'rgba(244, 67, 54, 0.1)',
                    color: '#f44336',
                    '& .MuiAlert-icon': {
                      color: '#f44336'
                    }
                  }}
                >
                  {fileError}
                </Alert>
              )}
              
              {errors.imageFile && (
                <Typography color="error" variant="caption" sx={{ display: 'block', mt: 1, ml: 1 }}>
                  {errors.imageFile}
                </Typography>
              )}
              
              {previewUrl && (
                <Box 
                  sx={{ 
                    mt: 2, 
                    height: 150, 
                    backgroundImage: `url(${previewUrl})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    borderRadius: 1,
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                  }} 
                />
              )}
            </Box>
          )}
          
          <TextField
            fullWidth
            label="Prompt (optional)"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="The prompt used to generate this image"
            margin="normal"
            multiline
            rows={2}
            disabled={isSubmitting}
            variant="outlined"
            sx={{
              '& .MuiOutlinedInput-root': {
                color: 'white',
                '& fieldset': {
                  borderColor: 'rgba(255, 255, 255, 0.2)',
                },
                '&:hover fieldset': {
                  borderColor: 'rgba(255, 255, 255, 0.3)',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#673ab7',
                },
              },
              '& .MuiInputLabel-root': {
                color: 'rgba(255, 255, 255, 0.7)',
              }
            }}
          />
          
          <FormControlLabel
            control={
              <Switch 
                checked={isPublic} 
                onChange={(e) => setIsPublic(e.target.checked)} 
                disabled={isSubmitting}
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': {
                    color: '#673ab7',
                    '&:hover': {
                      backgroundColor: 'rgba(103, 58, 183, 0.08)',
                    },
                  },
                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                    backgroundColor: 'rgba(103, 58, 183, 0.5)',
                  },
                }}
              />
            }
            label={
              <Typography 
                variant="body2" 
                sx={{ color: 'rgba(255, 255, 255, 0.9)' }}
              >
                Share with the community
              </Typography>
            }
            sx={{ mt: 2 }}
          />
        </Box>
      </DialogContent>
      
      <DialogActions 
        sx={{ 
          px: 3, 
          py: 2.5,
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          background: 'rgba(0, 0, 0, 0.2)'
        }}
      >
        <Button 
          onClick={handleClose} 
          color="inherit"
          disabled={isSubmitting}
          sx={{ 
            color: 'rgba(255, 255, 255, 0.7)',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.05)'
            }
          }}
        >
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          color="primary" 
          disabled={isSubmitting || (uploadMethod === 'file' && !!fileError)}
          startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : null}
          sx={{
            backgroundColor: 'rgba(103, 58, 183, 0.8)',
            '&:hover': {
              backgroundColor: 'rgba(103, 58, 183, 0.9)'
            },
            '&.Mui-disabled': {
              backgroundColor: 'rgba(103, 58, 183, 0.3)',
              color: 'rgba(255, 255, 255, 0.4)'
            }
          }}
        >
          {isSubmitting ? 'Creating...' : 'Create Theme'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateThemeDialog; 
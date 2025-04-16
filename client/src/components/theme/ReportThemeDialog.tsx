import React, { useState } from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  TextField,
  Typography,
  Alert,
  Box,
  CircularProgress
} from '@mui/material';
import { ReportProblem } from '@mui/icons-material';
import apiService from '../../services/api';
import { toast } from 'react-hot-toast';

interface ReportThemeDialogProps {
  open: boolean;
  onClose: () => void;
  themeId: number;
  themeName: string;
}

const ReportThemeDialog: React.FC<ReportThemeDialogProps> = ({
  open,
  onClose,
  themeId,
  themeName
}) => {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleSubmit = async () => {
    if (!reason.trim()) {
      setError('Please provide a reason for reporting this theme');
      return;
    }
    
    try {
      setIsSubmitting(true);
      setError(null);
      
      await apiService.api.post(`/moderation/themes/${themeId}/report`, { reason });
      
      toast.success('Thank you for your report. Our team will review this theme.');
      setReason('');
      onClose();
    } catch (err: any) {
      console.error('Error reporting theme:', err);
      setError(err.response?.data?.message || 'Failed to submit report. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleCancel = () => {
    setReason('');
    setError(null);
    onClose();
  };
  
  return (
    <Dialog 
      open={open} 
      onClose={handleCancel}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <ReportProblem color="error" />
        Report Inappropriate Theme
      </DialogTitle>
      
      <DialogContent>
        <Typography variant="body1" gutterBottom>
          You are reporting <strong>{themeName}</strong> as inappropriate or violating community guidelines.
        </Typography>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Our moderation team will review your report and take appropriate action if necessary.
          Please provide specific details about why you believe this theme violates our guidelines.
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        <TextField
          fullWidth
          multiline
          rows={4}
          label="Reason for Report"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Please explain why you believe this theme is inappropriate..."
          required
          disabled={isSubmitting}
          error={!!error && !reason.trim()}
          helperText={(!reason.trim() && !!error) ? "This field is required" : ""}
          sx={{ mt: 1 }}
        />
        
        <Box mt={2}>
          <Typography variant="caption" color="text.secondary">
            Reports are anonymous to theme creators, but our moderation team can see your account details.
            False or malicious reports may result in account restrictions.
          </Typography>
        </Box>
      </DialogContent>
      
      <DialogActions>
        <Button 
          onClick={handleCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit}
          color="error"
          variant="contained"
          disabled={isSubmitting || !reason.trim()}
          startIcon={isSubmitting ? <CircularProgress size={16} color="inherit" /> : undefined}
        >
          {isSubmitting ? 'Submitting...' : 'Submit Report'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ReportThemeDialog; 
import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  CircularProgress,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Box,
  Typography
} from '@mui/material';
import { toast } from 'react-toastify';
import axios from 'axios';

interface ReportThemeDialogProps {
  open: boolean;
  onClose: () => void;
  themeId: string;
  themeName: string;
}

const REPORT_REASONS = [
  "Inappropriate content",
  "Copyright violation",
  "Offensive material",
  "Low quality",
  "Other"
];

const ReportThemeDialog: React.FC<ReportThemeDialogProps> = ({
  open,
  onClose,
  themeId,
  themeName
}) => {
  const [reason, setReason] = useState(REPORT_REASONS[0]);
  const [details, setDetails] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!themeId) {
      toast.error("Missing theme information");
      return;
    }

    try {
      setLoading(true);
      
      // Get server URL from environment
      const serverUrl = process.env.REACT_APP_SERVER_URL || 'http://localhost:5001';
      
      // Get auth token for authentication
      const token = localStorage.getItem('token');
      
      await axios.post(`${serverUrl}/api/themes/report`, {
        theme_id: themeId,
        reason,
        details: details.trim()
      }, {
        headers: {
          Authorization: token ? `Bearer ${token}` : undefined
        }
      });
      
      toast.success("Report submitted successfully");
      handleClose();
    } catch (error) {
      console.error("Error submitting report:", error);
      toast.error("Failed to submit report. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setReason(REPORT_REASONS[0]);
    setDetails('');
    onClose();
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle>Report Theme</DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 2, mt: 1 }}>
          <Typography variant="body2" gutterBottom>
            You are reporting: <strong>{themeName}</strong>
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Our moderation team will review this theme based on your report.
          </Typography>
        </Box>

        <FormControl component="fieldset" sx={{ mb: 2, width: '100%' }}>
          <FormLabel component="legend">Reason for reporting</FormLabel>
          <RadioGroup
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          >
            {REPORT_REASONS.map((reportReason) => (
              <FormControlLabel
                key={reportReason}
                value={reportReason}
                control={<Radio />}
                label={reportReason}
              />
            ))}
          </RadioGroup>
        </FormControl>

        <TextField
          label="Additional details"
          multiline
          rows={4}
          fullWidth
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          placeholder="Please provide any additional information about this report"
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} /> : "Submit Report"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ReportThemeDialog; 
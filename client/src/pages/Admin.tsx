import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Card, 
  CardContent, 
  CardMedia, 
  Button, 
  Chip, 
  Grid, 
  Tabs, 
  Tab, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  TextField,
  CircularProgress,
  Alert,
  Snackbar
} from '@mui/material';
import { CheckCircle, Cancel, Flag, VisibilityOff } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import apiService from '../services/api';

interface Theme {
  id: number;
  name: string;
  description: string;
  image_url: string;
  user_id: number;
  username: string;
  user_name: string;
  created_at: string;
  moderation_status: string;
  reported_count?: number;
  reports?: {
    id: number;
    reason: string;
    created_at: string;
    user_id: number;
    reporter_username: string;
  }[];
}

const Admin: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const [tabIndex, setTabIndex] = useState(0);
  const [pendingThemes, setPendingThemes] = useState<Theme[]>([]);
  const [reportedThemes, setReportedThemes] = useState<Theme[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [selectedThemeId, setSelectedThemeId] = useState<number | null>(null);
  const [reportsDialogOpen, setReportsDialogOpen] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState<Theme | null>(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  // Redirect non-admin users
  useEffect(() => {
    if (!isLoading && isAuthenticated && user && !user.is_admin) {
      navigate('/dashboard');
    }
  }, [isLoading, isAuthenticated, user, navigate]);

  // Fetch themes needing moderation
  useEffect(() => {
    const fetchThemes = async () => {
      try {
        setLoading(true);
        setError(null);

        if (tabIndex === 0) {
          const response = await apiService.api.get('/api/moderation/admin/themes/pending');
          setPendingThemes(response.data);
        } else {
          const response = await apiService.api.get('/api/moderation/admin/themes/reported');
          setReportedThemes(response.data);
        }
      } catch (err: any) {
        console.error('Error fetching themes for moderation:', err);
        setError(err.response?.data?.message || 'Error loading themes for moderation');
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated && user?.is_admin) {
      fetchThemes();
    }
  }, [tabIndex, isAuthenticated, user]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabIndex(newValue);
  };

  const handleApproveTheme = async (themeId: number) => {
    try {
      await apiService.api.post(`/moderation/admin/themes/${themeId}/approve`);
      
      // Remove the theme from the list
      setPendingThemes(themes => themes.filter(t => t.id !== themeId));
      
      // Show success message
      setSnackbar({
        open: true,
        message: 'Theme approved successfully',
        severity: 'success'
      });
    } catch (err: any) {
      console.error('Error approving theme:', err);
      setSnackbar({
        open: true,
        message: err.response?.data?.message || 'Error approving theme',
        severity: 'error'
      });
    }
  };

  const openRejectDialog = (themeId: number) => {
    setSelectedThemeId(themeId);
    setRejectReason('');
    setRejectDialogOpen(true);
  };

  const handleRejectTheme = async () => {
    if (!selectedThemeId) return;
    
    try {
      await apiService.api.post(`/moderation/admin/themes/${selectedThemeId}/reject`, {
        reason: rejectReason
      });
      
      // Remove the theme from the list
      setPendingThemes(themes => themes.filter(t => t.id !== selectedThemeId));
      
      // Close dialog
      setRejectDialogOpen(false);
      
      // Show success message
      setSnackbar({
        open: true,
        message: 'Theme rejected successfully',
        severity: 'success'
      });
    } catch (err: any) {
      console.error('Error rejecting theme:', err);
      setSnackbar({
        open: true,
        message: err.response?.data?.message || 'Error rejecting theme',
        severity: 'error'
      });
    }
  };

  const openReportsDialog = (theme: Theme) => {
    setSelectedTheme(theme);
    setReportsDialogOpen(true);
  };

  if (isLoading) {
    return (
      <Container>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="70vh">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (!isAuthenticated || !user?.is_admin) {
    return (
      <Container>
        <Box mt={4}>
          <Alert severity="error">
            You do not have permission to access this page. This area is restricted to administrators.
          </Alert>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Typography variant="h4" component="h1" gutterBottom sx={{ mt: 4, mb: 2 }}>
        Theme Moderation
      </Typography>

      <Tabs 
        value={tabIndex} 
        onChange={handleTabChange} 
        sx={{ mb: 4 }}
        variant="fullWidth"
      >
        <Tab label={`Pending Themes (${pendingThemes.length})`} />
        <Tab label={`Reported Themes (${reportedThemes.length})`} />
      </Tabs>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress />
        </Box>
      ) : (
        <Box>
          {tabIndex === 0 && (
            <>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Themes Pending Approval
              </Typography>
              {pendingThemes.length === 0 ? (
                <Alert severity="info">
                  There are no themes pending approval.
                </Alert>
              ) : (
                <Grid container spacing={3}>
                  {pendingThemes.map(theme => (
                    <Grid key={theme.id} component="div" sx={{ gridColumn: { xs: 'span 12', md: 'span 6' } }}>
                      <Card sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                        <CardMedia
                          component="img"
                          image={theme.image_url}
                          alt={theme.name}
                          sx={{ height: 200 }}
                        />
                        <CardContent>
                          <Typography variant="h6">{theme.name}</Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            By {theme.user_name} (@{theme.username})
                          </Typography>
                          <Typography variant="body2">
                            {theme.description || 'No description'}
                          </Typography>
                          <Box mt={2} display="flex" justifyContent="space-between">
                            <Chip 
                              label={`Submitted ${new Date(theme.created_at).toLocaleDateString()}`}
                              size="small"
                              variant="outlined"
                            />
                          </Box>
                          
                          <Box mt={2} display="flex" justifyContent="flex-end" gap={1}>
                            <Button
                              variant="outlined"
                              color="error"
                              startIcon={<Cancel />}
                              onClick={() => openRejectDialog(theme.id)}
                            >
                              Reject
                            </Button>
                            <Button
                              variant="contained"
                              color="success"
                              startIcon={<CheckCircle />}
                              onClick={() => handleApproveTheme(theme.id)}
                            >
                              Approve
                            </Button>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}
            </>
          )}

          {tabIndex === 1 && (
            <>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Reported Themes
              </Typography>
              {reportedThemes.length === 0 ? (
                <Alert severity="info">
                  There are no reported themes.
                </Alert>
              ) : (
                <Grid container spacing={3}>
                  {reportedThemes.map(theme => (
                    <Grid key={theme.id} component="div" sx={{ gridColumn: { xs: 'span 12', md: 'span 6' } }}>
                      <Card sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                        <CardMedia
                          component="img"
                          image={theme.image_url}
                          alt={theme.name}
                          sx={{ height: 200 }}
                        />
                        <CardContent>
                          <Typography variant="h6">{theme.name}</Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            By {theme.user_name} (@{theme.username})
                          </Typography>
                          <Box mt={1}>
                            <Chip 
                              icon={<Flag />}
                              label={`${theme.reported_count || 0} reports`}
                              color="error"
                              variant="outlined"
                              onClick={() => openReportsDialog(theme)}
                              sx={{ mr: 1 }}
                            />
                            <Chip 
                              label={`Status: ${theme.moderation_status || 'pending'}`}
                              color={theme.moderation_status === 'approved' ? 'success' : 'warning'}
                            />
                          </Box>
                          
                          <Box mt={2} display="flex" justifyContent="flex-end" gap={1}>
                            <Button
                              variant="outlined"
                              color="error"
                              startIcon={<VisibilityOff />}
                              onClick={() => openRejectDialog(theme.id)}
                            >
                              Hide Theme
                            </Button>
                            <Button
                              variant="contained"
                              color="success"
                              startIcon={<CheckCircle />}
                              onClick={() => handleApproveTheme(theme.id)}
                            >
                              Keep Theme
                            </Button>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}
            </>
          )}
        </Box>
      )}

      {/* Reject Reason Dialog */}
      <Dialog open={rejectDialogOpen} onClose={() => setRejectDialogOpen(false)}>
        <DialogTitle>Reject Theme</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Please provide a reason for rejecting this theme. This message will be visible to the user.
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Rejection Reason"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Example: This theme contains inappropriate content that violates our community guidelines."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleRejectTheme} 
            color="error" 
            variant="contained"
            disabled={!rejectReason.trim()}
          >
            Reject Theme
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reports Dialog */}
      <Dialog 
        open={reportsDialogOpen} 
        onClose={() => setReportsDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Reports for Theme: {selectedTheme?.name}
        </DialogTitle>
        <DialogContent>
          {selectedTheme?.reports?.map((report, index) => (
            <Card key={report.id} sx={{ mb: 2, bgcolor: 'background.paper' }}>
              <CardContent>
                <Typography variant="subtitle2">
                  Report #{index + 1} by @{report.reporter_username}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {new Date(report.created_at).toLocaleString()}
                </Typography>
                <Typography variant="body1" sx={{ mt: 1, fontStyle: 'italic' }}>
                  "{report.reason}"
                </Typography>
              </CardContent>
            </Card>
          ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReportsDialogOpen(false)}>Close</Button>
          <Button 
            onClick={() => {
              setReportsDialogOpen(false);
              if (selectedTheme) {
                openRejectDialog(selectedTheme.id);
              }
            }} 
            color="error" 
            variant="contained"
          >
            Hide Theme
          </Button>
        </DialogActions>
      </Dialog>

      {/* Feedback Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Admin; 
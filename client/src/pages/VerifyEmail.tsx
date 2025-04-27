import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Container, Typography, Box, Button, Paper, TextField, CircularProgress, Alert } from '@mui/material';
import { verifyEmail, resendVerificationEmail } from '../services/api';

const VerifyEmail: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [verifying, setVerifying] = useState<boolean>(true);
  const [success, setSuccess] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState<string>('');
  const [resendSuccess, setResendSuccess] = useState<boolean>(false);
  const [resendError, setResendError] = useState<string | null>(null);
  const [resending, setResending] = useState<boolean>(false);

  useEffect(() => {
    if (token) {
      verifyEmailToken();
    } else {
      setVerifying(false);
      setError('No verification token found in URL');
    }
  }, [token]);

  const verifyEmailToken = async () => {
    try {
      setVerifying(true);
      await verifyEmail(token!);
      setSuccess(true);
      setError(null);
    } catch (err: any) {
      setSuccess(false);
      setError(err.response?.data?.message || 'Failed to verify email. Please try again or request a new verification link.');
    } finally {
      setVerifying(false);
    }
  };

  const handleResendVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setResendError('Please enter your email address');
      return;
    }

    try {
      setResending(true);
      setResendError(null);
      await resendVerificationEmail(email);
      setResendSuccess(true);
    } catch (err: any) {
      setResendSuccess(false);
      setResendError(err.response?.data?.message || 'Failed to resend verification email. Please try again later.');
    } finally {
      setResending(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ my: 4, textAlign: 'center' }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Email Verification
        </Typography>

        {verifying ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        ) : success ? (
          <Paper elevation={3} sx={{ p: 4, bgcolor: 'background.paper' }}>
            <Alert severity="success" sx={{ mb: 2 }}>
              Your email has been verified successfully!
            </Alert>
            <Typography variant="body1" paragraph>
              Thank you for verifying your email address. You can now use all features of the application.
            </Typography>
            <Button
              fullWidth
              variant="contained"
              color="primary"
              onClick={() => navigate('/login')}
              sx={{ mt: 2 }}
            >
              Go to Login
            </Button>
          </Paper>
        ) : (
          <Paper elevation={3} sx={{ p: 4, bgcolor: 'background.paper' }}>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            <Typography variant="body1" paragraph>
              We couldn't verify your email with the provided token. The token might be expired or invalid.
            </Typography>
            <Typography variant="body1" paragraph>
              Please request a new verification link below:
            </Typography>
            
            <Box component="form" onSubmit={handleResendVerification} sx={{ mt: 2 }}>
              {resendSuccess && (
                <Alert severity="success" sx={{ mb: 2 }}>
                  Verification email sent successfully! Please check your inbox.
                </Alert>
              )}
              {resendError && <Alert severity="error" sx={{ mb: 2 }}>{resendError}</Alert>}
              
              <TextField
                fullWidth
                label="Email Address"
                variant="outlined"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                required
                sx={{ mb: 2 }}
              />
              
              <Button
                type="submit"
                fullWidth
                variant="contained"
                color="primary"
                disabled={resending}
                sx={{ mb: 2 }}
              >
                {resending ? <CircularProgress size={24} /> : 'Resend Verification Email'}
              </Button>
              
              <Link to="/login" style={{ textDecoration: 'none' }}>
                <Button fullWidth variant="outlined">
                  Back to Login
                </Button>
              </Link>
            </Box>
          </Paper>
        )}
      </Box>
    </Container>
  );
};

export default VerifyEmail; 
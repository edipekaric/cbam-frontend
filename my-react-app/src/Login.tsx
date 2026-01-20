import { useState } from 'react';
import {
  Box,
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Link,
  Stack,
  Divider,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  TrendingDown,
  ArrowBack,
  Email,
  Lock,
} from '@mui/icons-material';

interface LoginProps {
  onBack: () => void;
  onLoginSuccess: () => void;
}

interface LoginResponse {
  success: boolean;
  token?: string;
  user?: {
    id: number;
    username: string;
    email: string;
    role: string;
    companyName: string;
  };
  message?: string;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

const Login: React.FC<LoginProps> = ({ onBack, onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [forgotPasswordMessage, setForgotPasswordMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          password: password,
        }),
      });

      const data: LoginResponse = await response.json();

      if (response.ok && data.success && data.token) {
        // Store token and user info in localStorage
        localStorage.setItem('token', data.token);
        if (data.user) {
          localStorage.setItem('user', JSON.stringify(data.user));
        }
        // Redirect to dashboard
        onLoginSuccess();
      } else {
        // Handle error response
        setError(data.message || 'Login failed. Please check your credentials.');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Unable to connect to the server. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotPasswordEmail) {
      setForgotPasswordMessage('Please enter your email address');
      return;
    }
    // Simulate password reset - in real app, this would call an API
    console.log('Password reset request for:', forgotPasswordEmail);
    setForgotPasswordMessage('Password reset instructions have been sent to your email address.');
    setTimeout(() => {
      setShowForgotPassword(false);
      setForgotPasswordEmail('');
      setForgotPasswordMessage('');
    }, 3000);
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', py: 4 }}>
      <Container maxWidth="sm">
        <Button
          startIcon={<ArrowBack />}
          onClick={onBack}
          sx={{ mb: 3 }}
        >
          Back to Home
        </Button>

        <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
          <Box textAlign="center" mb={4}>
            <Box display="flex" alignItems="center" justifyContent="center" gap={1} mb={2}>
              <TrendingDown color="primary" />
              <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
                EPE Consulting
              </Typography>
            </Box>
            <Typography variant="h5" component="h2" gutterBottom>
              Welcome Back
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Sign in to your CBAM compliance account
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {!showForgotPassword ? (
            <Box component="form" onSubmit={handleSubmit}>
              <Stack spacing={3}>
                <TextField
                  fullWidth
                  label="Email Address"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  InputProps={{
                    startAdornment: <Email sx={{ mr: 1, color: 'text.secondary' }} />,
                  }}
                  required
                />
                
                <TextField
                  fullWidth
                  label="Password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  InputProps={{
                    startAdornment: <Lock sx={{ mr: 1, color: 'text.secondary' }} />,
                  }}
                  required
                />

                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  fullWidth
                  disabled={loading}
                  sx={{ py: 1.5, fontSize: '1.1rem' }}
                >
                  {loading ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </Stack>
            </Box>
          ) : (
            <Box component="form" onSubmit={handleForgotPassword}>
              <Stack spacing={3}>
                <Typography variant="h6" textAlign="center" gutterBottom>
                  Reset Your Password
                </Typography>
                <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mb: 2 }}>
                  Enter your email address and we'll send you instructions to reset your password.
                </Typography>
                
                <TextField
                  fullWidth
                  label="Email Address"
                  type="email"
                  value={forgotPasswordEmail}
                  onChange={(e) => setForgotPasswordEmail(e.target.value)}
                  InputProps={{
                    startAdornment: <Email sx={{ mr: 1, color: 'text.secondary' }} />,
                  }}
                  required
                />

                {forgotPasswordMessage && (
                  <Alert severity={forgotPasswordMessage.includes('sent') ? 'success' : 'error'}>
                    {forgotPasswordMessage}
                  </Alert>
                )}

                <Stack direction="row" spacing={2}>
                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    sx={{ flex: 1, py: 1.5, fontSize: '1.1rem' }}
                  >
                    Send Reset Instructions
                  </Button>
                  <Button
                    variant="outlined"
                    size="large"
                    onClick={() => setShowForgotPassword(false)}
                    sx={{ flex: 1, py: 1.5, fontSize: '1.1rem' }}
                  >
                    Cancel
                  </Button>
                </Stack>
              </Stack>
            </Box>
          )}

          <Divider sx={{ my: 3 }} />

          {!showForgotPassword && (
            <Box textAlign="center">
              <Typography variant="body2" color="text.secondary">
                <Link 
                  href="#" 
                  onClick={(e) => {
                    e.preventDefault();
                    setShowForgotPassword(true);
                  }}
                  sx={{ fontSize: '0.875rem', fontWeight: 600 }}
                >
                  Forgot your password?
                </Link>
              </Typography>
            </Box>
          )}
        </Paper>

        <Box textAlign="center" mt={4}>
          <Typography variant="body2" color="text.secondary">
            © 2025 EPE Consulting. All rights reserved.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default Login;

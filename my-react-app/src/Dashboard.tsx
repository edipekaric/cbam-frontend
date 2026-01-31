import { useState, useEffect } from 'react';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import SessionExpired from './SessionExpired';
import { isTokenExpired, API_BASE_URL, apiRequest } from './utils/api';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Container,
  Box,
  Grid,
  Card,
  CardContent,
  Paper,
  Chip,
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Stack,
  TextField,
} from '@mui/material';
import {
  TrendingDown,
  Menu as MenuIcon,
  AccountCircle,
  Logout,
  Settings,
  Calculate,
  Description,
  Send,
  Notifications,
  Help,
  ArrowBack,
  ArrowForward,
} from '@mui/icons-material';

interface DashboardProps {
  onLogout: () => void;
}

interface User {
  id: number;
  username: string;
  email: string;
  companyName: string;
}

const Dashboard: React.FC<DashboardProps> = ({ onLogout }) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [userName, setUserName] = useState<string>('User');
  const [, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [currentView, setCurrentView] = useState<'dashboard' | 'calculation' | 'report' | 'sharing'>('dashboard');
  const [newCalcError, setNewCalcError] = useState<string | null>(null);
  const [newCalcLoading, setNewCalcLoading] = useState(false);
  const [calculationsCount, setCalculationsCount] = useState<number | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Fetch current user data on component mount
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        const response = await fetch(`${API_BASE_URL}/users/me`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.user) {
            setUser(data.user);
            // Use username as display name (not companyName)
            setUserName(data.user.username || 'User');
            setSessionExpired(false);
          }
        } else if (response.status === 401) {
          // Token expired or invalid - show session expired screen
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setSessionExpired(true);
        }
      } catch (error) {
        console.error('Error fetching user:', error);
        // On error, check if token exists - if not, redirect to login
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
        } else {
          // Token exists but request failed - might be expired
          setSessionExpired(true);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentUser();

    // Fetch calculations count for current user
    const fetchCalculationsCount = async () => {
      const meResult = await apiRequest<{ success: boolean; user?: { id: number } }>('/users/me');
      if (meResult === null || !meResult.data.success || !meResult.data.user?.id) return;
      const calcResult = await apiRequest<{ success: boolean; calculations?: unknown[] }>(
        `/calculations/user/${meResult.data.user.id}`
      );
      if (calcResult !== null && calcResult.data.success && Array.isArray(calcResult.data.calculations)) {
        setCalculationsCount(calcResult.data.calculations.length);
      }
    };
    fetchCalculationsCount();

    // Set up periodic token validation (check every 1 hour and 2 minutes)
    const intervalId = setInterval(() => {
      const token = localStorage.getItem('token');
      if (token) {
        // First check client-side expiration (faster, no API call needed)
        const expired = isTokenExpired(token);
        if (expired === true) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setSessionExpired(true);
          return;
        }

        // Also verify with backend (in case of clock skew or other issues)
        fetch(`${API_BASE_URL}/users/me`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })
          .then((response) => {
            if (response.status === 401) {
              // Token expired on server side
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              setSessionExpired(true);
            }
          })
          .catch((error) => {
            // Network error - don't log out, just log
            console.error('Token validation error:', error);
          });
      } else {
        // No token found, show expired screen
        setSessionExpired(true);
      }
    }, (60 + 2) * 60 * 1000); // Check every 1 hour and 2 minutes (62 minutes)

    return () => clearInterval(intervalId);
  }, [navigate]);

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    setAnchorEl(null);
    // Clear localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    onLogout();
  };

  const handleNewCalculation = async () => {
    setNewCalcError(null);
    setNewCalcLoading(true);
    try {
      const meResult = await apiRequest<{ success: boolean; user?: { id: number; companyId?: number | null } }>('/users/me');
      if (meResult === null || !meResult.data.success || !meResult.data.user) {
        setNewCalcError('Session expired or not authenticated');
        setNewCalcLoading(false);
        return;
      }
      const user = meResult.data.user;
      const companyId = user.companyId ?? 0;
      if (!companyId) {
        setNewCalcError('Your account has no company assigned. Please contact your administrator.');
        setNewCalcLoading(false);
        return;
      }
      const calcResult = await apiRequest<{ success: boolean; calculation?: { id: number } }>('/calculations/create', {
        method: 'POST',
        body: JSON.stringify({
          company: { id: companyId },
          createdByUser: { id: user.id },
        }),
      });
      if (calcResult === null || !calcResult.data.success || !calcResult.data.calculation?.id) {
        setNewCalcError((calcResult?.data as { message?: string })?.message ?? 'Failed to create calculation');
        setNewCalcLoading(false);
        return;
      }
      const calculationId = calcResult.data.calculation.id;
      setNewCalcLoading(false);
      navigate('/dashboard/new-calculation', { state: { calculationId } });
    } catch (err) {
      setNewCalcError(err instanceof Error ? err.message : 'Failed to create calculation');
      setNewCalcLoading(false);
    }
  };

  const handleGenerateReport = () => {
    setCurrentView('report');
  };

  const handleShareWithClient = () => {
    setCurrentView('sharing');
  };

  const handleBackToDashboard = () => {
    setCurrentView('dashboard');
  };

  // Report Generation Page Component
  const ReportPage = () => (
    <Container maxWidth="lg">
      <Box mb={4}>
        <Button startIcon={<ArrowBack />} onClick={handleBackToDashboard} sx={{ mb: 2 }}>
          Back to Dashboard
        </Button>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
          Generate Report
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Create compliant CBAM reports for your calculations
        </Typography>
      </Box>

      <Paper elevation={2} sx={{ p: 4, borderRadius: 2 }}>
        <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
          Report Configuration
        </Typography>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField fullWidth label="Report Period" variant="outlined" />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField fullWidth label="Report Type" variant="outlined" />
          </Grid>
          <Grid size={12}>
            <TextField fullWidth multiline rows={4} label="Additional Notes" variant="outlined" />
          </Grid>
          <Grid size={12}>
            <Button variant="contained" size="large" startIcon={<Description />} sx={{ mt: 2 }}>
              Generate Report
            </Button>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );

  // Client Sharing Page Component
  const SharingPage = () => (
    <Container maxWidth="lg">
      <Box mb={4}>
        <Button startIcon={<ArrowBack />} onClick={handleBackToDashboard} sx={{ mb: 2 }}>
          Back to Dashboard
        </Button>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
          Share with Client
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Send emissions data to your EU clients securely
        </Typography>
      </Box>

      <Paper elevation={2} sx={{ p: 4, borderRadius: 2 }}>
        <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
          Client Information
        </Typography>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField fullWidth label="Client Company Name" variant="outlined" />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField fullWidth label="Contact Email" type="email" variant="outlined" />
          </Grid>
          <Grid size={12}>
            <TextField fullWidth label="Subject" variant="outlined" />
          </Grid>
          <Grid size={12}>
            <TextField fullWidth multiline rows={4} label="Message" variant="outlined" />
          </Grid>
          <Grid size={12}>
            <Button variant="contained" size="large" startIcon={<Send />} sx={{ mt: 2 }}>
              Send to Client
            </Button>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );

  const dashboardCards: Array<{
    title: string;
    description: string;
    icon: React.ReactNode;
    color: string;
    count: string;
    label: string;
    seeAllHref?: string;
  }> = [
    {
      title: 'CBAM Calculations',
      description: 'Calculate emissions for your products',
      icon: <Calculate />,
      color: '#059669',
      count: calculationsCount !== null ? String(calculationsCount) : '—',
      label: 'Active Projects',
      seeAllHref: '/dashboard/calculations',
    },
    {
      title: 'Reports Generated',
      description: 'View and manage your reports',
      icon: <Description />,
      color: '#2563eb',
      count: '8',
      label: 'This Month'
    },
    {
      title: 'Client Sharing',
      description: 'Share data with EU clients',
      icon: <Send />,
      color: '#7c3aed',
      count: '24',
      label: 'Shared Reports'
    }
  ];

  // Show session expired screen if session expired
  if (sessionExpired) {
    return <SessionExpired />;
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Navigation */}
      <AppBar position="fixed" sx={{ bgcolor: 'white', color: 'text.primary', boxShadow: 1 }}>
        <Toolbar>
          <Box display="flex" alignItems="center" gap={1} sx={{ flexGrow: 1 }}>
            <TrendingDown color="primary" />
            <Typography variant="h6" component="div" sx={{ fontWeight: 700 }}>
              EPE Consulting
            </Typography>
            <Chip label="Dashboard" color="primary" size="small" sx={{ ml: 2 }} />
          </Box>
          
          <IconButton color="inherit" sx={{ mr: 1 }}>
            <Notifications />
          </IconButton>
          
          <IconButton color="inherit" sx={{ mr: 1 }}>
            <Help />
          </IconButton>

          <Button
            onClick={handleMenuClick}
            startIcon={<AccountCircle />}
            endIcon={<MenuIcon />}
            sx={{ color: 'text.primary' }}
            disabled={loading}
          >
            {loading ? 'Loading...' : userName}
          </Button>
          
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
          >
            <MenuItem onClick={handleMenuClose}>
              <ListItemIcon>
                <Settings />
              </ListItemIcon>
              <ListItemText>Settings</ListItemText>
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <Logout />
              </ListItemIcon>
              <ListItemText>Logout</ListItemText>
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Box sx={{ pt: 10, pb: 4 }}>
        {location.pathname === '/dashboard' && (
        <Container maxWidth="lg">
          {/* Welcome Section */}
          <Box mb={4}>
            <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
              {loading ? 'Loading...' : `Welcome back, ${userName}!`}
            </Typography>
            <Typography variant="h6" color="text.secondary">
              Manage your CBAM compliance and emissions reporting
            </Typography>
          </Box>

          {/* Dashboard Cards */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {dashboardCards.map((card, index) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={index}>
                <Card 
                  sx={{ 
                    height: '100%',
                    background: `linear-gradient(135deg, ${card.color}15, white)`,
                    border: `1px solid ${card.color}30`,
                    '&:hover': {
                      boxShadow: 3,
                      transform: 'translateY(-2px)',
                    },
                    transition: 'all 0.3s ease',
                  }}
                >
                  <CardContent sx={{ p: 4 }}>
                    <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
                      <Avatar sx={{ bgcolor: card.color, width: 56, height: 56 }}>
                        {card.icon}
                      </Avatar>
                      <Typography variant="h3" component="div" sx={{ fontWeight: 700, color: card.color }}>
                        {card.count}
                      </Typography>
                    </Box>
                    <Typography variant="h5" component="h3" gutterBottom sx={{ fontWeight: 600, mb: 1 }}>
                      {card.title}
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                      {card.description}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                      {card.label}
                    </Typography>
                    {card.seeAllHref && (
                      <Button
                        component="span"
                        endIcon={<ArrowForward />}
                        onClick={() => navigate(card.seeAllHref!)}
                        sx={{ mt: 2, px: 0, textTransform: 'none', color: card.color, fontWeight: 600 }}
                      >
                        See all
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Quick Actions */}
          <Paper elevation={2} sx={{ p: 4, borderRadius: 2 }}>
            <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
              Quick Actions
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                {newCalcError && (
                  <Typography variant="body2" color="error" sx={{ mb: 1 }}>
                    {newCalcError}
                  </Typography>
                )}
                <Button
                  variant="contained"
                  startIcon={<Calculate />}
                  fullWidth
                  size="large"
                  sx={{ py: 2 }}
                  onClick={handleNewCalculation}
                  disabled={newCalcLoading}
                >
                  {newCalcLoading ? 'Creating...' : 'New Calculation'}
                </Button>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <Button
                  variant="outlined"
                  startIcon={<Description />}
                  fullWidth
                  size="large"
                  sx={{ py: 2 }}
                  onClick={handleGenerateReport}
                >
                  Generate Report
                </Button>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <Button
                  variant="outlined"
                  startIcon={<Send />}
                  fullWidth
                  size="large"
                  sx={{ py: 2 }}
                  onClick={handleShareWithClient}
                >
                  Share with Client
                </Button>
              </Grid>
            </Grid>
          </Paper>

          {/* Recent Activity */}
          <Paper elevation={2} sx={{ p: 4, borderRadius: 2, mt: 3 }}>
            <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
              Recent Activity
            </Typography>
            <Stack spacing={2}>
              <Box display="flex" alignItems="center" gap={2}>
                <Avatar sx={{ bgcolor: 'success.main', width: 32, height: 32 }}>
                  <Calculate />
                </Avatar>
                <Box>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    Completed calculation for Steel Products
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    2 hours ago
                  </Typography>
                </Box>
              </Box>
              <Box display="flex" alignItems="center" gap={2}>
                <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
                  <Send />
                </Avatar>
                <Box>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    Shared report with EU Client GmbH
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    5 hours ago
                  </Typography>
                </Box>
              </Box>
              <Box display="flex" alignItems="center" gap={2}>
                <Avatar sx={{ bgcolor: 'info.main', width: 32, height: 32 }}>
                  <Description />
                </Avatar>
                <Box>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    Generated monthly compliance report
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    1 day ago
                  </Typography>
                </Box>
              </Box>
            </Stack>
          </Paper>
        </Container>
        )}

        {currentView === 'report' && <ReportPage />}
        {currentView === 'sharing' && <SharingPage />}
        <Outlet />
      </Box>
    </Box>
  );
};

export default Dashboard;

import { useState } from 'react';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
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
} from '@mui/icons-material';

interface DashboardProps {
  onLogout: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onLogout }) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [userName] = useState('John Doe'); // In real app, this would come from authentication
  const [currentView, setCurrentView] = useState<'dashboard' | 'calculation' | 'report' | 'sharing'>('dashboard');
  const navigate = useNavigate();
  const location = useLocation();

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    setAnchorEl(null);
    onLogout();
  };

  const handleNewCalculation = () => {
    navigate('/dashboard/new-calculation');
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

  const dashboardCards = [
    {
      title: 'CBAM Calculations',
      description: 'Calculate emissions for your products',
      icon: <Calculate />,
      color: '#059669',
      count: '12',
      label: 'Active Projects'
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
          >
            {userName}
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
              Welcome back, {userName}!
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
                <Button
                  variant="contained"
                  startIcon={<Calculate />}
                  fullWidth
                  size="large"
                  sx={{ py: 2 }}
                  onClick={handleNewCalculation}
                >
                  New Calculation
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

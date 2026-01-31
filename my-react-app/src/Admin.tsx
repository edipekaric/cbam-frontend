import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Stack,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Shield,
  Email,
  Lock,
  PersonAdd,
  Logout,
  ArrowBack,
  AdminPanelSettings,
  TableChart,
  Search,
  ArrowUpward,
  ArrowDownward,
  Add,
  Business,
} from '@mui/icons-material';
import { API_BASE_URL } from './utils/api';

interface AdminUser {
  id: number;
  username: string;
  email: string;
  role?: string;
  createdAt?: string;
  modifiedAt?: string;
}

interface StoredUser {
  id: number;
  username: string;
  email: string;
  role: string;
}

interface Company {
  id: number;
  name: string;
  createdAt?: string;
  modifiedAt?: string;
}

const DATA_TABLES: { id: string; label: string; endpoint: string; responseKey: string; createEndpoint: string }[] = [
  { id: 'admins', label: 'Admins', endpoint: '/admin/all', responseKey: 'admins', createEndpoint: '/admin/create' },
  { id: 'companies', label: 'Companies', endpoint: '/companies/all', responseKey: 'companies', createEndpoint: '/companies/create' },
  { id: 'users', label: 'Users', endpoint: '/users', responseKey: 'users', createEndpoint: '/users/create' },
  { id: 'emission-factors', label: 'Emission Factors', endpoint: '/emission-factors/all', responseKey: 'emissionFactors', createEndpoint: '/emission-factors/create' },
  { id: 'emission-factor-types', label: 'Emission Factor Types', endpoint: '/emission-factor-types/all', responseKey: 'emissionFactorTypes', createEndpoint: '/emission-factor-types/create' },
  { id: 'emission-factor-values', label: 'Emission Factor Values', endpoint: '/emission-factor-values/all', responseKey: 'emissionFactorValues', createEndpoint: '/emission-factor-values/create' },
  { id: 'nominators', label: 'Nominators', endpoint: '/nominators/all', responseKey: 'nominators', createEndpoint: '/nominators/create' },
  { id: 'denominators', label: 'Denominators', endpoint: '/denominators/all', responseKey: 'denominators', createEndpoint: '/denominators/create' },
];

function getCellDisplay(value: unknown): string {
  if (value == null) return '—';
  if (typeof value === 'object' && value !== null && !Array.isArray(value) && !(value instanceof Date)) {
    const obj = value as Record<string, unknown>;
    if (Object.keys(obj).length === 0) return '—';
    if ('id' in obj && Object.keys(obj).length <= 2) return String(obj.id);
    if ('username' in obj) return String(obj.username);
    if ('email' in obj) return String(obj.email);
    if ('emissionFactorType' in obj) return String((obj as { emissionFactorType?: string }).emissionFactorType);
    if ('nominator' in obj && typeof (obj as { nominator?: unknown }).nominator === 'object') return String((obj as { nominator?: { nominator?: string } }).nominator?.nominator ?? '');
    if ('denominator' in obj && typeof (obj as { denominator?: unknown }).denominator === 'object') return String((obj as { denominator?: { denominator?: string } }).denominator?.denominator ?? '');
    return JSON.stringify(obj).slice(0, 80);
  }
  if (Array.isArray(value)) return value.length ? `[${value.length} items]` : '[]';
  if (typeof value === 'string' && value.length > 60) return value.slice(0, 60) + '…';
  return String(value);
}

function getSortableValue(value: unknown): string | number | Date {
  if (value == null) return '';
  if (typeof value === 'number' || typeof value === 'boolean') return value as number;
  if (typeof value === 'string') return value;
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'object' && value !== null && 'id' in (value as object)) return (value as { id: unknown }).id as number;
  return getCellDisplay(value);
}

const Admin: React.FC = () => {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [adminsLoading, setAdminsLoading] = useState(false);
  const [createUsername, setCreateUsername] = useState('');
  const [createEmail, setCreateEmail] = useState('');
  const [createPassword, setCreatePassword] = useState('');
  const [createError, setCreateError] = useState('');
  const [createSuccess, setCreateSuccess] = useState('');
  const [createLoading, setCreateLoading] = useState(false);

  const [activeTab, setActiveTab] = useState(0);
  const [dataTableId, setDataTableId] = useState<string | null>(null);
  const [dataRows, setDataRows] = useState<Record<string, unknown>[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [dataError, setDataError] = useState('');
  const [dataSearch, setDataSearch] = useState('');
  const [dataSortKey, setDataSortKey] = useState<string | null>(null);
  const [dataSortDir, setDataSortDir] = useState<'asc' | 'desc'>('asc');

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addForm, setAddForm] = useState<Record<string, string>>({});
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState('');

  const [companies, setCompanies] = useState<Company[]>([]);
  const [companiesLoading, setCompaniesLoading] = useState(false);
  const [createCompanyName, setCreateCompanyName] = useState('');
  const [createCompanyLoading, setCreateCompanyLoading] = useState(false);
  const [createCompanyError, setCreateCompanyError] = useState('');
  const [createCompanySuccess, setCreateCompanySuccess] = useState('');

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (token && userStr) {
      try {
        const user: StoredUser = JSON.parse(userStr);
        setIsAdmin(user.role === 'ADMIN');
      } catch {
        setIsAdmin(false);
      }
    } else {
      setIsAdmin(false);
    }
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    const token = localStorage.getItem('token');
    if (!token) return;
    setAdminsLoading(true);
    fetch(`${API_BASE_URL}/admin/all`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.admins) setAdmins(data.admins);
      })
      .catch(() => setAdmins([]))
      .finally(() => setAdminsLoading(false));
  }, [isAdmin, createSuccess]);

  useEffect(() => {
    if (!isAdmin) return;
    const token = localStorage.getItem('token');
    if (!token) return;
    setCompaniesLoading(true);
    fetch(`${API_BASE_URL}/companies/all`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.companies) setCompanies(data.companies);
      })
      .catch(() => setCompanies([]))
      .finally(() => setCompaniesLoading(false));
  }, [isAdmin, createCompanySuccess]);

  const loadDataTable = (tableId: string) => {
    const config = DATA_TABLES.find((t) => t.id === tableId);
    if (!config) return;
    setDataTableId(tableId);
    setDataError('');
    setDataSearch('');
    setDataSortKey(null);
    setDataSortDir('asc');
    const token = localStorage.getItem('token');
    if (!token) {
      setDataError('Not authenticated.');
      setDataRows([]);
      return;
    }
    setDataLoading(true);
    fetch(`${API_BASE_URL}${config.endpoint}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data[config.responseKey] != null) {
          const rows = Array.isArray(data[config.responseKey]) ? data[config.responseKey] : [];
          setDataRows(rows.map((r: unknown) => (r && typeof r === 'object' ? (r as Record<string, unknown>) : {})));
        } else {
          setDataRows([]);
          setDataError(data.message || 'Failed to load data.');
        }
      })
      .catch(() => {
        setDataRows([]);
        setDataError('Request failed.');
      })
      .finally(() => setDataLoading(false));
  };

  const dataColumns = dataRows.length > 0 ? Object.keys(dataRows[0]).filter((k) => k !== 'password') : [];
  const filteredRows = dataSearch.trim()
    ? dataRows.filter((row) =>
        dataColumns.some((col) =>
          getCellDisplay(row[col]).toLowerCase().includes(dataSearch.trim().toLowerCase())
        )
      )
    : dataRows;
  const sortedRows =
    dataSortKey == null
      ? filteredRows
      : [...filteredRows].sort((a, b) => {
          const va = getSortableValue(a[dataSortKey]);
          const vb = getSortableValue(b[dataSortKey]);
          const cmp =
            typeof va === 'number' && typeof vb === 'number'
              ? va - vb
              : String(va).localeCompare(String(vb), undefined, { numeric: true });
          return dataSortDir === 'asc' ? cmp : -cmp;
        });

  const handleSort = (key: string) => {
    if (dataSortKey === key) setDataSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setDataSortKey(key);
      setDataSortDir('asc');
    }
  };

  const getDefaultAddForm = (tableId: string): Record<string, string> => {
    const defaults: Record<string, Record<string, string>> = {
      admins: { username: '', email: '', password: '' },
      users: { username: '', email: '', password: '', companyId: '' },
      companies: { name: '' },
      'emission-factors': { sector: '', subsector: '', subsubsector: '', emissionFactorName: '', emissionFactorTypeId: '', nominatorId: '', denominatorId: '', emissionFactorValueId: '', createdByUserId: '' },
      'emission-factor-types': { emissionFactorType: '' },
      'emission-factor-values': { value: '', co2: '', ch4: '', n2o: '', hfcs: '', pfcs: '', sf6: '', nf3: '', description: '', year: '', location: '', sourceName: '', sourceUrl: '', sourceAuthor: '', tags: '' },
      nominators: { nominator: '' },
      denominators: { denominator: '' },
    };
    return { ...(defaults[tableId] || {}) };
  };

  const openAddDialog = () => {
    if (!dataTableId) return;
    setAddForm(getDefaultAddForm(dataTableId));
    setAddError('');
    setAddDialogOpen(true);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dataTableId) return;
    const config = DATA_TABLES.find((t) => t.id === dataTableId);
    if (!config) return;
    const token = localStorage.getItem('token');
    if (!token) {
      setAddError('Not authenticated.');
      return;
    }
    setAddLoading(true);
    setAddError('');
    try {
      let body: Record<string, unknown> = {};
      if (dataTableId === 'companies') {
        const name = addForm.name?.trim();
        if (!name) {
          setAddError('Company name is required.');
          setAddLoading(false);
          return;
        }
        const res = await fetch(
          `${API_BASE_URL}${config.createEndpoint}?name=${encodeURIComponent(name)}`,
          {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const data = await res.json();
        if (res.ok && data.success) {
          setAddDialogOpen(false);
          loadDataTable(dataTableId);
          setCreateCompanySuccess((s) => (s ? '' : ' ')); // refresh companies list on tab 0
        } else {
          setAddError(data.message || 'Failed to create company.');
        }
        setAddLoading(false);
        return;
      }
      if (dataTableId === 'admins' || dataTableId === 'users') {
        body = { username: addForm.username, email: addForm.email, password: addForm.password };
        if (dataTableId === 'users' && addForm.companyId) {
          const companyId = Number(addForm.companyId);
          if (!Number.isNaN(companyId)) body.companyId = companyId;
        }
      } else if (dataTableId === 'emission-factor-types') {
        body = { emissionFactorType: addForm.emissionFactorType };
      } else if (dataTableId === 'nominators') {
        body = { nominator: addForm.nominator };
      } else if (dataTableId === 'denominators') {
        body = { denominator: addForm.denominator };
      } else if (dataTableId === 'emission-factors') {
        body = {
          sector: addForm.sector,
          subsector: addForm.subsector,
          subsubsector: addForm.subsubsector,
          emissionFactorName: addForm.emissionFactorName,
          emissionFactorTypeId: addForm.emissionFactorTypeId ? Number(addForm.emissionFactorTypeId) : undefined,
          nominatorId: addForm.nominatorId ? Number(addForm.nominatorId) : undefined,
          denominatorId: addForm.denominatorId ? Number(addForm.denominatorId) : undefined,
          emissionFactorValueId: addForm.emissionFactorValueId ? Number(addForm.emissionFactorValueId) : undefined,
          createdByUserId: addForm.createdByUserId ? Number(addForm.createdByUserId) : undefined,
        };
      } else if (dataTableId === 'emission-factor-values') {
        const tags = addForm.tags ? addForm.tags.split(',').map((s) => s.trim()).filter(Boolean) : undefined;
        body = {
          value: addForm.value,
          co2: addForm.co2 || undefined,
          ch4: addForm.ch4 || undefined,
          n2o: addForm.n2o || undefined,
          hfcs: addForm.hfcs || undefined,
          pfcs: addForm.pfcs || undefined,
          sf6: addForm.sf6 || undefined,
          nf3: addForm.nf3 || undefined,
          description: addForm.description || undefined,
          year: addForm.year ? parseInt(addForm.year, 10) : undefined,
          location: addForm.location || undefined,
          sourceName: addForm.sourceName,
          sourceUrl: addForm.sourceUrl,
          sourceAuthor: addForm.sourceAuthor,
          tags,
        };
      }
      const res = await fetch(`${API_BASE_URL}${config.createEndpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAddDialogOpen(false);
        loadDataTable(dataTableId);
      } else {
        setAddError(data.message || 'Failed to create.');
      }
    } catch {
      setAddError('Request failed.');
    } finally {
      setAddLoading(false);
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (response.ok && data.success && data.token && data.admin) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify({ ...data.admin, role: 'ADMIN' }));
        setIsAdmin(true);
      } else {
        setLoginError(data.message || 'Invalid email or password.');
      }
    } catch {
      setLoginError('Login failed. Please try again.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAdmin(false);
    setEmail('');
    setPassword('');
    setLoginError('');
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');
    setCreateSuccess('');
    setCreateLoading(true);
    const token = localStorage.getItem('token');
    if (!token) {
      setCreateError('Not authenticated.');
      setCreateLoading(false);
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/admin/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          username: createUsername,
          email: createEmail,
          password: createPassword,
        }),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setCreateSuccess('Admin user created successfully.');
        setCreateUsername('');
        setCreateEmail('');
        setCreatePassword('');
      } else {
        setCreateError(data.message || 'Failed to create admin.');
      }
    } catch {
      setCreateError('Request failed. Please try again.');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleBackToHome = () => {
    window.location.href = '/';
  };

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateCompanyError('');
    setCreateCompanySuccess('');
    const name = createCompanyName.trim();
    if (!name) {
      setCreateCompanyError('Company name is required.');
      return;
    }
    const token = localStorage.getItem('token');
    if (!token) {
      setCreateCompanyError('Not authenticated.');
      return;
    }
    setCreateCompanyLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/companies/create?name=${encodeURIComponent(name)}`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await response.json();
      if (response.ok && data.success) {
        setCreateCompanySuccess('Company created successfully.');
        setCreateCompanyName('');
      } else {
        setCreateCompanyError(data.message || 'Failed to create company.');
      }
    } catch {
      setCreateCompanyError('Request failed. Please try again.');
    } finally {
      setCreateCompanyLoading(false);
    }
  };

  if (isAdmin === null) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!isAdmin) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50', py: 4 }}>
        <Container maxWidth="sm">
          <Paper elevation={2} sx={{ p: 4, borderRadius: 2 }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 3 }}>
              <Shield color="primary" sx={{ fontSize: 32 }} />
              <Typography variant="h5" component="h1" sx={{ fontWeight: 700 }}>
                Admin sign in
              </Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Sign in with your admin account. This page is not linked from the main site.
            </Typography>
            {loginError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {loginError}
              </Alert>
            )}
            <form onSubmit={handleAdminLogin}>
              <Stack spacing={2}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  InputProps={{ startAdornment: <Email sx={{ mr: 1, color: 'action.active' }} /> }}
                />
                <TextField
                  fullWidth
                  label="Password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  InputProps={{ startAdornment: <Lock sx={{ mr: 1, color: 'action.active' }} /> }}
                />
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  fullWidth
                  disabled={loginLoading}
                  startIcon={loginLoading ? <CircularProgress size={20} /> : <Shield />}
                >
                  {loginLoading ? 'Signing in...' : 'Sign in'}
                </Button>
              </Stack>
            </form>
            <Button
              startIcon={<ArrowBack />}
              onClick={handleBackToHome}
              sx={{ mt: 3 }}
              color="inherit"
            >
              Back to site
            </Button>
          </Paper>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Paper elevation={1} sx={{ px: 3, py: 2, mb: 3, borderRadius: 0 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <AdminPanelSettings color="primary" />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Admin
            </Typography>
          </Stack>
          <Stack direction="row" spacing={2}>
            <Button startIcon={<ArrowBack />} href="/" color="inherit" size="small">
              Site
            </Button>
            <Button startIcon={<Logout />} onClick={handleLogout} color="primary" variant="outlined" size="small">
              Sign out
            </Button>
          </Stack>
        </Stack>
      </Paper>

      <Container maxWidth="lg" sx={{ pb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700, mb: 2 }}>
          Admin dashboard
        </Typography>

        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}>
          <Tab label="Admins" icon={<AdminPanelSettings />} iconPosition="start" />
          <Tab label="DataTables" icon={<TableChart />} iconPosition="start" />
        </Tabs>

        {activeTab === 0 && (
        <Box>
        <Box sx={{ mb: 3 }}>
          <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }} gutterBottom>
              Create admin user
            </Typography>
            {createError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {createError}
              </Alert>
            )}
            {createSuccess && (
              <Alert severity="success" sx={{ mb: 2 }}>
                {createSuccess}
              </Alert>
            )}
            <form onSubmit={handleCreateAdmin}>
              <Stack spacing={2} direction={{ xs: 'column', sm: 'row' }} flexWrap="wrap" useFlexGap>
                <TextField
                  label="Username"
                  value={createUsername}
                  onChange={(e) => setCreateUsername(e.target.value)}
                  required
                  size="small"
                  sx={{ minWidth: 160 }}
                />
                <TextField
                  label="Email"
                  type="email"
                  value={createEmail}
                  onChange={(e) => setCreateEmail(e.target.value)}
                  required
                  size="small"
                  sx={{ minWidth: 200 }}
                />
                <TextField
                  label="Password"
                  type="password"
                  value={createPassword}
                  onChange={(e) => setCreatePassword(e.target.value)}
                  required
                  size="small"
                  sx={{ minWidth: 160 }}
                  inputProps={{ minLength: 6 }}
                />
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={createLoading ? <CircularProgress size={18} /> : <PersonAdd />}
                  disabled={createLoading}
                >
                  {createLoading ? 'Creating...' : 'Create admin'}
                </Button>
              </Stack>
            </form>
          </Paper>
        </Box>

        <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Admin users
            </Typography>
          </Box>
          {adminsLoading ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Username</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Created</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {admins.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                        No admin users
                      </TableCell>
                    </TableRow>
                  ) : (
                    admins.map((admin) => (
                      <TableRow key={admin.id}>
                        <TableCell>{admin.id}</TableCell>
                        <TableCell>{admin.username}</TableCell>
                        <TableCell>{admin.email}</TableCell>
                        <TableCell>
                          {admin.createdAt
                            ? new Date(admin.createdAt).toLocaleDateString()
                            : '—'}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>

        <Box sx={{ mt: 4, mb: 3 }}>
          <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }} gutterBottom>
              Create company
            </Typography>
            {createCompanyError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {createCompanyError}
              </Alert>
            )}
            {createCompanySuccess && (
              <Alert severity="success" sx={{ mb: 2 }}>
                {createCompanySuccess}
              </Alert>
            )}
            <form onSubmit={handleCreateCompany}>
              <Stack spacing={2} direction={{ xs: 'column', sm: 'row' }} flexWrap="wrap" useFlexGap alignItems="center">
                <TextField
                  label="Company name"
                  value={createCompanyName}
                  onChange={(e) => setCreateCompanyName(e.target.value)}
                  required
                  size="small"
                  sx={{ minWidth: 240 }}
                />
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={createCompanyLoading ? <CircularProgress size={18} /> : <Business />}
                  disabled={createCompanyLoading}
                >
                  {createCompanyLoading ? 'Creating...' : 'Create company'}
                </Button>
              </Stack>
            </form>
          </Paper>
        </Box>

        <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Companies
            </Typography>
          </Box>
          {companiesLoading ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Created</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {companies.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} align="center" sx={{ py: 3 }}>
                        No companies
                      </TableCell>
                    </TableRow>
                  ) : (
                    companies.map((company) => (
                      <TableRow key={company.id}>
                        <TableCell>{company.id}</TableCell>
                        <TableCell>{company.name}</TableCell>
                        <TableCell>
                          {company.createdAt
                            ? new Date(company.createdAt).toLocaleDateString()
                            : '—'}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
        </Box>
        )}

        {activeTab === 1 && (
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              Select a table
            </Typography>
            <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mb: 2 }}>
              {DATA_TABLES.map((t) => (
                <Button
                  key={t.id}
                  variant={dataTableId === t.id ? 'contained' : 'outlined'}
                  size="small"
                  onClick={() => loadDataTable(t.id)}
                >
                  {t.label}
                </Button>
              ))}
            </Stack>
            {dataTableId && (
              <>
                <Stack direction="row" alignItems="center" gap={2} sx={{ mb: 2, flexWrap: 'wrap' }}>
                  <TextField
                    size="small"
                    placeholder="Search in table…"
                    value={dataSearch}
                    onChange={(e) => setDataSearch(e.target.value)}
                    sx={{ minWidth: 280 }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Search />
                        </InputAdornment>
                      ),
                    }}
                  />
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<Add />}
                    onClick={openAddDialog}
                  >
                    Add
                  </Button>
                </Stack>
                {dataError && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {dataError}
                  </Alert>
                )}
                {dataLoading ? (
                  <Box sx={{ p: 4, textAlign: 'center' }}>
                    <CircularProgress />
                  </Box>
                ) : (
                  <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'auto' }}>
                    <TableContainer sx={{ maxHeight: 560 }}>
                      <Table size="small" stickyHeader>
                        <TableHead>
                          <TableRow>
                            {dataColumns.map((col) => (
                              <TableCell
                                key={col}
                                onClick={() => handleSort(col)}
                                sx={{
                                  cursor: 'pointer',
                                  fontWeight: 600,
                                  whiteSpace: 'nowrap',
                                  userSelect: 'none',
                                  bgcolor: 'background.paper',
                                }}
                              >
                                <Stack direction="row" alignItems="center" spacing={0.5}>
                                  {col.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase())}
                                  {dataSortKey === col &&
                                    (dataSortDir === 'asc' ? <ArrowUpward fontSize="small" /> : <ArrowDownward fontSize="small" />)}
                                </Stack>
                              </TableCell>
                            ))}
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {sortedRows.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={dataColumns.length} align="center" sx={{ py: 3 }}>
                                {dataRows.length === 0 ? 'No rows' : 'No rows match the search'}
                              </TableCell>
                            </TableRow>
                          ) : (
                            sortedRows.map((row, idx) => (
                              <TableRow key={idx}>
                                {dataColumns.map((col) => (
                                  <TableCell key={col} sx={{ maxWidth: 320 }}>
                                    {getCellDisplay(row[col])}
                                  </TableCell>
                                ))}
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Paper>
                )}
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {sortedRows.length} row{sortedRows.length !== 1 ? 's' : ''}
                  {dataSearch.trim() && filteredRows.length !== dataRows.length && ` (filtered from ${dataRows.length})`}
                </Typography>

                <Dialog open={addDialogOpen} onClose={() => !addLoading && setAddDialogOpen(false)} maxWidth="sm" fullWidth>
                  <form onSubmit={handleAddSubmit}>
                    <DialogTitle>
                      Add to {DATA_TABLES.find((t) => t.id === dataTableId)?.label ?? ''}
                    </DialogTitle>
                    <DialogContent>
                      {addError && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                          {addError}
                        </Alert>
                      )}
                      <Stack spacing={2} sx={{ pt: 1 }}>
                        {(dataTableId === 'admins' || dataTableId === 'users') && (
                          <>
                            <TextField label="Username" value={addForm.username ?? ''} onChange={(e) => setAddForm((f) => ({ ...f, username: e.target.value }))} required size="small" fullWidth />
                            <TextField label="Email" type="email" value={addForm.email ?? ''} onChange={(e) => setAddForm((f) => ({ ...f, email: e.target.value }))} required size="small" fullWidth />
                            <TextField label="Password" type="password" value={addForm.password ?? ''} onChange={(e) => setAddForm((f) => ({ ...f, password: e.target.value }))} required size="small" fullWidth inputProps={{ minLength: 6 }} />
                            {dataTableId === 'users' && (
                              <FormControl size="small" fullWidth>
                                <InputLabel id="add-user-company-label">Company</InputLabel>
                                <Select
                                  labelId="add-user-company-label"
                                  label="Company"
                                  value={addForm.companyId ?? ''}
                                  onChange={(e) => setAddForm((f) => ({ ...f, companyId: e.target.value }))}
                                >
                                  <MenuItem value="">
                                    <em>None</em>
                                  </MenuItem>
                                  {companies.map((c) => (
                                    <MenuItem key={c.id} value={String(c.id)}>
                                      {c.name} (ID:{c.id})
                                    </MenuItem>
                                  ))}
                                </Select>
                              </FormControl>
                            )}
                          </>
                        )}
                        {dataTableId === 'companies' && (
                          <TextField label="Company name" value={addForm.name ?? ''} onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))} required size="small" fullWidth />
                        )}
                        {dataTableId === 'emission-factor-types' && (
                          <TextField label="Emission factor type" value={addForm.emissionFactorType ?? ''} onChange={(e) => setAddForm((f) => ({ ...f, emissionFactorType: e.target.value }))} required size="small" fullWidth />
                        )}
                        {dataTableId === 'nominators' && (
                          <TextField label="Nominator" value={addForm.nominator ?? ''} onChange={(e) => setAddForm((f) => ({ ...f, nominator: e.target.value }))} required size="small" fullWidth />
                        )}
                        {dataTableId === 'denominators' && (
                          <TextField label="Denominator" value={addForm.denominator ?? ''} onChange={(e) => setAddForm((f) => ({ ...f, denominator: e.target.value }))} required size="small" fullWidth />
                        )}
                        {dataTableId === 'emission-factors' && (
                          <>
                            <TextField label="Sector" value={addForm.sector ?? ''} onChange={(e) => setAddForm((f) => ({ ...f, sector: e.target.value }))} required size="small" fullWidth />
                            <TextField label="Subsector" value={addForm.subsector ?? ''} onChange={(e) => setAddForm((f) => ({ ...f, subsector: e.target.value }))} required size="small" fullWidth />
                            <TextField label="Subsubsector" value={addForm.subsubsector ?? ''} onChange={(e) => setAddForm((f) => ({ ...f, subsubsector: e.target.value }))} required size="small" fullWidth />
                            <TextField label="Emission factor name" value={addForm.emissionFactorName ?? ''} onChange={(e) => setAddForm((f) => ({ ...f, emissionFactorName: e.target.value }))} required size="small" fullWidth />
                            <TextField label="Emission factor type ID" type="number" value={addForm.emissionFactorTypeId ?? ''} onChange={(e) => setAddForm((f) => ({ ...f, emissionFactorTypeId: e.target.value }))} size="small" fullWidth />
                            <TextField label="Nominator ID" type="number" value={addForm.nominatorId ?? ''} onChange={(e) => setAddForm((f) => ({ ...f, nominatorId: e.target.value }))} size="small" fullWidth />
                            <TextField label="Denominator ID" type="number" value={addForm.denominatorId ?? ''} onChange={(e) => setAddForm((f) => ({ ...f, denominatorId: e.target.value }))} size="small" fullWidth />
                            <TextField label="Emission factor value ID" type="number" value={addForm.emissionFactorValueId ?? ''} onChange={(e) => setAddForm((f) => ({ ...f, emissionFactorValueId: e.target.value }))} size="small" fullWidth />
                            <TextField label="Created by user ID" type="number" value={addForm.createdByUserId ?? ''} onChange={(e) => setAddForm((f) => ({ ...f, createdByUserId: e.target.value }))} size="small" fullWidth />
                          </>
                        )}
                        {dataTableId === 'emission-factor-values' && (
                          <>
                            <TextField label="Value" type="number" value={addForm.value ?? ''} onChange={(e) => setAddForm((f) => ({ ...f, value: e.target.value }))} required size="small" fullWidth inputProps={{ step: 'any' }} />
                            <TextField label="Source name" value={addForm.sourceName ?? ''} onChange={(e) => setAddForm((f) => ({ ...f, sourceName: e.target.value }))} required size="small" fullWidth />
                            <TextField label="Source URL" value={addForm.sourceUrl ?? ''} onChange={(e) => setAddForm((f) => ({ ...f, sourceUrl: e.target.value }))} required size="small" fullWidth />
                            <TextField label="Source author" value={addForm.sourceAuthor ?? ''} onChange={(e) => setAddForm((f) => ({ ...f, sourceAuthor: e.target.value }))} required size="small" fullWidth />
                            <TextField label="CO2" type="number" value={addForm.co2 ?? ''} onChange={(e) => setAddForm((f) => ({ ...f, co2: e.target.value }))} size="small" fullWidth inputProps={{ step: 'any' }} />
                            <TextField label="CH4" type="number" value={addForm.ch4 ?? ''} onChange={(e) => setAddForm((f) => ({ ...f, ch4: e.target.value }))} size="small" fullWidth inputProps={{ step: 'any' }} />
                            <TextField label="N2O" type="number" value={addForm.n2o ?? ''} onChange={(e) => setAddForm((f) => ({ ...f, n2o: e.target.value }))} size="small" fullWidth inputProps={{ step: 'any' }} />
                            <TextField label="Description" value={addForm.description ?? ''} onChange={(e) => setAddForm((f) => ({ ...f, description: e.target.value }))} size="small" fullWidth multiline />
                            <TextField label="Year" type="number" value={addForm.year ?? ''} onChange={(e) => setAddForm((f) => ({ ...f, year: e.target.value }))} size="small" fullWidth />
                            <TextField label="Location" value={addForm.location ?? ''} onChange={(e) => setAddForm((f) => ({ ...f, location: e.target.value }))} size="small" fullWidth />
                            <TextField label="Tags (comma-separated)" value={addForm.tags ?? ''} onChange={(e) => setAddForm((f) => ({ ...f, tags: e.target.value }))} size="small" fullWidth placeholder="tag1, tag2" />
                          </>
                        )}
                      </Stack>
                    </DialogContent>
                    <DialogActions>
                      <Button onClick={() => setAddDialogOpen(false)} disabled={addLoading}>
                        Cancel
                      </Button>
                      <Button type="submit" variant="contained" disabled={addLoading} startIcon={addLoading ? <CircularProgress size={18} /> : <Add />}>
                        {addLoading ? 'Adding…' : 'Add'}
                      </Button>
                    </DialogActions>
                  </form>
                </Dialog>
              </>
            )}
          </Box>
        )}
      </Container>
    </Box>
  );
};

export default Admin;

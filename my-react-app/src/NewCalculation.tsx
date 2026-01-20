import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  Container,
  Box,
  Button,
  Typography,
  Paper,
  Grid,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormLabel,
} from '@mui/material';
import {
  ArrowBack,
  ArrowForward,
} from '@mui/icons-material';

// Fuel data with units and emission factors
const fuelData = [
  { name: 'Natural gas', unit: 'm³', emissionFactor: 2.06672 },
  { name: 'Natural gas (100% mineral blend)', unit: 'm³', emissionFactor: 2.08906 },
  { name: 'Butane', unit: 'tonnes', emissionFactor: 3033.38067 },
  { name: 'CNG', unit: 'tonnes', emissionFactor: 2575.46441 },
  { name: 'LNG', unit: 'tonnes', emissionFactor: 2603.30441 },
  { name: 'LPG', unit: 'tonnes', emissionFactor: 2939.36095 },
  { name: 'Other petroleum gas', unit: 'tonnes', emissionFactor: 2578.24647 },
  { name: 'Propane', unit: 'tonnes', emissionFactor: 2997.63233 },
  { name: 'Diesel (100% mineral diesel)', unit: 'litres', emissionFactor: 2.66155 },
  { name: 'Diesel (average biofuel blend)', unit: 'litres', emissionFactor: 2.57082 },
  { name: 'Gas oil', unit: 'litres', emissionFactor: 2.75541 },
  { name: 'Fuel oil', unit: 'litres', emissionFactor: 3.17492 },
  { name: 'Marine gas oil', unit: 'litres', emissionFactor: 2.77139 },
  { name: 'Marine fuel oil', unit: 'litres', emissionFactor: 3.10202 },
  { name: 'Burning oil', unit: 'litres', emissionFactor: 2.54016 },
  { name: 'Naphtha (uslovno)', unit: 'litres', emissionFactor: 2.11894 },
  { name: 'Waste oils (ako se sagorijevaju)', unit: 'litres', emissionFactor: 2.74924 },
  { name: 'Coal (industrial)', unit: 'tonnes', emissionFactor: 2395.28994 },
  { name: 'Coal (electricity generation)', unit: 'tonnes', emissionFactor: 2225.22448 },
  { name: 'Coal (domestic)', unit: 'tonnes', emissionFactor: 2904.95234 },
  { name: 'Coking coal', unit: 'tonnes', emissionFactor: 3164.65002 },
  { name: 'Petroleum coke', unit: 'tonnes', emissionFactor: 3386.57168 },
  { name: 'Coal (electricity generation – home produced)', unit: 'tonnes', emissionFactor: 2221.7467 },
  { name: 'Bioethanol', unit: 'litres', emissionFactor: 0.00901 },
  { name: 'Biodiesel ME', unit: 'litres', emissionFactor: 0.16751 },
  { name: 'Biodiesel ME (from used cooking oil)', unit: 'litres', emissionFactor: 0.16751 },
  { name: 'Biodiesel ME (from tallow)', unit: 'litres', emissionFactor: 0.16751 },
  { name: 'Biodiesel HVO', unit: 'litres', emissionFactor: 0.03558 },
  { name: 'Biopropane', unit: 'litres', emissionFactor: 0.00213 },
  { name: 'Methanol (bio)', unit: 'litres', emissionFactor: 0.00669 },
  { name: 'Avtur (renewable)', unit: 'litres', emissionFactor: 0.02531 },
  { name: 'Wood logs', unit: 'tonnes', emissionFactor: 46.98508 },
  { name: 'Wood chips', unit: 'tonnes', emissionFactor: 43.43964 },
  { name: 'Wood pellets', unit: 'tonnes', emissionFactor: 55.19389 },
  { name: 'Grass / straw', unit: 'tonnes', emissionFactor: 47.35709 },
  { name: 'Biogas', unit: 'tonnes', emissionFactor: 1.24314 },
  { name: 'Landfill gas', unit: 'tonnes', emissionFactor: 0.69696 },
];

const NewCalculation: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { categoryParam, productTypeParam, processParam, dataLevelParam } = useParams<{ categoryParam?: string; productTypeParam?: string; processParam?: string; dataLevelParam?: string }>();
  const [category, setCategory] = useState('');
  const [productName, setProductName] = useState('');
  const [step, setStep] = useState(1);
  const [aluminumProductType, setAluminumProductType] = useState('');
  const [aluminumProductSubtype, setAluminumProductSubtype] = useState('');
  const [productionProcess, setProductionProcess] = useState('');
  const [dataQualityLevel, setDataQualityLevel] = useState('');
  
  // Fuel input state
  const [selectedFuel, setSelectedFuel] = useState('');
  const [selectedUnit, setSelectedUnit] = useState('');
  const [fuelAmount, setFuelAmount] = useState<string>('');

  // Get the selected fuel's unit
  const getSelectedFuelUnit = () => {
    const fuel = fuelData.find(f => f.name === selectedFuel);
    return fuel ? fuel.unit : '';
  };

  // Get the selected fuel's emission factor
  const getSelectedFuelEmissionFactor = () => {
    const fuel = fuelData.find(f => f.name === selectedFuel);
    return fuel ? fuel.emissionFactor : 0;
  };

  // Handle fuel selection change - reset unit when fuel changes
  const handleFuelChange = (fuelName: string) => {
    setSelectedFuel(fuelName);
    setSelectedUnit(''); // Reset unit selection when fuel changes
  };

  // Helper function to convert category name to URL slug
  const categoryToSlug = (cat: string) => {
    return cat.toLowerCase().split(/\s+/).join('-');
  };

  // Helper function to convert URL slug to category name
  const slugToCategory = (slug: string) => {
    return slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  // Helper function to convert product type to URL slug
  const productTypeToSlug = (productType: string) => {
    if (productType === 'products') {
      return 'al-products';
    }
    return productType; // 'unwrought' stays as is
  };

  // Helper function to convert URL slug to product type
  const slugToProductType = (slug: string) => {
    if (slug === 'al-products') {
      return 'products';
    }
    return slug; // 'unwrought' stays as is
  };

  // Helper function to convert production process to URL slug
  const processToSlug = (process: string) => {
    if (process === 'primary') return 'primary';
    if (process === 'secondary') return 'secundary';
    if (process === 'unknown') return 'dkn';
    return process;
  };

  // Helper function to convert URL slug to production process
  const slugToProcess = (slug: string) => {
    if (slug === 'primary') return 'primary';
    if (slug === 'secundary') return 'secondary';
    if (slug === 'dkn') return 'unknown';
    return slug;
  };

  // Helper function to convert product subtype to URL slug
  const subtypeToSlug = (subtype: string) => {
    switch (subtype) {
      case 'wire': return 'zica';
      case 'sheets': return 'limovi';
      case 'foils': return 'folije';
      case 'profiles': return 'profili-sine-konstrukcija';
      case 'tubes': return 'cijevi-fitinzi';
      case 'other': return 'drugi';
      default: return subtype;
    }
  };

  // Helper function to convert URL slug to product subtype
  const slugToSubtype = (slug: string) => {
    switch (slug) {
      case 'zica': return 'wire';
      case 'limovi': return 'sheets';
      case 'folije': return 'foils';
      case 'profili-sine-konstrukcija': return 'profiles';
      case 'cijevi-fitinzi': return 'tubes';
      case 'drugi': return 'other';
      default: return slug;
    }
  };

  // Helper function to convert data quality level to URL slug
  const dataLevelToSlug = (level: string) => {
    switch (level) {
      case 'real-data': return 'fuels';
      case 'calculated-emissions': return 'emissions';
      case 'default-values': return 'nothing';
      default: return level;
    }
  };

  // Helper function to convert URL slug to data quality level
  const slugToDataLevel = (slug: string) => {
    switch (slug) {
      case 'fuels': return 'real-data';
      case 'emissions': return 'calculated-emissions';
      case 'nothing': return 'default-values';
      default: return slug;
    }
  };

  // Initialize from URL params on mount
  useEffect(() => {
    if (categoryParam && !category) {
      const categoryFromUrl = slugToCategory(categoryParam);
      if (categories.includes(categoryFromUrl)) {
        setCategory(categoryFromUrl);
        setStep(2);
      }
    }
    if (productTypeParam && !aluminumProductType && (productTypeParam === 'unwrought' || productTypeParam === 'al-products')) {
      setAluminumProductType(slugToProductType(productTypeParam));
      setStep(3); // Go to step 3 for both unwrought (production process) and al-products (product subtype selection)
    }
    if (processParam) {
      // Check if it's a production process (for unwrought) or product subtype (for al-products)
      if (productTypeParam === 'unwrought' && !productionProcess && (processParam === 'primary' || processParam === 'secundary' || processParam === 'dkn')) {
        setProductionProcess(slugToProcess(processParam));
        setStep(4);
      } else if (productTypeParam === 'al-products' && !aluminumProductSubtype) {
        // Check if it's a valid product subtype slug
        const validSubtypes = ['zica', 'limovi', 'folije', 'profili-sine-konstrukcija', 'cijevi-fitinzi', 'drugi'];
        if (validSubtypes.includes(processParam)) {
          setAluminumProductSubtype(slugToSubtype(processParam));
          setStep(4);
        }
      }
    }
    if (dataLevelParam && productTypeParam === 'unwrought') {
      // Check if it's a valid data level slug
      const validDataLevels = ['fuels', 'emissions', 'nothing'];
      if (validDataLevels.includes(dataLevelParam) && !dataQualityLevel) {
        setDataQualityLevel(slugToDataLevel(dataLevelParam));
        // Check if we're on the /anodes route
        if (location.pathname.endsWith('/anode-elektrode')) {
          setStep(6);
        } else {
          setStep(5);
        }
      }
    }
    // Also check for /anodes if dataQualityLevel is already set
    if (location.pathname.endsWith('/anodes') && step !== 6) {
      setStep(6);
    }
  }, [categoryParam, productTypeParam, processParam, dataLevelParam, location.pathname]);


  const categories = [
    'Cement',
    'Iron and Steel',
    'Aluminium',
    'Fertilizers',
    'Electricity',
    'Hydrogen'
  ];

  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  const handleNext = () => {
    if (step === 1) {
      if (!category || !productName) {
        return;
      }
      const slug = categoryToSlug(category);
      // Navigate first, then update step
      navigate(`/dashboard/new-calculation/${slug}`, { replace: true });
      setStep(2);
    } else if (step === 2) {
      // If Aluminium and no product type selected, don't proceed
      if (category === 'Aluminium' && !aluminumProductType) {
        return;
      }
      if (category === 'Aluminium' && aluminumProductType) {
        // If unwrought, go to production process question (step 3)
        // If products, go to product subtype selection (step 3)
        const slug = categoryToSlug(category);
        const productTypeSlug = productTypeToSlug(aluminumProductType);
        navigate(`/dashboard/new-calculation/${slug}/${productTypeSlug}`, { replace: true });
        setStep(3);
      } else {
        setStep(3);
      }
    } else if (step === 3) {
      if (category === 'Aluminium' && aluminumProductType === 'unwrought') {
        // Step 3 is the production process question for unwrought aluminium
        if (!productionProcess) {
          return; // Validation
        }
        // If "Ne znam / miješano" is selected, treat it as "primarni" internally but keep 'unknown' for URL
        const finalProcess = productionProcess === 'unknown' ? 'primary' : productionProcess;
        setProductionProcess(finalProcess);
        // Navigate with production process in URL
        const slug = categoryToSlug(category);
        const productTypeSlug = productTypeToSlug(aluminumProductType);
        const processSlug = processToSlug(productionProcess); // Use original value for URL
        navigate(`/dashboard/new-calculation/${slug}/${productTypeSlug}/${processSlug}`, { replace: true });
        setStep(4); // Go to data quality level question
      } else if (category === 'Aluminium' && aluminumProductType === 'products') {
        // Step 3 is the product subtype selection for aluminium products
        if (!aluminumProductSubtype) {
          return; // Validation
        }
        // Navigate with product subtype in URL
        const slug = categoryToSlug(category);
        const productTypeSlug = productTypeToSlug(aluminumProductType);
        const subtypeSlug = subtypeToSlug(aluminumProductSubtype);
        navigate(`/dashboard/new-calculation/${slug}/${productTypeSlug}/${subtypeSlug}`, { replace: true });
        setStep(4); // Go to next step (calculation form or further questions)
      }
    } else if (step === 4) {
      // Step 4 is the data quality level question for unwrought aluminium
      // Or continuation for products
      if (category === 'Aluminium' && aluminumProductType === 'unwrought') {
        if (!dataQualityLevel) {
          return; // Validation
        }
        // Navigate with data level in URL
        const slug = categoryToSlug(category);
        const productTypeSlug = productTypeToSlug(aluminumProductType);
        const processSlug = processToSlug(productionProcess);
        const dataLevelSlug = dataLevelToSlug(dataQualityLevel);
        navigate(`/dashboard/new-calculation/${slug}/${productTypeSlug}/${processSlug}/${dataLevelSlug}`, { replace: true });
      }
      setStep(5); // Go to calculation form (A3, A4, or A5 based on selection)
    } else if (step === 5) {
      // Step 5 is the fuel input form (for fuels route)
      // Validation: require fuel, unit, and amount for fuels route
      if (category === 'Aluminium' && aluminumProductType === 'unwrought' && dataQualityLevel === 'real-data') {
        if (!selectedFuel || !selectedUnit || !fuelAmount) {
          return; // Validation - all fields required
        }
        // Navigate to anodes step
        const slug = categoryToSlug(category);
        const productTypeSlug = productTypeToSlug(aluminumProductType);
        const processSlug = processToSlug(productionProcess);
        const dataLevelSlug = dataLevelToSlug(dataQualityLevel);
        navigate(`/dashboard/new-calculation/${slug}/${productTypeSlug}/${processSlug}/${dataLevelSlug}/anode-elektrode`, { replace: true });
      }
      setStep(6); // Go to next step
    }
  };

  const handleBack = () => {
    if (step === 6) {
      // Going back from step 6 (anodes) to step 5 (fuels)
      if (category === 'Aluminium' && aluminumProductType === 'unwrought' && dataQualityLevel === 'real-data') {
        // Remove /anodes from URL
        const slug = categoryToSlug(category);
        const productTypeSlug = productTypeToSlug(aluminumProductType);
        const processSlug = processToSlug(productionProcess);
        const dataLevelSlug = dataLevelToSlug(dataQualityLevel);
        navigate(`/dashboard/new-calculation/${slug}/${productTypeSlug}/${processSlug}/${dataLevelSlug}`, { replace: true });
      }
      setStep(5);
    } else if (step === 5) {
      // Going back from step 5 (calculation form) to step 4 (data quality question)
      if (category === 'Aluminium' && aluminumProductType === 'unwrought') {
        // Remove data level from URL
        const slug = categoryToSlug(category);
        const productTypeSlug = productTypeToSlug(aluminumProductType);
        const processSlug = processToSlug(productionProcess);
        navigate(`/dashboard/new-calculation/${slug}/${productTypeSlug}/${processSlug}`, { replace: true });
        setDataQualityLevel('');
        setStep(4);
      } else {
        setStep(4);
      }
    } else if (step === 4) {
      // Going back from step 4 to step 3
      if (category === 'Aluminium' && aluminumProductType === 'unwrought') {
        // Go back to production process question (remove process from URL)
        const slug = categoryToSlug(category);
        const productTypeSlug = productTypeToSlug(aluminumProductType);
        navigate(`/dashboard/new-calculation/${slug}/${productTypeSlug}`, { replace: true });
        setProductionProcess('');
        setStep(3);
      } else if (category === 'Aluminium' && aluminumProductType === 'products') {
        // Go back to product subtype selection (remove subtype from URL)
        const slug = categoryToSlug(category);
        const productTypeSlug = productTypeToSlug(aluminumProductType);
        navigate(`/dashboard/new-calculation/${slug}/${productTypeSlug}`, { replace: true });
        setAluminumProductSubtype('');
        setStep(3);
      } else {
        // For other cases, go back to step 2
        const slug = categoryToSlug(category);
        const productTypeSlug = productTypeToSlug(aluminumProductType);
        navigate(`/dashboard/new-calculation/${slug}/${productTypeSlug}`, { replace: true });
        setStep(2);
      }
    } else if (step === 3) {
      // Going back from step 3 to step 2
      if (category === 'Aluminium' && aluminumProductType) {
        // Go back to category URL (remove product type)
        const slug = categoryToSlug(category);
        navigate(`/dashboard/new-calculation/${slug}`, { replace: true });
        setAluminumProductType(''); // Clear product type when going back
        setAluminumProductSubtype(''); // Clear product subtype when going back
        setStep(2);
      } else if (category) {
        // For non-Aluminium, go back to category URL
        const slug = categoryToSlug(category);
        navigate(`/dashboard/new-calculation/${slug}`, { replace: true });
        setStep(2);
      } else {
        setStep(2);
      }
    } else if (step === 2) {
      // Going back from step 2 to step 1
      navigate('/dashboard/new-calculation', { replace: true });
      setStep(1);
    } else if (step === 1) {
      navigate('/dashboard');
    }
  };

  return (
    <Container maxWidth="lg">
      <Box mb={4}>
        <Button startIcon={<ArrowBack />} onClick={handleBackToDashboard} sx={{ mb: 2 }}>
          Back to Dashboard
        </Button>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
          New CBAM Calculation
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Calculate embedded emissions for your products
        </Typography>
      </Box>

      <Paper elevation={2} sx={{ p: 4, borderRadius: 2 }}>
        {step === 1 && (
          <>
            <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
              Product Information
            </Typography>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField 
                  fullWidth 
                  label="Product Name" 
                  variant="outlined"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>Product Category</InputLabel>
                  <Select
                    value={category}
                    label="Product Category"
                    onChange={(e) => {
                      setCategory(e.target.value);
                    }}
                  >
                    {categories.map((cat) => (
                      <MenuItem key={cat} value={cat}>
                        {cat}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={12}>
                <Box display="flex" justifyContent="flex-end" sx={{ mt: 2 }}>
                  <Button 
                    variant="contained" 
                    size="large" 
                    endIcon={<ArrowForward />}
                    onClick={handleNext}
                    disabled={!category || !productName}
                  >
                    Next
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </>
        )}

        {step === 2 && category === 'Aluminium' && (
          <>
            <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
              Šta uvoznik/importer prijavljuje? (koji CBAM proizvod)
            </Typography>
            <Grid container spacing={3}>
              <Grid size={12}>
                <FormControl component="fieldset" fullWidth>
                  <FormLabel component="legend" sx={{ mb: 2, fontWeight: 500 }}>
                    Odaberite jednu opciju:
                  </FormLabel>
                  <RadioGroup
                    value={aluminumProductType}
                    onChange={(e) => {
                      setAluminumProductType(e.target.value);
                    }}
                  >
                    <FormControlLabel
                      value="unwrought"
                      control={<Radio />}
                      label="Unwrought aluminium (CN 7601…) – ingoti, blokovi, gredice"
                      sx={{ mb: 2 }}
                    />
                    <FormControlLabel
                      value="products"
                      control={<Radio />}
                      label="Aluminium products (žica, limovi, folije, profili, cijevi itd.)"
                    />
                  </RadioGroup>
                </FormControl>
              </Grid>
              <Grid size={12}>
                <Box display="flex" justifyContent="space-between" sx={{ mt: 2 }}>
                  <Button 
                    variant="outlined" 
                    size="large" 
                    startIcon={<ArrowBack />}
                    onClick={handleBack}
                  >
                    Back
                  </Button>
                  <Button 
                    variant="contained" 
                    size="large" 
                    endIcon={<ArrowForward />}
                    onClick={handleNext}
                    disabled={!aluminumProductType}
                  >
                    Next
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </>
        )}

        {step === 2 && category !== 'Aluminium' && (
          <>
            <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
              Product: {productName}
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Category: {category}
            </Typography>
            <Grid container spacing={3}>
              <Grid size={12}>
                <Typography variant="body1" color="text.secondary">
                  Calculation form for {category} will be displayed here.
                </Typography>
              </Grid>
              <Grid size={12}>
                <Box display="flex" justifyContent="space-between" sx={{ mt: 2 }}>
                  <Button 
                    variant="outlined" 
                    size="large" 
                    startIcon={<ArrowBack />}
                    onClick={handleBack}
                  >
                    Back
                  </Button>
                  <Button 
                    variant="contained" 
                    size="large" 
                    endIcon={<ArrowForward />}
                    onClick={handleNext}
                  >
                    Next
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </>
        )}

        {step === 3 && category === 'Aluminium' && aluminumProductType === 'unwrought' && (
          <>
            <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
              UNWROUGHT ALUMINIUM (jednostavan proizvod)
            </Typography>
            <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
              Kako je proizveden taj unwrought aluminij (većina emisija se tu dešava)?
            </Typography>
            <Grid container spacing={3}>
              <Grid size={12}>
                <FormControl component="fieldset" fullWidth>
                  <FormLabel component="legend" sx={{ mb: 2, fontWeight: 500 }}>
                    Odaberite jednu opciju:
                  </FormLabel>
                  <RadioGroup
                    value={productionProcess}
                    onChange={(e) => {
                      setProductionProcess(e.target.value);
                    }}
                  >
                    <FormControlLabel
                      value="primary"
                      control={<Radio />}
                      label="Primarni aluminij (elektroliza alumine)"
                      sx={{ mb: 2 }}
                    />
                    <FormControlLabel
                      value="secondary"
                      control={<Radio />}
                      label="Sekundarni aluminij (topenje/reciklaža otpada/scrap)"
                      sx={{ mb: 2 }}
                    />
                    <FormControlLabel
                      value="unknown"
                      control={<Radio />}
                      label="Ne znam / miješano"
                    />
                  </RadioGroup>
                </FormControl>
              </Grid>
              <Grid size={12}>
                <Box display="flex" justifyContent="space-between" sx={{ mt: 2 }}>
                  <Button 
                    variant="outlined" 
                    size="large" 
                    startIcon={<ArrowBack />}
                    onClick={handleBack}
                  >
                    Back
                  </Button>
                  <Button 
                    variant="contained" 
                    size="large" 
                    endIcon={<ArrowForward />}
                    onClick={handleNext}
                    disabled={!productionProcess}
                  >
                    Next
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </>
        )}

        {step === 3 && category === 'Aluminium' && aluminumProductType === 'products' && (
          <>
            <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
              Koji tip aluminijskog proizvoda?
            </Typography>
            <Grid container spacing={3}>
              <Grid size={12}>
                <FormControl component="fieldset" fullWidth>
                  <FormLabel component="legend" sx={{ mb: 2, fontWeight: 500 }}>
                    Odaberite jednu opciju:
                  </FormLabel>
                  <RadioGroup
                    value={aluminumProductSubtype}
                    onChange={(e) => {
                      setAluminumProductSubtype(e.target.value);
                    }}
                  >
                    <FormControlLabel
                      value="wire"
                      control={<Radio />}
                      label="Žica (7605)"
                      sx={{ mb: 2 }}
                    />
                    <FormControlLabel
                      value="sheets"
                      control={<Radio />}
                      label="Limovi (7606)"
                      sx={{ mb: 2 }}
                    />
                    <FormControlLabel
                      value="foils"
                      control={<Radio />}
                      label="Folije (7607)"
                      sx={{ mb: 2 }}
                    />
                    <FormControlLabel
                      value="profiles"
                      control={<Radio />}
                      label="Profili / šine / konstrukcije (7610…)"
                      sx={{ mb: 2 }}
                    />
                    <FormControlLabel
                      value="tubes"
                      control={<Radio />}
                      label="Cijevi / fitinzi (7608, 7609)"
                      sx={{ mb: 2 }}
                    />
                    <FormControlLabel
                      value="other"
                      control={<Radio />}
                      label="Drugi aluminijski artikli (7616)"
                    />
                  </RadioGroup>
                </FormControl>
              </Grid>
              <Grid size={12}>
                <Box display="flex" justifyContent="space-between" sx={{ mt: 2 }}>
                  <Button 
                    variant="outlined" 
                    size="large" 
                    startIcon={<ArrowBack />}
                    onClick={handleBack}
                  >
                    Back
                  </Button>
                  <Button 
                    variant="contained" 
                    size="large" 
                    endIcon={<ArrowForward />}
                    onClick={handleNext}
                    disabled={!aluminumProductSubtype}
                  >
                    Next
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </>
        )}

        {step === 4 && category === 'Aluminium' && aluminumProductType === 'unwrought' && (
          <>
            <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
              Kakve podatke korisnik ima?
            </Typography>
            <Grid container spacing={3}>
              <Grid size={12}>
                <FormControl component="fieldset" fullWidth>
                  <FormLabel component="legend" sx={{ mb: 2, fontWeight: 500 }}>
                    Odaberite jednu opciju:
                  </FormLabel>
                  <RadioGroup
                    value={dataQualityLevel}
                    onChange={(e) => {
                      setDataQualityLevel(e.target.value);
                    }}
                  >
                    <FormControlLabel
                      value="real-data"
                      control={<Radio />}
                      label="Imam stvarne podatke o gorivima, anoda, električnoj energiji itd."
                      sx={{ mb: 2 }}
                    />
                    <FormControlLabel
                      value="calculated-emissions"
                      control={<Radio />}
                      label="Nemam detalje, ali imam već izračunate emisije (npr. iz lokalnog ETS-a ili interne MRV šeme)"
                      sx={{ mb: 2 }}
                    />
                    <FormControlLabel
                      value="default-values"
                      control={<Radio />}
                      label="Nemam ništa – trebam koristiti default vrijednosti"
                    />
                  </RadioGroup>
                </FormControl>
              </Grid>
              <Grid size={12}>
                <Box display="flex" justifyContent="space-between" sx={{ mt: 2 }}>
                  <Button 
                    variant="outlined" 
                    size="large" 
                    startIcon={<ArrowBack />}
                    onClick={handleBack}
                  >
                    Back
                  </Button>
                  <Button 
                    variant="contained" 
                    size="large" 
                    endIcon={<ArrowForward />}
                    onClick={handleNext}
                    disabled={!dataQualityLevel}
                  >
                    Next
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </>
        )}

        {step === 4 && category === 'Aluminium' && aluminumProductType === 'products' && (
          <>
            <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
              Aluminium Products - Nastavak
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Odabrani tip proizvoda: {(() => {
                switch (aluminumProductSubtype) {
                  case 'wire': return 'Žica (7605)';
                  case 'sheets': return 'Limovi (7606)';
                  case 'foils': return 'Folije (7607)';
                  case 'profiles': return 'Profili / šine / konstrukcije (7610…)';
                  case 'tubes': return 'Cijevi / fitinzi (7608, 7609)';
                  case 'other': return 'Drugi aluminijski artikli (7616)';
                  default: return '';
                }
              })()}
            </Typography>
            <Grid container spacing={3}>
              <Grid size={12}>
                <Typography variant="body1" color="text.secondary">
                  Calculation form for aluminium products will be displayed here.
                </Typography>
              </Grid>
              <Grid size={12}>
                <Box display="flex" justifyContent="space-between" sx={{ mt: 2 }}>
                  <Button 
                    variant="outlined" 
                    size="large" 
                    startIcon={<ArrowBack />}
                    onClick={handleBack}
                  >
                    Back
                  </Button>
                  <Button 
                    variant="contained" 
                    size="large" 
                    endIcon={<ArrowForward />}
                    onClick={handleNext}
                  >
                    Next
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </>
        )}

        {step === 3 && !(category === 'Aluminium' && (aluminumProductType === 'unwrought' || aluminumProductType === 'products')) && (
          <>
            <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
              Product: {productName}
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Category: {category}
              {category === 'Aluminium' && aluminumProductType && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Product Type: {aluminumProductType === 'unwrought' ? 'Unwrought aluminium (Blok A)' : 'Aluminium products (Blok B)'}
                </Typography>
              )}
            </Typography>
            <Grid container spacing={3}>
              <Grid size={12}>
                <Typography variant="body1" color="text.secondary">
                  Calculation form for {category} will be displayed here.
                </Typography>
              </Grid>
              <Grid size={12}>
                <Box display="flex" justifyContent="space-between" sx={{ mt: 2 }}>
                  <Button 
                    variant="outlined" 
                    size="large" 
                    startIcon={<ArrowBack />}
                    onClick={handleBack}
                  >
                    Back
                  </Button>
                  <Button 
                    variant="contained" 
                    size="large" 
                    endIcon={<ArrowForward />}
                    onClick={handleNext}
                  >
                    Next
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </>
        )}

        {step === 5 && (
          <>
            {/* Fuel Input Form - shown when dataQualityLevel is 'real-data' (fuels route) */}
            {category === 'Aluminium' && aluminumProductType === 'unwrought' && dataQualityLevel === 'real-data' && (
              <>
                <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: 600, mb: 3, mt: 2 }}>
                  Unos podataka o gorivima
                </Typography>
                <Grid container spacing={3}>
                  <Grid size={{ xs: 12, md: 5 }}>
                    <FormControl fullWidth>
                      <InputLabel>Vrsta goriva</InputLabel>
                      <Select
                        value={selectedFuel}
                        label="Vrsta goriva"
                        onChange={(e) => handleFuelChange(e.target.value)}
                      >
                        {fuelData.map((fuel) => (
                          <MenuItem key={fuel.name} value={fuel.name}>
                            {fuel.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      fullWidth
                      label="Količina"
                      type="number"
                      value={fuelAmount}
                      onChange={(e) => setFuelAmount(e.target.value)}
                      slotProps={{ htmlInput: { min: 0, step: 'any' } }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 3 }}>
                    <FormControl fullWidth disabled={!selectedFuel}>
                      <InputLabel>Jedinica</InputLabel>
                      <Select
                        value={selectedUnit}
                        label="Jedinica"
                        onChange={(e) => setSelectedUnit(e.target.value)}
                      >
                        {selectedFuel && (
                          <MenuItem value={getSelectedFuelUnit()}>
                            {getSelectedFuelUnit()}
                          </MenuItem>
                        )}
                      </Select>
                    </FormControl>
                  </Grid>
                  {selectedFuel && selectedUnit && fuelAmount && (
                    <Grid size={12}>
                      <Paper elevation={1} sx={{ p: 2, mt: 1, backgroundColor: 'primary.50', border: '1px solid', borderColor: 'primary.200' }}>
                        <Typography variant="body2" color="text.secondary">
                          <strong>Emisijski faktor:</strong> {getSelectedFuelEmissionFactor()} kg CO₂e / {selectedUnit}
                        </Typography>
                        <Typography variant="body1" sx={{ mt: 1, fontWeight: 600 }}>
                          <strong>Izračunate emisije:</strong> {(Number.parseFloat(fuelAmount) * getSelectedFuelEmissionFactor()).toFixed(2)} kg CO₂e
                        </Typography>
                      </Paper>
                    </Grid>
                  )}
                </Grid>
              </>
            )}

            {/* Default content for other cases */}
            {!(category === 'Aluminium' && aluminumProductType === 'unwrought' && dataQualityLevel === 'real-data') && (
              <Grid container spacing={3}>
                <Grid size={12}>
                  <Typography variant="body1" color="text.secondary">
                    Calculation form for {category} will be displayed here.
                  </Typography>
                </Grid>
              </Grid>
            )}

            <Grid container spacing={3}>
              <Grid size={12}>
                <Box display="flex" justifyContent="space-between" sx={{ mt: 3 }}>
                  <Button 
                    variant="outlined" 
                    size="large" 
                    startIcon={<ArrowBack />}
                    onClick={handleBack}
                  >
                    Back
                  </Button>
                  <Button 
                    variant="contained" 
                    size="large" 
                    endIcon={<ArrowForward />}
                    onClick={handleNext}
                  >
                    Next
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </>
        )}

        {step === 6 && (
          <>
            {/* Anodes Input Form */}
            <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
              Unos podataka o anodama
            </Typography>
            <Grid container spacing={3}>
              <Grid size={12}>
                <Typography variant="body1" color="text.secondary">
                  Anodes input form will be displayed here.
                </Typography>
              </Grid>
              <Grid size={12}>
                <Box display="flex" justifyContent="space-between" sx={{ mt: 3 }}>
                  <Button 
                    variant="outlined" 
                    size="large" 
                    startIcon={<ArrowBack />}
                    onClick={handleBack}
                  >
                    Back
                  </Button>
                  <Button 
                    variant="contained" 
                    size="large" 
                    endIcon={<ArrowForward />}
                    onClick={handleNext}
                  >
                    Next
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </>
        )}
      </Paper>
    </Container>
  );
};

export default NewCalculation;


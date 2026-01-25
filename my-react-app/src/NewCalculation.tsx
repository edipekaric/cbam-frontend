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
  Add,
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
  
  // Fuel input state - array of fuel entries
  interface FuelEntry {
    id: number;
    fuel: string;
    amount: string;
    unit: string;
  }
  const [fuelEntries, setFuelEntries] = useState<FuelEntry[]>([
    { id: 1, fuel: '', amount: '', unit: '' }
  ]);

  // Anodes input state
  const [anodesQuantity, setAnodesQuantity] = useState<string>('');
  const [hasCarbonPercentage, setHasCarbonPercentage] = useState<string>('');
  const [carbonPercentage, setCarbonPercentage] = useState<string>('');

  // PFC input state
  const [pfcQuantity, setPfcQuantity] = useState<string>('');
  const [hasPfcCarbonPercentage, setHasPfcCarbonPercentage] = useState<string>('');
  const [pfcCarbonPercentage, setPfcCarbonPercentage] = useState<string>('');
  const [pfcMethod, setPfcMethod] = useState<string>('');

  // Slope (PFC method a) input state
  const [anodeEffectFrequency, setAnodeEffectFrequency] = useState<string>('');
  const [anodeEffectDuration, setAnodeEffectDuration] = useState<string>('');
  const [primaryAluminumQuantity, setPrimaryAluminumQuantity] = useState<string>('');
  const [cellTechnology, setCellTechnology] = useState<string>('');

  // Overvoltage (PFC method b) input state
  const [aeo, setAeo] = useState<string>('');
  const [ce, setCe] = useState<string>('');
  const [primaryAluminumQuantityOvervoltage, setPrimaryAluminumQuantityOvervoltage] = useState<string>('');
  const [cellTechnologyOvervoltage, setCellTechnologyOvervoltage] = useState<string>('');

  // Electricity source state
  const [electricitySource, setElectricitySource] = useState<string>('');

  // Grid electricity consumption state
  const [gridConsumption, setGridConsumption] = useState<string>('');
  const [gridConsumptionUnit, setGridConsumptionUnit] = useState<string>('kWh');

  // Self-power electricity state
  const [selfPowerFuelType, setSelfPowerFuelType] = useState<string>('');
  const [selfPowerConsumption, setSelfPowerConsumption] = useState<string>('');

  // PPA electricity state
  const [ppaHasEmissionFactor, setPpaHasEmissionFactor] = useState<string>('');
  const [ppaEmissionFactor, setPpaEmissionFactor] = useState<string>('');
  const [ppaConsumption, setPpaConsumption] = useState<string>('');
  const [ppaConsumptionUnit, setPpaConsumptionUnit] = useState<string>('kWh');

  // Get x1 coefficient based on cell technology
  const getX1Coefficient = (technology: string): number => {
    const coefficients: { [key: string]: number } = {
      'pfpb-l': 0.000122,
      'pfpb-m': 0.000104,
      'pfpb-mw': 0, // Not allowed for calculation
      'cwpb': 0.000143,
      'swpb': 0.000233,
      'vss': 0.000058,
      'hss': 0.000165,
    };
    return coefficients[technology] || 0;
  };

  // Get x2 coefficient based on cell technology
  const getX2Coefficient = (technology: string): number => {
    const coefficients: { [key: string]: number } = {
      'pfpb-l': 0.097,
      'pfpb-m': 0.057,
      'pfpb-mw': 0, // Not allowed for calculation
      'cwpb': 0.121,
      'swpb': 0.280,
      'vss': 0.086,
      'hss': 0.077,
    };
    return coefficients[technology] || 0;
  };

  // Get x1 coefficient for overvoltage method based on cell technology
  const getX1CoefficientOvervoltage = (technology: string): number => {
    const coefficients: { [key: string]: number } = {
      'cwpb': 0.00116,
      'swpb': 0.00365,
    };
    return coefficients[technology] || 0;
  };

  // Get x2 coefficient for overvoltage method based on cell technology
  const getX2CoefficientOvervoltage = (technology: string): number => {
    const coefficients: { [key: string]: number } = {
      'cwpb': 0.000121,
      'swpb': 0.000252,
    };
    return coefficients[technology] || 0;
  };

  // Calculate PFC emissions using the slope method
  const calculatePfcEmissions = (): number => {
    if (!anodeEffectFrequency || !anodeEffectDuration || !primaryAluminumQuantity || !cellTechnology) {
      return 0;
    }

    // Don't calculate if PFPB MW is selected
    if (cellTechnology === 'pfpb-mw') {
      return 0;
    }

    const frequency = Number.parseFloat(anodeEffectFrequency) || 0;
    const duration = Number.parseFloat(anodeEffectDuration) || 0;
    const quantity = Number.parseFloat(primaryAluminumQuantity) || 0;
    const x1 = getX1Coefficient(cellTechnology);
    const x2 = getX2Coefficient(cellTechnology);

    // Formula: frequency * duration * quantity * x1 * 6630 * (1 + x2 * 11100)
    return frequency * duration * quantity * x1 * 6630 * (1 + x2 * 11100);
  };

  // Calculate PFC emissions using the overvoltage method
  const calculatePfcEmissionsOvervoltage = (): number => {
    if (!aeo || !ce || !primaryAluminumQuantityOvervoltage || !cellTechnologyOvervoltage) {
      return 0;
    }

    const aeoValue = Number.parseFloat(aeo) || 0;
    const ceValue = Number.parseFloat(ce) || 0;
    const quantity = Number.parseFloat(primaryAluminumQuantityOvervoltage) || 0;
    
    // Prevent division by zero
    if (ceValue === 0) {
      return 0;
    }

    const x1 = getX1CoefficientOvervoltage(cellTechnologyOvervoltage);
    const x2 = getX2CoefficientOvervoltage(cellTechnologyOvervoltage);

    // Formula: (AEO / CE) * quantity * x1 * 6630 * (1 + x2 * 11100)
    return (aeoValue / ceValue) * quantity * x1 * 6630 * (1 + x2 * 11100);
  };

  // Get the selected fuel's unit
  const getFuelUnit = (fuelName: string) => {
    const fuel = fuelData.find(f => f.name === fuelName);
    return fuel ? fuel.unit : '';
  };

  // Get the selected fuel's emission factor
  const getFuelEmissionFactor = (fuelName: string) => {
    const fuel = fuelData.find(f => f.name === fuelName);
    return fuel ? fuel.emissionFactor : 0;
  };

  // Calculate grid electricity emissions
  const calculateGridEmissions = (): number => {
    if (!gridConsumption) {
      return 0;
    }

    const consumption = Number.parseFloat(gridConsumption) || 0;
    
    // Formula: input * 0.77 for kWh, input * 0.77 * 1000 for MWh
    if (gridConsumptionUnit === 'kWh') {
      return consumption * 0.77;
    } else if (gridConsumptionUnit === 'MWh') {
      return consumption * 0.77 * 1000;
    }
    
    return 0;
  };

  // Get emission factor for self-power fuel type
  const getSelfPowerEmissionFactor = (fuelType: string): number => {
    const factors: { [key: string]: number } = {
      'ugalj': 0.33621,
      'prirodni-gas': 0.2027,
      'loz-ulje': 0.27288,
      'mazut': 0.28523,
      'biomasa': 0.3615,
      'biogas': 0.19924,
      'obnovljivi': 0,
    };
    return factors[fuelType] || 0;
  };

  // Calculate self-power electricity emissions
  const calculateSelfPowerEmissions = (): number => {
    if (!selfPowerFuelType || !selfPowerConsumption) {
      return 0;
    }

    const consumption = Number.parseFloat(selfPowerConsumption) || 0;
    const emissionFactor = getSelfPowerEmissionFactor(selfPowerFuelType);
    
    // Formula: consumption (kWh) * emission factor
    return consumption * emissionFactor;
  };

  // Calculate PPA electricity emissions
  const calculatePpaEmissions = (): number => {
    if (!ppaConsumption) {
      return 0;
    }

    const consumption = Number.parseFloat(ppaConsumption) || 0;
    
    if (ppaHasEmissionFactor === 'yes') {
      // If user has verified emission factor: emission factor (kgCO2/kWh) * consumption
      if (!ppaEmissionFactor) {
        return 0;
      }
      const emissionFactor = Number.parseFloat(ppaEmissionFactor) || 0;
      // Convert consumption to kWh if needed
      let consumptionInKWh = consumption;
      if (ppaConsumptionUnit === 'MWh') {
        consumptionInKWh = consumption * 1000; // Convert MWh to kWh
      }
      // Formula: emission factor (kgCO2/kWh) * consumption (kWh) = emissions (kg CO₂)
      return emissionFactor * consumptionInKWh;
    } else {
      // If NO, use same logic as grid: input * 0.77 for kWh, input * 0.77 * 1000 for MWh
      if (ppaConsumptionUnit === 'kWh') {
        return consumption * 0.77;
      } else if (ppaConsumptionUnit === 'MWh') {
        return consumption * 0.77 * 1000;
      }
    }
    
    return 0;
  };

  // Handle fuel selection change - reset unit when fuel changes
  const handleFuelChange = (id: number, fuelName: string) => {
    setFuelEntries(prev => prev.map(entry => 
      entry.id === id 
        ? { ...entry, fuel: fuelName, unit: '' } 
        : entry
    ));
  };

  // Handle fuel amount change
  const handleFuelAmountChange = (id: number, amount: string) => {
    setFuelEntries(prev => prev.map(entry => 
      entry.id === id 
        ? { ...entry, amount } 
        : entry
    ));
  };

  // Handle fuel unit change
  const handleFuelUnitChange = (id: number, unit: string) => {
    setFuelEntries(prev => prev.map(entry => 
      entry.id === id 
        ? { ...entry, unit } 
        : entry
    ));
  };

  // Add a new fuel entry
  const handleAddFuel = () => {
    const newId = Math.max(...fuelEntries.map(e => e.id), 0) + 1;
    setFuelEntries(prev => [...prev, { id: newId, fuel: '', amount: '', unit: '' }]);
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
      }
    }
    
    // Check routes in order of specificity (most specific first)
    // 1. Check for /grid, /self-power, /ppa/yes, /ppa/no, or /ppa routes first (most specific - shows step 10)
    if (location.pathname.endsWith('/grid') || location.pathname.endsWith('/self-power') || 
        location.pathname.endsWith('/ppa/yes') || location.pathname.endsWith('/ppa/no') || 
        location.pathname.endsWith('/ppa')) {
      setStep(10);
      // Ensure dataQualityLevel is set if we have the param
      if (dataLevelParam && productTypeParam === 'unwrought' && !dataQualityLevel) {
        const validDataLevels = ['fuels', 'emissions', 'nothing'];
        if (validDataLevels.includes(dataLevelParam)) {
          setDataQualityLevel(slugToDataLevel(dataLevelParam));
        }
      }
      // Set electricity source based on route
      if (location.pathname.endsWith('/grid') && !electricitySource) {
        setElectricitySource('grid');
      } else if (location.pathname.endsWith('/self-power') && !electricitySource) {
        setElectricitySource('self-power');
      } else if ((location.pathname.endsWith('/ppa') || location.pathname.endsWith('/ppa/yes') || location.pathname.endsWith('/ppa/no')) && !electricitySource) {
        setElectricitySource('ppa');
      }
      // Set PPA answer based on route
      if (location.pathname.endsWith('/ppa/yes') && !ppaHasEmissionFactor) {
        setPpaHasEmissionFactor('yes');
      } else if (location.pathname.endsWith('/ppa/no') && !ppaHasEmissionFactor) {
        setPpaHasEmissionFactor('no');
      }
    }
    // 2. Check for /electricity route (but not /grid, /self-power, /ppa, /ppa/yes, or /ppa/no)
    else if (location.pathname.endsWith('/electricity') && 
             !location.pathname.endsWith('/grid') && 
             !location.pathname.endsWith('/self-power') &&
             !location.pathname.endsWith('/ppa') &&
             !location.pathname.endsWith('/ppa/yes') &&
             !location.pathname.endsWith('/ppa/no')) {
      setStep(9);
      // Ensure dataQualityLevel is set if we have the param
      if (dataLevelParam && productTypeParam === 'unwrought' && !dataQualityLevel) {
        const validDataLevels = ['fuels', 'emissions', 'nothing'];
        if (validDataLevels.includes(dataLevelParam)) {
          setDataQualityLevel(slugToDataLevel(dataLevelParam));
        }
      }
    }
    // 3. Check for /slope or /overvoltage route (but not /electricity, /grid, /self-power, /ppa, /ppa/yes, or /ppa/no)
    else if ((location.pathname.endsWith('/slope') || location.pathname.endsWith('/overvoltage')) && 
             !location.pathname.endsWith('/electricity') &&
             !location.pathname.endsWith('/grid') &&
             !location.pathname.endsWith('/self-power') &&
             !location.pathname.endsWith('/ppa') &&
             !location.pathname.endsWith('/ppa/yes') &&
             !location.pathname.endsWith('/ppa/no')) {
      setStep(8);
      // Ensure dataQualityLevel is set if we have the param
      if (dataLevelParam && productTypeParam === 'unwrought' && !dataQualityLevel) {
        const validDataLevels = ['fuels', 'emissions', 'nothing'];
        if (validDataLevels.includes(dataLevelParam)) {
          setDataQualityLevel(slugToDataLevel(dataLevelParam));
        }
      }
    }
    // 4. Check for /pfc route (but not /slope, /overvoltage, /electricity, /grid, /self-power, /ppa, /ppa/yes, or /ppa/no)
    else if (location.pathname.endsWith('/pfc') && 
             !location.pathname.endsWith('/slope') && 
             !location.pathname.endsWith('/overvoltage') &&
             !location.pathname.endsWith('/electricity') &&
             !location.pathname.endsWith('/grid') &&
             !location.pathname.endsWith('/self-power') &&
             !location.pathname.endsWith('/ppa') &&
             !location.pathname.endsWith('/ppa/yes') &&
             !location.pathname.endsWith('/ppa/no')) {
      setStep(7);
      // Ensure dataQualityLevel is set if we have the param
      if (dataLevelParam && productTypeParam === 'unwrought' && !dataQualityLevel) {
        const validDataLevels = ['fuels', 'emissions', 'nothing'];
        if (validDataLevels.includes(dataLevelParam)) {
          setDataQualityLevel(slugToDataLevel(dataLevelParam));
        }
      }
    }
    // 5. Check for /anode-elektrode route (but not /pfc, /slope, /overvoltage, /electricity, /grid, /self-power, /ppa, /ppa/yes, or /ppa/no)
    else if (location.pathname.endsWith('/anode-elektrode') && 
             !location.pathname.endsWith('/pfc') && 
             !location.pathname.endsWith('/slope') &&
             !location.pathname.endsWith('/overvoltage') &&
             !location.pathname.endsWith('/electricity') &&
             !location.pathname.endsWith('/grid') &&
             !location.pathname.endsWith('/self-power') &&
             !location.pathname.endsWith('/ppa') &&
             !location.pathname.endsWith('/ppa/yes') &&
             !location.pathname.endsWith('/ppa/no')) {
      setStep(6);
    }
    // 5. Default to step 5 if we have dataLevelParam but no specific route
    else if (dataLevelParam && productTypeParam === 'unwrought') {
      const validDataLevels = ['fuels', 'emissions', 'nothing'];
      if (dataQualityLevel || validDataLevels.includes(dataLevelParam)) {
        setStep(5);
      }
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
      // Validation: require fuel, unit, and amount for all fuel entries
      if (category === 'Aluminium' && aluminumProductType === 'unwrought' && dataQualityLevel === 'real-data') {
        const allValid = fuelEntries.every(entry => entry.fuel && entry.unit && entry.amount);
        if (!allValid || fuelEntries.length === 0) {
          return; // Validation - all fields required for all entries
        }
        // Navigate to anodes step
        const slug = categoryToSlug(category);
        const productTypeSlug = productTypeToSlug(aluminumProductType);
        const processSlug = processToSlug(productionProcess);
        const dataLevelSlug = dataLevelToSlug(dataQualityLevel);
        navigate(`/dashboard/new-calculation/${slug}/${productTypeSlug}/${processSlug}/${dataLevelSlug}/anode-elektrode`, { replace: true });
      }
      setStep(6); // Go to next step
    } else if (step === 6) {
      // Step 6 is the anodes input form
      // Navigate to PFC step
      if (category === 'Aluminium' && aluminumProductType === 'unwrought' && dataQualityLevel === 'real-data') {
        const slug = categoryToSlug(category);
        const productTypeSlug = productTypeToSlug(aluminumProductType);
        const processSlug = processToSlug(productionProcess);
        const dataLevelSlug = dataLevelToSlug(dataQualityLevel);
        navigate(`/dashboard/new-calculation/${slug}/${productTypeSlug}/${processSlug}/${dataLevelSlug}/anode-elektrode/pfc`, { replace: true });
      }
      setStep(7); // Go to next step (PFC)
    } else if (step === 7) {
      // Step 7 is the PFC method selection
      // Validation: require a method to be selected
      if (!pfcMethod) {
        return; // Validation - method must be selected
      }
      // Navigate based on selected PFC method
      if (category === 'Aluminium' && aluminumProductType === 'unwrought' && dataQualityLevel === 'real-data') {
        const slug = categoryToSlug(category);
        const productTypeSlug = productTypeToSlug(aluminumProductType);
        const processSlug = processToSlug(productionProcess);
        const dataLevelSlug = dataLevelToSlug(dataQualityLevel);
        
        if (pfcMethod === 'anode-effect') {
          // Option "a" - navigate to slope step
          navigate(`/dashboard/new-calculation/${slug}/${productTypeSlug}/${processSlug}/${dataLevelSlug}/anode-elektrode/pfc/slope`, { replace: true });
          setStep(8); // Go to slope step
        } else if (pfcMethod === 'aeo-ce') {
          // Option "b" - navigate to overvoltage step
          navigate(`/dashboard/new-calculation/${slug}/${productTypeSlug}/${processSlug}/${dataLevelSlug}/anode-elektrode/pfc/overvoltage`, { replace: true });
          setStep(8); // Go to overvoltage step (same as slope)
        } else {
          setStep(8);
        }
      } else {
        setStep(8);
      }
    } else if (step === 8) {
      // Step 8 is slope or overvoltage - navigate to electricity
      // Validation: check if required fields are filled based on the method
      if (category === 'Aluminium' && aluminumProductType === 'unwrought' && dataQualityLevel === 'real-data') {
        const slug = categoryToSlug(category);
        const productTypeSlug = productTypeToSlug(aluminumProductType);
        const processSlug = processToSlug(productionProcess);
        const dataLevelSlug = dataLevelToSlug(dataQualityLevel);
        
        // Check which method we're on and validate accordingly
        if (location.pathname.endsWith('/slope')) {
          // Validate slope method fields
          if (!anodeEffectFrequency || !anodeEffectDuration || !primaryAluminumQuantity || !cellTechnology) {
            return; // Validation - all fields required
          }
          navigate(`/dashboard/new-calculation/${slug}/${productTypeSlug}/${processSlug}/${dataLevelSlug}/anode-elektrode/pfc/slope/electricity`, { replace: true });
        } else if (location.pathname.endsWith('/overvoltage')) {
          // Validate overvoltage method fields
          if (!aeo || !ce || !primaryAluminumQuantityOvervoltage || !cellTechnologyOvervoltage) {
            return; // Validation - all fields required
          }
          navigate(`/dashboard/new-calculation/${slug}/${productTypeSlug}/${processSlug}/${dataLevelSlug}/anode-elektrode/pfc/overvoltage/electricity`, { replace: true });
        }
        setStep(9); // Go to electricity step
      } else {
        setStep(9);
      }
    } else if (step === 9 && !location.pathname.endsWith('/grid') && !location.pathname.endsWith('/self-power') && !location.pathname.endsWith('/ppa') && !location.pathname.endsWith('/ppa/yes') && !location.pathname.endsWith('/ppa/no')) {
      // Step 9 is electricity source selection - navigate based on selection
      if (!electricitySource) {
        return; // Validation - source must be selected
      }
      
      if (category === 'Aluminium' && aluminumProductType === 'unwrought' && dataQualityLevel === 'real-data') {
        const slug = categoryToSlug(category);
        const productTypeSlug = productTypeToSlug(aluminumProductType);
        const processSlug = processToSlug(productionProcess);
        const dataLevelSlug = dataLevelToSlug(dataQualityLevel);
        
        // Determine base path (slope or overvoltage)
        let basePath = '';
        if (location.pathname.includes('/slope/electricity')) {
          basePath = `/dashboard/new-calculation/${slug}/${productTypeSlug}/${processSlug}/${dataLevelSlug}/anode-elektrode/pfc/slope/electricity`;
        } else if (location.pathname.includes('/overvoltage/electricity')) {
          basePath = `/dashboard/new-calculation/${slug}/${productTypeSlug}/${processSlug}/${dataLevelSlug}/anode-elektrode/pfc/overvoltage/electricity`;
        } else {
          basePath = `/dashboard/new-calculation/${slug}/${productTypeSlug}/${processSlug}/${dataLevelSlug}/anode-elektrode/pfc/electricity`;
        }
        
        // Navigate based on selection
        if (electricitySource === 'grid') {
          navigate(`${basePath}/grid`, { replace: true });
        } else if (electricitySource === 'self-power') {
          navigate(`${basePath}/self-power`, { replace: true });
        } else if (electricitySource === 'ppa') {
          navigate(`${basePath}/ppa`, { replace: true });
        }
        setStep(10);
      } else {
        setStep(10);
      }
    } else if (step === 10 && location.pathname.endsWith('/ppa') && !location.pathname.endsWith('/ppa/yes') && !location.pathname.endsWith('/ppa/no')) {
      // Step 10 on /ppa - navigate based on answer
      if (!ppaHasEmissionFactor) {
        return; // Validation - answer must be selected
      }
      
      if (category === 'Aluminium' && aluminumProductType === 'unwrought' && dataQualityLevel === 'real-data') {
        const slug = categoryToSlug(category);
        const productTypeSlug = productTypeToSlug(aluminumProductType);
        const processSlug = processToSlug(productionProcess);
        const dataLevelSlug = dataLevelToSlug(dataQualityLevel);
        
        // Determine base path (slope or overvoltage)
        let basePath = '';
        if (location.pathname.includes('/slope/electricity')) {
          basePath = `/dashboard/new-calculation/${slug}/${productTypeSlug}/${processSlug}/${dataLevelSlug}/anode-elektrode/pfc/slope/electricity/ppa`;
        } else if (location.pathname.includes('/overvoltage/electricity')) {
          basePath = `/dashboard/new-calculation/${slug}/${productTypeSlug}/${processSlug}/${dataLevelSlug}/anode-elektrode/pfc/overvoltage/electricity/ppa`;
        } else {
          basePath = `/dashboard/new-calculation/${slug}/${productTypeSlug}/${processSlug}/${dataLevelSlug}/anode-elektrode/pfc/electricity/ppa`;
        }
        
        // Navigate based on answer
        if (ppaHasEmissionFactor === 'yes') {
          navigate(`${basePath}/yes`, { replace: true });
        } else if (ppaHasEmissionFactor === 'no') {
          navigate(`${basePath}/no`, { replace: true });
        }
      }
    }
  };

  const handleBack = () => {
    if (step === 10) {
      // Going back from step 10 (grid/self-power/ppa/yes/ppa/no) to step 9 (electricity) or /ppa
      if (category === 'Aluminium' && aluminumProductType === 'unwrought' && dataQualityLevel === 'real-data') {
        const slug = categoryToSlug(category);
        const productTypeSlug = productTypeToSlug(aluminumProductType);
        const processSlug = processToSlug(productionProcess);
        const dataLevelSlug = dataLevelToSlug(dataQualityLevel);
        
        // If on /ppa/yes or /ppa/no, go back to /ppa
        if (location.pathname.endsWith('/ppa/yes') || location.pathname.endsWith('/ppa/no')) {
          if (location.pathname.includes('/slope/electricity')) {
            navigate(`/dashboard/new-calculation/${slug}/${productTypeSlug}/${processSlug}/${dataLevelSlug}/anode-elektrode/pfc/slope/electricity/ppa`, { replace: true });
          } else if (location.pathname.includes('/overvoltage/electricity')) {
            navigate(`/dashboard/new-calculation/${slug}/${productTypeSlug}/${processSlug}/${dataLevelSlug}/anode-elektrode/pfc/overvoltage/electricity/ppa`, { replace: true });
          } else {
            navigate(`/dashboard/new-calculation/${slug}/${productTypeSlug}/${processSlug}/${dataLevelSlug}/anode-elektrode/pfc/electricity/ppa`, { replace: true });
          }
          setPpaHasEmissionFactor('');
          return;
        }
        
        // Remove /grid, /self-power, or /ppa from URL
        if (location.pathname.includes('/slope/electricity')) {
          navigate(`/dashboard/new-calculation/${slug}/${productTypeSlug}/${processSlug}/${dataLevelSlug}/anode-elektrode/pfc/slope/electricity`, { replace: true });
        } else if (location.pathname.includes('/overvoltage/electricity')) {
          navigate(`/dashboard/new-calculation/${slug}/${productTypeSlug}/${processSlug}/${dataLevelSlug}/anode-elektrode/pfc/overvoltage/electricity`, { replace: true });
        } else {
          navigate(`/dashboard/new-calculation/${slug}/${productTypeSlug}/${processSlug}/${dataLevelSlug}/anode-elektrode/pfc/electricity`, { replace: true });
        }
      }
      setStep(9);
    } else if (step === 9) {
      // Going back from step 9 (electricity) to step 8 (slope or overvoltage)
      if (category === 'Aluminium' && aluminumProductType === 'unwrought' && dataQualityLevel === 'real-data') {
        const slug = categoryToSlug(category);
        const productTypeSlug = productTypeToSlug(aluminumProductType);
        const processSlug = processToSlug(productionProcess);
        const dataLevelSlug = dataLevelToSlug(dataQualityLevel);
        
        // Determine which method we came from (slope or overvoltage)
        if (location.pathname.includes('/slope/electricity')) {
          navigate(`/dashboard/new-calculation/${slug}/${productTypeSlug}/${processSlug}/${dataLevelSlug}/anode-elektrode/pfc/slope`, { replace: true });
        } else if (location.pathname.includes('/overvoltage/electricity')) {
          navigate(`/dashboard/new-calculation/${slug}/${productTypeSlug}/${processSlug}/${dataLevelSlug}/anode-elektrode/pfc/overvoltage`, { replace: true });
        }
      }
      setStep(8);
    } else if (step === 8) {
      // Going back from step 8 (slope or overvoltage) to step 7 (PFC)
      if (category === 'Aluminium' && aluminumProductType === 'unwrought' && dataQualityLevel === 'real-data') {
        // Remove /slope or /overvoltage from URL
        const slug = categoryToSlug(category);
        const productTypeSlug = productTypeToSlug(aluminumProductType);
        const processSlug = processToSlug(productionProcess);
        const dataLevelSlug = dataLevelToSlug(dataQualityLevel);
        navigate(`/dashboard/new-calculation/${slug}/${productTypeSlug}/${processSlug}/${dataLevelSlug}/anode-elektrode/pfc`, { replace: true });
      }
      setStep(7);
    } else if (step === 7) {
      // Going back from step 7 (PFC) to step 6 (anodes)
      if (category === 'Aluminium' && aluminumProductType === 'unwrought' && dataQualityLevel === 'real-data') {
        // Remove /pfc from URL
        const slug = categoryToSlug(category);
        const productTypeSlug = productTypeToSlug(aluminumProductType);
        const processSlug = processToSlug(productionProcess);
        const dataLevelSlug = dataLevelToSlug(dataQualityLevel);
        navigate(`/dashboard/new-calculation/${slug}/${productTypeSlug}/${processSlug}/${dataLevelSlug}/anode-elektrode`, { replace: true });
      }
      setStep(6);
    } else if (step === 6) {
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
                {fuelEntries.map((entry) => (
                  <Box key={entry.id} sx={{ mb: 3 }}>
                    <Grid container spacing={3} alignItems="flex-start">
                      <Grid size={{ xs: 12, md: 5 }}>
                        <FormControl fullWidth>
                          <InputLabel>Vrsta goriva</InputLabel>
                          <Select
                            value={entry.fuel}
                            label="Vrsta goriva"
                            onChange={(e) => handleFuelChange(entry.id, e.target.value)}
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
                          value={entry.amount}
                          onChange={(e) => handleFuelAmountChange(entry.id, e.target.value)}
                          slotProps={{ htmlInput: { min: 0, step: 'any' } }}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, md: 3 }}>
                        <FormControl fullWidth disabled={!entry.fuel}>
                          <InputLabel>Jedinica</InputLabel>
                          <Select
                            value={entry.unit}
                            label="Jedinica"
                            onChange={(e) => handleFuelUnitChange(entry.id, e.target.value)}
                          >
                            {entry.fuel && (
                              <MenuItem value={getFuelUnit(entry.fuel)}>
                                {getFuelUnit(entry.fuel)}
                              </MenuItem>
                            )}
                          </Select>
                        </FormControl>
                      </Grid>
                      {entry.fuel && entry.unit && entry.amount && (
                        <Grid size={12}>
                          <Paper elevation={1} sx={{ p: 2, mt: 1, backgroundColor: 'primary.50', border: '1px solid', borderColor: 'primary.200' }}>
                            <Typography variant="body2" color="text.secondary">
                              <strong>Emisijski faktor:</strong> {getFuelEmissionFactor(entry.fuel)} kg CO₂e / {entry.unit}
                            </Typography>
                            <Typography variant="body1" sx={{ mt: 1, fontWeight: 600 }}>
                              <strong>Izračunate emisije:</strong> {(Number.parseFloat(entry.amount) * getFuelEmissionFactor(entry.fuel)).toFixed(2)} kg CO₂e
                            </Typography>
                          </Paper>
                        </Grid>
                      )}
                    </Grid>
                  </Box>
                ))}
                <Box sx={{ mt: 2, mb: 3 }}>
                  <Button
                    variant="outlined"
                    onClick={handleAddFuel}
                    startIcon={<Add />}
                    sx={{ mr: 2 }}
                  >
                    Add another fuel
                  </Button>
                </Box>
                {fuelEntries.some(entry => entry.fuel && entry.unit && entry.amount) && (
                  <Box sx={{ mt: 2 }}>
                    <Paper elevation={1} sx={{ p: 2, backgroundColor: 'success.50', border: '1px solid', borderColor: 'success.200' }}>
                      <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
                        Ukupne izračunate emisije:
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600, fontSize: '1.2rem' }}>
                        {fuelEntries
                          .filter(entry => entry.fuel && entry.unit && entry.amount)
                          .reduce((total, entry) => {
                            const amount = Number.parseFloat(entry.amount) || 0;
                            const factor = getFuelEmissionFactor(entry.fuel);
                            return total + (amount * factor);
                          }, 0)
                          .toFixed(2)} kg CO₂e
                      </Typography>
                    </Paper>
                  </Box>
                )}
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
                <Typography variant="body1" sx={{ mb: 2, fontWeight: 500 }}>
                  Kolika je količina potrošenih anoda?
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 8 }}>
                <TextField
                  fullWidth
                  label="Količina anoda"
                  type="number"
                  value={anodesQuantity}
                  onChange={(e) => setAnodesQuantity(e.target.value)}
                  slotProps={{ htmlInput: { min: 0, step: 'any' } }}
                  helperText="Unesite količinu u tonama (tonnes)"
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <FormControl fullWidth>
                  <InputLabel>Jedinica</InputLabel>
                  <Select
                    value="tonnes"
                    label="Jedinica"
                    disabled
                  >
                    <MenuItem value="tonnes">tonnes</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={12} sx={{ mt: 3 }}>
                <Typography variant="body1" sx={{ mb: 2, fontWeight: 500 }}>
                  Da li imaš podatak o procentu (%) ugljika u anodama?
                </Typography>
                <FormControl component="fieldset" fullWidth>
                  <RadioGroup
                    value={hasCarbonPercentage}
                    onChange={(e) => setHasCarbonPercentage(e.target.value)}
                    row
                  >
                    <FormControlLabel
                      value="yes"
                      control={<Radio />}
                      label="Da"
                      sx={{ mr: 3 }}
                    />
                    <FormControlLabel
                      value="no"
                      control={<Radio />}
                      label="Ne"
                    />
                  </RadioGroup>
                </FormControl>
              </Grid>
              {hasCarbonPercentage === 'yes' && (
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Procenat ugljika (%)"
                    type="number"
                    value={carbonPercentage}
                    onChange={(e) => setCarbonPercentage(e.target.value)}
                    slotProps={{ htmlInput: { min: 0, max: 100, step: 'any' } }}
                    helperText="Unesite procenat ugljika u anodama"
                  />
                </Grid>
              )}
              {anodesQuantity && (
                <Grid size={12} sx={{ mt: 2 }}>
                  <Paper elevation={1} sx={{ p: 2, backgroundColor: 'primary.50', border: '1px solid', borderColor: 'primary.200' }}>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      <strong>Izračunate emisije:</strong>{' '}
                      {(() => {
                        const amount = Number.parseFloat(anodesQuantity) || 0;
                        if (hasCarbonPercentage === 'yes' && carbonPercentage) {
                          const percent = Number.parseFloat(carbonPercentage) || 0;
                          return (amount * (percent / 100) * (44 / 12)).toFixed(2);
                        } else if (hasCarbonPercentage === 'no') {
                          return (amount * (44 / 12)).toFixed(2);
                        }
                        return '0.00';
                      })()}{' '}
                      tonnes kg CO₂e
                    </Typography>
                  </Paper>
                </Grid>
              )}
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

        {step === 7 && (
          <>
            <Typography variant="body1" sx={{ mb: 3 }}>
              Kako bismo odabrali odgovarajuću CBAM-kompatibilnu metodu za izračun PFC emisija iz primarne proizvodnje aluminija, trebamo potvrditi koje podatke imate dostupne iz vašeg sistema upravljanja procesom:
            </Typography>
            <Grid container spacing={3}>
              <Grid size={12}>
                <FormControl component="fieldset" fullWidth>
                  <RadioGroup
                    value={pfcMethod}
                    onChange={(e) => setPfcMethod(e.target.value)}
                  >
                    <FormControlLabel
                      value="anode-effect"
                      control={<Radio />}
                      label={
                        <Typography variant="body1">
                          <strong>a)</strong> Frekvencija anode effecta (broj anode effecta po ćeliji po danu – number of anode effects / cell-day) i prosječno trajanje anode effecta (u minutama po pojavi – anode effect minutes / occurrence).
                        </Typography>
                      }
                      sx={{ mb: 2, alignItems: 'flex-start' }}
                    />
                    <FormControlLabel
                      value="aeo-ce"
                      control={<Radio />}
                      label={
                        <Typography variant="body1">
                          <strong>b)</strong> AEO – Anode Effect Overvoltage po ćeliji (izražen u mV; predstavlja vremenski integrisani višak napona iznad ciljnog napona) i CE – Current Efficiency (prosječna strujna efikasnost proizvodnje aluminija, u %).
                        </Typography>
                      }
                      sx={{ alignItems: 'flex-start' }}
                    />
                  </RadioGroup>
                </FormControl>
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

        {step === 8 && (
          <>
            {location.pathname.endsWith('/overvoltage') ? (
              // Overvoltage method (option b) form
              <Grid container spacing={3}>
                <Grid size={12}>
                  <Typography variant="body1" sx={{ mb: 2, fontWeight: 500 }}>
                    1) Kolika je vrijednost AEO – Anode Effect Overvoltage po ćeliji?
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    AEO se izražava u mV i predstavlja vremenski integrisani višak napona iznad ciljnog napona, izračunat kao integral [vrijeme × napon iznad ciljnog napona] podijeljen s ukupnim vremenom prikupljanja podataka.
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, md: 8 }}>
                      <TextField
                        fullWidth
                        label="AEO – Anode Effect Overvoltage"
                        type="number"
                        value={aeo}
                        onChange={(e) => setAeo(e.target.value)}
                        slotProps={{ htmlInput: { min: 0, step: 'any' } }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <FormControl fullWidth>
                        <InputLabel>Jedinica</InputLabel>
                        <Select
                          value="mV"
                          label="Jedinica"
                          disabled
                        >
                          <MenuItem value="mV">mV</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>
                </Grid>
                <Grid size={12}>
                  <Typography variant="body1" sx={{ mb: 2, fontWeight: 500 }}>
                    2) Kolika je prosječna strujna efikasnost (CE – Current Efficiency) proizvodnje aluminija?
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, md: 8 }}>
                      <TextField
                        fullWidth
                        label="CE – Current Efficiency"
                        type="number"
                        value={ce}
                        onChange={(e) => setCe(e.target.value)}
                        slotProps={{ htmlInput: { min: 0, max: 100, step: 'any' } }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <FormControl fullWidth>
                        <InputLabel>Jedinica</InputLabel>
                        <Select
                          value="%"
                          label="Jedinica"
                          disabled
                        >
                          <MenuItem value="%">%</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>
                </Grid>
                <Grid size={12}>
                  <Typography variant="body1" sx={{ mb: 2, fontWeight: 500 }}>
                    3) Kolika je ukupna količina proizvedenog primarnog aluminija u posmatranom periodu?
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, md: 8 }}>
                      <TextField
                        fullWidth
                        label="Količina primarnog aluminija"
                        type="number"
                        value={primaryAluminumQuantityOvervoltage}
                        onChange={(e) => setPrimaryAluminumQuantityOvervoltage(e.target.value)}
                        slotProps={{ htmlInput: { min: 0, step: 'any' } }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <FormControl fullWidth>
                        <InputLabel>Jedinica</InputLabel>
                        <Select
                          value="tonnes"
                          label="Jedinica"
                          disabled
                        >
                          <MenuItem value="tonnes">tonnes</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>
                </Grid>
                <Grid size={12}>
                  <Typography variant="body1" sx={{ mb: 2, fontWeight: 500 }}>
                    4) Koju tehnologiju elektrolitičkih ćelija koristite?
                  </Typography>
                  <FormControl component="fieldset" fullWidth>
                    <RadioGroup
                      value={cellTechnologyOvervoltage}
                      onChange={(e) => setCellTechnologyOvervoltage(e.target.value)}
                    >
                      <FormControlLabel
                        value="cwpb"
                        control={<Radio />}
                        label="Centre Worked Prebake (CWPB)"
                        sx={{ mb: 1 }}
                      />
                      <FormControlLabel
                        value="swpb"
                        control={<Radio />}
                        label="Side Worked Prebake (SWPB)"
                      />
                    </RadioGroup>
                  </FormControl>
                </Grid>
                {aeo && ce && primaryAluminumQuantityOvervoltage && cellTechnologyOvervoltage && (
                  <Grid size={12} sx={{ mt: 2 }}>
                    <Paper elevation={1} sx={{ p: 2, backgroundColor: 'primary.50', border: '1px solid', borderColor: 'primary.200' }}>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        <strong>Izračunate PFC emisije:</strong>{' '}
                        {calculatePfcEmissionsOvervoltage().toFixed(2)} tonnes CO₂e
                      </Typography>
                    </Paper>
                  </Grid>
                )}
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
            ) : (
              // Slope method (option a) form
              <Grid container spacing={3}>
                <Grid size={12}>
                  <Typography variant="body1" sx={{ mb: 2, fontWeight: 500 }}>
                    1) Koja je frekvencija anode effecta?
                  </Typography>
                  <TextField
                    fullWidth
                    label="Frekvencija anode effecta"
                    type="number"
                    value={anodeEffectFrequency}
                    onChange={(e) => setAnodeEffectFrequency(e.target.value)}
                    slotProps={{ htmlInput: { min: 0, step: 'any' } }}
                    helperText="Jedinica: number anode effects / cell-day"
                  />
                </Grid>
                <Grid size={12}>
                  <Typography variant="body1" sx={{ mb: 2, fontWeight: 500 }}>
                    2) Koje je prosječno trajanje jednog anode effecta?
                  </Typography>
                  <TextField
                    fullWidth
                    label="Prosječno trajanje anode effecta"
                    type="number"
                    value={anodeEffectDuration}
                    onChange={(e) => setAnodeEffectDuration(e.target.value)}
                    slotProps={{ htmlInput: { min: 0, step: 'any' } }}
                    helperText="Jedinica: anode effect minutes / occurrence"
                  />
                </Grid>
                <Grid size={12}>
                  <Typography variant="body1" sx={{ mb: 2, fontWeight: 500 }}>
                    3) Kolika je ukupna količina proizvedenog primarnog aluminija u posmatranom periodu?
                  </Typography>
                  <Grid container spacing={3}>
                    <Grid size={{ xs: 12, md: 8 }}>
                      <TextField
                        fullWidth
                        label="Količina primarnog aluminija"
                        type="number"
                        value={primaryAluminumQuantity}
                        onChange={(e) => setPrimaryAluminumQuantity(e.target.value)}
                        slotProps={{ htmlInput: { min: 0, step: 'any' } }}
                        helperText="Unesite količinu u tonama (tonnes)"
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <FormControl fullWidth>
                        <InputLabel>Jedinica</InputLabel>
                        <Select
                          value="tonnes"
                          label="Jedinica"
                          disabled
                        >
                          <MenuItem value="tonnes">tonnes</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>
                </Grid>
                <Grid size={12}>
                  <Typography variant="body1" sx={{ mb: 2, fontWeight: 500 }}>
                    4) Koju tehnologiju elektrolitičkih ćelija koristite?
                  </Typography>
                  <FormControl component="fieldset" fullWidth>
                    <RadioGroup
                      value={cellTechnology}
                      onChange={(e) => setCellTechnology(e.target.value)}
                    >
                      <FormControlLabel
                        value="pfpb-l"
                        control={<Radio />}
                        label="Legacy Point Feed Pre Bake (PFPB L)"
                        sx={{ mb: 1 }}
                      />
                      <FormControlLabel
                        value="pfpb-m"
                        control={<Radio />}
                        label="Modern Point Feed Pre Bake (PFPB M)"
                        sx={{ mb: 1 }}
                      />
                      <FormControlLabel
                        value="pfpb-mw"
                        control={<Radio />}
                        label="Modern Point-Fed Prebake without fully automated anode effect intervention strategies for PFC emissions (PFPB MW)"
                        sx={{ mb: 1 }}
                      />
                      <FormControlLabel
                        value="cwpb"
                        control={<Radio />}
                        label="Centre Worked Prebake (CWPB)"
                        sx={{ mb: 1 }}
                      />
                      <FormControlLabel
                        value="swpb"
                        control={<Radio />}
                        label="Side Worked Prebake (SWPB)"
                        sx={{ mb: 1 }}
                      />
                      <FormControlLabel
                        value="vss"
                        control={<Radio />}
                        label="Vertical Stud Søderberg (VSS)"
                        sx={{ mb: 1 }}
                      />
                      <FormControlLabel
                        value="hss"
                        control={<Radio />}
                        label="Horizontal Stud Søderberg (HSS)"
                      />
                    </RadioGroup>
                  </FormControl>
                </Grid>
                {anodeEffectFrequency && anodeEffectDuration && primaryAluminumQuantity && cellTechnology && (
                  <Grid size={12} sx={{ mt: 2 }}>
                    {cellTechnology === 'pfpb-mw' ? (
                      <Paper elevation={1} sx={{ p: 2, backgroundColor: 'warning.50', border: '1px solid', borderColor: 'warning.200' }}>
                        <Typography variant="body1" sx={{ fontWeight: 600, color: 'warning.dark' }}>
                          Izračun nije dozvoljen za Modern Point-Fed Prebake without fully automated anode effect intervention strategies for PFC emissions (PFPB MW).
                        </Typography>
                      </Paper>
                    ) : (
                      <Paper elevation={1} sx={{ p: 2, backgroundColor: 'primary.50', border: '1px solid', borderColor: 'primary.200' }}>
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>
                          <strong>Izračunate PFC emisije:</strong>{' '}
                          {calculatePfcEmissions().toFixed(2)} tonnes CO₂e
                        </Typography>
                      </Paper>
                    )}
                  </Grid>
                )}
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
            )}
          </>
        )}

        {step === 9 && !location.pathname.endsWith('/grid') && !location.pathname.endsWith('/self-power') && !location.pathname.endsWith('/ppa') && (
          <>
            <Grid container spacing={3}>
              <Grid size={12}>
                <Typography variant="body1" sx={{ mb: 2, fontWeight: 500 }}>
                  Pitanje: Odakle dolazi električna energija?
                </Typography>
                <FormControl component="fieldset" fullWidth>
                  <RadioGroup
                    value={electricitySource}
                    onChange={(e) => setElectricitySource(e.target.value)}
                  >
                    <FormControlLabel
                      value="grid"
                      control={<Radio />}
                      label="Iz mreže"
                      sx={{ mb: 1 }}
                    />
                    <FormControlLabel
                      value="self-power"
                      control={<Radio />}
                      label="Sopstvena elektrana u okviru postrojenja"
                      sx={{ mb: 1 }}
                    />
                    <FormControlLabel
                      value="ppa"
                      control={<Radio />}
                      label="Poseban PPA (Power Purchase Agreement)"
                    />
                  </RadioGroup>
                </FormControl>
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

        {step === 10 && location.pathname.endsWith('/grid') && (
          <>
            <Grid container spacing={3}>
              <Grid size={12}>
                <Typography variant="body1" sx={{ mb: 2, fontWeight: 500 }}>
                  Unos potrošnje: kWh/MWh
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Alat množi s default grid faktorom za državu
                </Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, md: 8 }}>
                    <TextField
                      fullWidth
                      label="Potrošnja"
                      type="number"
                      value={gridConsumption}
                      onChange={(e) => setGridConsumption(e.target.value)}
                      slotProps={{ htmlInput: { min: 0, step: 'any' } }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <FormControl fullWidth>
                      <InputLabel>Jedinica</InputLabel>
                      <Select
                        value={gridConsumptionUnit}
                        label="Jedinica"
                        onChange={(e) => setGridConsumptionUnit(e.target.value)}
                      >
                        <MenuItem value="kWh">kWh</MenuItem>
                        <MenuItem value="MWh">MWh</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </Grid>
              {gridConsumption && (
                <Grid size={12} sx={{ mt: 2 }}>
                  <Paper elevation={1} sx={{ p: 2, backgroundColor: 'primary.50', border: '1px solid', borderColor: 'primary.200' }}>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      <strong>Izračunate emisije:</strong>{' '}
                      {calculateGridEmissions().toFixed(2)} kg CO₂e
                    </Typography>
                  </Paper>
                </Grid>
              )}
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

        {step === 10 && location.pathname.endsWith('/self-power') && (
          <>
            <Grid container spacing={3}>
              <Grid size={12}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  SOPSTVENA ELEKTRANA
                </Typography>
                <Typography variant="body1" sx={{ mb: 2, fontWeight: 500 }}>
                  Dodatna pitanja:
                </Typography>
                <Typography variant="body1" sx={{ mb: 2, fontWeight: 500 }}>
                  Tip goriva u elektrani
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Alat izračuna specifični faktor t CO₂/kWh za tu elektranu, pa množi s kWh potrošnje
                </Typography>
                <FormControl component="fieldset" fullWidth sx={{ mb: 3 }}>
                  <RadioGroup
                    value={selfPowerFuelType}
                    onChange={(e) => setSelfPowerFuelType(e.target.value)}
                  >
                    <FormControlLabel
                      value="ugalj"
                      control={<Radio />}
                      label="Ugalj"
                      sx={{ mb: 1 }}
                    />
                    <FormControlLabel
                      value="prirodni-gas"
                      control={<Radio />}
                      label="Prirodni gas"
                      sx={{ mb: 1 }}
                    />
                    <FormControlLabel
                      value="loz-ulje"
                      control={<Radio />}
                      label="Loz ulje"
                      sx={{ mb: 1 }}
                    />
                    <FormControlLabel
                      value="mazut"
                      control={<Radio />}
                      label="Mazut"
                      sx={{ mb: 1 }}
                    />
                    <FormControlLabel
                      value="biomasa"
                      control={<Radio />}
                      label="Biomasa"
                      sx={{ mb: 1 }}
                    />
                    <FormControlLabel
                      value="biogas"
                      control={<Radio />}
                      label="Biogas"
                      sx={{ mb: 1 }}
                    />
                    <FormControlLabel
                      value="obnovljivi"
                      control={<Radio />}
                      label="Obnovljivi izvori (solari, vjetroelektrana, hidroelektrana..)"
                    />
                  </RadioGroup>
                </FormControl>
                <Typography variant="body1" sx={{ mb: 2, fontWeight: 500 }}>
                  Potrošnja (kWh)
                </Typography>
                <TextField
                  fullWidth
                  label="Potrošnja"
                  type="number"
                  value={selfPowerConsumption}
                  onChange={(e) => setSelfPowerConsumption(e.target.value)}
                  slotProps={{ htmlInput: { min: 0, step: 'any' } }}
                  helperText="Unesite potrošnju u kWh"
                />
              </Grid>
              {selfPowerFuelType && selfPowerConsumption && (
                <Grid size={12} sx={{ mt: 2 }}>
                  <Paper elevation={1} sx={{ p: 2, backgroundColor: 'primary.50', border: '1px solid', borderColor: 'primary.200' }}>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      <strong>Izračunate emisije:</strong>{' '}
                      {calculateSelfPowerEmissions().toFixed(2)} kg CO₂e
                    </Typography>
                  </Paper>
                </Grid>
              )}
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

        {step === 10 && (location.pathname.endsWith('/ppa') || location.pathname.endsWith('/ppa/yes') || location.pathname.endsWith('/ppa/no')) && (
          <>
            <Grid container spacing={3}>
              {location.pathname.endsWith('/ppa') && !location.pathname.endsWith('/ppa/yes') && !location.pathname.endsWith('/ppa/no') ? (
                // Show question first
                <>
                  <Grid size={12}>
                    <Typography variant="body1" sx={{ mb: 2, fontWeight: 500 }}>
                      Pitanje: Da li imaš emisioni faktor iz tog PPA (verifikovan)?
                    </Typography>
                    <FormControl component="fieldset" fullWidth>
                      <RadioGroup
                        value={ppaHasEmissionFactor}
                        onChange={(e) => setPpaHasEmissionFactor(e.target.value)}
                      >
                        <FormControlLabel
                          value="yes"
                          control={<Radio />}
                          label="DA"
                          sx={{ mb: 1 }}
                        />
                        <FormControlLabel
                          value="no"
                          control={<Radio />}
                          label="NE"
                        />
                      </RadioGroup>
                    </FormControl>
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
                        disabled={!ppaHasEmissionFactor}
                      >
                        Next
                      </Button>
                    </Box>
                  </Grid>
                </>
              ) : ppaHasEmissionFactor === 'yes' ? (
                // If YES: show emission factor input and consumption
                <>
                  <Grid size={12}>
                    <Typography variant="body1" sx={{ mb: 2, fontWeight: 500 }}>
                      Unos emisionog faktora i potrošnje
                    </Typography>
                    <Grid container spacing={2} sx={{ mb: 3 }}>
                      <Grid size={12}>
                        <Typography variant="body1" sx={{ mb: 1, fontWeight: 500 }}>
                          Emisioni faktor
                        </Typography>
                        <Grid container spacing={2}>
                          <Grid size={{ xs: 12, md: 8 }}>
                            <TextField
                              fullWidth
                              label="Emisioni faktor"
                              type="number"
                              value={ppaEmissionFactor}
                              onChange={(e) => setPpaEmissionFactor(e.target.value)}
                              slotProps={{ htmlInput: { min: 0, step: 'any' } }}
                            />
                          </Grid>
                          <Grid size={{ xs: 12, md: 4 }}>
                            <FormControl fullWidth>
                              <InputLabel>Jedinica</InputLabel>
                              <Select
                                value="kgCO2/kWh"
                                label="Jedinica"
                                disabled
                              >
                                <MenuItem value="kgCO2/kWh">kgCO2/kWh</MenuItem>
                              </Select>
                            </FormControl>
                          </Grid>
                        </Grid>
                      </Grid>
                      <Grid size={12}>
                        <Typography variant="body1" sx={{ mb: 1, fontWeight: 500 }}>
                          Potrošnja
                        </Typography>
                        <Grid container spacing={2}>
                          <Grid size={{ xs: 12, md: 8 }}>
                            <TextField
                              fullWidth
                              label="Potrošnja"
                              type="number"
                              value={ppaConsumption}
                              onChange={(e) => setPpaConsumption(e.target.value)}
                              slotProps={{ htmlInput: { min: 0, step: 'any' } }}
                            />
                          </Grid>
                          <Grid size={{ xs: 12, md: 4 }}>
                            <FormControl fullWidth>
                              <InputLabel>Jedinica</InputLabel>
                              <Select
                                value={ppaConsumptionUnit}
                                label="Jedinica"
                                onChange={(e) => setPpaConsumptionUnit(e.target.value)}
                              >
                                <MenuItem value="kWh">kWh</MenuItem>
                                <MenuItem value="MWh">MWh</MenuItem>
                              </Select>
                            </FormControl>
                          </Grid>
                        </Grid>
                      </Grid>
                    </Grid>
                  </Grid>
                  {ppaEmissionFactor && ppaConsumption && (
                    <Grid size={12} sx={{ mt: 2 }}>
                      <Paper elevation={1} sx={{ p: 2, backgroundColor: 'primary.50', border: '1px solid', borderColor: 'primary.200' }}>
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>
                          <strong>Izračunate emisije:</strong>{' '}
                          {calculatePpaEmissions().toFixed(2)} kg CO₂e
                        </Typography>
                      </Paper>
                    </Grid>
                  )}
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
                </>
              ) : (
                // If NO: show same form as /grid
                <>
                  <Grid size={12}>
                    <Typography variant="body1" sx={{ mb: 2, fontWeight: 500 }}>
                      Unos potrošnje: kWh/MWh
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Alat množi s default grid faktorom za državu
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 12, md: 8 }}>
                        <TextField
                          fullWidth
                          label="Potrošnja"
                          type="number"
                          value={ppaConsumption}
                          onChange={(e) => setPpaConsumption(e.target.value)}
                          slotProps={{ htmlInput: { min: 0, step: 'any' } }}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, md: 4 }}>
                        <FormControl fullWidth>
                          <InputLabel>Jedinica</InputLabel>
                          <Select
                            value={ppaConsumptionUnit}
                            label="Jedinica"
                            onChange={(e) => setPpaConsumptionUnit(e.target.value)}
                          >
                            <MenuItem value="kWh">kWh</MenuItem>
                            <MenuItem value="MWh">MWh</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                    </Grid>
                  </Grid>
                  {ppaConsumption && (
                    <Grid size={12} sx={{ mt: 2 }}>
                      <Paper elevation={1} sx={{ p: 2, backgroundColor: 'primary.50', border: '1px solid', borderColor: 'primary.200' }}>
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>
                          <strong>Izračunate emisije:</strong>{' '}
                          {calculatePpaEmissions().toFixed(2)} kg CO₂e
                        </Typography>
                      </Paper>
                    </Grid>
                  )}
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
                </>
              )}
            </Grid>
          </>
        )}
      </Paper>
    </Container>
  );
};

export default NewCalculation;


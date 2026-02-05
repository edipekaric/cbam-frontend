import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  CircularProgress,
} from '@mui/material';
import {
  ArrowBack,
  ArrowForward,
  Add,
} from '@mui/icons-material';
import { useProductCategories } from './hooks/useProductCategories';
import { useQuestionsByStep, type QuestionWithOptions } from './hooks/useQuestionsByStep';
import { useCalculationAnswers } from './hooks/useCalculationAnswers';
import { apiRequest } from './utils/api';
import { getStepCode, optionCodeToFrontendState, frontendStateToOptionCode } from './utils/questionStepMapping';
import { DynamicQuestionStep } from './components/DynamicQuestionStep';
import { getAllQuestions } from './api/questions';
import {
  getLookupSectors,
  getLookupSubsectors,
  getLookupSubsubsectors,
  getLookupEmissionFactorNames,
  getLookupDenominators,
  getLookupId,
} from './api/emissionFactors';

const NewCalculation: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { categoryParam, productTypeParam, processParam, dataLevelParam } = useParams<{ categoryParam?: string; productTypeParam?: string; processParam?: string; dataLevelParam?: string }>();
  const { categoryNames, categories: productCategories, loading: categoriesLoading, error: categoriesError } = useProductCategories();
  const [category, setCategory] = useState('');
  const [productName, setProductName] = useState('');
  const [step, setStep] = useState(1);
  const CBAM_CALC_ID_KEY = 'cbam-new-calculation-id';
  const [calculationId, setCalculationId] = useState<number | null>(() => {
    const fromState = (location.state as { calculationId?: number } | null)?.calculationId;
    if (fromState != null) return fromState;
    if (location.pathname.includes('/new-calculation')) {
      const stored = sessionStorage.getItem('cbam-new-calculation-id');
      if (stored) {
        const n = parseInt(stored, 10);
        if (!Number.isNaN(n)) return n;
      }
    }
    return null;
  });
  const [createError, setCreateError] = useState<string | null>(null);
  const [createLoading, setCreateLoading] = useState(false);
  const [calculationLoading, setCalculationLoading] = useState(false);
  const [aluminumProductType, setAluminumProductType] = useState('');
  const [aluminumProductSubtype, setAluminumProductSubtype] = useState('');
  const [productionProcess, setProductionProcess] = useState('');
  const [dataQualityLevel, setDataQualityLevel] = useState('');
  
  // Fuel input state - array of fuel entries (emission factor from API lookups)
  interface FuelEntry {
    id: number;
    sector: string;
    subsector: string;
    subsubsector: string;
    emissionFactorName: string;
    denominator: string;
    amount: string;
    emissionFactorId: number | null;
    emissionFactorValue: number | null; // numeric value for formula: value × Količina
  }
  const [fuelEntries, setFuelEntries] = useState<FuelEntry[]>([
    { id: 1, sector: '', subsector: '', subsubsector: '', emissionFactorName: '', denominator: '', amount: '', emissionFactorId: null, emissionFactorValue: null }
  ]);
  // Emission factor lookup (sectors from backend; cascading dropdowns per entry)
  const [fuelSectors, setFuelSectors] = useState<string[]>([]);
  const [subsectorsCache, setSubsectorsCache] = useState<Record<string, string[]>>({});
  const [subsubsectorsCache, setSubsubsectorsCache] = useState<Record<string, string[]>>({});
  const [emissionFactorNamesCache, setEmissionFactorNamesCache] = useState<Record<string, string[]>>({});
  const [denominatorsCache, setDenominatorsCache] = useState<Record<string, string[]>>({});
  const [fuelLookupLoading, setFuelLookupLoading] = useState(false);
  const [fuelLookupError, setFuelLookupError] = useState<string | null>(null);

  // Anodes input state
  const [anodesQuantity, setAnodesQuantity] = useState<string>('');
  const [hasCarbonPercentage, setHasCarbonPercentage] = useState<string>('');
  const [carbonPercentage, setCarbonPercentage] = useState<string>('');
  // Step 6: show form (prebaked or Söderberg) only after user presses Next on anode type question
  const [anodeTypeConfirmed, setAnodeTypeConfirmed] = useState(false);

  // PFC input state
  const [_pfcQuantity, _setPfcQuantity] = useState<string>('');
  const [_hasPfcCarbonPercentage, _setHasPfcCarbonPercentage] = useState<string>('');
  const [_pfcCarbonPercentage, _setPfcCarbonPercentage] = useState<string>('');
  const [pfcMethod, setPfcMethod] = useState<string>('');

  // Slope (PFC method a) input state
  const [anodeEffectFrequency, setAnodeEffectFrequency] = useState<string>('');
  const [anodeEffectDuration, setAnodeEffectDuration] = useState<string>('');
  const [primaryAluminumQuantity, setPrimaryAluminumQuantity] = useState<string>('');
  const [cellTechnology, setCellTechnology] = useState<string>('');

  // Electricity source state
  const [electricitySource, setElectricitySource] = useState<string>('');
  const [ppaHasEmissionFactor, setPpaHasEmissionFactor] = useState<string>('');

  // Step code for dynamic questions from DB (null = use existing hardcoded UI).
  // useMemo so array step codes (e.g. ['ALU_ANODES_INPUT', 'ALU_ANODES']) keep a stable reference and don't trigger infinite refetch.
  const stepCode = useMemo(
    () =>
      getStepCode({
        step,
        category,
        aluminumProductType,
        pathname: location.pathname,
        dataQualityLevel,
      }),
    [step, category, aluminumProductType, location.pathname, dataQualityLevel]
  );
  const { questions: questionsFromApi, loading: questionsLoading, error: questionsError } = useQuestionsByStep(stepCode);
  const { answers, getAnswer, setAnswer, saveAnswer, deleteAnswersForQuestions } = useCalculationAnswers(calculationId);

  // Hydrate local state from saved calculation answers (once per calculation load)
  const [questionIdToCode, setQuestionIdToCode] = useState<Record<number, string>>({});
  const hasHydratedRef = useRef(false);
  useEffect(() => {
    if (!calculationId) return;
    let cancelled = false;
    getAllQuestions()
      .then((list) => {
        if (cancelled) return;
        const map: Record<number, string> = {};
        list.forEach((q) => {
          map[q.id] = q.code;
        });
        setQuestionIdToCode(map);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [calculationId]);
  useEffect(() => {
    if (calculationId == null) hasHydratedRef.current = false;
  }, [calculationId]);
  useEffect(() => {
    if (Object.keys(questionIdToCode).length === 0 || Object.keys(answers).length === 0 || hasHydratedRef.current) return;
    hasHydratedRef.current = true;
    Object.entries(answers).forEach(([qIdStr, valueText]) => {
      const qId = Number(qIdStr);
      const code = questionIdToCode[qId];
      const valueStr = typeof valueText === 'string' ? valueText : '';
      if (!code || valueStr === '') return;
      const frontend = optionCodeToFrontendState(code, valueStr);
      switch (code) {
        case 'ALU_DECLARATION_PRODUCT':
          setAluminumProductType(frontend);
          break;
        case 'ALU_UNWROUGHT_PRODUCTION_METHOD':
          setProductionProcess(frontend);
          break;
        case 'ALU_PRODUCT_TYPE':
          setAluminumProductSubtype(frontend);
          break;
        case 'ALU_DATA_AVAILABILITY':
          setDataQualityLevel(frontend);
          break;
        case 'ALU_PFC_METHOD':
          setPfcMethod(frontend);
          break;
        case 'ALU_ELECTRICITY_SOURCE':
          setElectricitySource(frontend);
          break;
        case 'ALU_HAS_CARBON_PERCENT':
          setHasCarbonPercentage(frontend);
          break;
        case 'ALU_ANODES_QTY':
          setAnodesQuantity(valueStr);
          break;
        case 'ALU_ANODE_CARBON_PERCENT':
          setCarbonPercentage(valueStr);
          break;
        case 'ALU_AE_FREQUENCY':
          setAnodeEffectFrequency(valueStr);
          break;
        case 'ALU_AE_AVG_DURATION':
          setAnodeEffectDuration(valueStr);
          break;
        case 'ALU_PRIMARY_AL_QTY':
          setPrimaryAluminumQuantity(valueStr);
          break;
        case 'ALU_CELL_TECHNOLOGY':
          setCellTechnology(valueStr.toLowerCase().replace(/_/g, '-'));
          break;
        default:
          break;
      }
    });
  }, [answers, questionIdToCode]);

  // Derive answer for display: use saved answer or map from local state (for sync with URL/navigation)
  const getLocalStateForQuestionCode = (code: string): string => {
    switch (code) {
      case 'ALU_DECLARATION_PRODUCT': return aluminumProductType;
      case 'ALU_UNWROUGHT_PRODUCTION_METHOD': return productionProcess;
      case 'ALU_PRODUCT_TYPE': return aluminumProductSubtype;
      case 'ALU_DATA_AVAILABILITY': return dataQualityLevel;
      case 'ALU_PFC_METHOD': return pfcMethod;
      case 'ALU_ELECTRICITY_SOURCE': return electricitySource;
      case 'ALU_HAS_CARBON_PERCENT': return hasCarbonPercentage;
      case 'ALU_ANODES_QTY': return anodesQuantity;
      case 'ALU_ANODE_CARBON_PERCENT': return carbonPercentage;
      case 'ALU_AE_FREQUENCY': return anodeEffectFrequency;
      case 'ALU_AE_AVG_DURATION': return anodeEffectDuration;
      case 'ALU_PRIMARY_AL_QTY': return primaryAluminumQuantity;
      case 'ALU_CELL_TECHNOLOGY': return cellTechnology;
      default: return '';
    }
  };
  const getAnswerForStep = (questionId: number): string => {
    const v = getAnswer(questionId);
    if (v != null && v !== '') return v;
    const code = questionIdToCode[questionId];
    if (!code) return getAnswer(questionId);
    const local = getLocalStateForQuestionCode(code);
    if (!local) return getAnswer(questionId);
    // VALUE questions: local state is the value; SINGLE_CHOICE/MULTI_CHOICE: convert to option code
    if (['ALU_ANODES_QTY', 'ALU_ANODE_CARBON_PERCENT', 'ALU_AE_FREQUENCY', 'ALU_AE_AVG_DURATION', 'ALU_PRIMARY_AL_QTY'].includes(code)) return local;
    return frontendStateToOptionCode(code, local);
  };
  const handleOptionSelect = (questionCode: string, optionCode: string) => {
    const frontend = optionCodeToFrontendState(questionCode, optionCode);
    switch (questionCode) {
      case 'ALU_DECLARATION_PRODUCT': setAluminumProductType(frontend); break;
      case 'ALU_UNWROUGHT_PRODUCTION_METHOD': setProductionProcess(frontend); break;
      case 'ALU_PRODUCT_TYPE': setAluminumProductSubtype(frontend); break;
      case 'ALU_DATA_AVAILABILITY': setDataQualityLevel(frontend); break;
      case 'ALU_PFC_METHOD': setPfcMethod(frontend); break;
      case 'ALU_ELECTRICITY_SOURCE': setElectricitySource(frontend); break;
      case 'ALU_CELL_TECHNOLOGY': setCellTechnology(frontend); break;
      case 'ALU_HAS_CARBON_PERCENT': setHasCarbonPercentage(frontend); break;
      default: break;
    }
  };
  const handleValueChange = (questionCode: string, valueText: string) => {
    switch (questionCode) {
      case 'ALU_ANODES_QTY': setAnodesQuantity(valueText); break;
      case 'ALU_ANODE_CARBON_PERCENT': setCarbonPercentage(valueText); break;
      case 'ALU_AE_FREQUENCY': setAnodeEffectFrequency(valueText); break;
      case 'ALU_AE_AVG_DURATION': setAnodeEffectDuration(valueText); break;
      case 'ALU_PRIMARY_AL_QTY': setPrimaryAluminumQuantity(valueText); break;
      default: break;
    }
  };

  // Load emission factor sectors when on fuel step (step 5)
  useEffect(() => {
    if (step !== 5 || !(category === 'Aluminium' && aluminumProductType === 'unwrought' && dataQualityLevel === 'real-data')) return;
    let cancelled = false;
    setFuelLookupLoading(true);
    setFuelLookupError(null);
    getLookupSectors()
      .then((list) => { if (!cancelled) setFuelSectors(list); })
      .catch((e) => { if (!cancelled) setFuelLookupError(e instanceof Error ? e.message : 'Failed to load sectors'); setFuelSectors([]); })
      .finally(() => { if (!cancelled) setFuelLookupLoading(false); });
    return () => { cancelled = true; };
  }, [step, category, aluminumProductType, dataQualityLevel]);

  // Populate cascading caches per entry: subsectors by sector, subsubsectors by sector+subsector, etc.
  useEffect(() => {
    if (step !== 5 || !(category === 'Aluminium' && aluminumProductType === 'unwrought' && dataQualityLevel === 'real-data')) return;
    const sectors = [...new Set(fuelEntries.map((e: FuelEntry) => e.sector).filter(Boolean))] as string[];
    const toFetch = sectors.filter((s: string) => !(s in subsectorsCache));
    if (toFetch.length === 0) return;
    let cancelled = false;
    toFetch.forEach((sector: string) => {
      getLookupSubsectors(sector)
        .then((list) => { if (!cancelled) setSubsectorsCache((prev: Record<string, string[]>) => ({ ...prev, [sector]: list })); })
        .catch(() => { if (!cancelled) setSubsectorsCache((prev: Record<string, string[]>) => ({ ...prev, [sector]: [] })); });
    });
    return () => { cancelled = true; };
  }, [step, category, aluminumProductType, dataQualityLevel, fuelEntries]);

  useEffect(() => {
    if (step !== 5 || !(category === 'Aluminium' && aluminumProductType === 'unwrought' && dataQualityLevel === 'real-data')) return;
    const keys = [...new Set(fuelEntries.filter((e: FuelEntry) => e.sector && e.subsector).map((e: FuelEntry) => `${e.sector}|${e.subsector}`))] as string[];
    const toFetch = keys.filter((k: string) => !(k in subsubsectorsCache));
    if (toFetch.length === 0) return;
    let cancelled = false;
    toFetch.forEach((key: string) => {
      const [sector, subsector] = key.split('|');
      getLookupSubsubsectors(sector, subsector)
        .then((list) => { if (!cancelled) setSubsubsectorsCache((prev: Record<string, string[]>) => ({ ...prev, [key]: list })); })
        .catch(() => { if (!cancelled) setSubsubsectorsCache((prev: Record<string, string[]>) => ({ ...prev, [key]: [] })); });
    });
    return () => { cancelled = true; };
  }, [step, category, aluminumProductType, dataQualityLevel, fuelEntries]);

  useEffect(() => {
    if (step !== 5 || !(category === 'Aluminium' && aluminumProductType === 'unwrought' && dataQualityLevel === 'real-data')) return;
    const keys = [...new Set(fuelEntries.filter((e: FuelEntry) => e.sector && e.subsector).map((e: FuelEntry) => `${e.sector}|${e.subsector}|${e.subsubsector ?? ''}`))] as string[];
    const toFetch = keys.filter((k: string) => !(k in emissionFactorNamesCache));
    if (toFetch.length === 0) return;
    let cancelled = false;
    toFetch.forEach((key: string) => {
      const parts = key.split('|');
      const sector = parts[0];
      const subsector = parts[1];
      const subsubsector = parts[2] || null;
      getLookupEmissionFactorNames(sector, subsector, subsubsector)
        .then((list) => { if (!cancelled) setEmissionFactorNamesCache((prev: Record<string, string[]>) => ({ ...prev, [key]: list })); })
        .catch(() => { if (!cancelled) setEmissionFactorNamesCache((prev: Record<string, string[]>) => ({ ...prev, [key]: [] })); });
    });
    return () => { cancelled = true; };
  }, [step, category, aluminumProductType, dataQualityLevel, fuelEntries]);

  useEffect(() => {
    if (step !== 5 || !(category === 'Aluminium' && aluminumProductType === 'unwrought' && dataQualityLevel === 'real-data')) return;
    const keys = [...new Set(fuelEntries.filter((e: FuelEntry) => e.sector && e.subsector && e.emissionFactorName).map((e: FuelEntry) => `${e.sector}|${e.subsector}|${e.subsubsector ?? ''}|${e.emissionFactorName}`))] as string[];
    const toFetch = keys.filter((k: string) => !(k in denominatorsCache));
    if (toFetch.length === 0) return;
    let cancelled = false;
    toFetch.forEach((key: string) => {
      const parts = key.split('|');
      const sector = parts[0];
      const subsector = parts[1];
      const subsubsector = parts[2] || null;
      const emissionFactorName = parts[3];
      getLookupDenominators(sector, subsector, subsubsector, emissionFactorName)
        .then((list) => { if (!cancelled) setDenominatorsCache((prev: Record<string, string[]>) => ({ ...prev, [key]: list })); })
        .catch(() => { if (!cancelled) setDenominatorsCache((prev: Record<string, string[]>) => ({ ...prev, [key]: [] })); });
    });
    return () => { cancelled = true; };
  }, [step, category, aluminumProductType, dataQualityLevel, fuelEntries]);

  const updateFuelEntry = (index: number, updates: Partial<FuelEntry>) => {
    setFuelEntries((prev: FuelEntry[]) => prev.map((e: FuelEntry, i: number) => (i === index ? { ...e, ...updates } : e)));
  };
  const resolveEmissionFactorId = async (entry: FuelEntry) => {
    if (!entry.sector || !entry.subsector || !entry.emissionFactorName || !entry.denominator) return;
    try {
      const { emissionFactorId, value } = await getLookupId(
        entry.sector,
        entry.subsector,
        entry.subsubsector || null,
        entry.emissionFactorName,
        entry.denominator
      );
      setFuelEntries((prev: FuelEntry[]) => prev.map((e: FuelEntry) => (e.id === entry.id ? { ...e, emissionFactorId, emissionFactorValue: value } : e)));
    } catch {
      setFuelEntries((prev: FuelEntry[]) => prev.map((e: FuelEntry) => (e.id === entry.id ? { ...e, emissionFactorId: null, emissionFactorValue: null } : e)));
    }
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
    if (process === 'both') return 'both';
    return process;
  };

  // Helper function to convert URL slug to production process
  const slugToProcess = (slug: string) => {
    if (slug === 'primary') return 'primary';
    if (slug === 'secundary') return 'secondary';
    if (slug === 'both' || slug === 'dkn') return 'both';
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
      default: return level;
    }
  };

  // Helper function to convert URL slug to data quality level
  const slugToDataLevel = (slug: string) => {
    switch (slug) {
      case 'fuels': return 'real-data';
      case 'emissions': return 'calculated-emissions';
      default: return slug;
    }
  };

  // Persist: restore all state from URL on load/refresh so refresh keeps you on the same page
  useEffect(() => {
    // Always restore form state from URL params when present (don't wait for categoryNames etc.)
    if (categoryParam) {
      setCategory(slugToCategory(categoryParam));
    }
    if (productTypeParam === 'unwrought' || productTypeParam === 'al-products') {
      setAluminumProductType(slugToProductType(productTypeParam));
    }
    if (processParam) {
      if (productTypeParam === 'unwrought' && (processParam === 'primary' || processParam === 'secundary' || processParam === 'both' || processParam === 'dkn')) {
        setProductionProcess(slugToProcess(processParam));
      } else if (productTypeParam === 'al-products') {
        const validSubtypes = ['zica', 'limovi', 'folije', 'profili-sine-konstrukcija', 'cijevi-fitinzi', 'drugi'];
        if (validSubtypes.includes(processParam)) {
          setAluminumProductSubtype(slugToSubtype(processParam));
        }
      }
    }
    if (dataLevelParam && (dataLevelParam === 'fuels' || dataLevelParam === 'emissions')) {
      setDataQualityLevel(slugToDataLevel(dataLevelParam));
    }

    // Set step from pathname (and params) so refresh restores the correct step
    // Check routes in order of specificity (most specific first)
    // 0. End screen for calculated-emissions path (after user entered direct/indirect emissions)
    if (dataLevelParam === 'emissions' && location.pathname.endsWith('/complete')) {
      setStep(12);
    }
    // 1. Check for /grid, /self-power, /ppa/yes, /ppa/no, or /ppa routes first (most specific - shows step 11)
    else if (location.pathname.endsWith('/grid') || location.pathname.endsWith('/self-power') || 
        location.pathname.endsWith('/ppa/yes') || location.pathname.endsWith('/ppa/no') || 
        location.pathname.endsWith('/ppa')) {
      setStep(11);
      // Ensure dataQualityLevel is set if we have the param
      if (dataLevelParam && productTypeParam === 'unwrought' && !dataQualityLevel) {
        const validDataLevels = ['fuels', 'emissions'];
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
    else if (location.pathname.includes('/electricity') && 
             !location.pathname.endsWith('/grid') && 
             !location.pathname.endsWith('/self-power') &&
             !location.pathname.endsWith('/ppa') &&
             !location.pathname.endsWith('/ppa/yes') &&
             !location.pathname.endsWith('/ppa/no')) {
      setStep(10);
      // Ensure dataQualityLevel is set if we have the param
      if (dataLevelParam && productTypeParam === 'unwrought' && !dataQualityLevel) {
        const validDataLevels = ['fuels', 'emissions'];
        if (validDataLevels.includes(dataLevelParam)) {
          setDataQualityLevel(slugToDataLevel(dataLevelParam));
        }
      }
    }
    // 3. Check for /flue-gas route (but not /electricity) – step 9
    else if (location.pathname.includes('/flue-gas') && !location.pathname.includes('/electricity')) {
      setStep(9);
      if (dataLevelParam && productTypeParam === 'unwrought' && !dataQualityLevel) {
        const validDataLevels = ['fuels', 'emissions'];
        if (validDataLevels.includes(dataLevelParam)) {
          setDataQualityLevel(slugToDataLevel(dataLevelParam));
        }
      }
    }
    // 4. Check for /slope or /overvoltage route (but not /flue-gas, /electricity, /grid, /self-power, /ppa)
    else if ((location.pathname.endsWith('/slope') || location.pathname.endsWith('/overvoltage')) && 
             !location.pathname.includes('/flue-gas') &&
             !location.pathname.endsWith('/electricity') &&
             !location.pathname.endsWith('/grid') &&
             !location.pathname.endsWith('/self-power') &&
             !location.pathname.endsWith('/ppa') &&
             !location.pathname.endsWith('/ppa/yes') &&
             !location.pathname.endsWith('/ppa/no')) {
      setStep(8);
      // Ensure dataQualityLevel is set if we have the param
      if (dataLevelParam && productTypeParam === 'unwrought' && !dataQualityLevel) {
        const validDataLevels = ['fuels', 'emissions'];
        if (validDataLevels.includes(dataLevelParam)) {
          setDataQualityLevel(slugToDataLevel(dataLevelParam));
        }
      }
    }
    // 5. Check for /pfc route (but not /slope, /overvoltage, /flue-gas, /electricity, /grid, /self-power, /ppa)
    else if (location.pathname.endsWith('/pfc') && 
             !location.pathname.endsWith('/slope') && 
             !location.pathname.endsWith('/overvoltage') &&
             !location.pathname.includes('/flue-gas') &&
             !location.pathname.includes('/electricity') &&
             !location.pathname.endsWith('/grid') &&
             !location.pathname.endsWith('/self-power') &&
             !location.pathname.endsWith('/ppa') &&
             !location.pathname.endsWith('/ppa/yes') &&
             !location.pathname.endsWith('/ppa/no')) {
      setStep(7);
      // Ensure dataQualityLevel is set if we have the param
      if (dataLevelParam && productTypeParam === 'unwrought' && !dataQualityLevel) {
        const validDataLevels = ['fuels', 'emissions'];
        if (validDataLevels.includes(dataLevelParam)) {
          setDataQualityLevel(slugToDataLevel(dataLevelParam));
        }
      }
    }
    // 6. Check for /anode-elektrode route (but not /pfc, /slope, /overvoltage, /flue-gas, /electricity, /grid, /self-power, /ppa)
    else if (location.pathname.endsWith('/anode-elektrode') && 
             !location.pathname.endsWith('/pfc') && 
             !location.pathname.endsWith('/slope') &&
             !location.pathname.endsWith('/overvoltage') &&
             !location.pathname.includes('/flue-gas') &&
             !location.pathname.includes('/electricity') &&
             !location.pathname.endsWith('/grid') &&
             !location.pathname.endsWith('/self-power') &&
             !location.pathname.endsWith('/ppa') &&
             !location.pathname.endsWith('/ppa/yes') &&
             !location.pathname.endsWith('/ppa/no')) {
      setStep(6);
    }
    // Step 5: fuels/emissions segment (no anode-elektrode, pfc, etc.)
    else if (dataLevelParam && productTypeParam === 'unwrought' && (dataLevelParam === 'fuels' || dataLevelParam === 'emissions')) {
      setStep(5);
    }
    // Step 4: process/subtype segment (primary, secundary, etc. or product subtype)
    else if (processParam) {
      setStep(4);
    }
    // Step 3: product type segment (unwrought or al-products)
    else if (productTypeParam === 'unwrought' || productTypeParam === 'al-products') {
      setStep(3);
    }
    // Step 2: category segment (e.g. aluminium)
    else if (categoryParam) {
      setStep(2);
    }
  }, [categoryParam, productTypeParam, processParam, dataLevelParam, location.pathname]);

  // After refresh on step 6: if anode type is already saved (from API), show the form. Only run when step or questions load changes, not when answers changes (so selecting an option does not auto-route).
  useEffect(() => {
    if (step !== 6 || !questionsFromApi?.length) return;
    const anodeTypeQuestion = questionsFromApi.find((q: { code: string }) => q.code === 'ALU_ANODE_TYPE');
    if (!anodeTypeQuestion) return;
    const savedAnswer = getAnswer(anodeTypeQuestion.id);
    if (savedAnswer != null && savedAnswer !== '') setAnodeTypeConfirmed(true);
  }, [step, questionsFromApi]);

  // Persist calculationId so refresh on /new-calculation keeps the same calculation
  useEffect(() => {
    if (calculationId != null && location.pathname.includes('/new-calculation')) {
      sessionStorage.setItem(CBAM_CALC_ID_KEY, String(calculationId));
    }
  }, [calculationId, location.pathname, CBAM_CALC_ID_KEY]);

  // If we landed without calculationId (e.g. refresh), create a calculation so the flow still works
  useEffect(() => {
    if (calculationId != null) return;
    let cancelled = false;
    setCalculationLoading(true);
    (async () => {
      const meResult = await apiRequest<{ success: boolean; user?: { id: number; companyId?: number | null } }>('/users/me');
      if (cancelled) return;
      if (meResult === null || !meResult.data.success || !meResult.data.user) {
        setCalculationLoading(false);
        return;
      }
      const user = meResult.data.user;
      const companyId = user.companyId ?? 0;
      if (!companyId) {
        setCalculationLoading(false);
        return;
      }
      const calcResult = await apiRequest<{ success: boolean; calculation?: { id: number } }>('/calculations/create', {
        method: 'POST',
        body: JSON.stringify({
          company: { id: companyId },
          createdByUser: { id: user.id },
        }),
      });
      if (cancelled) return;
      if (calcResult?.data?.success && calcResult.data.calculation?.id) {
        setCalculationId(calcResult.data.calculation.id);
      }
      setCalculationLoading(false);
    })();
    return () => { cancelled = true; };
  }, [calculationId]);

  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  const handleNext = async () => {
    // Persist current step answers to API only when user presses Next (not on every change).
    // Step 5 (fuel, real-data) has its own delete-then-save-all logic below, so skip generic persist for that case.
    // For step 5 with calculated-emissions we use generic persist for ALU_EMISSIONS_INPUT questions.
    if (calculationId != null && questionsFromApi?.length && !(step === 5 && dataQualityLevel === 'real-data')) {
      const questionIds = questionsFromApi.map((q: QuestionWithOptions) => q.id);
      const valuesToSave: { questionId: number; value: string }[] = [];
      for (const q of questionsFromApi) {
        const value = getAnswer(q.id);
        if (step === 6 && q.code === 'ALU_ANODES_UNIT') valuesToSave.push({ questionId: q.id, value: 'TONNES' });
        else if (value != null && value !== '') valuesToSave.push({ questionId: q.id, value });
      }
      await deleteAnswersForQuestions(questionIds);
      for (const item of valuesToSave) {
        await saveAnswer(item.questionId, item.value);
      }
    }
    if (step === 1) {
      if (!category || !productName) {
        return;
      }
      const productCategoryId = productCategories.find((c) => c.name === category)?.id;
      if (productCategoryId == null) {
        setCreateError('Invalid product category');
        return;
      }
      const currentCalcId = calculationId;
      if (currentCalcId == null) {
        setCreateError('Please wait for the calculation to be ready, or start from the dashboard.');
        return;
      }
      setCreateError(null);
      setCreateLoading(true);
      try {
        const cpResult = await apiRequest<{ success: boolean; calculationProduct?: unknown }>('/calculation-products/create', {
          method: 'POST',
          body: JSON.stringify({
            calculation: { id: currentCalcId },
            productName: productName.trim(),
            productCategory: { id: productCategoryId },
          }),
        });
        if (cpResult === null || !cpResult.data.success) {
          setCreateError((cpResult?.data as { message?: string })?.message ?? 'Failed to save product');
          setCreateLoading(false);
          return;
        }
        setCreateLoading(false);
        const slug = categoryToSlug(category);
        navigate(`/dashboard/new-calculation/${slug}`, { replace: true });
        setStep(2);
      } catch (err) {
        setCreateError(err instanceof Error ? err.message : 'Failed to save product');
        setCreateLoading(false);
      }
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
        // If "Oba" is selected, treat it as "primarni" internally but keep 'both' for URL
        const finalProcess = productionProcess === 'both' ? 'primary' : productionProcess;
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
      // Step 5: fuel input (real-data) or calculated emissions input (calculated-emissions)
      if (category === 'Aluminium' && aluminumProductType === 'unwrought' && dataQualityLevel === 'real-data') {
        const allValid = fuelEntries.every((entry: FuelEntry) =>
          entry.sector && entry.subsector && entry.emissionFactorName && entry.denominator && entry.amount && entry.emissionFactorId != null
        );
        if (!allValid || fuelEntries.length === 0) {
          return; // Validation - all fields required for all entries
        }
        // Replace fuel answers: delete all for this step, then insert one row per fuel entry (save on Next).
        if (calculationId && questionsFromApi?.length) {
          const questionId = questionsFromApi[0].id;
          await deleteAnswersForQuestions([questionId]);
          for (const entry of fuelEntries) {
            if (entry.emissionFactorId != null) {
              await saveAnswer(questionId, entry.amount, entry.emissionFactorId);
            }
          }
        }
        const slug = categoryToSlug(category);
        const productTypeSlug = productTypeToSlug(aluminumProductType);
        const processSlug = processToSlug(productionProcess);
        const dataLevelSlug = dataLevelToSlug(dataQualityLevel);
        navigate(`/dashboard/new-calculation/${slug}/${productTypeSlug}/${processSlug}/${dataLevelSlug}/anode-elektrode`, { replace: true });
      } else if (category === 'Aluminium' && aluminumProductType === 'unwrought' && dataQualityLevel === 'calculated-emissions') {
        // Navigate to end screen after entering total direct/indirect emissions (answers already persisted above)
        const slug = categoryToSlug(category);
        const productTypeSlug = productTypeToSlug(aluminumProductType);
        const processSlug = processToSlug(productionProcess);
        const dataLevelSlug = dataLevelToSlug(dataQualityLevel);
        navigate(`/dashboard/new-calculation/${slug}/${productTypeSlug}/${processSlug}/${dataLevelSlug}/complete`, { replace: true });
        setStep(12);
        return;
      }
      setStep(6); // Go to next step
    } else if (step === 6) {
      // Step 6: anode type. Only route when Next is pressed. First Next = confirm anode type and show form; second Next = go to PFC.
      const anodeTypeQuestion = questionsFromApi?.find((q: { code: string }) => q.code === 'ALU_ANODE_TYPE');
      const anodeTypeAnswer = anodeTypeQuestion != null ? getAnswer(anodeTypeQuestion.id) : '';
      const isPreBaked = anodeTypeAnswer === 'PRE_BAKED' || anodeTypeAnswer === 'pre-baked';
      const anodesFormFilled = Boolean(anodesQuantity);
      const pasteQtyQ = questionsFromApi?.find((q: { code: string }) => q.code === 'ALU_SODERBERG_PASTE_QTY');
      const soderbergHasCarbonQ = questionsFromApi?.find((q: { code: string }) => q.code === 'ALU_SODERBERG_HAS_CARBON_PERCENT');
      const soderbergCarbonQ = questionsFromApi?.find((q: { code: string }) => q.code === 'ALU_SODERBERG_CARBON_PERCENT');
      const soderbergPasteQty = pasteQtyQ != null ? getAnswer(pasteQtyQ.id) : '';
      const soderbergHasCarbon = soderbergHasCarbonQ != null ? getAnswer(soderbergHasCarbonQ.id) : '';
      const soderbergCarbonPercent = soderbergCarbonQ != null ? getAnswer(soderbergCarbonQ.id) : '';
      const soderbergFormFilled = Boolean(soderbergPasteQty) && Boolean(soderbergHasCarbon) && (soderbergHasCarbon === 'NO' || soderbergHasCarbon === 'no' || Boolean(soderbergCarbonPercent));
      // If user has not yet confirmed anode type: require selection and advance to form on Next (no URL change)
      if (anodeTypeQuestion && anodeTypeAnswer !== '' && !anodeTypeConfirmed) {
        setAnodeTypeConfirmed(true);
        return;
      }
      if (anodeTypeQuestion && anodeTypeAnswer !== '' && anodeTypeConfirmed) {
        if (isPreBaked && !anodesFormFilled) {
          return;
        }
        if (anodeTypeAnswer === 'SODERBERG' || anodeTypeAnswer === 'soderberg') {
          if (!soderbergFormFilled) return;
        }
      }
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
      // Step 8 is slope or overvoltage - navigate to flue gas
      // Validation: check if required fields are filled based on the method
      if (category === 'Aluminium' && aluminumProductType === 'unwrought' && dataQualityLevel === 'real-data') {
        const slug = categoryToSlug(category);
        const productTypeSlug = productTypeToSlug(aluminumProductType);
        const processSlug = processToSlug(productionProcess);
        const dataLevelSlug = dataLevelToSlug(dataQualityLevel);
        
        if (location.pathname.endsWith('/slope')) {
          if (!anodeEffectFrequency || !anodeEffectDuration || !primaryAluminumQuantity || !cellTechnology) {
            return;
          }
          navigate(`/dashboard/new-calculation/${slug}/${productTypeSlug}/${processSlug}/${dataLevelSlug}/anode-elektrode/pfc/slope/flue-gas`, { replace: true });
        } else if (location.pathname.endsWith('/overvoltage')) {
          // Validate Method B (AEO/CE) from API answers only
          if (questionsFromApi.length > 0) {
            const aeoQ = questionsFromApi.find((q: { code: string }) => q.code === 'ALU_AEO_VALUE');
            const ceQ = questionsFromApi.find((q: { code: string }) => q.code === 'ALU_CE_CURRENT_EFFICIENCY');
            const qtyQ = questionsFromApi.find((q: { code: string }) => q.code === 'ALU_PRIMARY_AL_QTY_OVERVOLTAGE');
            const cellQ = questionsFromApi.find((q: { code: string }) => q.code === 'ALU_CELL_TECHNOLOGY_OVERVOLTAGE');
            if (!aeoQ || !ceQ || !qtyQ || !cellQ || !getAnswer(aeoQ.id) || !getAnswer(ceQ.id) || !getAnswer(qtyQ.id) || !getAnswer(cellQ.id)) {
              return;
            }
          } else {
            return;
          }
          navigate(`/dashboard/new-calculation/${slug}/${productTypeSlug}/${processSlug}/${dataLevelSlug}/anode-elektrode/pfc/overvoltage/flue-gas`, { replace: true });
        }
        setStep(9);
      } else {
        setStep(9);
      }
    } else if (step === 9) {
      // Step 9 is flue gas treatment - validate and go to electricity
      if (category === 'Aluminium' && aluminumProductType === 'unwrought' && dataQualityLevel === 'real-data') {
        const slug = categoryToSlug(category);
        const productTypeSlug = productTypeToSlug(aluminumProductType);
        const processSlug = processToSlug(productionProcess);
        const dataLevelSlug = dataLevelToSlug(dataQualityLevel);
        const flueGasQuestion = questionsFromApi.find((q: { code: string }) => q.code === 'ALU_FLUE_GAS_TREATMENT');
        const flueGasAnswer = flueGasQuestion != null ? getAnswer(flueGasQuestion.id) : '';
        const needsQty = flueGasAnswer === 'SODA_ASH' || flueGasAnswer === 'soda-ash' || flueGasAnswer === 'LIMESTONE' || flueGasAnswer === 'limestone';
        const qtyQuestion = questionsFromApi.find((q: { code: string }) => q.code === 'ALU_FLUE_GAS_QTY');
        if (!flueGasAnswer) return;
        if (needsQty && qtyQuestion && !getAnswer(qtyQuestion.id)) return;
        let basePath = '';
        if (location.pathname.includes('/slope/flue-gas')) {
          basePath = `/dashboard/new-calculation/${slug}/${productTypeSlug}/${processSlug}/${dataLevelSlug}/anode-elektrode/pfc/slope/flue-gas/electricity`;
        } else if (location.pathname.includes('/overvoltage/flue-gas')) {
          basePath = `/dashboard/new-calculation/${slug}/${productTypeSlug}/${processSlug}/${dataLevelSlug}/anode-elektrode/pfc/overvoltage/flue-gas/electricity`;
        } else {
          basePath = `/dashboard/new-calculation/${slug}/${productTypeSlug}/${processSlug}/${dataLevelSlug}/anode-elektrode/pfc/flue-gas/electricity`;
        }
        navigate(basePath, { replace: true });
      }
      setStep(10);
    } else if (step === 10 && !location.pathname.endsWith('/grid') && !location.pathname.endsWith('/self-power') && !location.pathname.endsWith('/ppa') && !location.pathname.endsWith('/ppa/yes') && !location.pathname.endsWith('/ppa/no')) {
      // Step 10 is electricity source selection - navigate based on selection
      if (!electricitySource) {
        return;
      }
      
      if (category === 'Aluminium' && aluminumProductType === 'unwrought' && dataQualityLevel === 'real-data') {
        const slug = categoryToSlug(category);
        const productTypeSlug = productTypeToSlug(aluminumProductType);
        const processSlug = processToSlug(productionProcess);
        const dataLevelSlug = dataLevelToSlug(dataQualityLevel);
        
        let basePath = '';
        if (location.pathname.includes('/slope/flue-gas/electricity')) {
          basePath = `/dashboard/new-calculation/${slug}/${productTypeSlug}/${processSlug}/${dataLevelSlug}/anode-elektrode/pfc/slope/flue-gas/electricity`;
        } else if (location.pathname.includes('/overvoltage/flue-gas/electricity')) {
          basePath = `/dashboard/new-calculation/${slug}/${productTypeSlug}/${processSlug}/${dataLevelSlug}/anode-elektrode/pfc/overvoltage/flue-gas/electricity`;
        } else if (location.pathname.includes('/flue-gas/electricity')) {
          basePath = `/dashboard/new-calculation/${slug}/${productTypeSlug}/${processSlug}/${dataLevelSlug}/anode-elektrode/pfc/flue-gas/electricity`;
        } else if (location.pathname.includes('/slope/electricity')) {
          basePath = `/dashboard/new-calculation/${slug}/${productTypeSlug}/${processSlug}/${dataLevelSlug}/anode-elektrode/pfc/slope/electricity`;
        } else if (location.pathname.includes('/overvoltage/electricity')) {
          basePath = `/dashboard/new-calculation/${slug}/${productTypeSlug}/${processSlug}/${dataLevelSlug}/anode-elektrode/pfc/overvoltage/electricity`;
        } else {
          basePath = `/dashboard/new-calculation/${slug}/${productTypeSlug}/${processSlug}/${dataLevelSlug}/anode-elektrode/pfc/electricity`;
        }
        
        if (electricitySource === 'grid') {
          navigate(`${basePath}/grid`, { replace: true });
        } else if (electricitySource === 'self-power') {
          navigate(`${basePath}/self-power`, { replace: true });
        } else if (electricitySource === 'ppa') {
          navigate(`${basePath}/ppa`, { replace: true });
        }
        setStep(11);
      } else {
        setStep(11);
      }
    } else if (step === 11 && location.pathname.endsWith('/ppa') && !location.pathname.endsWith('/ppa/yes') && !location.pathname.endsWith('/ppa/no')) {
      // Step 11 on /ppa - navigate based on answer
      if (!ppaHasEmissionFactor) {
        return;
      }
      
      if (category === 'Aluminium' && aluminumProductType === 'unwrought' && dataQualityLevel === 'real-data') {
        const slug = categoryToSlug(category);
        const productTypeSlug = productTypeToSlug(aluminumProductType);
        const processSlug = processToSlug(productionProcess);
        const dataLevelSlug = dataLevelToSlug(dataQualityLevel);
        let basePath = '';
        if (location.pathname.includes('/slope/flue-gas/electricity')) {
          basePath = `/dashboard/new-calculation/${slug}/${productTypeSlug}/${processSlug}/${dataLevelSlug}/anode-elektrode/pfc/slope/flue-gas/electricity/ppa`;
        } else if (location.pathname.includes('/overvoltage/flue-gas/electricity')) {
          basePath = `/dashboard/new-calculation/${slug}/${productTypeSlug}/${processSlug}/${dataLevelSlug}/anode-elektrode/pfc/overvoltage/flue-gas/electricity/ppa`;
        } else if (location.pathname.includes('/flue-gas/electricity')) {
          basePath = `/dashboard/new-calculation/${slug}/${productTypeSlug}/${processSlug}/${dataLevelSlug}/anode-elektrode/pfc/flue-gas/electricity/ppa`;
        } else if (location.pathname.includes('/slope/electricity')) {
          basePath = `/dashboard/new-calculation/${slug}/${productTypeSlug}/${processSlug}/${dataLevelSlug}/anode-elektrode/pfc/slope/electricity/ppa`;
        } else if (location.pathname.includes('/overvoltage/electricity')) {
          basePath = `/dashboard/new-calculation/${slug}/${productTypeSlug}/${processSlug}/${dataLevelSlug}/anode-elektrode/pfc/overvoltage/electricity/ppa`;
        } else {
          basePath = `/dashboard/new-calculation/${slug}/${productTypeSlug}/${processSlug}/${dataLevelSlug}/anode-elektrode/pfc/electricity/ppa`;
        }
        if (ppaHasEmissionFactor === 'yes') {
          navigate(`${basePath}/yes`, { replace: true });
        } else if (ppaHasEmissionFactor === 'no') {
          navigate(`${basePath}/no`, { replace: true });
        }
      }
    }
  };

  const handleBack = async () => {
    // On Back: delete answers for the current step so we can re-save when user goes Next again (A -> Back -> B -> Next).
    if (step >= 2 && calculationId != null && questionsFromApi?.length) {
      const questionIds = questionsFromApi.map((q: QuestionWithOptions) => q.id);
      await deleteAnswersForQuestions(questionIds);
    }
    if (step === 11) {
      // Going back from step 11 (grid/self-power/ppa/yes/ppa/no) to step 10 (electricity) or /ppa
      if (category === 'Aluminium' && aluminumProductType === 'unwrought' && dataQualityLevel === 'real-data') {
        const slug = categoryToSlug(category);
        const productTypeSlug = productTypeToSlug(aluminumProductType);
        const processSlug = processToSlug(productionProcess);
        const dataLevelSlug = dataLevelToSlug(dataQualityLevel);
        
        if (location.pathname.endsWith('/ppa/yes') || location.pathname.endsWith('/ppa/no')) {
          if (location.pathname.includes('/slope/flue-gas/electricity')) {
            navigate(`/dashboard/new-calculation/${slug}/${productTypeSlug}/${processSlug}/${dataLevelSlug}/anode-elektrode/pfc/slope/flue-gas/electricity/ppa`, { replace: true });
          } else if (location.pathname.includes('/overvoltage/flue-gas/electricity')) {
            navigate(`/dashboard/new-calculation/${slug}/${productTypeSlug}/${processSlug}/${dataLevelSlug}/anode-elektrode/pfc/overvoltage/flue-gas/electricity/ppa`, { replace: true });
          } else if (location.pathname.includes('/slope/electricity')) {
            navigate(`/dashboard/new-calculation/${slug}/${productTypeSlug}/${processSlug}/${dataLevelSlug}/anode-elektrode/pfc/slope/electricity/ppa`, { replace: true });
          } else if (location.pathname.includes('/overvoltage/electricity')) {
            navigate(`/dashboard/new-calculation/${slug}/${productTypeSlug}/${processSlug}/${dataLevelSlug}/anode-elektrode/pfc/overvoltage/electricity/ppa`, { replace: true });
          } else {
            navigate(`/dashboard/new-calculation/${slug}/${productTypeSlug}/${processSlug}/${dataLevelSlug}/anode-elektrode/pfc/electricity/ppa`, { replace: true });
          }
          setPpaHasEmissionFactor('');
          return;
        }
        
        if (location.pathname.includes('/slope/flue-gas/electricity')) {
          navigate(`/dashboard/new-calculation/${slug}/${productTypeSlug}/${processSlug}/${dataLevelSlug}/anode-elektrode/pfc/slope/flue-gas/electricity`, { replace: true });
        } else if (location.pathname.includes('/overvoltage/flue-gas/electricity')) {
          navigate(`/dashboard/new-calculation/${slug}/${productTypeSlug}/${processSlug}/${dataLevelSlug}/anode-elektrode/pfc/overvoltage/flue-gas/electricity`, { replace: true });
        } else if (location.pathname.includes('/slope/electricity')) {
          navigate(`/dashboard/new-calculation/${slug}/${productTypeSlug}/${processSlug}/${dataLevelSlug}/anode-elektrode/pfc/slope/electricity`, { replace: true });
        } else if (location.pathname.includes('/overvoltage/electricity')) {
          navigate(`/dashboard/new-calculation/${slug}/${productTypeSlug}/${processSlug}/${dataLevelSlug}/anode-elektrode/pfc/overvoltage/electricity`, { replace: true });
        } else {
          navigate(`/dashboard/new-calculation/${slug}/${productTypeSlug}/${processSlug}/${dataLevelSlug}/anode-elektrode/pfc/electricity`, { replace: true });
        }
      }
      setStep(10);
    } else if (step === 10) {
      // Going back from step 10 (electricity) to step 9 (flue gas)
      if (category === 'Aluminium' && aluminumProductType === 'unwrought' && dataQualityLevel === 'real-data') {
        const slug = categoryToSlug(category);
        const productTypeSlug = productTypeToSlug(aluminumProductType);
        const processSlug = processToSlug(productionProcess);
        const dataLevelSlug = dataLevelToSlug(dataQualityLevel);
        if (location.pathname.includes('/slope/flue-gas/electricity')) {
          navigate(`/dashboard/new-calculation/${slug}/${productTypeSlug}/${processSlug}/${dataLevelSlug}/anode-elektrode/pfc/slope/flue-gas`, { replace: true });
        } else if (location.pathname.includes('/overvoltage/flue-gas/electricity')) {
          navigate(`/dashboard/new-calculation/${slug}/${productTypeSlug}/${processSlug}/${dataLevelSlug}/anode-elektrode/pfc/overvoltage/flue-gas`, { replace: true });
        } else if (location.pathname.includes('/slope/electricity')) {
          navigate(`/dashboard/new-calculation/${slug}/${productTypeSlug}/${processSlug}/${dataLevelSlug}/anode-elektrode/pfc/slope`, { replace: true });
        } else if (location.pathname.includes('/overvoltage/electricity')) {
          navigate(`/dashboard/new-calculation/${slug}/${productTypeSlug}/${processSlug}/${dataLevelSlug}/anode-elektrode/pfc/overvoltage`, { replace: true });
        } else {
          navigate(`/dashboard/new-calculation/${slug}/${productTypeSlug}/${processSlug}/${dataLevelSlug}/anode-elektrode/pfc/flue-gas`, { replace: true });
        }
      }
      setStep(9);
    } else if (step === 9) {
      // Going back from step 9 (flue gas) to step 8 (slope or overvoltage)
      if (category === 'Aluminium' && aluminumProductType === 'unwrought' && dataQualityLevel === 'real-data') {
        const slug = categoryToSlug(category);
        const productTypeSlug = productTypeToSlug(aluminumProductType);
        const processSlug = processToSlug(productionProcess);
        const dataLevelSlug = dataLevelToSlug(dataQualityLevel);
        if (location.pathname.includes('/slope/flue-gas')) {
          navigate(`/dashboard/new-calculation/${slug}/${productTypeSlug}/${processSlug}/${dataLevelSlug}/anode-elektrode/pfc/slope`, { replace: true });
        } else if (location.pathname.includes('/overvoltage/flue-gas')) {
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
      // Going back from step 6: if on form (anode type already confirmed), return to anode type question; else go to step 5
      if (anodeTypeConfirmed) {
        setAnodeTypeConfirmed(false);
        return;
      }
      if (category === 'Aluminium' && aluminumProductType === 'unwrought') {
        const slug = categoryToSlug(category);
        const productTypeSlug = productTypeToSlug(aluminumProductType);
        const processSlug = processToSlug(productionProcess);
        const dataLevelSlug = dataLevelToSlug(dataQualityLevel);
        navigate(`/dashboard/new-calculation/${slug}/${productTypeSlug}/${processSlug}/${dataLevelSlug}`, { replace: true });
      }
      setStep(5);
    } else if (step === 12) {
      // Going back from end screen to emissions input (step 5)
      if (category === 'Aluminium' && aluminumProductType === 'unwrought' && dataQualityLevel === 'calculated-emissions') {
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

      <Paper elevation={2} sx={{ p: 4, borderRadius: 2 }} data-calculation-id={calculationId ?? undefined}>
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
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProductName(e.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth disabled={categoriesLoading} error={!!categoriesError}>
                  <InputLabel>Product Category</InputLabel>
                  <Select
                    value={category}
                    label="Product Category"
                    onChange={(e: { target: { value: string } }) => {
                      setCategory(e.target.value);
                    }}
                    renderValue={(v: string) => (categoriesLoading ? 'Loading...' : v)}
                  >
                    {categoriesLoading ? (
                      <MenuItem disabled>
                        <Box display="flex" alignItems="center" gap={1}>
                          <CircularProgress size={20} />
                          Loading categories...
                        </Box>
                      </MenuItem>
                    ) : (
                      categoryNames.map((cat) => (
                        <MenuItem key={cat} value={cat}>
                          {cat}
                        </MenuItem>
                      ))
                    )}
                  </Select>
                  {categoriesError && (
                    <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                      {categoriesError}
                    </Typography>
                  )}
                </FormControl>
              </Grid>
              <Grid size={12}>
                {createError && (
                  <Typography variant="body2" color="error" sx={{ mb: 1 }}>
                    {createError}
                  </Typography>
                )}
                <Box display="flex" justifyContent="flex-end" sx={{ mt: 2 }}>
                  <Button 
                    variant="contained" 
                    size="large" 
                    endIcon={<ArrowForward />}
                    onClick={handleNext}
                    disabled={!category || !productName || categoriesLoading || createLoading || calculationId == null || calculationLoading}
                  >
                    {createLoading ? 'Saving...' : calculationLoading ? 'Loading...' : 'Next'}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </>
        )}

        {step === 2 && category === 'Aluminium' && (
          stepCode && questionsFromApi.length > 0 ? (
            <DynamicQuestionStep
              questions={questionsFromApi}
              loading={questionsLoading}
              error={questionsError}
              getAnswer={getAnswerForStep}
              setAnswer={setAnswer}
              onOptionSelect={handleOptionSelect}
              onValueChange={handleValueChange}
              onBack={handleBack}
              onNext={handleNext}
            />
          ) : questionsLoading ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight={120}><CircularProgress /></Box>
          ) : questionsError ? (
            <Typography color="error" sx={{ mb: 2 }}>{questionsError}</Typography>
          ) : (
            <Typography color="text.secondary">No questions available for this step.</Typography>
          )
        )}

        {step === 2 && category !== 'Aluminium' && (
          stepCode && questionsFromApi.length > 0 ? (
            <DynamicQuestionStep
              questions={questionsFromApi}
              loading={questionsLoading}
              error={questionsError}
              getAnswer={getAnswerForStep}
              setAnswer={setAnswer}
              onOptionSelect={handleOptionSelect}
              onValueChange={handleValueChange}
              onBack={handleBack}
              onNext={handleNext}
            />
          ) : questionsLoading ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight={120}><CircularProgress /></Box>
          ) : questionsError ? (
            <Typography color="error" sx={{ mb: 2 }}>{questionsError}</Typography>
          ) : (
            <Typography color="text.secondary">No questions available for this step.</Typography>
          )
        )}

        {step === 3 && category === 'Aluminium' && aluminumProductType === 'unwrought' && (
          stepCode && questionsFromApi.length > 0 ? (
            <DynamicQuestionStep
              questions={questionsFromApi}
              loading={questionsLoading}
              error={questionsError}
              getAnswer={getAnswerForStep}
              setAnswer={setAnswer}
              onOptionSelect={handleOptionSelect}
              onValueChange={handleValueChange}
              onBack={handleBack}
              onNext={handleNext}
            />
          ) : questionsLoading ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight={120}><CircularProgress /></Box>
          ) : questionsError ? (
            <Typography color="error" sx={{ mb: 2 }}>{questionsError}</Typography>
          ) : (
            <Typography color="text.secondary">No questions available for this step.</Typography>
          )
        )}

        {step === 3 && category === 'Aluminium' && aluminumProductType === 'products' && (
          stepCode && questionsFromApi.length > 0 ? (
            <DynamicQuestionStep
              questions={questionsFromApi}
              loading={questionsLoading}
              error={questionsError}
              getAnswer={getAnswerForStep}
              setAnswer={setAnswer}
              onOptionSelect={handleOptionSelect}
              onValueChange={handleValueChange}
              onBack={handleBack}
              onNext={handleNext}
            />
          ) : questionsLoading ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight={120}><CircularProgress /></Box>
          ) : questionsError ? (
            <Typography color="error" sx={{ mb: 2 }}>{questionsError}</Typography>
          ) : (
            <Typography color="text.secondary">No questions available for this step.</Typography>
          )
        )}

        {step === 4 && category === 'Aluminium' && aluminumProductType === 'unwrought' && (
          stepCode && questionsFromApi.length > 0 ? (
            <DynamicQuestionStep
              questions={questionsFromApi}
              loading={questionsLoading}
              error={questionsError}
              getAnswer={getAnswerForStep}
              setAnswer={setAnswer}
              onOptionSelect={handleOptionSelect}
              onValueChange={handleValueChange}
              onBack={handleBack}
              onNext={handleNext}
            />
          ) : questionsLoading ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight={120}><CircularProgress /></Box>
          ) : questionsError ? (
            <Typography color="error" sx={{ mb: 2 }}>{questionsError}</Typography>
          ) : (
            <Typography color="text.secondary">No questions available for this step.</Typography>
          )
        )}

        {step === 4 && category === 'Aluminium' && aluminumProductType === 'products' && (
          stepCode && questionsFromApi.length > 0 ? (
            <DynamicQuestionStep
              questions={questionsFromApi}
              loading={questionsLoading}
              error={questionsError}
              getAnswer={getAnswerForStep}
              setAnswer={setAnswer}
              onOptionSelect={handleOptionSelect}
              onValueChange={handleValueChange}
              onBack={handleBack}
              onNext={handleNext}
            />
          ) : questionsLoading ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight={120}><CircularProgress /></Box>
          ) : questionsError ? (
            <Typography color="error" sx={{ mb: 2 }}>{questionsError}</Typography>
          ) : (
            <Typography color="text.secondary">No questions available for this step.</Typography>
          )
        )}

        {step === 3 && !(category === 'Aluminium' && (aluminumProductType === 'unwrought' || aluminumProductType === 'products')) && (
          stepCode && questionsFromApi.length > 0 ? (
            <DynamicQuestionStep
              questions={questionsFromApi}
              loading={questionsLoading}
              error={questionsError}
              getAnswer={getAnswerForStep}
              setAnswer={setAnswer}
              onOptionSelect={handleOptionSelect}
              onValueChange={handleValueChange}
              onBack={handleBack}
              onNext={handleNext}
            />
          ) : questionsLoading ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight={120}><CircularProgress /></Box>
          ) : questionsError ? (
            <Typography color="error" sx={{ mb: 2 }}>{questionsError}</Typography>
          ) : (
            <Typography color="text.secondary">No questions available for this step.</Typography>
          )
        )}

        {step === 5 && (category === 'Aluminium' && aluminumProductType === 'unwrought' && dataQualityLevel === 'real-data' ? (
          <Grid container spacing={3} sx={{ width: '100%', maxWidth: '100%' }}>
            {fuelLookupError && (
              <Grid size={12}>
                <Typography color="error" sx={{ mb: 2 }}>{fuelLookupError}</Typography>
              </Grid>
            )}
            {fuelEntries.map((entry: FuelEntry, index: number) => (
              <Grid container key={entry.id} spacing={2} sx={{ mb: 3, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1, width: '100%' }}>
                <Grid size={12}>
                  <FormControl fullWidth disabled={fuelLookupLoading}>
                    <InputLabel>Sector</InputLabel>
                    <Select
                      value={entry.sector}
                      label="Sector"
                      onChange={(e: { target: { value: string } }) => updateFuelEntry(index, { sector: e.target.value, subsector: '', subsubsector: '', emissionFactorName: '', denominator: '', emissionFactorId: null, emissionFactorValue: null })}
                    >
                      {fuelSectors.map((s: string) => (
                        <MenuItem key={s} value={s}>{s}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={12}>
                  <FormControl fullWidth disabled={fuelLookupLoading || !entry.sector}>
                    <InputLabel>Subsector</InputLabel>
                    <Select
                      value={entry.subsector}
                      label="Subsector"
                      onChange={(e: { target: { value: string } }) => updateFuelEntry(index, { subsector: e.target.value, subsubsector: '', emissionFactorName: '', denominator: '', emissionFactorId: null, emissionFactorValue: null })}
                    >
                      {(subsectorsCache[entry.sector] ?? []).map((s: string) => (
                        <MenuItem key={s} value={s}>{s}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={12}>
                  <FormControl fullWidth disabled={fuelLookupLoading || !entry.subsector}>
                    <InputLabel>Subsubsector</InputLabel>
                    <Select
                      value={entry.subsubsector}
                      label="Subsubsector"
                      onChange={(e: { target: { value: string } }) => updateFuelEntry(index, { subsubsector: e.target.value, emissionFactorName: '', denominator: '', emissionFactorId: null, emissionFactorValue: null })}
                    >
                      {(subsubsectorsCache[entry.sector && entry.subsector ? `${entry.sector}|${entry.subsector}` : ''] ?? []).map((s: string) => (
                        <MenuItem key={s} value={s}>{s}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={12}>
                  <FormControl fullWidth disabled={fuelLookupLoading || !entry.subsector}>
                    <InputLabel>EmissionFactorName</InputLabel>
                    <Select
                      value={entry.emissionFactorName}
                      label="EmissionFactorName"
                      onChange={(e: { target: { value: string } }) => updateFuelEntry(index, { emissionFactorName: e.target.value, denominator: '', emissionFactorId: null, emissionFactorValue: null })}
                    >
                      {(emissionFactorNamesCache[entry.sector && entry.subsector ? `${entry.sector}|${entry.subsector}|${entry.subsubsector ?? ''}` : ''] ?? []).map((s: string) => (
                        <MenuItem key={s} value={s}>{s}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={12}>
                  <FormControl fullWidth disabled={fuelLookupLoading || !entry.emissionFactorName}>
                    <InputLabel>Denominator</InputLabel>
                    <Select
                      value={entry.denominator}
                      label="Denominator"
                      onChange={async (e: { target: { value: string } }) => {
                        const denom = e.target.value;
                        updateFuelEntry(index, { denominator: denom });
                        const nextEntry = { ...entry, denominator: denom };
                        await resolveEmissionFactorId(nextEntry);
                      }}
                    >
                      {(denominatorsCache[entry.sector && entry.subsector && entry.emissionFactorName ? `${entry.sector}|${entry.subsector}|${entry.subsubsector ?? ''}|${entry.emissionFactorName}` : ''] ?? []).map((s: string) => (
                        <MenuItem key={s} value={s}>{s}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={12}>
                  <TextField
                    fullWidth
                    label="Amount (Količina)"
                    value={entry.amount}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateFuelEntry(index, { amount: e.target.value })}
                    slotProps={{ htmlInput: { min: 0, step: 'any' } }}
                  />
                </Grid>
              </Grid>
            ))}
            <Grid size={12}>
              <Button
                type="button"
                variant="outlined"
                size="medium"
                startIcon={<Add />}
                onClick={() => setFuelEntries((prev: FuelEntry[]) => [
                  ...prev,
                  {
                    id: prev.length > 0 ? Math.max(...prev.map((e: FuelEntry) => e.id)) + 1 : 1,
                    sector: '',
                    subsector: '',
                    subsubsector: '',
                    emissionFactorName: '',
                    denominator: '',
                    amount: '',
                    emissionFactorId: null,
                    emissionFactorValue: null,
                  },
                ])}
                sx={{ mb: 2 }}
              >
                Add more fuels
              </Button>
            </Grid>
            <Grid size={12}>
              <Box display="flex" justifyContent="space-between" sx={{ mt: 3 }}>
                <Button type="button" variant="outlined" size="large" startIcon={<ArrowBack />} onClick={handleBack}>
                  Back
                </Button>
                <Button
                  type="button"
                  variant="contained"
                  size="large"
                  endIcon={<ArrowForward />}
                  onClick={handleNext}
                  disabled={fuelLookupLoading}
                >
                  Next
                </Button>
              </Box>
            </Grid>
          </Grid>
        ) : stepCode && questionsFromApi.length > 0 ? (
          <>
            {dataQualityLevel === 'calculated-emissions' && (
              <Typography variant="h6" component="h2" sx={{ mb: 3, fontWeight: 600 }}>
                Unesite:
              </Typography>
            )}
            <DynamicQuestionStep
              questions={questionsFromApi}
              loading={questionsLoading}
              error={questionsError}
              getAnswer={getAnswerForStep}
              setAnswer={setAnswer}
              onOptionSelect={handleOptionSelect}
              onValueChange={handleValueChange}
              onBack={handleBack}
              onNext={handleNext}
            />
          </>
        ) : questionsLoading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={120}><CircularProgress /></Box>
        ) : questionsError ? (
          <Typography color="error" sx={{ mb: 2 }}>{questionsError}</Typography>
        ) : (
          <Typography color="text.secondary">No questions available for this step.</Typography>
        )
        )}


        {step === 6 && (
          (stepCode && questionsFromApi.length > 0) ? (
            (() => {
              const anodeTypeQuestion = questionsFromApi.find((q: { code: string }) => q.code === 'ALU_ANODE_TYPE');
              const anodeTypeAnswer = anodeTypeQuestion != null ? getAnswer(anodeTypeQuestion.id) : '';
              const isSoderberg = anodeTypeAnswer === 'SODERBERG' || anodeTypeAnswer === 'soderberg';
              // Show only anode type question until user selects and presses Next (no reroute on selection)
              const showAnodeTypeOnly = anodeTypeQuestion != null && (anodeTypeAnswer === '' || !anodeTypeConfirmed);
              if (showAnodeTypeOnly) {
                return (
                  <DynamicQuestionStep
                    questions={[anodeTypeQuestion]}
                    loading={questionsLoading}
                    error={questionsError}
                    getAnswer={getAnswerForStep}
                    setAnswer={setAnswer}
                    onOptionSelect={handleOptionSelect}
                    onValueChange={handleValueChange}
                    onBack={handleBack}
                    onNext={handleNext}
                  />
                );
              }
              // If Söderberg selected: anode paste quantity, has carbon % (Da/Ne), carbon % if Da; formulas Da -> amount*(percent/100)*(44/12), Ne -> amount*(44/12)*85%
              if (anodeTypeQuestion != null && isSoderberg) {
                const pasteQtyQ = questionsFromApi.find((q: { code: string }) => q.code === 'ALU_SODERBERG_PASTE_QTY');
                const hasCarbonQ = questionsFromApi.find((q: { code: string }) => q.code === 'ALU_SODERBERG_HAS_CARBON_PERCENT');
                const carbonPercentQ = questionsFromApi.find((q: { code: string }) => q.code === 'ALU_SODERBERG_CARBON_PERCENT');
                const pasteQtyVal = pasteQtyQ != null ? getAnswer(pasteQtyQ.id) : '';
                const hasCarbonVal = hasCarbonQ != null ? getAnswer(hasCarbonQ.id) : '';
                const carbonPercentVal = carbonPercentQ != null ? getAnswer(carbonPercentQ.id) : '';
                const showCarbonPercent = hasCarbonVal === 'YES' || hasCarbonVal === 'yes';
                const soderbergQuestions: QuestionWithOptions[] = [pasteQtyQ, hasCarbonQ].filter((q): q is QuestionWithOptions => q != null);
                if (showCarbonPercent && carbonPercentQ) soderbergQuestions.push(carbonPercentQ);
                if (soderbergQuestions.length === 0) return null;
                const amount = Number.parseFloat(String(pasteQtyVal)) || 0;
                const percent = Number.parseFloat(String(carbonPercentVal)) || 0;
                const soderbergEmissions = showCarbonPercent
                  ? amount * (percent / 100) * (44 / 12)
                  : amount * (44 / 12) * 0.85;
                return (
                  <Grid container spacing={3}>
                    <Grid size={12}>
                      <DynamicQuestionStep
                        questions={soderbergQuestions}
                        loading={questionsLoading}
                        error={questionsError}
                        getAnswer={getAnswerForStep}
                        setAnswer={setAnswer}
                        onOptionSelect={handleOptionSelect}
                        onValueChange={handleValueChange}
                        onBack={handleBack}
                        onNext={handleNext}
                      />
                    </Grid>
                    {pasteQtyVal && (hasCarbonVal === 'NO' || hasCarbonVal === 'no' || (showCarbonPercent && carbonPercentVal)) && (
                      <Grid size={12} sx={{ mt: 2 }}>
                        <Paper elevation={1} sx={{ p: 2, backgroundColor: 'primary.50', border: '1px solid', borderColor: 'primary.200' }}>
                          <Typography variant="body1" sx={{ fontWeight: 600 }}>
                            <strong>Izračunate emisije:</strong>{' '}
                            {soderbergEmissions.toFixed(2)} tonnes CO₂e
                            {showCarbonPercent ? ' (formula: amount × (percent/100) × (44/12))' : ' (formula: amount × (44/12) × 85%)'}
                          </Typography>
                        </Paper>
                      </Grid>
                    )}
                  </Grid>
                );
              }
              // Pre-baked selected: EXACT same list-building as Söderberg – only add carbon % question when "Da" is selected (parent controls list, not child visibility).
              if (anodeTypeQuestion != null && !isSoderberg) {
                const qtyQ = questionsFromApi.find((q: { code: string }) => q.code === 'ALU_ANODES_QTY');
                const hasCarbonQ = questionsFromApi.find((q: { code: string }) => q.code === 'ALU_HAS_CARBON_PERCENT');
                const carbonPercentQ = questionsFromApi.find((q: { code: string }) => q.code === 'ALU_ANODE_CARBON_PERCENT');
                const qtyVal = qtyQ != null ? getAnswer(qtyQ.id) : '';
                const hasCarbonVal = hasCarbonQ != null ? getAnswer(hasCarbonQ.id) : '';
                const carbonPercentVal = carbonPercentQ != null ? getAnswer(carbonPercentQ.id) : '';
                const showCarbonPercent = hasCarbonVal === 'YES' || hasCarbonVal === 'yes' || hasCarbonVal === 'DA' || hasCarbonVal === 'da';
                const prebakedQuestions: QuestionWithOptions[] = [qtyQ, hasCarbonQ].filter((q): q is QuestionWithOptions => q != null);
                if (showCarbonPercent && carbonPercentQ) prebakedQuestions.push(carbonPercentQ);
                if (prebakedQuestions.length === 0) return null;
                const amount = Number.parseFloat(String(qtyVal)) || 0;
                const percent = Number.parseFloat(String(carbonPercentVal)) || 0;
                const prebakedEmissions = showCarbonPercent
                  ? amount * (percent / 100) * (44 / 12)
                  : amount * (44 / 12) * 0.85;
                return (
                  <Grid container spacing={3}>
                    <Grid size={12}>
                      <DynamicQuestionStep
                        questions={prebakedQuestions}
                        loading={questionsLoading}
                        error={questionsError}
                        getAnswer={getAnswerForStep}
                        setAnswer={setAnswer}
                        onOptionSelect={handleOptionSelect}
                        onValueChange={handleValueChange}
                        onBack={handleBack}
                        onNext={handleNext}
                      />
                    </Grid>
                    {qtyVal && (hasCarbonVal === 'NO' || hasCarbonVal === 'no' || (showCarbonPercent && carbonPercentVal)) && (
                      <Grid size={12} sx={{ mt: 2 }}>
                        <Paper elevation={1} sx={{ p: 2, backgroundColor: 'primary.50', border: '1px solid', borderColor: 'primary.200' }}>
                          <Typography variant="body1" sx={{ fontWeight: 600 }}>
                            <strong>Izračunate emisije:</strong>{' '}
                            {prebakedEmissions.toFixed(2)} tonnes CO₂e
                            {showCarbonPercent ? ' (formula: amount × (percent/100) × (44/12))' : ' (formula: amount × (44/12) × 85%)'}
                          </Typography>
                        </Paper>
                      </Grid>
                    )}
                  </Grid>
                );
              }
              return null;
            })()
          ) : (
            questionsLoading ? (
              <Box display="flex" justifyContent="center" alignItems="center" minHeight={120}>
                <CircularProgress />
              </Box>
            ) : questionsError ? (
              <Typography color="error" sx={{ mb: 2 }}>{questionsError}</Typography>
            ) : (
              <Typography color="text.secondary">No questions available for this step.</Typography>
            )
          )
        )}

        {step === 7 && (
          stepCode && questionsFromApi.length > 0 ? (
            <DynamicQuestionStep
              questions={questionsFromApi}
              loading={questionsLoading}
              error={questionsError}
              getAnswer={getAnswerForStep}
              setAnswer={setAnswer}
              onOptionSelect={handleOptionSelect}
              onValueChange={handleValueChange}
              onBack={handleBack}
              onNext={handleNext}
            />
          ) : questionsLoading ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight={120}><CircularProgress /></Box>
          ) : questionsError ? (
            <Typography color="error" sx={{ mb: 2 }}>{questionsError}</Typography>
          ) : (
            <Typography color="text.secondary">No questions available for this step.</Typography>
          )
        )}

        {step === 8 && (
          stepCode && questionsFromApi.length > 0 ? (
            <DynamicQuestionStep
              questions={questionsFromApi}
              loading={questionsLoading}
              error={questionsError}
              getAnswer={getAnswerForStep}
              setAnswer={setAnswer}
              onOptionSelect={handleOptionSelect}
              onValueChange={handleValueChange}
              onBack={handleBack}
              onNext={handleNext}
            />
          ) : questionsLoading ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight={120}><CircularProgress /></Box>
          ) : questionsError ? (
            <Typography color="error" sx={{ mb: 2 }}>{questionsError}</Typography>
          ) : (
            <Typography color="text.secondary">No questions available for this step.</Typography>
          )
        )}


        {step === 9 && (
          stepCode && questionsFromApi.length > 0 ? (
            (() => {
              const flueGasQ = questionsFromApi.find((q: { code: string }) => q.code === 'ALU_FLUE_GAS_TREATMENT');
              const qtyQ = questionsFromApi.find((q: { code: string }) => q.code === 'ALU_FLUE_GAS_QTY');
              const flueGasAnswer = flueGasQ != null ? getAnswer(flueGasQ.id) : '';
              const needsQty = flueGasAnswer === 'SODA_ASH' || flueGasAnswer === 'soda-ash' || flueGasAnswer === 'LIMESTONE' || flueGasAnswer === 'limestone';
              const step9Questions = flueGasQ ? (needsQty && qtyQ ? [flueGasQ, qtyQ] : [flueGasQ]) : questionsFromApi;
              return (
                <DynamicQuestionStep
                  questions={step9Questions}
                  loading={questionsLoading}
                  error={questionsError}
                  getAnswer={getAnswerForStep}
                  setAnswer={setAnswer}
                  onOptionSelect={handleOptionSelect}
                  onValueChange={handleValueChange}
                  onBack={handleBack}
                  onNext={handleNext}
                />
              );
            })()
          ) : questionsLoading ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight={120}><CircularProgress /></Box>
          ) : questionsError ? (
            <Typography color="error" sx={{ mb: 2 }}>{questionsError}</Typography>
          ) : (
            <Typography color="text.secondary">No questions available for this step.</Typography>
          )
        )}

        {step === 10 && !location.pathname.endsWith('/grid') && !location.pathname.endsWith('/self-power') && !location.pathname.endsWith('/ppa') && (
          stepCode && questionsFromApi.length > 0 ? (
            <DynamicQuestionStep
              questions={questionsFromApi}
              loading={questionsLoading}
              error={questionsError}
              getAnswer={getAnswerForStep}
              setAnswer={setAnswer}
              onOptionSelect={handleOptionSelect}
              onValueChange={handleValueChange}
              onBack={handleBack}
              onNext={handleNext}
            />
          ) : questionsLoading ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight={120}><CircularProgress /></Box>
          ) : questionsError ? (
            <Typography color="error" sx={{ mb: 2 }}>{questionsError}</Typography>
          ) : (
            <Typography color="text.secondary">No questions available for this step.</Typography>
          )
        )}

        {step === 11 && location.pathname.endsWith('/grid') && (
          stepCode && questionsFromApi.length > 0 ? (
            <DynamicQuestionStep
              questions={questionsFromApi}
              loading={questionsLoading}
              error={questionsError}
              getAnswer={getAnswerForStep}
              setAnswer={setAnswer}
              onOptionSelect={handleOptionSelect}
              onValueChange={handleValueChange}
              onBack={handleBack}
              onNext={handleNext}
            />
          ) : questionsLoading ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight={120}><CircularProgress /></Box>
          ) : questionsError ? (
            <Typography color="error" sx={{ mb: 2 }}>{questionsError}</Typography>
          ) : (
            <Typography color="text.secondary">No questions available for this step.</Typography>
          )
        )}

        {step === 11 && location.pathname.endsWith('/self-power') && (
          stepCode && questionsFromApi.length > 0 ? (
            <DynamicQuestionStep
              questions={questionsFromApi}
              loading={questionsLoading}
              error={questionsError}
              getAnswer={getAnswerForStep}
              setAnswer={setAnswer}
              onOptionSelect={handleOptionSelect}
              onValueChange={handleValueChange}
              onBack={handleBack}
              onNext={handleNext}
            />
          ) : questionsLoading ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight={120}><CircularProgress /></Box>
          ) : questionsError ? (
            <Typography color="error" sx={{ mb: 2 }}>{questionsError}</Typography>
          ) : (
            <Typography color="text.secondary">No questions available for this step.</Typography>
          )
        )}

        {step === 11 && (location.pathname.endsWith('/ppa') || location.pathname.endsWith('/ppa/yes') || location.pathname.endsWith('/ppa/no')) && (
          stepCode && questionsFromApi.length > 0 ? (
            <DynamicQuestionStep
              questions={questionsFromApi}
              loading={questionsLoading}
              error={questionsError}
              getAnswer={getAnswerForStep}
              setAnswer={setAnswer}
              onOptionSelect={handleOptionSelect}
              onValueChange={handleValueChange}
              onBack={handleBack}
              onNext={handleNext}
            />
          ) : questionsLoading ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight={120}><CircularProgress /></Box>
          ) : questionsError ? (
            <Typography color="error" sx={{ mb: 2 }}>{questionsError}</Typography>
          ) : (
            <Typography color="text.secondary">No questions available for this step.</Typography>
          )
        )}

        {step === 12 && dataQualityLevel === 'calculated-emissions' && (
          <Box sx={{ py: 4 }}>
            <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 700, mb: 3 }}>
              Calculation complete
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Your pre-calculated emissions have been saved.
            </Typography>
            {questionsFromApi.length >= 2 && (() => {
              const directQ = questionsFromApi.find((q: { code: string }) => q.code === 'ALU_TOTAL_DIRECT_EMISSIONS');
              const indirectQ = questionsFromApi.find((q: { code: string }) => q.code === 'ALU_TOTAL_INDIRECT_EMISSIONS');
              const directVal = directQ ? getAnswer(directQ.id) : '';
              const indirectVal = indirectQ ? getAnswer(indirectQ.id) : '';
              const total = (Number.parseFloat(String(directVal)) || 0) + (Number.parseFloat(String(indirectVal)) || 0);
              return (
                <Paper elevation={1} sx={{ p: 3, mb: 3, backgroundColor: 'primary.50', border: '1px solid', borderColor: 'primary.200' }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>Summary</Typography>
                  <Typography variant="body1" sx={{ mb: 1 }}>Total direct emissions: {String(directVal || '—')} tonnes CO₂e</Typography>
                  <Typography variant="body1" sx={{ mb: 1 }}>Total indirect emissions: {String(indirectVal || '—')} tonnes CO₂e</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>Total: {total.toFixed(2)} tonnes CO₂e</Typography>
                </Paper>
              );
            })()}
            <Box display="flex" gap={2} flexWrap="wrap">
              <Button variant="outlined" size="large" startIcon={<ArrowBack />} onClick={handleBack}>
                Back
              </Button>
              <Button variant="contained" size="large" onClick={() => navigate('/dashboard')}>
                Back to Dashboard
              </Button>
              <Button variant="outlined" size="large" onClick={() => navigate('/dashboard/new-calculation')}>
                New calculation
              </Button>
            </Box>
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default NewCalculation;


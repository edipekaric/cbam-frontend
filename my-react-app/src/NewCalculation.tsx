import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  Container,
  Box,
  Button,
  Typography,
  Paper,
  CircularProgress,
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { useProductCategories } from './hooks/useProductCategories';
import { useQuestionsByStep, type QuestionWithOptions } from './hooks/useQuestionsByStep';
import { useCalculationAnswers } from './hooks/useCalculationAnswers';
import { apiRequest } from './utils/api';
import { optionCodeToFrontendState, frontendStateToOptionCode } from './utils/questionStepMapping';
import { QuestionStepWrapper } from './components/QuestionStepWrapper';
import { ProductInfoStep } from './components/ProductInfoStep';
import { FuelInputStep, type FuelEntry } from './components/FuelInputStep';
import { AnodeStep } from './components/AnodeStep';
import { FlueGasStep } from './components/FlueGasStep';
import { CalculationCompleteStep } from './components/CalculationCompleteStep';
import { getAllQuestions, getQuestionsWithOptions, getNextStep } from './api/questions';
import { getCalculation, patchCalculationWizard, type CalculationDto } from './api/calculations';
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
  const { calculationId: calculationIdParam } = useParams<{ calculationId?: string }>();
  const calculationId: number | null = calculationIdParam ? (() => {
    const n = parseInt(calculationIdParam, 10);
    return Number.isNaN(n) ? null : n;
  })() : null;
  const { categoryNames, categories: productCategories, loading: categoriesLoading, error: categoriesError } = useProductCategories();
  const [category, setCategory] = useState('');
  const [productName, setProductName] = useState('');
  const [step, setStep] = useState(1);
  const CBAM_CALC_ID_KEY = 'cbam-new-calculation-id';
  const [, setCalculation] = useState<CalculationDto | null>(null);
  const [currentStepCode, setCurrentStepCode] = useState<string>('PRODUCT_INFO');
  const stepStackRef = useRef<string[]>([]);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createLoading, setCreateLoading] = useState(false);
  const [calculationLoading, setCalculationLoading] = useState(false);
  const [aluminumProductType, setAluminumProductType] = useState('');
  const [aluminumProductSubtype, setAluminumProductSubtype] = useState('');
  const [productionProcess, setProductionProcess] = useState('');
  const [dataQualityLevel, setDataQualityLevel] = useState('');
  
  // Fuel input state - array of fuel entries (emission factor from API lookups)
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
  const [ppaHasEmissionFactor, _setPpaHasEmissionFactor] = useState<string>('');

  // BE-driven: current step from calculation.currentStep. Questions for this step (skip PRODUCT_INFO and COMPLETE).
  const stepCodeForQuestions = useMemo(
    () =>
      currentStepCode && currentStepCode !== 'PRODUCT_INFO' && currentStepCode !== 'COMPLETE'
        ? currentStepCode
        : null,
    [currentStepCode]
  );
  const { questions: questionsFromApi, loading: questionsLoading, error: questionsError } = useQuestionsByStep(stepCodeForQuestions);
  const { answers, getAnswer, setAnswer, saveAnswer, deleteAnswersForQuestions } = useCalculationAnswers(calculationId);

  // Map BE step_code to step number (1–12) so existing step-based UI still works
  const stepFromCurrentStepCode = (code: string): number => {
    switch (code) {
      case 'PRODUCT_INFO': return 1;
      case 'ALU_DECLARATION': return 2;
      case 'ALU_UNWROUGHT':
      case 'ALU_PRODUCT_TYPE': return 3;
      case 'ALU_DATA':
      case 'ALU_SECONDARY_UNWROUGHT_SOURCES':
      case 'ALU_SECONDARY_UNWROUGHT_QTY':
      case 'ALU_SECONDARY_EMBEDDED_EMISSIONS':
      case 'ALU_SECONDARY_EMBEDDED_EMISSIONS_VALUE':
      case 'ALU_SECONDARY_ALLOYING_ELEMENTS':
      case 'ALU_SECONDARY_ALLOYING_PERCENT': return 4;
      case 'FUEL_INPUT':
      case 'ALU_EMISSIONS_INPUT':
      case 'ALU_SECONDARY_FUEL_INPUT':
      case 'ALU_SECONDARY_FUEL_RELATED': return 5;
      case 'ALU_ANODE_TYPE':
      case 'ALU_ANODES_INPUT':
      case 'ALU_ANODES_SODERBERG': return 6;
      case 'ALU_PFC_METHOD': return 7;
      case 'ALU_PFC_METHOD_A':
      case 'ALU_PFC_METHOD_B': return 8;
      case 'ALU_FLUE_GAS_TREATMENT': return 9;
      case 'ALU_ELECTRICITY_SOURCE': return 10;
      case 'ALU_GRID_CONSUMPTION':
      case 'ALU_OWN_PLANT_FUEL_TYPE':
      case 'ALU_OWN_PLANT_CONSUMPTION':
      case 'ALU_PPA_EMISSION_FACTOR':
      case 'ALU_PPA_EMISSION_FACTOR_AND_CONSUMPTION':
      case 'ALU_PPA_CONSUMPTION_ONLY': return 11;
      case 'COMPLETE': return 12;
      default: return 1;
    }
  };

  // Load calculation when calculationId is in URL (edit or after create redirect)
  useEffect(() => {
    if (calculationId == null) return;
    let cancelled = false;
    setCalculationLoading(true);
    getCalculation(calculationId)
      .then((calc) => {
        if (cancelled) return;
        setCalculation(calc);
        setCurrentStepCode(calc.currentStep);
        setStep(stepFromCurrentStepCode(calc.currentStep));
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setCalculationLoading(false);
      });
    return () => { cancelled = true; };
  }, [calculationId]);

  // Keep step in sync with currentStepCode when it changes (e.g. after Next/Back)
  useEffect(() => {
    setStep(stepFromCurrentStepCode(currentStepCode));
  }, [currentStepCode]);

  // When entering the "related activities" fuel step (skimmings, slag), clear fuel form so user enters fresh data
  useEffect(() => {
    if (currentStepCode === 'ALU_SECONDARY_FUEL_RELATED') {
      setFuelEntries([{ id: 1, sector: '', subsector: '', subsubsector: '', emissionFactorName: '', denominator: '', amount: '', emissionFactorId: null, emissionFactorValue: null }]);
    }
  }, [currentStepCode]);

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

  // When we show the fuel form (primary real-data or secondary fuel steps), load emission factors from API
  const isFuelStepWithLookup =
    step === 5 &&
    ( (category === 'Aluminium' && aluminumProductType === 'unwrought' && dataQualityLevel === 'real-data') ||
      currentStepCode === 'ALU_SECONDARY_FUEL_INPUT' ||
      currentStepCode === 'ALU_SECONDARY_FUEL_RELATED' );

  // Load emission factor sectors when on fuel step (primary or secondary)
  useEffect(() => {
    if (!isFuelStepWithLookup) return;
    let cancelled = false;
    setFuelLookupLoading(true);
    setFuelLookupError(null);
    getLookupSectors()
      .then((list) => { if (!cancelled) setFuelSectors(list); })
      .catch((e) => { if (!cancelled) setFuelLookupError(e instanceof Error ? e.message : 'Failed to load sectors'); setFuelSectors([]); })
      .finally(() => { if (!cancelled) setFuelLookupLoading(false); });
    return () => { cancelled = true; };
  }, [isFuelStepWithLookup]);

  // Populate cascading caches: subsectors by sector (from emission_factors)
  useEffect(() => {
    if (!isFuelStepWithLookup) return;
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
  }, [isFuelStepWithLookup, fuelEntries, subsectorsCache]);

  // Subsubsectors by sector+subsector (e.g. if subsector is "Liquid fuels", only options for that subsector)
  useEffect(() => {
    if (!isFuelStepWithLookup) return;
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
  }, [isFuelStepWithLookup, fuelEntries, subsubsectorsCache]);

  // Emission factor names by sector+subsector+subsubsector
  useEffect(() => {
    if (!isFuelStepWithLookup) return;
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
  }, [isFuelStepWithLookup, fuelEntries, emissionFactorNamesCache]);

  // Denominators by sector+subsector+subsubsector+emissionFactorName
  useEffect(() => {
    if (!isFuelStepWithLookup) return;
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
  }, [isFuelStepWithLookup, fuelEntries, denominatorsCache]);

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

  // Step and currentStepCode are now driven by BE (calculation.currentStep); no URL-based restore.

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

  // When URL is /dashboard/new-calculation (no id), create calculation and redirect to /dashboard/new-calculation/:id
  useEffect(() => {
    if (calculationId != null || location.pathname !== '/dashboard/new-calculation') return;
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
        navigate(`/dashboard/new-calculation/${calcResult.data.calculation.id}`, { replace: true });
      }
      setCalculationLoading(false);
    })();
    return () => { cancelled = true; };
  }, [calculationId, location.pathname, navigate]);

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
      const anodeTypeQuestion = questionsFromApi?.find((q: { code: string }) => q.code === 'ALU_ANODE_TYPE');
      const anodeTypeAnswer = anodeTypeQuestion != null ? getAnswerForStep(anodeTypeQuestion.id) : '';
      const isPreBaked = anodeTypeAnswer === 'PRE_BAKED' || anodeTypeAnswer === 'pre-baked';
      for (const q of questionsFromApi) {
        const value = getAnswerForStep(q.id);
        if (step === 6 && q.code === 'ALU_ANODES_UNIT') {
          if (anodeTypeConfirmed && isPreBaked) valuesToSave.push({ questionId: q.id, value: 'TONNES' });
        } else if (value != null && value !== '') valuesToSave.push({ questionId: q.id, value });
      }
      // Save first so routing answer exists before getNextStep; then delete only answers we did not re-save (e.g. cleared options).
      const savedIds = new Set(valuesToSave.map((v) => v.questionId));
      for (const item of valuesToSave) {
        await saveAnswer(item.questionId, item.value);
      }
      const toDelete = questionIds.filter((id: number) => !savedIds.has(id));
      if (toDelete.length > 0) {
        await deleteAnswersForQuestions(toDelete);
      }
    }
    if (step === 1 && currentStepCode === 'PRODUCT_INFO') {
      if (!category || !productName) {
        return;
      }
      const productCategoryId = productCategories.find((c) => c.name === category)?.id;
      if (productCategoryId == null) {
        setCreateError('Invalid product category');
        return;
      }
      if (calculationId == null) {
        setCreateError('Please wait for the calculation to be ready, or start from the dashboard.');
        return;
      }
      setCreateError(null);
      setCreateLoading(true);
      try {
        const cpResult = await apiRequest<{ success: boolean; calculationProduct?: unknown }>('/calculation-products/create', {
          method: 'POST',
          body: JSON.stringify({
            calculation: { id: calculationId },
            productName: productName.trim(),
            productCategory: { id: productCategoryId },
          }),
        });
        if (cpResult === null || !cpResult.data.success) {
          setCreateError((cpResult?.data as { message?: string })?.message ?? 'Failed to save product');
          setCreateLoading(false);
          return;
        }
        const nextStep = category === 'Aluminium' ? 'ALU_DECLARATION' : 'FUEL_INPUT';
        await patchCalculationWizard(calculationId, { currentStep: nextStep });
        stepStackRef.current.push('PRODUCT_INFO');
        setCurrentStepCode(nextStep);
        setCalculation((c: CalculationDto | null) => (c ? { ...c, currentStep: nextStep } : null));
      } catch (err) {
        setCreateError(err instanceof Error ? err.message : 'Failed to save product');
      } finally {
        setCreateLoading(false);
      }
      return;
    }
    if (step === 2) {
      if (category === 'Aluminium' && !aluminumProductType) return;
      if (calculationId == null) return;
      try {
        const { toStepCode } = await getNextStep(calculationId, currentStepCode);
        stepStackRef.current.push(currentStepCode);
        await patchCalculationWizard(calculationId, { currentStep: toStepCode });
        setCurrentStepCode(toStepCode);
        setCalculation((c: CalculationDto | null) => (c ? { ...c, currentStep: toStepCode } : null));
      } catch {
        // validation or API error
      }
    } else if (step === 3) {
      if (category === 'Aluminium' && aluminumProductType === 'unwrought' && !productionProcess) return;
      if (category === 'Aluminium' && aluminumProductType === 'products' && !aluminumProductSubtype) return;
      if (calculationId == null) return;
      try {
        const { toStepCode } = await getNextStep(calculationId, currentStepCode);
        stepStackRef.current.push(currentStepCode);
        await patchCalculationWizard(calculationId, { currentStep: toStepCode });
        setCurrentStepCode(toStepCode);
        setCalculation((c: CalculationDto | null) => (c ? { ...c, currentStep: toStepCode } : null));
      } catch {
        // validation or API error
      }
    } else if (step === 4) {
      // Only require dataQualityLevel when on ALU_DATA (primary/both path); secondary path never sets it
      if (currentStepCode === 'ALU_DATA' && category === 'Aluminium' && aluminumProductType === 'unwrought' && !dataQualityLevel) return;
      if (calculationId == null) return;
      try {
        const { toStepCode } = await getNextStep(calculationId, currentStepCode);
        stepStackRef.current.push(currentStepCode);
        await patchCalculationWizard(calculationId, { currentStep: toStepCode });
        setCurrentStepCode(toStepCode);
        setCalculation((c: CalculationDto | null) => (c ? { ...c, currentStep: toStepCode } : null));
      } catch {
        // validation or API error
      }
    } else if (step === 5) {
      const isPrimaryFuel = category === 'Aluminium' && aluminumProductType === 'unwrought' && dataQualityLevel === 'real-data';
      const isSecondaryFuel = currentStepCode === 'ALU_SECONDARY_FUEL_INPUT';
      const isSecondaryFuelRelated = currentStepCode === 'ALU_SECONDARY_FUEL_RELATED';
      if (isPrimaryFuel || isSecondaryFuel || isSecondaryFuelRelated) {
        const allValid = fuelEntries.every((entry: FuelEntry) =>
          entry.sector && entry.subsector && entry.emissionFactorName && entry.denominator && entry.amount && entry.emissionFactorId != null
        );
        if (!allValid || fuelEntries.length === 0) return;
        const fuelQtyCode = isSecondaryFuelRelated ? 'ALU_SECONDARY_FUEL_RELATED_QTY' : isSecondaryFuel ? 'ALU_SECONDARY_FUEL_QTY' : 'FUEL_QTY';
        const fuelQtyQuestion = questionsFromApi?.find((q: { code: string }) => q.code === fuelQtyCode);
        if (calculationId != null && fuelQtyQuestion) {
          await deleteAnswersForQuestions([fuelQtyQuestion.id]);
          for (const entry of fuelEntries) {
            if (entry.amount && entry.emissionFactorId != null) {
              await saveAnswer(fuelQtyQuestion.id, entry.amount, entry.emissionFactorId);
            }
          }
        }
      }
      if (calculationId == null) return;
      try {
        const { toStepCode } = await getNextStep(calculationId, currentStepCode);
        stepStackRef.current.push(currentStepCode);
        if (toStepCode === 'COMPLETE') {
          await patchCalculationWizard(calculationId, { status: 'COMPLETED' });
        } else {
          await patchCalculationWizard(calculationId, { currentStep: toStepCode });
        }
        setCurrentStepCode(toStepCode);
        setCalculation((c: CalculationDto | null) => (c ? { ...c, currentStep: toStepCode, status: toStepCode === 'COMPLETE' ? 'COMPLETED' : c.status } : null));
      } catch {
        // validation or API error
      }
    } else if (step === 6) {
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
      if (anodeTypeQuestion && anodeTypeAnswer !== '') {
        setAnodeTypeConfirmed(true);
        if (currentStepCode === 'ALU_ANODE_TYPE') {
          if (calculationId == null) return;
          try {
            const { toStepCode } = await getNextStep(calculationId, currentStepCode);
            stepStackRef.current.push(currentStepCode);
            await patchCalculationWizard(calculationId, { currentStep: toStepCode });
            setCurrentStepCode(toStepCode);
            setCalculation((c: CalculationDto | null) => (c ? { ...c, currentStep: toStepCode } : null));
          } catch {
            // validation or API error
          }
          return;
        }
        if (isPreBaked && !anodesFormFilled) return;
        if (anodeTypeAnswer === 'SODERBERG' || anodeTypeAnswer === 'soderberg') {
          if (!soderbergFormFilled) return;
        }
      }
      if (calculationId == null) return;
      try {
        const { toStepCode } = await getNextStep(calculationId, currentStepCode);
        stepStackRef.current.push(currentStepCode);
        await patchCalculationWizard(calculationId, { currentStep: toStepCode });
        setCurrentStepCode(toStepCode);
        setCalculation((c: CalculationDto | null) => (c ? { ...c, currentStep: toStepCode } : null));
      } catch {
        // validation or API error
      }
    } else if (step === 7) {
      if (!pfcMethod) return;
      if (calculationId == null) return;
      try {
        const { toStepCode } = await getNextStep(calculationId, currentStepCode);
        stepStackRef.current.push(currentStepCode);
        await patchCalculationWizard(calculationId, { currentStep: toStepCode });
        setCurrentStepCode(toStepCode);
        setCalculation((c: CalculationDto | null) => (c ? { ...c, currentStep: toStepCode } : null));
      } catch {
        // validation or API error
      }
    } else if (step === 8) {
      if (currentStepCode === 'ALU_PFC_METHOD_A' && (!anodeEffectFrequency || !anodeEffectDuration || !primaryAluminumQuantity || !cellTechnology)) return;
      if (currentStepCode === 'ALU_PFC_METHOD_B' && questionsFromApi?.length) {
        const aeoQ = questionsFromApi.find((q: { code: string }) => q.code === 'ALU_AEO_VALUE');
        const ceQ = questionsFromApi.find((q: { code: string }) => q.code === 'ALU_CE_CURRENT_EFFICIENCY');
        const qtyQ = questionsFromApi.find((q: { code: string }) => q.code === 'ALU_PRIMARY_AL_QTY_OVERVOLTAGE');
        const cellQ = questionsFromApi.find((q: { code: string }) => q.code === 'ALU_CELL_TECHNOLOGY_OVERVOLTAGE');
        if (!aeoQ || !ceQ || !qtyQ || !cellQ || !getAnswer(aeoQ.id) || !getAnswer(ceQ.id) || !getAnswer(qtyQ.id) || !getAnswer(cellQ.id)) return;
      }
      if (calculationId == null) return;
      try {
        const { toStepCode } = await getNextStep(calculationId, currentStepCode);
        stepStackRef.current.push(currentStepCode);
        await patchCalculationWizard(calculationId, { currentStep: toStepCode });
        setCurrentStepCode(toStepCode);
        setCalculation((c: CalculationDto | null) => (c ? { ...c, currentStep: toStepCode } : null));
      } catch {
        // validation or API error
      }
    } else if (step === 9) {
      const flueGasQuestion = questionsFromApi?.find((q: { code: string }) => q.code === 'ALU_FLUE_GAS_TREATMENT');
      const flueGasAnswer = flueGasQuestion != null ? getAnswer(flueGasQuestion.id) : '';
      const needsQty = flueGasAnswer === 'SODA_ASH' || flueGasAnswer === 'soda-ash' || flueGasAnswer === 'LIMESTONE' || flueGasAnswer === 'limestone';
      const qtyQuestion = questionsFromApi?.find((q: { code: string }) => q.code === 'ALU_FLUE_GAS_QTY');
      if (!flueGasAnswer) return;
      if (needsQty && qtyQuestion && !getAnswer(qtyQuestion.id)) return;
      if (calculationId == null) return;
      try {
        const { toStepCode } = await getNextStep(calculationId, currentStepCode);
        stepStackRef.current.push(currentStepCode);
        await patchCalculationWizard(calculationId, { currentStep: toStepCode });
        setCurrentStepCode(toStepCode);
        setCalculation((c: CalculationDto | null) => (c ? { ...c, currentStep: toStepCode } : null));
      } catch {
        // validation or API error
      }
    } else if (step === 10) {
      if (!electricitySource) return;
      if (calculationId == null) return;
      try {
        const { toStepCode } = await getNextStep(calculationId, currentStepCode);
        stepStackRef.current.push(currentStepCode);
        if (toStepCode === 'COMPLETE') {
          await patchCalculationWizard(calculationId, { status: 'COMPLETED' });
        } else {
          await patchCalculationWizard(calculationId, { currentStep: toStepCode });
        }
        setCurrentStepCode(toStepCode);
        setCalculation((c: CalculationDto | null) => (c ? { ...c, currentStep: toStepCode, status: toStepCode === 'COMPLETE' ? 'COMPLETED' : c.status } : null));
      } catch {
        // validation or API error
      }
    } else if (step === 11) {
      if (electricitySource === 'ppa' && !ppaHasEmissionFactor) return;
      if (calculationId == null) return;
      try {
        const { toStepCode } = await getNextStep(calculationId, currentStepCode);
        stepStackRef.current.push(currentStepCode);
        if (toStepCode === 'COMPLETE') {
          await patchCalculationWizard(calculationId, { status: 'COMPLETED' });
        } else {
          await patchCalculationWizard(calculationId, { currentStep: toStepCode });
        }
        setCurrentStepCode(toStepCode);
        setCalculation((c: CalculationDto | null) => (c ? { ...c, currentStep: toStepCode, status: toStepCode === 'COMPLETE' ? 'COMPLETED' : c.status } : null));
      } catch {
        // validation or API error
      }
    }
  };

  const handleBack = async () => {
    const previousStepCode = stepStackRef.current.pop();
    if (previousStepCode == null) {
      navigate('/dashboard');
      return;
    }
    if (calculationId == null) return;

    // Delete answers for the step we're going back TO (per requirement: Back from 2 -> 1, delete step 1's answers)
    if (previousStepCode !== 'PRODUCT_INFO') {
      try {
        const prevQuestions = await getQuestionsWithOptions(previousStepCode);
        const prevQuestionIds = prevQuestions.map((q) => q.id);
        if (prevQuestionIds.length > 0) {
          await deleteAnswersForQuestions(prevQuestionIds);
        }
      } catch {
        // ignore
      }
    }

    await patchCalculationWizard(calculationId, { currentStep: previousStepCode });
    setCurrentStepCode(previousStepCode);
    setCalculation((c: CalculationDto | null) => (c ? { ...c, currentStep: previousStepCode } : null));

    if (step === 6 && (currentStepCode === 'ALU_ANODES_INPUT' || currentStepCode === 'ALU_ANODES_SODERBERG')) {
      setAnodeTypeConfirmed(false);
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
          <ProductInfoStep
            productName={productName}
            onProductNameChange={setProductName}
            category={category}
            onCategoryChange={setCategory}
            categoryNames={categoryNames}
            categoriesLoading={categoriesLoading}
            categoriesError={categoriesError}
            createError={createError}
            createLoading={createLoading}
            calculationLoading={calculationLoading}
            calculationId={calculationId}
            onNext={handleNext}
          />
        )}

        {step === 2 && (
          <QuestionStepWrapper
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
        )}

        {step === 3 && (
          <QuestionStepWrapper
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
        )}

        {step === 4 && (
          <QuestionStepWrapper
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
        )}

        {step === 5 && ((category === 'Aluminium' && aluminumProductType === 'unwrought' && dataQualityLevel === 'real-data' || currentStepCode === 'ALU_SECONDARY_FUEL_INPUT' || currentStepCode === 'ALU_SECONDARY_FUEL_RELATED') ? (
          <FuelInputStep
            title={currentStepCode === 'ALU_SECONDARY_FUEL_RELATED' ? questionsFromApi?.find((q: { code: string }) => q.code === 'ALU_SECONDARY_FUEL_RELATED_STEP_LABEL')?.label : currentStepCode === 'ALU_SECONDARY_FUEL_INPUT' ? questionsFromApi?.find((q: { code: string }) => q.code === 'ALU_SECONDARY_FUEL_STEP_LABEL')?.label : questionsFromApi?.find((q: { code: string }) => q.code === 'FUEL_STEP_LABEL')?.label}
            addButtonLabel={currentStepCode === 'ALU_SECONDARY_FUEL_INPUT' || currentStepCode === 'ALU_SECONDARY_FUEL_RELATED' ? 'ADD ANOTHER FUEL' : undefined}
            fuelEntries={fuelEntries}
            updateFuelEntry={updateFuelEntry}
            resolveEmissionFactorId={resolveEmissionFactorId}
            addFuelEntry={() =>
              setFuelEntries((prev: FuelEntry[]) => [
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
              ])
            }
            fuelSectors={fuelSectors}
            subsectorsCache={subsectorsCache}
            subsubsectorsCache={subsubsectorsCache}
            emissionFactorNamesCache={emissionFactorNamesCache}
            denominatorsCache={denominatorsCache}
            fuelLookupLoading={fuelLookupLoading}
            fuelLookupError={fuelLookupError}
            onBack={handleBack}
            onNext={handleNext}
          />
        ) : (
          <QuestionStepWrapper
            questions={questionsFromApi}
            loading={questionsLoading}
            error={questionsError}
            getAnswer={getAnswerForStep}
            setAnswer={setAnswer}
            onOptionSelect={handleOptionSelect}
            onValueChange={handleValueChange}
            onBack={handleBack}
            onNext={handleNext}
            title={
              dataQualityLevel === 'calculated-emissions' ? (
                <Typography variant="h6" component="h2" sx={{ mb: 3, fontWeight: 600 }}>
                  Unesite:
                </Typography>
              ) : undefined
            }
          />
        ))}


        {step === 6 && (
          stepCodeForQuestions && questionsFromApi.length > 0 ? (
            <AnodeStep
              currentStepCode={currentStepCode}
              questionsFromApi={questionsFromApi}
              questionsLoading={questionsLoading}
              questionsError={questionsError}
              getAnswerForStep={getAnswerForStep}
              setAnswer={setAnswer}
              onOptionSelect={handleOptionSelect}
              onValueChange={handleValueChange}
              onBack={handleBack}
              onNext={handleNext}
            />
          ) : questionsLoading ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight={120}>
              <CircularProgress />
            </Box>
          ) : questionsError ? (
            <Typography color="error" sx={{ mb: 2 }}>{questionsError}</Typography>
          ) : (
            <Typography color="text.secondary">No questions available for this step.</Typography>
          )
        )}

        {step === 7 && (
          <QuestionStepWrapper
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
        )}

        {step === 8 && (
          <QuestionStepWrapper
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
        )}

        {step === 9 && (
          stepCodeForQuestions && questionsFromApi.length > 0 ? (
            <FlueGasStep
              questionsFromApi={questionsFromApi}
              questionsLoading={questionsLoading}
              questionsError={questionsError}
              getAnswer={getAnswer}
              getAnswerForStep={getAnswerForStep}
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

        {step === 10 && !location.pathname.endsWith('/grid') && !location.pathname.endsWith('/self-power') && !location.pathname.endsWith('/ppa') && (
          <QuestionStepWrapper
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
        )}

        {step === 11 && (currentStepCode === 'ALU_GRID_CONSUMPTION' || currentStepCode === 'ALU_OWN_PLANT_FUEL_TYPE' || currentStepCode === 'ALU_OWN_PLANT_CONSUMPTION' || currentStepCode === 'ALU_PPA_EMISSION_FACTOR' || currentStepCode === 'ALU_PPA_EMISSION_FACTOR_AND_CONSUMPTION' || currentStepCode === 'ALU_PPA_CONSUMPTION_ONLY' || location.pathname.endsWith('/grid') || location.pathname.endsWith('/self-power') || location.pathname.endsWith('/ppa') || location.pathname.endsWith('/ppa/yes') || location.pathname.endsWith('/ppa/no')) && (
          <QuestionStepWrapper
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
        )}

        {step === 12 && dataQualityLevel === 'calculated-emissions' && (
          <CalculationCompleteStep
            questionsFromApi={questionsFromApi}
            getAnswer={getAnswer}
            onBack={handleBack}
            onBackToDashboard={() => navigate('/dashboard')}
            onNewCalculation={() => navigate('/dashboard/new-calculation')}
          />
        )}
      </Paper>
    </Container>
  );
};

export default NewCalculation;


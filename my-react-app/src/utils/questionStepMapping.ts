/**
 * Maps frontend step + context to DB step_code for fetching questions.
 * step_code values come from SQL: ALU_DECLARATION, ALU_UNWROUGHT, ALU_PRODUCT_TYPE, ALU_DATA, FUEL_INPUT, ALU_ANODES, ALU_PFC_METHOD, ALU_PFC_METHOD_A, ALU_ELECTRICITY_SOURCE.
 */
export function getStepCode(params: {
  step: number;
  category: string;
  aluminumProductType: string;
  pathname: string;
}): string | null {
  const { step, category, aluminumProductType, pathname } = params;
  if (category !== 'Aluminium') return null;

  switch (step) {
    case 2:
      return 'ALU_DECLARATION'; // ALU_DECLARATION_PRODUCT
    case 3:
      return aluminumProductType === 'unwrought' ? 'ALU_UNWROUGHT' : 'ALU_PRODUCT_TYPE';
    case 4:
      return aluminumProductType === 'unwrought' ? 'ALU_DATA' : null; // products step 4 has no questions from DB
    case 5:
      return 'FUEL_INPUT';
    case 6:
      return 'ALU_ANODES';
    case 7:
      return 'ALU_PFC_METHOD';
    case 8:
      return pathname.endsWith('/overvoltage') ? null : 'ALU_PFC_METHOD_A'; // slope only; overvoltage has no step_code in SQL
    case 9:
      return pathname.endsWith('/grid') || pathname.endsWith('/self-power') || pathname.endsWith('/ppa') ? null : 'ALU_ELECTRICITY_SOURCE';
    default:
      return null;
  }
}

/** Map DB option code -> frontend state value for navigation/URL. */
export function optionCodeToFrontendState(questionCode: string, optionCode: string): string {
  const lower = optionCode.toLowerCase();
  switch (questionCode) {
    case 'ALU_DECLARATION_PRODUCT':
      if (optionCode === 'UNWROUGHT_CN7601') return 'unwrought';
      if (optionCode === 'ALU_PRODUCTS') return 'products';
      return lower;
    case 'ALU_UNWROUGHT_PRODUCTION_METHOD':
      if (optionCode === 'PRIMARY') return 'primary';
      if (optionCode === 'SECONDARY') return 'secondary';
      if (optionCode === 'UNKNOWN_MIXED') return 'unknown';
      return lower;
    case 'ALU_PRODUCT_TYPE':
      if (optionCode === 'WIRE_7605') return 'wire';
      if (optionCode === 'PLATES_7606') return 'sheets';
      if (optionCode === 'FOIL_7607') return 'foils';
      if (optionCode === 'PROFILES_7610') return 'profiles';
      if (optionCode === 'TUBES_FITTINGS_7608_7609') return 'tubes';
      if (optionCode === 'OTHER_7616') return 'other';
      return lower;
    case 'ALU_DATA_AVAILABILITY':
      if (optionCode === 'HAS_REAL_INPUTS') return 'real-data';
      if (optionCode === 'HAS_EMISSIONS_ONLY') return 'calculated-emissions';
      if (optionCode === 'NO_DATA_USE_DEFAULTS') return 'default-values';
      return lower;
    case 'ALU_PFC_METHOD':
      if (optionCode === 'METHOD_A_AE_FREQ_DURATION') return 'anode-effect';
      if (optionCode === 'METHOD_B_AEO_CE') return 'aeo-ce';
      return lower;
    case 'ALU_ELECTRICITY_SOURCE':
      if (optionCode === 'GRID') return 'grid';
      if (optionCode === 'OWN_PLANT') return 'self-power';
      if (optionCode === 'PPA') return 'ppa';
      return lower;
    case 'ALU_CELL_TECHNOLOGY':
      return lower.replace(/_/g, '-');
    case 'ALU_HAS_CARBON_PERCENT':
      if (optionCode === 'YES') return 'yes';
      if (optionCode === 'NO') return 'no';
      return lower;
    default:
      return lower;
  }
}

/** Map frontend state value -> DB option code for saving. */
export function frontendStateToOptionCode(questionCode: string, frontendValue: string): string {
  switch (questionCode) {
    case 'ALU_DECLARATION_PRODUCT':
      if (frontendValue === 'unwrought') return 'UNWROUGHT_CN7601';
      if (frontendValue === 'products') return 'ALU_PRODUCTS';
      return frontendValue.toUpperCase();
    case 'ALU_UNWROUGHT_PRODUCTION_METHOD':
      if (frontendValue === 'primary') return 'PRIMARY';
      if (frontendValue === 'secondary') return 'SECONDARY';
      if (frontendValue === 'unknown') return 'UNKNOWN_MIXED';
      return frontendValue.toUpperCase();
    case 'ALU_PRODUCT_TYPE':
      if (frontendValue === 'wire') return 'WIRE_7605';
      if (frontendValue === 'sheets') return 'PLATES_7606';
      if (frontendValue === 'foils') return 'FOIL_7607';
      if (frontendValue === 'profiles') return 'PROFILES_7610';
      if (frontendValue === 'tubes') return 'TUBES_FITTINGS_7608_7609';
      if (frontendValue === 'other') return 'OTHER_7616';
      return frontendValue.toUpperCase();
    case 'ALU_DATA_AVAILABILITY':
      if (frontendValue === 'real-data') return 'HAS_REAL_INPUTS';
      if (frontendValue === 'calculated-emissions') return 'HAS_EMISSIONS_ONLY';
      if (frontendValue === 'default-values') return 'NO_DATA_USE_DEFAULTS';
      return frontendValue.toUpperCase();
    case 'ALU_PFC_METHOD':
      if (frontendValue === 'anode-effect') return 'METHOD_A_AE_FREQ_DURATION';
      if (frontendValue === 'aeo-ce') return 'METHOD_B_AEO_CE';
      return frontendValue.toUpperCase();
    case 'ALU_ELECTRICITY_SOURCE':
      if (frontendValue === 'grid') return 'GRID';
      if (frontendValue === 'self-power') return 'OWN_PLANT';
      if (frontendValue === 'ppa') return 'PPA';
      return frontendValue.toUpperCase();
    case 'ALU_CELL_TECHNOLOGY':
      return frontendValue.replace(/-/g, '_').toUpperCase();
    case 'ALU_HAS_CARBON_PERCENT':
      if (frontendValue === 'yes') return 'YES';
      if (frontendValue === 'no') return 'NO';
      return frontendValue.toUpperCase();
    default:
      return frontendValue.toUpperCase();
  }
}

/**
 * Maps frontend step + context to DB step_code(s) for fetching questions.
 * step_code values come from SQL: ALU_DECLARATION, ALU_UNWROUGHT, ALU_PRODUCT_TYPE, ALU_DATA, FUEL_INPUT, ALU_EMISSIONS_INPUT, ALU_ANODES, ALU_ANODES_INPUT, ALU_PFC_METHOD, ALU_PFC_METHOD_A, ALU_ELECTRICITY_SOURCE.
 * Returns string[] for step 6 (anode) so we fetch both ALU_ANODES_INPUT and ALU_ANODES and merge (no migration needed).
 */
export function getStepCode(params: {
  step: number;
  category: string;
  aluminumProductType: string;
  pathname: string;
  dataQualityLevel?: string;
}): string | string[] | null {
  const { step, category, aluminumProductType, pathname, dataQualityLevel } = params;
  if (category !== 'Aluminium') return null;

  switch (step) {
    case 2:
      return 'ALU_DECLARATION'; // ALU_DECLARATION_PRODUCT
    case 3:
      return aluminumProductType === 'unwrought' ? 'ALU_UNWROUGHT' : 'ALU_PRODUCT_TYPE';
    case 4:
      return aluminumProductType === 'unwrought' ? 'ALU_DATA' : null; // products step 4 has no questions from DB
    case 5:
      return dataQualityLevel === 'calculated-emissions' ? 'ALU_EMISSIONS_INPUT' : 'FUEL_INPUT';
    case 12:
      return dataQualityLevel === 'calculated-emissions' ? 'ALU_EMISSIONS_INPUT' : null;
    case 6:
      // Anode page: anode type, Pre-baked form (ALU_ANODES_INPUT, ALU_ANODES), Söderberg form (ALU_ANODES_SODERBERG)
      return ['ALU_ANODE_TYPE', 'ALU_ANODES_INPUT', 'ALU_ANODES', 'ALU_ANODES_SODERBERG'];
    case 7:
      return 'ALU_PFC_METHOD';
    case 8:
      return pathname.endsWith('/overvoltage') ? 'ALU_PFC_METHOD_B' : 'ALU_PFC_METHOD_A';
    case 9:
      return 'ALU_FLUE_GAS_TREATMENT';
    case 10:
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
      if (optionCode === 'BOTH') return 'both';
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
    case 'ALU_CELL_TECHNOLOGY_OVERVOLTAGE':
      return lower.replace(/_/g, '-');
    case 'ALU_HAS_CARBON_PERCENT':
    case 'ALU_SODERBERG_HAS_CARBON_PERCENT':
      if (optionCode === 'YES') return 'yes';
      if (optionCode === 'NO') return 'no';
      return lower;
    case 'ALU_ANODE_TYPE':
      if (optionCode === 'PRE_BAKED') return 'pre-baked';
      if (optionCode === 'SODERBERG') return 'soderberg';
      return lower;
    case 'ALU_FLUE_GAS_TREATMENT':
      if (optionCode === 'SODA_ASH') return 'soda-ash';
      if (optionCode === 'LIMESTONE') return 'limestone';
      if (optionCode === 'NOTHING') return 'nothing';
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
      if (frontendValue === 'both') return 'BOTH';
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
    case 'ALU_CELL_TECHNOLOGY_OVERVOLTAGE':
      return frontendValue.replace(/-/g, '_').toUpperCase();
    case 'ALU_HAS_CARBON_PERCENT':
    case 'ALU_SODERBERG_HAS_CARBON_PERCENT':
      if (frontendValue === 'yes') return 'YES';
      if (frontendValue === 'no') return 'NO';
      return frontendValue.toUpperCase();
    case 'ALU_ANODE_TYPE':
      if (frontendValue === 'pre-baked') return 'PRE_BAKED';
      if (frontendValue === 'soderberg') return 'SODERBERG';
      return frontendValue.toUpperCase();
    case 'ALU_FLUE_GAS_TREATMENT':
      if (frontendValue === 'soda-ash') return 'SODA_ASH';
      if (frontendValue === 'limestone') return 'LIMESTONE';
      if (frontendValue === 'nothing') return 'NOTHING';
      return frontendValue.toUpperCase();
    default:
      return frontendValue.toUpperCase();
  }
}

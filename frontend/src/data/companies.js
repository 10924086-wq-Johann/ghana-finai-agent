export const COMPANIES = {
  GOIL: {
    symbol: 'GOIL',
    name: 'GOIL Company Ltd',
    sector: 'Energy & Oil',
    marketCap: '₵2.5B',
    about: 'GOIL is Ghana\'s leading oil & gas company, operating fuel distribution and retail networks across the country.',
    tradingStatus: 'Active',
    website: 'www.goilgh.com',
    established: '1983',
  },
  GCB: {
    symbol: 'GCB',
    name: 'GCB Bank Ltd',
    sector: 'Banking & Finance',
    marketCap: '₵5.2B',
    about: 'Ghana Commercial Bank is one of Ghana\'s leading financial institutions, providing banking and financial services.',
    tradingStatus: 'Active',
    website: 'www.gcbbank.com.gh',
    established: '1953',
  },
  EGH: {
    symbol: 'EGH',
    name: 'Ecobank Ghana',
    sector: 'Banking & Finance',
    marketCap: '₵4.2B',
    about: 'Ecobank is a pan-African banking group providing retail, commercial, and investment banking services.',
    tradingStatus: 'Active',
    website: 'www.ecobank.com',
    established: '1988',
  },
  SCB: {
    symbol: 'SCB',
    name: 'Standard Chartered Ghana',
    sector: 'Banking & Finance',
    marketCap: '₵3.7B',
    about: 'Standard Chartered operates as a premier international bank in Ghana with global reach and local expertise.',
    tradingStatus: 'Active',
    website: 'www.sc.com/gh',
    established: '1896',
  },
  MTNGH: {
    symbol: 'MTNGH',
    name: 'MTN Ghana',
    sector: 'Telecom',
    marketCap: '₵2.1B',
    about: 'MTN Ghana is a leading telecommunications company providing mobile services to millions of Ghanaians.',
    tradingStatus: 'Active',
    website: 'www.mtn.com.gh',
    established: '1997',
  },
  CAL: {
    symbol: 'CAL',
    name: 'CalBank',
    sector: 'Banking & Finance',
    marketCap: '₵950M',
    about: 'Capital Bank is a universal bank in Ghana offering retail, commercial, and corporate banking services.',
    tradingStatus: 'Active',
    website: 'www.calbank.com.gh',
    established: '2003',
  },
  FML: {
    symbol: 'FML',
    name: 'Fan Milk Ltd',
    sector: 'Consumer & Food',
    marketCap: '₵1.56B',
    about: 'Fan Milk is Ghana\'s leading dairy and ice cream company, producing quality dairy products.',
    tradingStatus: 'Active',
    website: 'www.fanmilk.com.gh',
    established: '1964',
  },
  UNIL: {
    symbol: 'UNIL',
    name: 'Unilever Ghana',
    sector: 'Consumer Goods',
    marketCap: '₵2.84B',
    about: 'Unilever Ghana manufactures and distributes personal care and home care products.',
    tradingStatus: 'Active',
    website: 'www.unilever.com.gh',
    established: '1960',
  },
  TOTAL: {
    symbol: 'TOTAL',
    name: 'TotalEnergies Ghana',
    sector: 'Energy & Oil',
    marketCap: '₵1.95B',
    about: 'TotalEnergies operates oil and gas exploration, production, and distribution in Ghana.',
    tradingStatus: 'Active',
    website: 'www.totalenergies.com.gh',
    established: '1962',
  },
  SOGEGH: {
    symbol: 'SOGEGH',
    name: 'Societe Generale Ghana',
    sector: 'Banking & Finance',
    marketCap: '₵2.2B',
    about: 'Societe Generale is a global banking group providing corporate and retail banking services in Ghana.',
    tradingStatus: 'Active',
    website: 'www.sg.com.gh',
    established: '1962',
  },
}

export const getSectorColor = (sector) => {
  const colors = {
    'Energy & Oil': '#FF6B35',
    'Banking & Finance': '#004E89',
    'Telecom': '#9D4EDD',
    'Consumer & Food': '#3A86FF',
    'Consumer Goods': '#FB5607',
  }
  return colors[sector] || '#94A3B8'
}

export const getSectorIcon = (sector) => {
  const icons = {
    'Energy & Oil': '⛽',
    'Banking & Finance': '🏦',
    'Telecom': '📱',
    'Consumer & Food': '🍦',
    'Consumer Goods': '🛁',
  }
  return icons[sector] || '📊'
}
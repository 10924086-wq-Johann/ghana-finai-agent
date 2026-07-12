export const LANGUAGES = {
  en: {
    code:     'en',
    name:     'English',
    flag:     '🇬🇧',
    label:    'EN',
    prompt:   'Respond in clear, simple English.',
    greeting: 'Hello! How can I help you with Ghana\'s financial markets today?'
  },
  tw: {
    code:     'tw',
    name:     'Twi (Akan)',
    flag:     '🇬🇭',
    label:    'TWI',
    prompt:   'Respond in Twi (Akan) language. Use simple, clear Twi that Ghanaians understand. Mix in English financial terms where needed since there may not be direct Twi equivalents.',
    greeting: 'Akwaaba! Mɛboa wo wɔ Ghana financial markets ho asɛm biara mu.'
  },
  ha: {
    code:     'ha',
    name:     'Hausa',
    flag:     '🇬🇭',
    label:    'HAUSA',
    prompt:   'Respond in Hausa language as spoken in Ghana and northern Nigeria. Use simple Hausa. Mix in English financial terms where needed.',
    greeting: 'Barka da zuwa! Zan taimaka maka game da kasuwannin kudi na Ghana.'
  },
  ga: {
    code:     'ga',
    name:     'Ga',
    flag:     '🇬🇭',
    label:    'GA',
    prompt:   'Respond in Ga language as spoken in Accra, Ghana. Use simple Ga. Mix in English financial terms where needed.',
    greeting: 'Ojekoo! Miihii bo oshwim Ghana financial markets ho.'
  },
  fat: {
    code:     'fat',
    name:     'Fante',
    flag:     '🇬🇭',
    label:    'FANTE',
    prompt:   'Respond in Fante (Fanti) language as spoken in coastal Ghana. Use simple Fante. Mix in English financial terms where needed.',
    greeting: 'Akwaaba! Meba bo wo ase Ghana financial markets mu asɛm ho.'
  },
  ee: {
    code:     'ee',
    name:     'Ewe',
    flag:     '🇬🇭',
    label:    'EWE',
    prompt:   'Respond in Ewe language as spoken in the Volta Region of Ghana. Use simple Ewe. Mix in English financial terms where needed.',
    greeting: 'Woezor! Mawɔm kpɔ ame Ghana financial markets ŋu.'
  }
}

export const UI_LABELS = {
  en: {
    chatTitle:    'Ghana FinAI Assistant',
    poweredBy:    'Powered by OpenRouter AI',
    clearChat:    'Clear chat',
    placeholder:  'Ask about Ghana\'s markets, stocks, forex...',
    send:         'Send',
    thinking:     'Thinking...',
    language:     'Language',
    alertFeed:    'Live Alert Feed',
    refreshing:   'Refreshing in',
    marketTitle:  'Ghana Market Intelligence',
    selectPrompt: 'Click any alert to see AI decision'
  },
  tw: {
    chatTitle:    'Ghana FinAI Boafoɔ',
    poweredBy:    'OpenRouter AI na ɛma no tumi',
    clearChat:    'Popa nsɛm',
    placeholder:  'Bisa Ghana markets, stocks, forex ho asɛm...',
    send:         'Soma',
    thinking:     'Misu...',
    language:     'Kasa',
    alertFeed:    'Nhyiamu Nsɛm Foforɔ',
    refreshing:   'Wɔrebɔ mu bio',
    marketTitle:  'Ghana Market Adwuma',
    selectPrompt: 'Klik nsɛm biara hwɛ AI adwene'
  },
  ha: {
    chatTitle:    'Ghana FinAI Mataimaki',
    poweredBy:    'OpenRouter AI ne ke',
    clearChat:    'Share zance',
    placeholder:  'Tambaya game da kasuwannin Ghana...',
    send:         'Aika',
    thinking:     'Yana tunani...',
    language:     'Yare',
    alertFeed:    'Labarai Kai Tsaye',
    refreshing:   'Za a sabunta',
    marketTitle:  'Kasuwannin Ghana',
    selectPrompt: 'Danna labari don ganin shawarar AI'
  },
  ga: {
    chatTitle:    'Ghana FinAI Boafo',
    poweredBy:    'OpenRouter AI kɛ ni',
    clearChat:    'Faa nsɛm',
    placeholder:  'Bɔ sane Ghana markets ho...',
    send:         'Tun',
    thinking:     'Eji sumo...',
    language:     'Kasa',
    alertFeed:    'Shwim Nsɛm',
    refreshing:   'Ebɔ mu bio',
    marketTitle:  'Ghana Market',
    selectPrompt: 'Klik nsɛm hwɛ AI adwene'
  },
  fat: {
    chatTitle:    'Ghana FinAI Boafoɔ',
    poweredBy:    'OpenRouter AI na ɛma no tumi',
    clearChat:    'Popa nsɛm',
    placeholder:  'Bisa Ghana markets ho asɛm...',
    send:         'Soma',
    thinking:     'Misu...',
    language:     'Kasa',
    alertFeed:    'Nhyiamu Nsɛm',
    refreshing:   'Wɔrebɔ mu bio',
    marketTitle:  'Ghana Market Adwuma',
    selectPrompt: 'Klik nsɛm hwɛ AI adwene'
  },
  ee: {
    chatTitle:    'Ghana FinAI Kpekpeɖeŋu',
    poweredBy:    'OpenRouter AI wɔ ŋu',
    clearChat:    'Ɖe nyawo',
    placeholder:  'Srɔ̃ Ghana markets, stocks, forex...',
    send:         'Xɔ',
    thinking:     'Le susu...',
    language:     'Gbe',
    alertFeed:    'Xexlẽme Nyatawo',
    refreshing:   'Le ɖo vɛ',
    marketTitle:  'Ghana Market',
    selectPrompt: 'Klik nya aɖe hwɛ AI susu'
  }
}

export function getLanguagePrompt(langCode) {
  return LANGUAGES[langCode]?.prompt || LANGUAGES.en.prompt
}

export function getUILabels(langCode) {
  return UI_LABELS[langCode] || UI_LABELS.en
}

export function getGreeting(langCode) {
  return LANGUAGES[langCode]?.greeting || LANGUAGES.en.greeting
}
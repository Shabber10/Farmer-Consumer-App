// Comprehensive Multilingual Produce Localization for KisanDirect
// Ensures 100% strict single-language display without cross-language mixing.

const PRODUCT_DICTIONARY = {
  // Potatoes
  'Farm Fresh Potatoes': {
    en: 'Farm Fresh Potatoes',
    hi: 'खेत के ताजे आलू',
    te: 'తాజా బంగాళాదుంపలు'
  },
  'Farm Fresh Potatoes (Aloo)': {
    en: 'Farm Fresh Potatoes',
    hi: 'खेत के ताजे आलू',
    te: 'తాజా బంగాళాదుంపలు'
  },
  
  // Tomatoes
  'Fresh Country Tomatoes': {
    en: 'Fresh Country Tomatoes',
    hi: 'ताजा देशी टमाटर',
    te: 'తాజా నాటు టమాటాలు'
  },
  'Country Red Tomatoes': {
    en: 'Fresh Country Tomatoes',
    hi: 'ताजा देशी टमाटर',
    te: 'తాజా నాటు టమాటాలు'
  },
  'Fresh Country Tomatoes (Desi)': {
    en: 'Fresh Country Tomatoes',
    hi: 'ताजा देशी टमाटर',
    te: 'తాజా నాటు టమాటాలు'
  },

  // Onions
  'Crisp Red Onions': {
    en: 'Crisp Red Onions',
    hi: 'कुरकुरे लाल प्याज',
    te: 'తాజా ఎర్ర ఉల్లిపాయలు'
  },
  'Desi Nasik Red Onions': {
    en: 'Crisp Red Onions',
    hi: 'कुरकुरे लाल प्याज',
    te: 'తాజా ఎర్ర ఉల్లిపాయలు'
  },
  'Crisp Farm Red Onions': {
    en: 'Crisp Red Onions',
    hi: 'कुरकुरे लाल प्याज',
    te: 'తాజా ఎర్ర ఉల్లిపాయలు'
  },

  // Spinach
  'Organic Tender Spinach': {
    en: 'Organic Tender Spinach',
    hi: 'जैविक ताजा पालक',
    te: 'సేంద్రీయ తాజా పాలకూర'
  },
  'Organic Tender Palak (Spinach)': {
    en: 'Organic Tender Spinach',
    hi: 'जैविक ताजा पालक',
    te: 'సేంద్రీయ తాజా పాలకూర'
  },
  'Farm Fresh Spinach': {
    en: 'Farm Fresh Spinach',
    hi: 'खेत का ताजा पालक',
    te: 'తాజా పాలకూర'
  },
  'Farm Fresh Spinach (Palak)': {
    en: 'Farm Fresh Spinach',
    hi: 'खेत का ताजा पालक',
    te: 'తాజా పాలకూర'
  },

  // Papaya
  'Farm Fresh Sweet Papaya': {
    en: 'Farm Fresh Sweet Papaya',
    hi: 'मीठा ताजा पपीता',
    te: 'తాజా తియ్యటి బొప్పాయి'
  },

  // Apples
  'Crisp Green Apples': {
    en: 'Crisp Green Apples',
    hi: 'ताजे हरे सेब',
    te: 'తాజా ఆకుపచ్చ ఆపిల్స్'
  },
  'Crisp Shimla Green Apples': {
    en: 'Crisp Green Apples',
    hi: 'ताजे हरे सेब',
    te: 'తాజా ఆకుపచ్చ ఆపిల్స్'
  },

  // Rice
  'Single Polish Sona Masoori Rice': {
    en: 'Single Polish Sona Masoori Rice',
    hi: 'सिंगल पॉलिश सोना मसूरी चावल',
    te: 'సింగిల్ పాలిష్ సోనా మసూరి బియ్యం'
  },
  'Sona Masoori Raw Rice': {
    en: 'Sona Masoori Raw Rice',
    hi: 'सोना मसूरी कच्चा चावल',
    te: 'సోనా మసూరి పచ్చి బియ్యం'
  },
  'Sona Masoori Raw Rice (Aged 1 Year)': {
    en: 'Sona Masoori Raw Rice',
    hi: 'सोना मसूरी कच्चा चावल',
    te: 'సోనా మసూరి పచ్చి బియ్యం'
  },

  // Turmeric
  'Pure Organic Turmeric Powder': {
    en: 'Pure Organic Turmeric Powder',
    hi: 'शुद्ध जैविक हल्दी पाउडर',
    te: 'స్వచ్ఛమైన సేంద్రీయ పసుపు పొడి'
  },
  'Pure Salem Haldi (Turmeric Powder)': {
    en: 'Pure Organic Turmeric Powder',
    hi: 'शुद्ध जैविक हल्दी पाउडर',
    te: 'స్వచ్ఛమైన సేంద్రీయ పసుపు పొడి'
  },
  'Pure Lakadong Turmeric Powder (High Curcumin)': {
    en: 'Pure Organic Turmeric Powder',
    hi: 'शुद्ध जैविक हल्दी पाउडर',
    te: 'స్వచ్ఛమైన సేంద్రీయ పసుపు పొడి'
  },

  // Okra / Ladyfinger
  'Tender Green Okra': {
    en: 'Tender Green Okra',
    hi: 'ताजी हरी भिंडी',
    te: 'లేత బెండకాయలు'
  },
  'Tender Green Ladyfinger (Bhindi)': {
    en: 'Tender Green Okra',
    hi: 'ताजी हरी भिंडी',
    te: 'లేత బెండకాయలు'
  },

  // Eggplant / Brinjal
  'Native Purple Eggplant': {
    en: 'Native Purple Eggplant',
    hi: 'बैंगनी बैंगन',
    te: 'నాటు వంకాయలు'
  },
  'Native Purple Brinjal (Vankaya)': {
    en: 'Native Purple Eggplant',
    hi: 'बैंगनी बैंगन',
    te: 'నాటు వంకాయలు'
  },

  // Guava
  'Organic Sweet Guava': {
    en: 'Organic Sweet Guava',
    hi: 'जैविक मीठा अमरूद',
    te: 'సేంద్రీయ జామపండ్లు'
  },
  'Organic Guava (Allahabad Safeda)': {
    en: 'Organic Sweet Guava',
    hi: 'जैविक मीठा अमरूद',
    te: 'సేంద్రీయ జామపండ్లు'
  },

  // Mangoes
  'Kesar Mangoes (Tree Ripened)': {
    en: 'Kesar Mangoes (Tree Ripened)',
    hi: 'पेड़ पर पके केसर आम',
    te: 'చెట్టున పండిన కేసర్ మామిడిపండ్లు'
  },

  // Foxtail Millet
  'Organic Foxtail Millet': {
    en: 'Organic Foxtail Millet',
    hi: 'जैविक कंगनी (मिलेट)',
    te: 'సేంద్రీయ కొర్రలు'
  },
  'Organic Foxtail Millet (Korra)': {
    en: 'Organic Foxtail Millet',
    hi: 'जैविक कंगनी (मिलेट)',
    te: 'సేంద్రీయ కొర్రలు'
  },

  // Toor Dal / Yellow Pigeon Pea
  'Unpolished Yellow Pigeon Pea': {
    en: 'Unpolished Yellow Pigeon Pea',
    hi: 'बिना पॉलिश अरहर दाल',
    te: 'పాలిష్ చేయని కందిపప్పు'
  },
  'Unpolished Desi Toor Dal (Pigeon Pea)': {
    en: 'Unpolished Yellow Pigeon Pea',
    hi: 'बिना पॉलिश अरहर दाल',
    te: 'పాలిష్ చేయని కందిపప్పు'
  },

  // Moong Dal
  'Organic Yellow Lentils': {
    en: 'Organic Yellow Lentils',
    hi: 'जैविक मूंग दाल',
    te: 'సేంద్రీయ పెసరపప్పు'
  },
  'Organic Yellow Moong Dal': {
    en: 'Organic Yellow Lentils',
    hi: 'जैविक मूंग दाल',
    te: 'సేంద్రీయ పెసరపప్పు'
  },

  // Chillies
  'Fiery Red Dried Chillies': {
    en: 'Fiery Red Dried Chillies',
    hi: 'तीखी सूखी लाल मिर्च',
    te: 'ఎర్ర ఎండుమిర్చి'
  },
  'Guntur Sannam Red Chillies (Stemless)': {
    en: 'Fiery Red Dried Chillies',
    hi: 'तीखी सूखी लाल मिर्च',
    te: 'ఎర్ర ఎండుమిర్చి'
  },

  // Honey
  'Pure Wild Honey (Raw & Unprocessed)': {
    en: 'Pure Wild Forest Honey',
    hi: 'शुद्ध जंगली शहद',
    te: 'స్వచ్ఛమైన అడవి తేనె'
  },

  // Groundnut Oil
  'Cold-Pressed Groundnut Oil (Wood Churn)': {
    en: 'Cold-Pressed Groundnut Oil',
    hi: 'कोल्ड-प्रेस्ड मूंगफली का तेल',
    te: 'గానుగ వేరుశెనగ నూనె'
  }
};

const CATEGORY_NAMES = {
  'Vegetables': { en: 'Vegetables', hi: 'सब्जियां', te: 'కూరగాయలు' },
  'Fruits': { en: 'Fruits', hi: 'फल', te: 'పండ్లు' },
  'Grains': { en: 'Grains', hi: 'अनाज', te: 'ధాన్యాలు' },
  'Pulses': { en: 'Pulses', hi: 'दालें', te: 'పప్పుధాన్యాలు' },
  'Spices': { en: 'Spices', hi: 'मसाले', te: 'మసాలాలు' },
  'Other Products': { en: 'Other Products', hi: 'अन्य उत्पाद', te: 'ఇతర ఉత్పత్తులు' }
};

const UNIT_DICTIONARY = {
  'kg': { en: 'kg', hi: 'किग्रा', te: 'కిలో' },
  '/kg': { en: '/kg', hi: '/किग्रा', te: '/కిలో' },
  'bunch': { en: 'bunch', hi: 'गड्डी', te: 'కట్ట' },
  '/bunch': { en: '/bunch', hi: '/गड्डी', te: '/కట్ట' },
  'litre': { en: 'litre', hi: 'लीटर', te: 'లీటర్' },
  '/litre': { en: '/litre', hi: '/लीटर', te: '/లీటర్' },
  'dozen': { en: 'dozen', hi: 'दर्जन', te: 'డజన్' },
  '/dozen': { en: '/dozen', hi: '/दर्जन', te: '/డజన్' }
};

/**
 * Returns strictly localized product name based on current language.
 * Guarantees zero cross-language bleeding (e.g. no Hindi text when English is selected).
 */
export function getLocalizedProductName(name, language = 'en') {
  if (!name) return '';
  const lang = (language === 'hi' || language === 'te') ? language : 'en';
  
  if (PRODUCT_DICTIONARY[name] && PRODUCT_DICTIONARY[name][lang]) {
    return PRODUCT_DICTIONARY[name][lang];
  }

  // Fallback clean-up: if in English, strip any parenthetical Hindi/Telugu words like (Aloo), (Palak), (Desi), etc.
  if (lang === 'en') {
    return name
      .replace(/\s*\((?:Aloo|Palak|Bhindi|Vankaya|Korra|Desi|Spinach|Safeda|Allahabad)\)/gi, '')
      .replace(/\bDesi\b\s*/gi, '')
      .trim();
  }

  return name;
}

/**
 * Returns strictly localized category name.
 */
export function getLocalizedCategoryName(categoryName, language = 'en') {
  if (!categoryName) return '';
  const lang = (language === 'hi' || language === 'te') ? language : 'en';
  return CATEGORY_NAMES[categoryName]?.[lang] || categoryName;
}

/**
 * Returns strictly localized unit.
 */
export function getLocalizedUnit(unit, language = 'en') {
  if (!unit) return '';
  const lang = (language === 'hi' || language === 'te') ? language : 'en';
  return UNIT_DICTIONARY[unit]?.[lang] || unit;
}

/**
 * Localized quick chips for search
 */
export function getLocalizedQuickChips(language = 'en') {
  if (language === 'hi') {
    return [
      { label: 'सभी', query: '' },
      { label: '🍅 टमाटर', query: 'tomato' },
      { label: '🧅 प्याज', query: 'onion' },
      { label: '🥔 आलू', query: 'potato' },
      { label: '🌿 पालक', query: 'spinach' },
      { label: '🍎 फल', query: 'apple' },
      { label: '🌾 चावल', query: 'rice' },
    ];
  }
  if (language === 'te') {
    return [
      { label: 'అన్నీ', query: '' },
      { label: '🍅 టమాటాలు', query: 'tomato' },
      { label: '🧅 ఉల్లిపాయలు', query: 'onion' },
      { label: '🥔 బంగాళాదుంపలు', query: 'potato' },
      { label: '🌿 పాలకూర', query: 'spinach' },
      { label: '🍎 పండ్లు', query: 'apple' },
      { label: '🌾 బియ్యం', query: 'rice' },
    ];
  }
  return [
    { label: 'All', query: '' },
    { label: '🍅 Tomatoes', query: 'tomato' },
    { label: '🧅 Onions', query: 'onion' },
    { label: '🥔 Potatoes', query: 'potato' },
    { label: '🌿 Spinach', query: 'spinach' },
    { label: '🍎 Fruits', query: 'apple' },
    { label: '🌾 Rice', query: 'rice' },
  ];
}

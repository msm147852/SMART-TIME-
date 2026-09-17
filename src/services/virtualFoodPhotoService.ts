/**
 * Virtual Food Photo Generator Service for SMART TIME
 * Procedurally synthesizes high-fidelity virtual food photo artworks (SVG Data-URIs)
 * with dish-specific color palettes, textures, dish garnishes, steaming vapor,
 * ceramic bowls/plates, and dynamic lighting.
 */

export type VirtualPhotoTheme = 'rustic' | 'golden_kitchen' | 'clay_pot' | 'cinematic' | 'chef_studio';

export interface VirtualPhotoSpec {
  dishTitle: string;
  category?: string;
  group?: string;
  theme?: VirtualPhotoTheme;
  spices?: string[];
  mainColor?: string;
  secondaryColor?: string;
}

/**
 * Returns tailored virtual dish visual configuration based on Egyptian/Arab dish name.
 */
function getDishVisualConfig(title: string, category = '', group = '') {
  const t = title.toLowerCase();
  
  if (t.includes('كشري')) {
    return {
      dishType: 'koshari',
      plateType: 'bowl',
      baseHue: '#C2834E',
      layerColors: ['#E6C280', '#A25828', '#8B2500', '#5E1914', '#D48824'],
      accentColor: '#D32F2F',
      garnish: 'crispy_onions',
      garnishText: 'بصل مقرمش + صلصة شطة + حمص',
      steam: true,
      labelAr: 'كشري مصري أصيل',
      subtext: 'مكرونة وأرز وعدس مع تقلية وصلصة ودقة'
    };
  }
  if (t.includes('ملوخية')) {
    return {
      dishType: 'molokhia',
      plateType: 'clay_tagine',
      baseHue: '#1B4D1B',
      layerColors: ['#123512', '#235D23', '#2E7D32', '#4CAF50', '#81C784'],
      accentColor: '#FBC02D',
      garnish: 'taqleya',
      garnishText: 'طشة ثوم وكزبرة بالسمن البلدي',
      steam: true,
      labelAr: 'ملوخية خضراء بالطشة',
      subtext: 'شوربة غنية مع طشة الثوم والكزبرة'
    };
  }
  if (t.includes('محشي') || t.includes('ورق عنب') || t.includes('كرنب')) {
    return {
      dishType: 'mahshi',
      plateType: 'oval_platter',
      baseHue: '#2E4C1F',
      layerColors: ['#1E3812', '#335C24', '#4E7D38', '#C62828', '#FFB300'],
      accentColor: '#D32F2F',
      garnish: 'lemon_mint',
      garnishText: 'شرائح ليمون + دبس رمان + كزبرة',
      steam: true,
      labelAr: 'محشي مشكل مصري',
      subtext: 'خلطة الأرز بالأعشاب والصلصة'
    };
  }
  if (t.includes('حواوشي')) {
    return {
      dishType: 'hawawshi',
      plateType: 'wood_board',
      baseHue: '#A0522D',
      layerColors: ['#8B4513', '#CD853F', '#D2691E', '#3E2723', '#FF8F00'],
      accentColor: '#4CAF50',
      garnish: 'sesame_peppers',
      garnishText: 'سمسم محمص + مخلل بلدي + فلفل حار',
      steam: true,
      labelAr: 'حواوشي بلدي مقرمش',
      subtext: 'لحم متبل داخل خبز بلدي مخبوز على الحجر'
    };
  }
  if (t.includes('طاجن') || t.includes('بامية') || t.includes('عكاوي')) {
    return {
      dishType: 'tagine',
      plateType: 'clay_pot',
      baseHue: '#8D3A1B',
      layerColors: ['#5C1D06', '#872C0C', '#B33C15', '#D84315', '#FF7043'],
      accentColor: '#FFB300',
      garnish: 'coriander_chili',
      garnishText: 'فلفل أحمر حار + كزبرة خضراء مفرومة',
      steam: true,
      labelAr: 'طاجن فخار بالفرن',
      subtext: 'مسبك ومحمر في الفرن البلدي'
    };
  }
  if (t.includes('كفتة') || t.includes('كباب') || t.includes('مشوي') || t.includes('شيش')) {
    return {
      dishType: 'grills',
      plateType: 'grill_board',
      baseHue: '#4A2E18',
      layerColors: ['#2E180A', '#4E2711', '#6E3817', '#8D491F', '#2E7D32'],
      accentColor: '#2E7D32',
      garnish: 'parsley_sumac',
      garnishText: 'بقدونس مفروم + سماق + بصل وطحينة',
      steam: true,
      labelAr: 'مشويات حاتي على الفحم',
      subtext: 'لحم مشوي على الفحم الطبيعي مع تتبيلة البهارات'
    };
  }
  if (t.includes('شاورما')) {
    return {
      dishType: 'shawarma',
      plateType: 'slate',
      baseHue: '#C47D33',
      layerColors: ['#8C4A11', '#B8651B', '#E08A2E', '#F6B26B', '#F1F8E9'],
      accentColor: '#2E7D32',
      garnish: 'toum_pickles',
      garnishText: 'ثومية كريمية + خيار مخلل + خبز صاج',
      steam: true,
      labelAr: 'شاورما عربية فاخرة',
      subtext: 'شرائح متبلة مع صوصات وتومية'
    };
  }
  if (t.includes('فول') || t.includes('فلافل') || t.includes('طعمية')) {
    return {
      dishType: 'breakfast',
      plateType: 'brass_plate',
      baseHue: '#8C6239',
      layerColors: ['#5C3D1E', '#7F5529', '#A8743E', '#2E7D32', '#C62828'],
      accentColor: '#F57F17',
      garnish: 'tahini_cumin',
      garnishText: 'زيت حار + طحينة خام + كمون وليمون',
      steam: true,
      labelAr: 'فطور مصري شعبي',
      subtext: 'فول مدمس بالسمنة والزيت الحار والطعمية'
    };
  }
  if (t.includes('أم علي') || t.includes('كنافة') || t.includes('بسبوسة') || t.includes('أرز باللبن') || category.includes('حلو') || group.includes('حلويات')) {
    return {
      dishType: 'dessert',
      plateType: 'porcelain',
      baseHue: '#C8963E',
      layerColors: ['#8D6018', '#B37D24', '#D49B35', '#F5C568', '#FFF3E0'],
      accentColor: '#2E7D32',
      garnish: 'pistachio_nuts',
      garnishText: 'فستق حلبي + مكسرات محمصة + قشطة بلدي',
      steam: false,
      labelAr: 'حلوى شرقية فاخرة',
      subtext: 'محلاة بالسمن البلدي والمكسرات والقشطة'
    };
  }
  if (t.includes('سمك') || t.includes('جمبري') || t.includes('سردين') || t.includes('سي فود')) {
    return {
      dishType: 'seafood',
      plateType: 'ocean_slate',
      baseHue: '#BD6B37',
      layerColors: ['#6D3613', '#964E1F', '#C46A2E', '#FBC02D', '#2E7D32'],
      accentColor: '#FBC02D',
      garnish: 'lemon_herbs',
      garnishText: 'شرائح ليمون أضاليا + شبت وكمون إسكندراني',
      steam: true,
      labelAr: 'مأكولات بحرية طازجة',
      subtext: 'سمك مطهو بالردة أو بالزيت والليمون'
    };
  }

  // Default Warm Egyptian Culinary Styling
  return {
    dishType: 'general',
    plateType: 'rustic_plate',
    baseHue: '#A0522D',
    layerColors: ['#5C2B14', '#853F1F', '#B35B2E', '#D97A45', '#F5A671'],
    accentColor: '#FFB300',
    garnish: 'herbs_spices',
    garnishText: 'بهارات مصرية + أعشاب طازجة',
    steam: true,
    labelAr: title,
    subtext: 'وصفة مصرية شهية ومميزة'
  };
}

/**
 * Procedurally generates a gorgeous, scalable vector Virtual Photo (SVG Data URI).
 */
export function generateVirtualFoodPhoto(spec: VirtualPhotoSpec | string): string {
  const title = typeof spec === 'string' ? spec : spec.dishTitle;
  const category = typeof spec === 'string' ? '' : (spec.category || '');
  const group = typeof spec === 'string' ? '' : (spec.group || '');
  const theme = typeof spec === 'string' ? 'golden_kitchen' : (spec.theme || 'golden_kitchen');

  const conf = getDishVisualConfig(title, category, group);

  // Background Theme Gradients
  let bgGradStart = '#1A120B';
  let bgGradMid = '#2C1810';
  let bgGradEnd = '#0F0804';
  let rimLight = '#FF9E43';

  if (theme === 'rustic') {
    bgGradStart = '#241812';
    bgGradMid = '#150E0A';
    bgGradEnd = '#080503';
    rimLight = '#D4A373';
  } else if (theme === 'clay_pot') {
    bgGradStart = '#3D1C10';
    bgGradMid = '#240F08';
    bgGradEnd = '#100502';
    rimLight = '#FF7043';
  } else if (theme === 'cinematic') {
    bgGradStart = '#0F172A';
    bgGradMid = '#090D16';
    bgGradEnd = '#030712';
    rimLight = '#F59E0B';
  } else if (theme === 'chef_studio') {
    bgGradStart = '#1E1E24';
    bgGradMid = '#131316';
    bgGradEnd = '#09090B';
    rimLight = '#E2E8F0';
  }

  const svgContent = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="100%" height="100%">
  <defs>
    <!-- Background Radial Gradient -->
    <radialGradient id="bgGrad" cx="50%" cy="45%" r="75%">
      <stop offset="0%" stop-color="${bgGradStart}" />
      <stop offset="60%" stop-color="${bgGradMid}" />
      <stop offset="100%" stop-color="${bgGradEnd}" />
    </radialGradient>

    <!-- Warm Spotlight -->
    <radialGradient id="spotLight" cx="48%" cy="42%" r="45%">
      <stop offset="0%" stop-color="#FFF2D6" stop-opacity="0.3" />
      <stop offset="50%" stop-color="${rimLight}" stop-opacity="0.12" />
      <stop offset="100%" stop-color="#000000" stop-opacity="0" />
    </radialGradient>

    <!-- Plate Rim Gradient -->
    <linearGradient id="plateRim" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#D7CCC8" />
      <stop offset="50%" stop-color="#8D6E63" />
      <stop offset="100%" stop-color="#4E342E" />
    </linearGradient>

    <!-- Food Layers Gradient -->
    <linearGradient id="foodGrad1" x1="20%" y1="10%" x2="80%" y2="90%">
      <stop offset="0%" stop-color="${conf.layerColors[3]}" />
      <stop offset="50%" stop-color="${conf.layerColors[2]}" />
      <stop offset="100%" stop-color="${conf.layerColors[0]}" />
    </linearGradient>

    <radialGradient id="sauceGlow" cx="45%" cy="40%" r="50%">
      <stop offset="0%" stop-color="${conf.layerColors[4]}" stop-opacity="0.9" />
      <stop offset="70%" stop-color="${conf.layerColors[1]}" stop-opacity="0.8" />
      <stop offset="100%" stop-color="${conf.layerColors[0]}" stop-opacity="0.95" />
    </radialGradient>

    <!-- Dish Texture Filters -->
    <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="28" stdDeviation="22" flood-color="#000000" flood-opacity="0.8" />
    </filter>

    <filter id="foodGlow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="${conf.accentColor}" flood-opacity="0.35" />
    </filter>

    <linearGradient id="bannerGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#000000" stop-opacity="0.85" />
      <stop offset="50%" stop-color="#1E130B" stop-opacity="0.75" />
      <stop offset="100%" stop-color="#000000" stop-opacity="0.85" />
    </linearGradient>
  </defs>

  <!-- Canvas Surface Background -->
  <rect width="800" height="600" fill="url(#bgGrad)" />

  <!-- Wooden Table / Slate Textured Base -->
  <ellipse cx="400" cy="520" rx="420" ry="120" fill="#000000" opacity="0.6" />
  <ellipse cx="400" cy="460" rx="380" ry="90" fill="#0D0907" opacity="0.5" />

  <!-- Overhead Spotlight Effect -->
  <circle cx="400" cy="270" r="300" fill="url(#spotLight)" />

  <!-- Dish Main Plate / Bowl Container with Shadow -->
  <g filter="url(#softShadow)">
    <!-- Base Plate Outer Shadow -->
    <ellipse cx="400" cy="310" rx="270" ry="170" fill="#2D1B14" />
    
    <!-- Outer Rim -->
    <ellipse cx="400" cy="305" rx="260" ry="160" fill="url(#plateRim)" />
    <ellipse cx="400" cy="303" rx="245" ry="148" fill="#1C110C" />
    
    <!-- Inner Ceramic Dish Body -->
    <ellipse cx="400" cy="300" rx="230" ry="135" fill="url(#foodGrad1)" />
  </g>

  <!-- Food Base Texture & Sauce Bed -->
  <g filter="url(#foodGlow)">
    <ellipse cx="400" cy="295" rx="210" ry="120" fill="url(#sauceGlow)" />
    
    <!-- Procedural Food Mound Highlights & Textures -->
    <!-- Center mounds -->
    <ellipse cx="370" cy="285" rx="90" ry="55" fill="${conf.layerColors[2]}" opacity="0.85" />
    <ellipse cx="430" cy="290" rx="85" ry="50" fill="${conf.layerColors[3]}" opacity="0.75" />
    <ellipse cx="395" cy="270" rx="70" ry="40" fill="${conf.layerColors[4]}" opacity="0.65" />
    
    <!-- Roasted Crust / Crispy Textures -->
    <path d="M 320 280 Q 360 250 420 270 T 470 295 Q 430 320 370 315 Z" fill="${conf.layerColors[1]}" opacity="0.7" />
    <path d="M 340 260 Q 400 240 450 265 Q 430 290 380 285 Z" fill="${conf.layerColors[3]}" opacity="0.8" />
  </g>

  <!-- Dish Specific Garnishes -->
  <g>
    <!-- Garnishing Fresh Herbs & Spices (Mint/Parsley/Chili/Nuts) -->
    <!-- Herb Sprigs 1 -->
    <path d="M 385 240 Q 395 220 410 230 Q 400 245 385 240 Z" fill="#43A047" />
    <path d="M 405 235 Q 425 225 420 245 Q 410 250 405 235 Z" fill="#2E7D32" />
    <path d="M 390 250 Q 370 235 380 255 Z" fill="#66BB6A" />

    <!-- Herb Sprigs 2 -->
    <path d="M 440 270 Q 460 260 455 280 Z" fill="#2E7D32" />
    <path d="M 330 290 Q 345 275 350 295 Z" fill="#388E3C" />

    <!-- Seasoning Flakes & Golden Oil Drizzle -->
    <circle cx="360" cy="270" r="3" fill="${conf.accentColor}" />
    <circle cx="430" cy="260" r="2.5" fill="${conf.accentColor}" />
    <circle cx="450" cy="290" r="3.5" fill="#FFC107" />
    <circle cx="380" cy="305" r="2" fill="#FF5722" />
    <circle cx="340" cy="285" r="3" fill="#FFE082" />
    <circle cx="415" cy="280" r="2" fill="#D32F2F" />

    <!-- Crispy Onions / Pine Nuts / Sesame Dots -->
    <rect x="375" y="275" width="8" height="3" rx="1.5" fill="#FFB300" transform="rotate(25 375 275)" />
    <rect x="420" y="285" width="10" height="3" rx="1.5" fill="#FFA000" transform="rotate(-15 420 285)" />
    <rect x="350" y="295" width="7" height="2.5" rx="1.5" fill="#FFD54F" transform="rotate(40 350 295)" />
    <rect x="400" y="260" width="9" height="3" rx="1.5" fill="#FFE082" transform="rotate(-30 400 260)" />
  </g>

  <!-- Subtle Culinary Steaming Vapor -->
  ${conf.steam ? `
  <g opacity="0.35">
    <path d="M 360 230 Q 350 170 375 120 T 365 60" stroke="#FFFFFF" stroke-width="6" fill="none" stroke-linecap="round" filter="url(#softShadow)" opacity="0.4" />
    <path d="M 410 220 Q 430 160 400 110 T 425 50" stroke="#FFFFFF" stroke-width="8" fill="none" stroke-linecap="round" filter="url(#softShadow)" opacity="0.5" />
    <path d="M 450 235 Q 470 180 445 130 T 460 70" stroke="#FFFFFF" stroke-width="5" fill="none" stroke-linecap="round" filter="url(#softShadow)" opacity="0.3" />
  </g>
  ` : ''}

  <!-- Lower Metadata & Virtual Identity Badge -->
  <rect x="40" y="475" width="720" height="95" rx="24" fill="url(#bannerGrad)" stroke="rgba(255,255,255,0.12)" stroke-width="1.5" />
  
  <!-- Virtual Stamp Tag -->
  <rect x="65" y="495" width="125" height="26" rx="13" fill="#D97706" />
  <text x="127" y="513" fill="#FFFFFF" font-family="system-ui, -apple-system, sans-serif" font-size="12" font-weight="900" text-anchor="middle">🎨 صورة افتراضية</text>

  <!-- Dish Arabic Title -->
  <text x="730" y="518" fill="#FFFFFF" font-family="system-ui, -apple-system, sans-serif" font-size="24" font-weight="900" text-anchor="end">${title}</text>
  
  <!-- Dish Garnish & Subtext -->
  <text x="730" y="548" fill="#D1D5DB" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="500" text-anchor="end">${conf.garnishText} • ${conf.subtext}</text>
</svg>
  `.trim();

  return `data:image/svg+xml;utf8,${encodeURIComponent(svgContent)}`;
}

/**
 * High-definition virtual presets dictionary for quick offline & instant viewing.
 */
export const VIRTUAL_FOOD_PRESETS: Record<string, string> = {
  koshari: generateVirtualFoodPhoto({ dishTitle: 'كشري مصري', category: 'normal', theme: 'golden_kitchen' }),
  molokhia: generateVirtualFoodPhoto({ dishTitle: 'ملوخية بالأرانب', category: 'normal', theme: 'clay_pot' }),
  mahshi: generateVirtualFoodPhoto({ dishTitle: 'محشي ورق عنب وكوسة', category: 'normal', theme: 'rustic' }),
  hawawshi: generateVirtualFoodPhoto({ dishTitle: 'حواوشي بلدي', category: 'normal', theme: 'golden_kitchen' }),
  tagine: generateVirtualFoodPhoto({ dishTitle: 'طاجن بامية باللحم', category: 'normal', theme: 'clay_pot' }),
  grills: generateVirtualFoodPhoto({ dishTitle: 'كفتة وكباب حاتي', category: 'normal', theme: 'rustic' }),
  shawarma: generateVirtualFoodPhoto({ dishTitle: 'شاورما دجاج عربي', category: 'normal', theme: 'cinematic' }),
  breakfast: generateVirtualFoodPhoto({ dishTitle: 'فول مدمس وطعمية', category: 'breakfast', theme: 'rustic' }),
  dessert: generateVirtualFoodPhoto({ dishTitle: 'أم علي بالمكسرات', category: 'dessert', theme: 'chef_studio' }),
  seafood: generateVirtualFoodPhoto({ dishTitle: 'سمك سنجاري إسكندراني', category: 'seafood', theme: 'cinematic' }),
};

(() => {
  const CANVAS_FONT = '"NanumSquareRound", "Pretendard", "Malgun Gothic", "Apple SD Gothic Neo", sans-serif';

  const THEMES = {
    day: {
      key: 'day',
      label: 'Day',
      skyRim: 'rgba(205, 248, 255, 0.72)',
      skyFade: 'rgba(130, 224, 236, 0)',
      oceanTop: '#4ac8d4',
      oceanBottom: '#2d99aa',
      oceanFoam: 'rgba(255, 255, 255, 0.52)',
      oceanRipple: 'rgba(255, 255, 255, 0.28)',
      islandShadow: 'rgba(12, 52, 62, 0.28)',
      reefGlow: 'rgba(146, 245, 236, 0.62)',
      sandWet: '#dfc27c',
      sandTop: '#fae8b2',
      sandLip: '#c8a35c',
      sandSpeck: '#e2c885',
      grassBase: '#79cf5b',
      grassTriangle: '#66bc4b',
      grassUpper: '#8ce26a',
      grassUpperTriangle: '#79ce57',
      grassHighlight: '#acf089',
      cliffHighlight: '#b07647',
      cliffFront: '#935c33',
      cliffDark: '#6c4020',
      cliffRim: '#559c3b',
      waterBase: '#45c1d1',
      waterLight: '#8be9f0',
      plazaFill: '#e8ceb3',
      plazaTileA: '#dfb893',
      plazaTileB: '#cfa079',
      plazaBorder: '#ac7d56',
      pathSand: '#f4e2b5',
      pathEdge: '#d3b87d',
      woodLight: '#bd8752',
      woodMid: '#8d5b32',
      woodDark: '#573419',
      windowLit: '#ffe46c',
      windowLitGlow: 'rgba(255, 224, 102, 0.36)',
      windowOut: '#bce4f7',
      ambientWash: null,
      lampGlow: false,
      fireflies: false,
    },
    sunset: {
      key: 'sunset',
      label: 'Sunset',
      skyRim: 'rgba(255, 198, 148, 0.65)',
      skyFade: 'rgba(225, 146, 128, 0)',
      oceanTop: '#5fa4b8',
      oceanBottom: '#3c748c',
      oceanFoam: 'rgba(255, 224, 194, 0.48)',
      oceanRipple: 'rgba(255, 200, 145, 0.32)',
      islandShadow: 'rgba(26, 36, 56, 0.32)',
      reefGlow: 'rgba(244, 189, 148, 0.44)',
      sandWet: '#d4ab6f',
      sandTop: '#f3d49b',
      sandLip: '#b98d4f',
      sandSpeck: '#dab273',
      grassBase: '#81b84e',
      grassTriangle: '#6fa440',
      grassUpper: '#92c75a',
      grassUpperTriangle: '#7fb34a',
      grassHighlight: '#add86e',
      cliffHighlight: '#a46940',
      cliffFront: '#86502d',
      cliffDark: '#60351a',
      cliffRim: '#5c8a36',
      waterBase: '#4d9bb1',
      waterLight: '#f3b78b',
      plazaFill: '#dfb796',
      plazaTileA: '#d49e77',
      plazaTileB: '#c38a63',
      plazaBorder: '#9b6b49',
      pathSand: '#ebd09a',
      pathEdge: '#c5a268',
      woodLight: '#ab7444',
      woodMid: '#7f4f2a',
      woodDark: '#4f2e16',
      windowLit: '#ffd954',
      windowLitGlow: 'rgba(255, 196, 72, 0.50)',
      windowOut: '#a7c6df',
      ambientWash: 'rgba(255, 146, 86, 0.11)',
      lampGlow: true,
      fireflies: false,
    },
    night: {
      key: 'night',
      label: 'Night',
      skyRim: 'rgba(66, 114, 168, 0.55)',
      skyFade: 'rgba(24, 58, 92, 0)',
      oceanTop: '#225072',
      oceanBottom: '#143651',
      oceanFoam: 'rgba(182, 226, 248, 0.34)',
      oceanRipple: 'rgba(170, 218, 250, 0.22)',
      islandShadow: 'rgba(6, 18, 32, 0.46)',
      reefGlow: 'rgba(84, 173, 204, 0.34)',
      sandWet: '#968765',
      sandTop: '#beaf89',
      sandLip: '#827454',
      sandSpeck: '#a39671',
      grassBase: '#4b9862',
      grassTriangle: '#3e8554',
      grassUpper: '#57a86f',
      grassUpperTriangle: '#499460',
      grassHighlight: '#6bba82',
      cliffHighlight: '#7c553b',
      cliffFront: '#63412b',
      cliffDark: '#452b1b',
      cliffRim: '#377348',
      waterBase: '#2b6d8f',
      waterLight: '#67b7d9',
      plazaFill: '#a88d7c',
      plazaTileA: '#997c6b',
      plazaTileB: '#876b5b',
      plazaBorder: '#6b5042',
      pathSand: '#baa984',
      pathEdge: '#91805f',
      woodLight: '#8e6340',
      woodMid: '#6b462a',
      woodDark: '#402715',
      windowLit: '#ffe675',
      windowLitGlow: 'rgba(255, 224, 102, 0.68)',
      windowOut: '#5f87a8',
      ambientWash: 'rgba(18, 40, 84, 0.16)',
      lampGlow: true,
      fireflies: true,
    },
  };

  const PROVIDER_COLORS = {
    antigravity: '#16a34a',
    claude: '#d97706',
    cursor: '#0284c7',
    codex: '#7c3aed',
  };

  function getLightingTheme(mode = 'auto', nowDate = new Date()) {
    let resolvedKey = mode;
    if (!THEMES[resolvedKey]) {
      const h = nowDate.getHours() + nowDate.getMinutes() / 60;
      if (h >= 7 && h < 17) resolvedKey = 'day';
      else if (h >= 17 && h < 19.5) resolvedKey = 'sunset';
      else resolvedKey = 'night';
    }
    return THEMES[resolvedKey] || THEMES.day;
  }

  function hashStr(str) {
    let h = 2166136261;
    const s = String(str || '');
    for (let i = 0; i < s.length; i += 1) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function shadeHex(hex, amount) {
    const clean = String(hex || '#999999').replace('#', '');
    if (clean.length !== 6) return hex;
    const num = parseInt(clean, 16);
    const clamp = (v) => Math.max(0, Math.min(255, v));
    const r = clamp((num >> 16) + amount);
    const g = clamp(((num >> 8) & 0xff) + amount);
    const b = clamp((num & 0xff) + amount);
    return `rgb(${r}, ${g}, ${b})`;
  }

  function roundedRectPath(c, x, y, w, h, r) {
    const rad = Math.min(r, w / 2, h / 2);
    c.beginPath();
    c.moveTo(x + rad, y);
    c.arcTo(x + w, y, x + w, y + h, rad);
    c.arcTo(x + w, y + h, x, y + h, rad);
    c.arcTo(x, y + h, x, y, rad);
    c.arcTo(x, y, x + w, y, rad);
    c.closePath();
  }

  const ICON_PATHS = {
    leaf: '<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>',
    book: '<path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/><path d="M8 7h8"/><path d="M8 11h6"/>',
    hammer: '<path d="m15 12-8.5 8.5c-.83.83-2.17.83-3 0a2.12 2.12 0 0 1 0-3L12 9"/><path d="M17.64 15 22 10.64"/><path d="m20.91 11.7-1.25-1.25c-.6-.6-.93-1.4-.93-2.25v-.86L16.01 4.6a5.56 5.56 0 0 0-3.94-1.64H9l.92.82A6.18 6.18 0 0 1 12 8.4v1.56l2 2h2.47l2.26 1.91"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.26.6.86 1 1.51 1H21a2 2 0 0 1 0 4h-.09c-.65 0-1.25.4-1.51 1z"/>',
    plane: '<path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>',
    megaphone: '<path d="m3 11 18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/>',
    clipboard: '<rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M9 12h6"/><path d="M9 16h4"/>',
    thought: '<path d="M17.5 19H9a5 5 0 1 1 1.1-9.88A4.5 4.5 0 0 1 19 10.5a3.5 3.5 0 0 1-1.5 8.5Z"/><circle cx="7" cy="21" r="1"/><circle cx="4" cy="22" r="0.6"/>',
    coffee: '<path d="M17 8h1a4 4 0 1 1 0 8h-1"/><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"/><path d="M6 2v2"/><path d="M10 2v2"/><path d="M14 2v2"/>',
    zzz: '<path d="M4 12h6l-6 7h6"/><path d="M14 4h6l-6 7h6"/>',
    sweat: '<path d="M12 2.5C9.5 7 6.5 10.5 6.5 14.5a5.5 5.5 0 0 0 11 0C17.5 10.5 14.5 7 12 2.5Z"/><path d="M10 15.5a2 2 0 0 0 2 2"/>',
    sparkle: '<path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3L12 3Z"/>',
    mayor: '<path d="m4 17 2-9 6 4 6-4 2 9Z"/><path d="M4 20h16"/>',
    curator: '<circle cx="8" cy="13" r="3.5"/><circle cx="16" cy="13" r="3.5"/><path d="M11.5 13h1"/><path d="M4.5 13 6 7"/><path d="M19.5 13 18 7"/>',
    pilot: '<circle cx="12" cy="12" r="9"/><polygon points="15.5 8.5 13.5 13.5 8.5 15.5 10.5 10.5 15.5 8.5"/>',
    rescue: '<path d="M4 15a8 8 0 0 1 16 0Z"/><path d="M2 15h20"/><path d="M12 7V4"/>',
    atelier: '<circle cx="13.5" cy="6.5" r=".8" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".8" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".8" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".8" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.93 0 1.65-.75 1.65-1.69 0-.43-.18-.83-.44-1.12-.29-.29-.44-.65-.44-1.12a1.64 1.64 0 0 1 1.67-1.67h2c3.05 0 5.56-2.5 5.56-5.56C21.96 6.02 17.46 2 12 2Z"/>',
    secretary: '<rect x="5" y="4" width="14" height="16" rx="2"/><path d="M9 9h6"/><path d="M9 13h6"/><path d="M9 17h4"/>',
    helper: '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76Z"/>',
    island: '<path d="M3 18c3-2.5 6-3 9-3s6 .5 9 3"/><path d="M12 15V8"/><path d="M12 8c-2.5-3-6-2.5-7 0 2.5 0 5 .5 7 2"/><path d="M12 8c2.5-3 6-2.5 7 0-2.5 0-5 .5-7 2"/>',
    home: '<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1V10Z"/>',
    chat: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
    folder: '<path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/>',
    copy: '<rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>',
    sunset: '<path d="M12 10V3"/><path d="m4.93 10.93 1.41 1.41"/><path d="M2 18h2"/><path d="M20 18h2"/><path d="m19.07 10.93-1.41 1.41"/><path d="M22 22H2"/><path d="M16 18a4 4 0 0 0-8 0"/>',
    moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
    'clock-auto': '<circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15.5 14"/>',
    bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
    search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
    star: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
    filter: '<polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>',
    layers: '<polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 12 12 17 22 12"/><polyline points="2 17 12 22 22 17"/>',
    focus: '<circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2.5"/><path d="M12 2v3"/><path d="M12 19v3"/><path d="M2 12h3"/><path d="M19 12h3"/>',
    'eye-off': '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="2" y1="2" x2="22" y2="22"/>',
    eye: '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a14 14 0 0 1 0 18 14 14 0 0 1 0-18Z"/>',
    list: '<line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>',
    help: '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/>',
    popout: '<path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
    close: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
    back: '<path d="m15 18-6-6 6-6"/>',
    'provider-antigravity': '<path d="M12 3 4 20h3.6l1.7-3.8h5.4L16.4 20H20L12 3Zm-1.4 10 1.4-3.4L13.4 13h-2.8Z"/>',
    'provider-claude': '<path d="M12 3v18"/><path d="m5.5 6.5 13 11"/><path d="m18.5 6.5-13 11"/>',
    'provider-cursor': '<path d="m5 3 14 9-6.2 1.6L11 20 5 3Z"/>',
    'provider-codex': '<rect x="4" y="5" width="16" height="14" rx="3"/><path d="m8 10 3 2-3 2"/><path d="M13 14h3"/>',
  };

  function renderIconSvg(name, size = 14, className = '') {
    const body = ICON_PATHS[name] || ICON_PATHS.sparkle;
    const cls = className ? ` class="${className}"` : '';
    return `<svg${cls} width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
  }

  function renderProviderIconSvg(sourceId, size = 13, className = '') {
    const key = `provider-${sourceId || 'antigravity'}`;
    return renderIconSvg(ICON_PATHS[key] ? key : 'provider-antigravity', size, className);
  }

  function getSpeciesPalette(species) {
    switch (species) {
      case 'cat':
        return { fur: '#fde28a', inner: '#f9a8a8', muzzle: '#fffbeb', accent: '#f59e0b' };
      case 'shiba':
        return { fur: '#f29f3d', inner: '#fde68a', muzzle: '#fffaf0', accent: '#c26a19' };
      case 'bunny':
        return { fur: '#fdf4f8', inner: '#f9a8d4', muzzle: '#ffffff', accent: '#ec4899' };
      case 'bear':
        return { fur: '#b67d54', inner: '#ecc29f', muzzle: '#f8e6cf', accent: '#7c4d2b' };
      case 'fox':
        return { fur: '#eb6826', inner: '#fed7aa', muzzle: '#fff7ed', accent: '#9a3412' };
      case 'frog':
        return { fur: '#84cc36', inner: '#d9f99d', muzzle: '#eefcd4', accent: '#4d7c0f' };
      case 'squirrel':
        return { fur: '#c66f42', inner: '#f7c59f', muzzle: '#fff3e6', accent: '#854321' };
      case 'duck':
      default:
        return { fur: '#fde047', inner: '#fef08a', muzzle: '#fef9c3', accent: '#f97316', bill: '#fb923c' };
    }
  }

  function renderSpeciesPortraitSvg(species, shirt = '#10b981', roleCode = 'helper', size = 34) {
    const pal = getSpeciesPalette(species);
    let ears = '';
    if (species === 'bunny') {
      ears = `
        <rect x="11" y="2" width="5" height="12" rx="2.5" fill="${pal.fur}" stroke="#4a3020" stroke-width="1.6"/>
        <rect x="20" y="2" width="5" height="12" rx="2.5" fill="${pal.fur}" stroke="#4a3020" stroke-width="1.6"/>
        <rect x="12.4" y="4" width="2.2" height="7" rx="1.1" fill="${pal.inner}"/>
        <rect x="21.4" y="4" width="2.2" height="7" rx="1.1" fill="${pal.inner}"/>`;
    } else if (species === 'bear' || species === 'frog' || species === 'duck') {
      ears = species === 'duck'
        ? `<path d="M16 7c1-3 4-4 5-2-1 1-1.5 2.5-1.5 3.5" fill="${pal.fur}" stroke="#4a3020" stroke-width="1.5"/>`
        : `<circle cx="10" cy="10" r="4" fill="${pal.fur}" stroke="#4a3020" stroke-width="1.6"/>
           <circle cx="26" cy="10" r="4" fill="${pal.fur}" stroke="#4a3020" stroke-width="1.6"/>
           <circle cx="10" cy="10" r="2" fill="${pal.inner}"/>
           <circle cx="26" cy="10" r="2" fill="${pal.inner}"/>`;
    } else {
      ears = `
        <polygon points="8,14 10,5 15,10" fill="${pal.fur}" stroke="#4a3020" stroke-width="1.6" stroke-linejoin="round"/>
        <polygon points="28,14 26,5 21,10" fill="${pal.fur}" stroke="#4a3020" stroke-width="1.6" stroke-linejoin="round"/>`;
    }
    const hat = roleCode === 'mayor'
      ? `<rect x="10" y="6" width="16" height="3.5" rx="1.7" fill="#7c4724" stroke="#4a3020" stroke-width="1.3"/><rect x="12.5" y="2.5" width="11" height="4.5" rx="1.5" fill="#9a5c30" stroke="#4a3020" stroke-width="1.3"/>`
      : roleCode === 'rescue'
        ? `<path d="M10 10a8 6.5 0 0 1 16 0Z" fill="#facc15" stroke="#4a3020" stroke-width="1.4"/>`
        : '';
    const mouth = species === 'duck'
      ? `<ellipse cx="18" cy="21" rx="4.5" ry="2.4" fill="#fb923c" stroke="#4a3020" stroke-width="1.2"/>`
      : `<ellipse cx="18" cy="20.5" rx="5" ry="3.4" fill="${pal.muzzle}"/><circle cx="18" cy="19.5" r="1.4" fill="#4a3020"/>`;
    return `
      <svg width="${size}" height="${size}" viewBox="0 0 36 36" fill="none" aria-hidden="true">
        <path d="M9 35c0-6 4-10 9-10s9 4 9 10Z" fill="${shirt}" stroke="#4a3020" stroke-width="1.6"/>
        ${ears}
        <ellipse cx="18" cy="17.5" rx="10.5" ry="9" fill="${pal.fur}" stroke="#4a3020" stroke-width="1.6"/>
        ${hat}
        <circle cx="12.2" cy="19.8" r="2" fill="rgba(244,114,182,0.5)"/>
        <circle cx="23.8" cy="19.8" r="2" fill="rgba(244,114,182,0.5)"/>
        <circle cx="14" cy="16.5" r="1.5" fill="#2d1c10"/>
        <circle cx="22" cy="16.5" r="1.5" fill="#2d1c10"/>
        ${mouth}
      </svg>`;
  }

  // --- Offscreen Grass Pattern Cache ---
  const patternCache = new Map();
  function getGrassPattern(ctx, fillCol, triCol) {
    const key = `${fillCol}|${triCol}`;
    if (patternCache.has(key)) return patternCache.get(key);
    const tile = document.createElement('canvas');
    tile.width = 48;
    tile.height = 48;
    const tctx = tile.getContext('2d');
    tctx.fillStyle = fillCol;
    tctx.fillRect(0, 0, 48, 48);
    tctx.fillStyle = triCol;
    const drawSoftTri = (cx, cy, s) => {
      tctx.beginPath();
      tctx.moveTo(cx, cy - s * 0.65);
      tctx.quadraticCurveTo(cx + s * 0.65, cy - s * 0.25, cx + s * 0.55, cy + s * 0.5);
      tctx.quadraticCurveTo(cx, cy + s * 0.72, cx - s * 0.55, cy + s * 0.5);
      tctx.quadraticCurveTo(cx - s * 0.65, cy - s * 0.25, cx, cy - s * 0.65);
      tctx.fill();
    };
    drawSoftTri(12, 12, 7.5);
    drawSoftTri(36, 36, 7.5);
    tctx.globalAlpha = 0.65;
    drawSoftTri(36, 12, 5.5);
    drawSoftTri(12, 36, 5.5);
    const pat = ctx.createPattern(tile, 'repeat');
    patternCache.set(key, pat);
    return pat;
  }

  function buildOrganicPerimeterPath(c, x, y, w, h, cornerR, seed, amp = 6) {
    const pts = [];
    const stepsX = Math.max(4, Math.round(w / 90));
    const stepsY = Math.max(3, Math.round(h / 90));
    const inset = cornerR * 0.45;
    for (let i = 0; i <= stepsX; i += 1) {
      const t = i / stepsX;
      const px = x + inset + (w - inset * 2) * t;
      const j = (i === 0 || i === stepsX) ? 0 : Math.sin(seed * 0.13 + i * 2.1) * amp;
      pts.push([px, y + j]);
    }
    for (let i = 1; i <= stepsY; i += 1) {
      const t = i / stepsY;
      const py = y + inset + (h - inset * 2) * t;
      const j = (i === stepsY) ? 0 : Math.cos(seed * 0.17 + i * 2.4) * amp;
      pts.push([x + w + j, py]);
    }
    for (let i = 1; i <= stepsX; i += 1) {
      const t = i / stepsX;
      const px = x + w - inset - (w - inset * 2) * t;
      const j = (i === stepsX) ? 0 : Math.sin(seed * 0.23 + i * 1.9) * amp;
      pts.push([px, y + h + j]);
    }
    for (let i = 1; i < stepsY; i += 1) {
      const t = i / stepsY;
      const py = y + h - inset - (h - inset * 2) * t;
      const j = Math.cos(seed * 0.29 + i * 2.2) * amp;
      pts.push([x + j, py]);
    }
    c.beginPath();
    const len = pts.length;
    const firstMidX = (pts[len - 1][0] + pts[0][0]) / 2;
    const firstMidY = (pts[len - 1][1] + pts[0][1]) / 2;
    c.moveTo(firstMidX, firstMidY);
    for (let i = 0; i < len; i += 1) {
      const next = pts[(i + 1) % len];
      const midX = (pts[i][0] + next[0]) / 2;
      const midY = (pts[i][1] + next[1]) / 2;
      c.quadraticCurveTo(pts[i][0], pts[i][1], midX, midY);
    }
    c.closePath();
  }

  // Draws sculpted 2.5D faceted rock & earth cliff wall with overhanging grass lip shadow
  function drawSculptedCliffBase(c, x, y, w, h, cornerR, seed, amp, depthPx, theme) {
    // Contact ambient-occlusion shadow below cliff foot
    c.save();
    c.fillStyle = 'rgba(18, 42, 22, 0.24)';
    buildOrganicPerimeterPath(c, x - 3, y + depthPx + 4, w + 6, h, cornerR, seed, amp);
    c.fill();

    // Deep lower bedrock tier
    c.fillStyle = theme.cliffDark;
    buildOrganicPerimeterPath(c, x, y + depthPx, w, h, cornerR, seed, amp);
    c.fill();

    // Mid earth face
    c.fillStyle = theme.cliffFront;
    buildOrganicPerimeterPath(c, x, y + Math.round(depthPx * 0.64), w, h, cornerR, seed, amp);
    c.fill();

    // Clip to cliff face belt so angled rock facets only decorate the visible wall
    c.save();
    buildOrganicPerimeterPath(c, x, y + depthPx, w, h, cornerR, seed, amp);
    c.clip();
    const wallTopY = y + Math.round(h * 0.45);
    const wallBottomY = y + h + depthPx + 6;
    let facetIdx = 0;
    for (let fx = x + 16; fx < x + w - 12; fx += 22) {
      const fw = 12 + ((seed + facetIdx * 7) % 10);
      c.fillStyle = facetIdx % 3 === 0 ? theme.cliffHighlight : theme.cliffDark;
      c.globalAlpha = facetIdx % 3 === 0 ? 0.42 : 0.34;
      c.beginPath();
      c.moveTo(fx, wallTopY);
      c.lineTo(fx + fw, wallTopY);
      c.lineTo(fx + fw - 4, wallBottomY);
      c.lineTo(fx + 2, wallBottomY);
      c.closePath();
      c.fill();
      facetIdx += 1;
    }
    c.restore();

    // Under-lip turf shadow just beneath grassy overhang
    c.strokeStyle = theme.cliffDark;
    c.lineWidth = 4;
    buildOrganicPerimeterPath(c, x, y + 3, w, h, cornerR, seed, amp);
    c.stroke();
    c.restore();
  }

  function drawFruitTree(c, tx, ty, fruitType, theme, scale = 1) {
    c.save();
    c.translate(tx, ty);
    c.scale(scale, scale);

    // 2.5D elongated canopy shadow on grass
    c.fillStyle = 'rgba(20, 46, 24, 0.26)';
    c.beginPath();
    c.ellipse(2, 7, 19, 7.5, 0, 0, Math.PI * 2);
    c.fill();

    // Rounded trunk with bark highlight
    c.fillStyle = theme.woodMid;
    c.strokeStyle = theme.woodDark;
    c.lineWidth = 1.8;
    roundedRectPath(c, -5, -18, 10, 24, 3.5);
    c.fill();
    c.stroke();
    c.fillStyle = theme.woodLight;
    c.fillRect(-3, -15, 2.5, 19);

    const leafDark = theme.key === 'night' ? '#245d3b' : theme.key === 'sunset' ? '#438130' : '#328937';
    const leafMid = theme.key === 'night' ? '#367850' : theme.key === 'sunset' ? '#5ea23d' : '#4fb448';
    const leafTop = theme.key === 'night' ? '#4d9868' : theme.key === 'sunset' ? '#81c250' : '#7ae064';

    // 4-cluster volumetric spheres for 2.5D lush canopy
    c.fillStyle = leafDark;
    c.beginPath();
    c.arc(-11, -21, 12.5, 0, Math.PI * 2);
    c.arc(11, -21, 12.5, 0, Math.PI * 2);
    c.arc(0, -31, 15, 0, Math.PI * 2);
    c.fill();

    c.fillStyle = leafMid;
    c.beginPath();
    c.arc(-9, -25, 11.5, 0, Math.PI * 2);
    c.arc(9, -25, 11.5, 0, Math.PI * 2);
    c.arc(0, -35, 13.5, 0, Math.PI * 2);
    c.fill();

    c.fillStyle = leafTop;
    c.beginPath();
    c.arc(-3, -39, 9.5, 0, Math.PI * 2);
    c.arc(5, -35, 6.5, 0, Math.PI * 2);
    c.fill();

    const fruitPos = [[-9.5, -21], [9, -23], [0, -33]];
    for (const [fx, fy] of fruitPos) {
      if (fruitType === 'cherry') {
        c.strokeStyle = '#365314';
        c.lineWidth = 1.2;
        c.beginPath();
        c.moveTo(fx, fy - 4.5);
        c.lineTo(fx - 2.5, fy + 1);
        c.moveTo(fx, fy - 4.5);
        c.lineTo(fx + 2.5, fy + 1);
        c.stroke();
        c.fillStyle = '#e11d48';
        c.beginPath();
        c.arc(fx - 2.5, fy + 1.5, 2.7, 0, Math.PI * 2);
        c.arc(fx + 2.5, fy + 1.5, 2.7, 0, Math.PI * 2);
        c.fill();
      } else {
        const fruitCol =
          fruitType === 'orange' ? '#f97316'
            : fruitType === 'peach' ? '#fb7185'
              : fruitType === 'pear' ? '#bef264'
                : '#ef4444';
        c.fillStyle = fruitCol;
        c.beginPath();
        if (fruitType === 'pear') {
          c.ellipse(fx, fy + 0.5, 3.3, 4.2, 0, 0, Math.PI * 2);
        } else {
          c.arc(fx, fy, 3.8, 0, Math.PI * 2);
        }
        c.fill();
        c.fillStyle = 'rgba(255,255,255,0.52)';
        c.beginPath();
        c.arc(fx - 1.1, fy - 1.3, 1.2, 0, Math.PI * 2);
        c.fill();
      }
    }
    c.restore();
  }

  function drawCedarTree(c, tx, ty, theme) {
    c.save();
    c.translate(tx, ty);
    c.fillStyle = 'rgba(20, 46, 24, 0.24)';
    c.beginPath();
    c.ellipse(1.5, 6, 15, 6, 0, 0, Math.PI * 2);
    c.fill();

    c.fillStyle = theme.woodDark;
    roundedRectPath(c, -3.5, -10, 7, 16, 2);
    c.fill();

    const cols = theme.key === 'night'
      ? ['#1d4936', '#286147', '#357b5b', '#44946e']
      : theme.key === 'sunset'
        ? ['#295c34', '#37763f', '#498f4d', '#5eab5c']
        : ['#205e3a', '#2b7a4b', '#3a955b', '#52b36f'];
    for (let i = 0; i < 3; i += 1) {
      const w = 18.5 - i * 3.8;
      const baseY = -8 - i * 11;
      c.fillStyle = cols[i];
      c.beginPath();
      c.moveTo(0, baseY - 18);
      c.quadraticCurveTo(w * 0.72, baseY - 5, w, baseY);
      c.quadraticCurveTo(0, baseY + 5, -w, baseY);
      c.quadraticCurveTo(-w * 0.72, baseY - 5, 0, baseY - 18);
      c.fill();

      // Sunlit left ridge highlight on cedar needles
      c.fillStyle = cols[i + 1];
      c.beginPath();
      c.moveTo(-1, baseY - 17);
      c.quadraticCurveTo(-w * 0.5, baseY - 4, -w * 0.65, baseY - 1);
      c.quadraticCurveTo(-2, baseY + 2, -1, baseY - 17);
      c.fill();
    }
    c.restore();
  }

  function drawFlowerPatch(c, fx, fy, seed) {
    const colors = ['#fb7185', '#fde047', '#ffffff', '#f9a8d4', '#93c5fd'];
    c.save();
    c.translate(fx, fy);
    for (let i = 0; i < 3; i += 1) {
      const ox = (i - 1) * 7.5;
      const oy = (i % 2) * 3;
      const col = colors[(seed + i) % colors.length];
      c.fillStyle = '#3f8a3e';
      c.fillRect(ox - 1, oy, 2, 5.5);
      c.fillStyle = col;
      for (let p = 0; p < 5; p += 1) {
        const a = (p * Math.PI * 2) / 5;
        c.beginPath();
        c.arc(ox + Math.cos(a) * 2.3, oy - 1 + Math.sin(a) * 2.3, 1.8, 0, Math.PI * 2);
        c.fill();
      }
      c.fillStyle = '#facc15';
      c.beginPath();
      c.arc(ox, oy - 1, 1.3, 0, Math.PI * 2);
      c.fill();
    }
    c.restore();
  }

  function drawEmptyPlotSign(c, cx, cy, theme, openPlotText = 'Open Plot') {
    c.save();
    c.translate(cx, cy);
    c.fillStyle = 'rgba(130, 102, 52, 0.25)';
    roundedRectPath(c, -48, -18, 96, 46, 8);
    c.fill();
    c.strokeStyle = theme.woodMid;
    c.lineWidth = 2;
    c.setLineDash([5, 4]);
    roundedRectPath(c, -48, -18, 96, 46, 8);
    c.stroke();
    c.setLineDash([]);
    for (const [sx, sy] of [[-48, -18], [48, -18], [-48, 28], [48, 28]]) {
      c.fillStyle = theme.woodMid;
      c.beginPath();
      c.arc(sx, sy, 3.2, 0, Math.PI * 2);
      c.fill();
    }

    c.fillStyle = theme.woodMid;
    roundedRectPath(c, -3, -2, 6, 20, 2);
    c.fill();
    c.fillStyle = '#fff9e6';
    c.strokeStyle = theme.woodDark;
    c.lineWidth = 2;
    roundedRectPath(c, -42, -23, 84, 24, 7);
    c.fill();
    c.stroke();
    c.fillStyle = '#4a301a';
    c.font = `800 11px ${CANVAS_FONT}`;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText(openPlotText, 0, -10.5, 74);
    c.restore();
  }

  // ACNH-inspired Resident Services Pavilion (clock arch & leaf crest tent)
  function drawResidentServicesPavilion(c, cx, cy, theme) {
    c.save();
    c.translate(cx, cy);

    // Shadow on plaza brick
    c.fillStyle = 'rgba(42, 26, 14, 0.22)';
    c.beginPath();
    c.ellipse(2, 11, 28, 7.5, 0, 0, Math.PI * 2);
    c.fill();

    // 2.5D Cedar wooden back posts + counter
    c.fillStyle = theme.woodDark;
    c.fillRect(-19, -20, 4, 29);
    c.fillRect(15, -20, 4, 29);
    c.fillStyle = theme.woodMid;
    c.strokeStyle = theme.woodDark;
    c.lineWidth = 1.5;
    roundedRectPath(c, -17, -4, 34, 13, 3);
    c.fill();
    c.stroke();

    // Green & cream ACNH Striped Pavilion Roof with 2.5D pitch
    c.fillStyle = '#156037';
    c.strokeStyle = '#104427';
    c.lineWidth = 1.7;
    c.beginPath();
    c.moveTo(-25, -16);
    c.lineTo(0, -34);
    c.lineTo(25, -16);
    c.lineTo(22, -10);
    c.lineTo(-22, -10);
    c.closePath();
    c.fill();
    c.stroke();

    // Cream awning scallops
    for (let i = -2; i <= 2; i += 1) {
      c.fillStyle = Math.abs(i) % 2 === 0 ? '#fffbf0' : '#228750';
      c.beginPath();
      c.arc(i * 9, -12.5, 5, 0, Math.PI);
      c.fill();
    }

    // Golden Nook Leaf Town Crest + Clock face
    c.fillStyle = '#fff9e6';
    c.strokeStyle = theme.woodDark;
    c.lineWidth = 1.4;
    c.beginPath();
    c.arc(0, -23, 5.5, 0, Math.PI * 2);
    c.fill();
    c.stroke();
    c.strokeStyle = '#166534';
    c.lineWidth = 1.4;
    c.beginPath();
    c.moveTo(0, -23);
    c.lineTo(0, -26);
    c.moveTo(0, -23);
    c.lineTo(2.5, -23);
    c.stroke();

    // Tiny potted cedar shrubs flanking the pavilion
    for (const sx of [-24, 24]) {
      c.fillStyle = '#b4533c';
      c.fillRect(sx - 3, 2, 6, 6);
      c.fillStyle = theme.key === 'night' ? '#2e6b46' : '#3a9b47';
      c.beginPath();
      c.arc(sx, -1, 5.5, 0, Math.PI * 2);
      c.fill();
    }
    c.restore();
  }

  const TERRAIN_PAD = 56;
  const terrainCache = new Map();

  function getIslandTerrainCanvas(isl, theme, openPlotText = 'Open Plot') {
    const cacheKey = `${isl.id}|${isl.w}x${isl.h}|${isl.fruit}|${isl.isCompactEmpty ? 1 : 0}|${isl.homeSlots.length}|${theme.key}|${isl.isCurrentWorkspace ? 1 : 0}|${openPlotText}`;
    if (terrainCache.has(cacheKey)) {
      const entry = terrainCache.get(cacheKey);
      terrainCache.delete(cacheKey);
      terrainCache.set(cacheKey, entry);
      return entry;
    }

    const scale = 2;
    const totalW = Math.ceil(isl.w + TERRAIN_PAD * 2);
    const totalH = Math.ceil(isl.h + TERRAIN_PAD * 2);
    const off = document.createElement('canvas');
    off.width = totalW * scale;
    off.height = totalH * scale;
    const c = off.getContext('2d');
    c.scale(scale, scale);
    c.translate(TERRAIN_PAD, TERRAIN_PAD);

    const { w, h, isCompactEmpty, resTop, resHeight, laneY, plazaY, stations, homeSlots } = isl;
    const seed = hashStr(isl.id);

    // 1. Deep 2.5D Ocean Drop Shadow + Coral Reef Shelf
    c.save();
    c.fillStyle = theme.islandShadow;
    buildOrganicPerimeterPath(c, -10, 12, w + 20, h + 30, 50, seed, 6);
    c.fill();

    c.fillStyle = theme.reefGlow;
    buildOrganicPerimeterPath(c, -18, -11, w + 36, h + 36, 52, seed, 6);
    c.fill();
    c.restore();

    // 2. Wet Shoreline + Sand Beach Lip + Warm Sand Top
    c.save();
    c.fillStyle = theme.sandWet;
    buildOrganicPerimeterPath(c, -8, 4, w + 16, h + 22, 46, seed, 5);
    c.fill();

    c.fillStyle = theme.sandLip;
    buildOrganicPerimeterPath(c, -6, 1, w + 12, h + 18, 44, seed, 5);
    c.fill();

    c.fillStyle = theme.sandTop;
    buildOrganicPerimeterPath(c, -6, -5, w + 12, h + 16, 44, seed, 5);
    c.fill();
    c.strokeStyle = theme.sandLip;
    c.lineWidth = 1.6;
    c.stroke();

    // Coastal pebbles, shells & starfish
    c.fillStyle = theme.sandSpeck;
    for (let i = 0; i < 16; i += 1) {
      const sx = ((seed * (i + 3) * 37) % Math.max(40, w - 24)) + 12;
      const sy = i % 2 === 0 ? h + 4 + ((seed + i * 7) % 6) : 1 + ((seed + i * 5) % 6);
      c.beginPath();
      c.arc(sx, sy, 2, 0, Math.PI * 2);
      c.fill();
    }
    // Starfish on lower-left shoreline
    c.fillStyle = '#fb7185';
    c.beginPath();
    c.arc(24, h + 6, 3.4, 0, Math.PI * 2);
    c.fill();
    c.restore();

    // 3. Sculpted 22px 2.5D Faceted Main Island Cliff + Grass Plateau
    const gX = 10;
    const gY = 4;
    const gW = w - 20;
    const gH = h - 22;

    c.save();
    drawSculptedCliffBase(c, gX, gY, gW, gH, 36, seed + 11, 4, 21, theme);

    // Main grass plateau with ACNH triangle pattern
    buildOrganicPerimeterPath(c, gX, gY, gW, gH, 36, seed + 11, 4);
    c.save();
    c.clip();
    c.fillStyle = getGrassPattern(c, theme.grassBase, theme.grassTriangle);
    c.fillRect(gX - 10, gY - 10, gW + 20, gH + 20);

    // Sunlit grass turf crest
    c.strokeStyle = theme.grassHighlight;
    c.lineWidth = 3.2;
    c.stroke();

    if (!isCompactEmpty) {
      // 4. Sculpted 18px Upper Residential Cliff Tier
      const hillX = gX + 14;
      const hillY = resTop - 24;
      const hillW = gW - 28;
      const hillH = resHeight + 12;

      drawSculptedCliffBase(c, hillX, hillY, hillW, hillH, 24, seed + 29, 3.5, 17, theme);

      c.fillStyle = getGrassPattern(c, theme.grassUpper, theme.grassUpperTriangle);
      buildOrganicPerimeterPath(c, hillX, hillY, hillW, hillH, 24, seed + 29, 3.5);
      c.fill();
      c.strokeStyle = theme.cliffRim;
      c.lineWidth = 2.2;
      c.stroke();

      // 5. Mountain Spring Pond, 2-Tier Cliff Waterfall, Creek, Wooden Bridge & Seaplane Lagoon
      const creekX = w - 38;
      const springX = creekX - 6;
      const springY = hillY + 26;

      c.fillStyle = theme.waterBase;
      c.beginPath();
      c.ellipse(springX, springY, 18, 10.5, 0, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = theme.waterLight;
      c.beginPath();
      c.ellipse(springX - 2, springY - 2, 10.5, 4.5, 0, 0, Math.PI * 2);
      c.fill();

      for (const [rx, ry, rw] of [[springX - 16, springY - 5, 4.5], [springX - 11, springY + 6, 3.8], [springX + 14, springY - 4, 4]]) {
        c.fillStyle = '#94a3b8';
        c.strokeStyle = '#64748b';
        c.lineWidth = 1;
        c.beginPath();
        c.ellipse(rx, ry, rw, rw * 0.7, 0, 0, Math.PI * 2);
        c.fill();
        c.stroke();
      }

      // Winding creek channel down to seaplane lagoon
      c.strokeStyle = theme.waterBase;
      c.lineCap = 'round';
      c.lineWidth = 16;
      c.beginPath();
      c.moveTo(springX + 2, springY + 6);
      c.bezierCurveTo(creekX + 6, laneY - 24, creekX - 10, laneY + 32, stations.airport.x + 2, plazaY + 8);
      c.stroke();

      // Seaplane lagoon opening south to coastal beach + surf foam
      c.fillStyle = theme.waterBase;
      c.beginPath();
      c.ellipse(stations.airport.x, plazaY + 12, 36, 17, 0, 0, Math.PI * 2);
      c.fill();
      c.strokeStyle = theme.waterBase;
      c.lineWidth = 24;
      c.beginPath();
      c.moveTo(stations.airport.x, plazaY + 18);
      c.lineTo(stations.airport.x + 2, gY + gH + 10);
      c.stroke();
      c.strokeStyle = theme.waterLight;
      c.lineWidth = 6;
      c.beginPath();
      c.moveTo(stations.airport.x, plazaY + 18);
      c.lineTo(stations.airport.x + 1, gY + gH + 8);
      c.stroke();

      c.strokeStyle = theme.waterLight;
      c.lineWidth = 4.5;
      c.beginPath();
      c.moveTo(springX, springY + 8);
      c.bezierCurveTo(creekX + 4, laneY - 20, creekX - 12, laneY + 36, stations.airport.x, plazaY + 6);
      c.stroke();

      // Deep 2.5D Cascading Cliff Waterfall spanning the 17px hill cliff face!
      const fallY = hillY + hillH;
      c.fillStyle = theme.waterBase;
      c.beginPath();
      c.ellipse(creekX, fallY + 17, 15, 7, 0, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = theme.waterLight;
      roundedRectPath(c, creekX - 9, fallY - 3, 18, 21, 5);
      c.fill();
      c.fillStyle = 'rgba(255, 255, 255, 0.85)';
      c.fillRect(creekX - 6, fallY - 2, 3, 17);
      c.fillRect(creekX + 2, fallY - 1, 3, 16);
      c.fillStyle = '#ffffff';
      for (const fx of [-6, -1, 4, 8]) {
        c.beginPath();
        c.arc(creekX + fx, fallY + 16, 2.7, 0, Math.PI * 2);
        c.fill();
      }

      // 3D Curved Wooden Bridge with Side Posts & Shadow
      const bridgeY = laneY + 6;
      c.save();
      c.translate(creekX - 3, bridgeY);
      c.fillStyle = 'rgba(22, 46, 54, 0.25)';
      roundedRectPath(c, -15, -5, 30, 18, 4);
      c.fill();
      c.fillStyle = theme.woodDark;
      roundedRectPath(c, -16, -9, 32, 18, 4);
      c.fill();
      c.fillStyle = theme.woodLight;
      for (let p = -12; p <= 8; p += 5) {
        c.fillRect(p, -7, 3.6, 14);
      }
      c.fillStyle = theme.woodMid;
      c.fillRect(-16, -10, 32, 3.5);
      c.fillRect(-16, 6.5, 32, 3.5);
      c.restore();

      // 6. 3D Stepped Timber Cliff Incline with Handrails
      const rampX = w / 2;
      const rampTopY = hillY + hillH - 6;
      const rampH = 30;
      c.fillStyle = theme.woodDark;
      roundedRectPath(c, rampX - 24, rampTopY, 48, rampH, 5);
      c.fill();
      c.fillStyle = theme.woodMid;
      c.fillRect(rampX - 24, rampTopY, 4, rampH);
      c.fillRect(rampX + 20, rampTopY, 4, rampH);
      c.fillStyle = theme.woodLight;
      for (let step = 0; step < 5; step += 1) {
        roundedRectPath(c, rampX - 18, rampTopY + 3 + step * 5.2, 36, 3.8, 1.5);
        c.fill();
      }

      // 7. Main Village Promenade & Cozy Stepping Stones
      c.strokeStyle = theme.pathEdge;
      c.lineWidth = 14;
      c.lineCap = 'round';
      c.beginPath();
      c.moveTo(xSafe(w * 0.11, w), laneY + 5);
      c.quadraticCurveTo(w * 0.5, laneY - 1, xSafe(w * 0.85, w), laneY + 5);
      c.stroke();

      c.strokeStyle = theme.pathSand;
      c.lineWidth = 10;
      c.beginPath();
      c.moveTo(xSafe(w * 0.11, w), laneY + 5);
      c.quadraticCurveTo(w * 0.5, laneY - 1, xSafe(w * 0.85, w), laneY + 5);
      c.stroke();

      const drawSteppingStone = (sx, sy, rx = 5.4, ry = 3.4, rot = 0) => {
        c.fillStyle = theme.pathEdge;
        c.beginPath();
        c.ellipse(sx, sy + 1.4, rx, ry, rot, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = theme.pathSand;
        c.beginPath();
        c.ellipse(sx, sy, rx - 0.5, ry - 0.4, rot, 0, Math.PI * 2);
        c.fill();
      };

      for (let sy = laneY + 17; sy <= plazaY - 96; sy += 13) {
        const wobble = Math.sin(sy * 0.18) * 4;
        drawSteppingStone(rampX + wobble, sy, 6.2, 4, wobble * 0.04);
      }

      for (const plot of homeSlots) {
        drawSteppingStone(plot.hx, plot.hy + 55, 5.2, 3.2, 0.1);
        drawSteppingStone(plot.hx + (plot.hx < rampX ? 10 : -10), plot.hy + 69, 4.6, 3, -0.1);
      }

      // 8. Brick Resident Services Plaza + Raised Town Hall Welcome Apron
      const plazaLeft = Math.max(gX + 20, stations.bookshelf.x - 42);
      const plazaRight = Math.min(gX + gW - 58, stations.generator.x + 38);
      const plazaW = Math.max(220, plazaRight - plazaLeft);
      const plazaTopY = plazaY - 28;
      const plazaBoxH = 100;
      const pavCenterX = w * 0.44;
      const pavCenterY = plazaY - 72;

      // Cobblestone welcome courtyard connecting incline to Brick Plaza
      c.fillStyle = theme.plazaBorder;
      c.beginPath();
      c.ellipse(pavCenterX, pavCenterY + 6, 48, 25, 0, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = theme.plazaFill;
      c.beginPath();
      c.ellipse(pavCenterX, pavCenterY + 5, 45, 22, 0, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = theme.plazaTileA;
      c.beginPath();
      c.ellipse(pavCenterX, pavCenterY + 5, 34, 15, 0, 0, Math.PI * 2);
      c.fill();

      c.fillStyle = theme.plazaBorder;
      roundedRectPath(c, plazaLeft - 3, plazaTopY - 3, plazaW + 6, plazaBoxH + 8, 18);
      c.fill();

      c.save();
      roundedRectPath(c, plazaLeft, plazaTopY, plazaW, plazaBoxH, 16);
      c.clip();
      c.fillStyle = theme.plazaFill;
      c.fillRect(plazaLeft, plazaTopY, plazaW, plazaBoxH);
      const tileW = 14;
      const tileH = 10;
      for (let ty = plazaTopY; ty < plazaTopY + plazaBoxH; ty += tileH) {
        const rowIdx = Math.floor((ty - plazaTopY) / tileH);
        const offsetX = (rowIdx % 2) * (tileW / 2);
        for (let tx = plazaLeft - tileW; tx < plazaLeft + plazaW; tx += tileW) {
          c.fillStyle = ((Math.floor(tx / tileW) + rowIdx) % 2 === 0) ? theme.plazaTileA : theme.plazaTileB;
          roundedRectPath(c, tx + offsetX + 1, ty + 1, tileW - 2, tileH - 2, 2);
          c.fill();
        }
      }
      c.restore();

      // ACNH Resident Services Tent/Pavilion clear above all plaza stations & labels!
      drawResidentServicesPavilion(c, pavCenterX, pavCenterY, theme);

      // Nook Leaf Flagpole beside Resident Services courtyard
      const flagX = pavCenterX - 40;
      const flagY = pavCenterY + 12;
      c.fillStyle = '#e2e8f0';
      c.fillRect(flagX - 1.5, flagY - 24, 3, 26);
      c.fillStyle = '#facc15';
      c.beginPath();
      c.arc(flagX, flagY - 25, 2.5, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = '#227446';
      c.beginPath();
      c.moveTo(flagX + 1.5, flagY - 23);
      c.lineTo(flagX + 17, flagY - 18);
      c.lineTo(flagX + 1.5, flagY - 12);
      c.closePath();
      c.fill();

      // Vintage Plaza Streetlamps flanking Resident Services Courtyard clear of station labels
      for (const lampX of [pavCenterX - 58, pavCenterX + 48]) {
        const lampY = pavCenterY + 14;
        c.fillStyle = '#2f3d38';
        c.fillRect(lampX - 1.5, lampY - 20, 3, 22);
        c.fillStyle = theme.lampGlow ? '#ffe675' : '#e2f2ee';
        c.beginPath();
        c.arc(lampX, lampY - 22, 4, 0, Math.PI * 2);
        c.fill();
        if (theme.lampGlow) {
          const grd = c.createRadialGradient(lampX, lampY - 22, 2, lampX, lampY - 22, 28);
          grd.addColorStop(0, 'rgba(255, 228, 120, 0.48)');
          grd.addColorStop(1, 'rgba(255, 228, 120, 0)');
          c.fillStyle = grd;
          c.beginPath();
          c.arc(lampX, lampY - 22, 28, 0, Math.PI * 2);
          c.fill();
        }
      }
    }

    c.restore(); // end grass clip
    c.restore(); // end cliff

    // 9. Volumetric Perimeter Foliage
    if (isCompactEmpty) {
      drawCedarTree(c, 34, 42, theme);
      drawFruitTree(c, w - 34, 48, isl.fruit, theme, 0.85);
      drawFlowerPatch(c, 48, h - 30, seed);
      drawEmptyPlotSign(c, w / 2, h / 2 + 4, theme, openPlotText);
    } else {
      drawCedarTree(c, 28, 44, theme);
      drawCedarTree(c, w - 28, 42, theme);
      drawFruitTree(c, 28, laneY - 6, isl.fruit, theme, 0.94);
      drawFruitTree(c, 32, h - 34, isl.fruit, theme, 0.98);
      drawFruitTree(c, w - 30, h - 80, isl.fruit, theme, 0.9);
      drawFlowerPatch(c, 58, h - 25, seed);
      drawFlowerPatch(c, w - 68, 44, seed + 2);
      drawFlowerPatch(c, 52, 42, seed + 5);
    }

    if (terrainCache.size >= 48) {
      const oldest = terrainCache.keys().next().value;
      terrainCache.delete(oldest);
    }
    terrainCache.set(cacheKey, off);
    return off;
  }

  function xSafe(val, w) {
    return Math.max(40, Math.min(w - 50, val));
  }

  // --- Pre-baked Three-Quarter 2.5D Oblique House Sprites ---
  const houseCache = new Map();
  function getHouseCanvas(isSub, roofColor, isAtHome, theme, agentSource = 'antigravity') {
    const key = `${isSub ? 's' : 'm'}|${roofColor}|${isAtHome ? 1 : 0}|${theme.key}|${agentSource}`;
    if (houseCache.has(key)) return houseCache.get(key);

    const scale = 2;
    const cw = 142;
    const ch = 116;
    const off = document.createElement('canvas');
    off.width = cw * scale;
    off.height = ch * scale;
    const c = off.getContext('2d');
    c.scale(scale, scale);
    c.translate(cw / 2 - 4, 48);

    const bodyW = isSub ? 42 : 48;
    const bodyH = isSub ? 26 : 30;
    const depthX = 11; // Visible oblique 2.5D right side-wall width
    const depthY = -5; // Oblique elevation slant
    const roofPeak = isSub ? 18 : 22;
    const halfW = bodyW / 2;
    const provCol = PROVIDER_COLORS[agentSource] || PROVIDER_COLORS.antigravity;

    // Warm window yard glow at night/sunset
    if (isAtHome && (theme.key === 'night' || theme.key === 'sunset')) {
      const glow = c.createRadialGradient(0, 14, 4, 0, 14, 46);
      glow.addColorStop(0, theme.windowLitGlow);
      glow.addColorStop(1, 'rgba(255, 224, 102, 0)');
      c.fillStyle = glow;
      c.beginPath();
      c.arc(0, 14, 46, 0, Math.PI * 2);
      c.fill();
    }

    // 2.5D Ground contact shadow stretched slightly right
    c.fillStyle = 'rgba(22, 48, 24, 0.25)';
    c.beginPath();
    c.ellipse(5, bodyH + 3, halfW + 13, 8, 0, 0, Math.PI * 2);
    c.fill();

    // Picket garden fence behind cottage flanks
    c.fillStyle = '#fff5e0';
    c.strokeStyle = theme.woodMid;
    c.lineWidth = 1.2;
    for (const fx of [-halfW - 11, -halfW - 6, halfW + depthX + 2, halfW + depthX + 7]) {
      roundedRectPath(c, fx, bodyH - 11, 3.6, 11, 1);
      c.fill();
      c.stroke();
    }

    // 2-step Wooden Front Porch Steps
    c.fillStyle = theme.woodDark;
    roundedRectPath(c, -halfW + 3, bodyH + 1, bodyW + depthX - 6, 6, 2);
    c.fill();
    c.fillStyle = theme.woodLight;
    c.strokeStyle = theme.woodDark;
    c.lineWidth = 1.3;
    roundedRectPath(c, -halfW - 1, bodyH - 3, bodyW + depthX - 1, 6, 2);
    c.fill();
    c.stroke();

    // Brick chimney rising from side roof slope
    if (!isSub) {
      c.fillStyle = '#a84732';
      c.strokeStyle = '#5c2a1e';
      c.lineWidth = 1.6;
      roundedRectPath(c, halfW - 6, -roofPeak - 3, 8, 15, 2);
      c.fill();
      c.stroke();
      c.fillStyle = '#d97757';
      c.fillRect(halfW - 7, -roofPeak - 4, 10, 3);
    }

    // 2.5D Shaded Right Side Wall (oblique cube face)
    c.fillStyle = isSub ? '#e8d7bd' : '#efe1c9';
    c.strokeStyle = '#6f4826';
    c.lineWidth = 1.8;
    c.beginPath();
    c.moveTo(halfW, 0);
    c.lineTo(halfW + depthX, depthY);
    c.lineTo(halfW + depthX, bodyH + depthY);
    c.lineTo(halfW, bodyH);
    c.closePath();
    c.fill();
    c.stroke();

    // Small circular window on 2.5D side wall
    c.fillStyle = isAtHome ? theme.windowLit : theme.windowOut;
    c.strokeStyle = '#6f4826';
    c.lineWidth = 1.1;
    c.beginPath();
    c.ellipse(halfW + depthX * 0.52, bodyH * 0.42 + depthY * 0.5, 2.5, 3.5, 0, 0, Math.PI * 2);
    c.fill();
    c.stroke();

    // Front Cream Plaster Wall
    c.fillStyle = isSub ? '#fff5e4' : '#fffaf0';
    c.strokeStyle = '#6f4826';
    c.lineWidth = 1.9;
    roundedRectPath(c, -halfW, 0, bodyW, bodyH, 3);
    c.fill();
    c.stroke();

    // Timber corner posts & eave shadow strip
    c.fillStyle = theme.woodMid;
    c.fillRect(-halfW + 1, 1, 3, bodyH - 2);
    c.fillRect(halfW - 3.5, 1, 3, bodyH - 2);
    c.fillStyle = 'rgba(78, 46, 22, 0.20)';
    c.fillRect(-halfW + 1, 1.5, bodyW - 2, 4.5);

    // 2.5D Side Roof Plane (darkened roof pitch extending back-right)
    c.fillStyle = shadeHex(roofColor, -34);
    c.strokeStyle = '#4e2e16';
    c.lineWidth = 1.9;
    c.beginPath();
    c.moveTo(0, -roofPeak);
    c.lineTo(depthX + 2, -roofPeak + depthY);
    c.lineTo(halfW + depthX + 7, 4 + depthY);
    c.lineTo(halfW + 5, 4);
    c.closePath();
    c.fill();
    c.stroke();

    // Main Front Gabled Roof
    c.fillStyle = roofColor;
    c.strokeStyle = '#4e2e16';
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(-halfW - 7, 4);
    c.quadraticCurveTo(-halfW * 0.42, -roofPeak * 0.45, 0, -roofPeak);
    c.quadraticCurveTo(halfW * 0.42, -roofPeak * 0.45, halfW + 5, 4);
    c.closePath();
    c.fill();
    c.stroke();

    // Sunlit shingle ridge lines
    c.strokeStyle = 'rgba(255, 255, 255, 0.28)';
    c.lineWidth = 1.3;
    c.beginPath();
    c.moveTo(-halfW + 1, -3);
    c.lineTo(halfW - 1, -3);
    c.moveTo(-halfW * 0.55, -10);
    c.lineTo(halfW * 0.55, -10);
    c.stroke();

    // Roof Dormer / Emblem
    if (!isSub) {
      c.fillStyle = '#fff9e6';
      c.strokeStyle = '#4e2e16';
      c.lineWidth = 1.4;
      c.beginPath();
      c.arc(0, -roofPeak + 10.5, 4.2, 0, Math.PI * 2);
      c.fill();
      c.stroke();
      c.fillStyle = isAtHome ? theme.windowLit : theme.windowOut;
      c.beginPath();
      c.arc(0, -roofPeak + 10.5, 2.5, 0, Math.PI * 2);
      c.fill();
    } else {
      c.fillStyle = '#4ade80';
      c.strokeStyle = '#166534';
      c.lineWidth = 1.2;
      c.beginPath();
      c.ellipse(0, -roofPeak + 8.5, 4.5, 2.6, -0.3, 0, Math.PI * 2);
      c.fill();
      c.stroke();
    }

    // Arched Wooden Front Door
    c.fillStyle = '#8b562e';
    c.strokeStyle = '#4e2e16';
    c.lineWidth = 1.5;
    c.beginPath();
    c.moveTo(-5.5, bodyH);
    c.lineTo(-5.5, bodyH - 11);
    c.arc(0, bodyH - 11, 5.5, Math.PI, 0);
    c.lineTo(5.5, bodyH);
    c.closePath();
    c.fill();
    c.stroke();

    if (!isSub) {
      c.strokeStyle = '#227446';
      c.lineWidth = 2;
      c.beginPath();
      c.arc(0, bodyH - 11, 2.6, 0, Math.PI * 2);
      c.stroke();
    }
    c.fillStyle = '#fbbf24';
    c.beginPath();
    c.arc(3, bodyH - 6.5, 1.2, 0, Math.PI * 2);
    c.fill();

    // Mullioned Front Windows
    const winCol = isAtHome ? theme.windowLit : theme.windowOut;
    for (const wx of [-halfW + 5, halfW - 14]) {
      c.fillStyle = winCol;
      c.strokeStyle = '#6f4826';
      c.lineWidth = 1.4;
      roundedRectPath(c, wx, 7, 9, 9, 2);
      c.fill();
      c.stroke();
      c.beginPath();
      c.moveTo(wx + 4.5, 7);
      c.lineTo(wx + 4.5, 16);
      c.moveTo(wx, 11.5);
      c.lineTo(wx + 9, 11.5);
      c.stroke();
    }

    // Flowerbox on left porch
    c.fillStyle = '#fffdf5';
    c.strokeStyle = '#9e7340';
    c.lineWidth = 1.1;
    c.fillRect(-halfW - 6, bodyH - 4, 6.5, 7);
    c.strokeRect(-halfW - 6, bodyH - 4, 6.5, 7);
    c.fillStyle = '#f472b6';
    c.beginPath();
    c.arc(-halfW - 3, bodyH - 5.5, 2.2, 0, Math.PI * 2);
    c.fill();

    // Mailbox with Agent Tool Color Flag
    c.fillStyle = theme.woodMid;
    c.fillRect(halfW + depthX - 1, bodyH - 1, 3.5, 7);
    c.fillStyle = provCol;
    c.strokeStyle = '#3e2718';
    c.lineWidth = 1.2;
    roundedRectPath(c, halfW + depthX - 3.5, bodyH - 8, 9, 6, 2.5);
    c.fill();
    c.stroke();

    if (houseCache.size >= 160) {
      const oldest = houseCache.keys().next().value;
      houseCache.delete(oldest);
    }
    houseCache.set(key, off);
    return off;
  }

  function drawAgentHouse(ctx, hx, hy, villager, roofColor, animSec, theme, reducedMotion, zoom = 1, doorplateText = '') {
    const isAtHome = villager.station === 'home';
    const isSub = Boolean(villager.isSubagent);
    const cached = getHouseCanvas(isSub, roofColor, isAtHome, theme, villager.agentSource || 'antigravity');

    ctx.save();
    ctx.drawImage(cached, hx - 67, hy - 48, 142, 116);

    // Chimney smoke puffs when Mayor is resting
    if (!isSub && isAtHome && !reducedMotion) {
      const halfW = 24;
      const roofPeak = 22;
      for (let p = 0; p < 2; p += 1) {
        const phase = ((animSec * 0.7 + p * 0.5 + hx * 0.01) % 1);
        const alpha = (1 - phase) * 0.65;
        ctx.fillStyle = `rgba(255, 252, 244, ${alpha})`;
        ctx.beginPath();
        ctx.arc(hx + halfW - 2 + Math.sin(phase * 5) * 3, hy - roofPeak - 8 - phase * 18, 2.8 + phase * 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Wooden House Doorplate showing cleaned quest topic
    const label = doorplateText || villager.doorplateLabel || '';
    if (label) {
      const zoomBoost = Math.min(1.42, Math.max(1, 0.78 / Math.max(0.45, zoom)));
      const fontSize = Math.round(10.5 * zoomBoost * 10) / 10;
      const ph = Math.round(16 * zoomBoost);
      const maxTw = Math.round(98 * Math.min(1.22, zoomBoost));
      ctx.font = `800 ${fontSize}px ${CANVAS_FONT}`;
      const tw = Math.min(maxTw, Math.max(46, ctx.measureText(label).width + 14 * zoomBoost));
      const py = hy + (isSub ? 32 : 36);
      ctx.fillStyle = theme.key === 'night' ? '#362416' : '#fffbf0';
      ctx.strokeStyle = theme.woodMid;
      ctx.lineWidth = 1.6;
      roundedRectPath(ctx, hx - tw / 2, py, tw, ph, ph / 2.6);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = theme.key === 'night' ? '#fdeec6' : '#2c1c0f';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, hx, py + ph / 2 + 0.5, tw - 10);
    }
    ctx.restore();
  }

  // --- Curved Horizon Backdrop behind Ocean ---
  function drawOceanBackdrop(ctx, width, height, animSec, theme, reducedMotion) {
    // Gentle sky glow along upper horizon
    const skyGrd = ctx.createLinearGradient(0, 0, 0, 52);
    skyGrd.addColorStop(0, theme.skyRim);
    skyGrd.addColorStop(1, theme.skyFade);
    ctx.fillStyle = skyGrd;
    ctx.fillRect(0, 0, width, 52);

    // Subtle twinkling stars at Night along high horizon mist
    if (theme.key === 'night') {
      for (let i = 0; i < 14; i += 1) {
        const sx = ((i * 89 + 31) % Math.max(120, width - 40)) + 20;
        const sy = 8 + ((i * 19) % 28);
        const alpha = reducedMotion ? 0.55 : 0.35 + 0.4 * (0.5 + 0.5 * Math.sin(animSec * 2.2 + i * 1.7));
        ctx.fillStyle = `rgba(255, 250, 220, ${alpha})`;
        ctx.beginPath();
        ctx.arc(sx, sy, (i % 3 === 0 ? 1.5 : 1), 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Subtle Ocean Shimmer Ripples
    ctx.strokeStyle = theme.oceanRipple;
    ctx.lineWidth = 2;
    const shift = reducedMotion ? 0 : animSec * 12;
    for (let row = 0; row < 6; row += 1) {
      for (let col = 0; col < 5; col += 1) {
        const rx = ((col * 250 + shift + row * 95) % (width + 120)) - 60;
        const ry = (row + 0.65) * (height / 6.5);
        ctx.beginPath();
        ctx.arc(rx, ry, 18, 0.2, 1.25);
        ctx.stroke();
      }
    }
  }

  // --- Island Entrance Signboard with Multi-Tool Dots ---
  function drawIslandSignboard(ctx, isl, animSec, theme, reducedMotion) {
    const signX = isl.x + 14;
    const signY = isl.y - 18;
    ctx.save();
    ctx.font = `800 12.5px ${CANVAS_FONT}`;
    const labelText = isl.name.length > 20 ? `${isl.name.slice(0, 19)}…` : isl.name;
    const textW = ctx.measureText(labelText).width;
    const sources = Array.isArray(isl.sources) && isl.sources.length > 0 ? isl.sources : [];
    const srcPad = sources.length > 0 ? sources.length * 8 + 4 : 0;
    const leftPad = isl.isCurrentWorkspace ? 34 : 24;
    const signW = Math.max(100, textW + leftPad + srcPad + 24);

    // Dual wooden posts with bevel
    ctx.fillStyle = theme.woodDark;
    roundedRectPath(ctx, signX + 14, signY + 22, 6, 16, 2);
    ctx.fill();
    roundedRectPath(ctx, signX + signW - 20, signY + 22, 6, 16, 2);
    ctx.fill();

    // Soft cast shadow behind signboard
    ctx.fillStyle = 'rgba(20, 44, 30, 0.20)';
    roundedRectPath(ctx, signX + 1, signY + 3, signW, 27, 11);
    ctx.fill();

    // Cream Wooden Signboard Plaque
    ctx.fillStyle = theme.key === 'night' ? '#362619' : '#fffaf0';
    ctx.strokeStyle = isl.isCurrentWorkspace || isl.activeCount > 0 ? '#d97706' : theme.woodMid;
    ctx.lineWidth = isl.activeCount > 0 || isl.isCurrentWorkspace ? 2.5 : 2;
    roundedRectPath(ctx, signX, signY, signW, 27, 11);
    ctx.fill();
    ctx.stroke();

    // Live status beacon
    ctx.fillStyle = isl.activeCount > 0 ? '#22c55e' : '#b79e72';
    ctx.beginPath();
    ctx.arc(signX + 13, signY + 13.5, 4.2, 0, Math.PI * 2);
    ctx.fill();
    if (isl.activeCount > 0 && !reducedMotion) {
      ctx.fillStyle = 'rgba(34, 197, 94, 0.30)';
      ctx.beginPath();
      ctx.arc(signX + 13, signY + 13.5, 7 + Math.sin(animSec * 4) * 1.6, 0, Math.PI * 2);
      ctx.fill();
    }

    if (isl.isCurrentWorkspace) {
      drawMiniStar(ctx, signX + 25, signY + 13.5, 4.5, '#f59e0b');
    }

    ctx.fillStyle = theme.key === 'night' ? '#fff7e0' : '#342112';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(labelText, signX + leftPad, signY + 14);

    // Source jewel dots right of title
    sources.forEach((srcId, i) => {
      const dx = signX + leftPad + textW + 9 + i * 8;
      ctx.fillStyle = PROVIDER_COLORS[srcId] || '#64748b';
      ctx.beginPath();
      ctx.arc(dx, signY + 13.5, 2.8, 0, Math.PI * 2);
      ctx.fill();
    });

    // Island Fruit badge on right
    drawMiniFruit(ctx, signX + signW - 12, signY + 13.5, isl.fruit);
    ctx.restore();
  }

  function drawMiniStar(ctx, cx, cy, r, col) {
    ctx.fillStyle = col;
    ctx.beginPath();
    for (let i = 0; i < 10; i += 1) {
      const rad = i % 2 === 0 ? r : r * 0.45;
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      const x = cx + Math.cos(a) * rad;
      const y = cy + Math.sin(a) * rad;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
  }

  function drawMiniFruit(ctx, cx, cy, fruit) {
    const col =
      fruit === 'orange' ? '#f97316'
        : fruit === 'peach' ? '#fb7185'
          : fruit === 'pear' ? '#84cc16'
            : fruit === 'cherry' ? '#e11d48'
              : '#ef4444';
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.arc(cx, cy + 0.5, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.ellipse(cx + 1.5, cy - 3.5, 2.2, 1.1, -0.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // --- 5 Detailed 2.5D Plaza Stations ---
  function drawBookshelfStation(ctx, x, y, theme) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = 'rgba(24, 48, 28, 0.24)';
    ctx.beginPath();
    ctx.ellipse(2, 11, 23, 6.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2.5D right side depth panel
    ctx.fillStyle = theme.woodDark;
    ctx.beginPath();
    ctx.moveTo(19, -20);
    ctx.lineTo(24, -23);
    ctx.lineTo(24, 5);
    ctx.lineTo(19, 8);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = theme.woodMid;
    ctx.strokeStyle = theme.woodDark;
    ctx.lineWidth = 1.8;
    roundedRectPath(ctx, -19, -20, 38, 28, 4);
    ctx.fill();
    ctx.stroke();

    // Striped canopy awning
    for (let i = 0; i < 4; i += 1) {
      ctx.fillStyle = i % 2 === 0 ? '#166534' : '#fff9e6';
      roundedRectPath(ctx, -21 + i * 10.5, -27, 10.5, 8, 2);
      ctx.fill();
    }
    ctx.strokeStyle = theme.woodDark;
    ctx.lineWidth = 1.5;
    roundedRectPath(ctx, -21, -27, 42, 8, 2);
    ctx.stroke();

    ctx.fillStyle = '#b98354';
    ctx.fillRect(-15, -16, 30, 9);
    ctx.fillRect(-15, -4, 30, 9);
    const cols = ['#ef4444', '#3b82f6', '#f59e0b', '#10b981', '#ec4899'];
    for (let i = 0; i < 5; i += 1) {
      ctx.fillStyle = cols[i];
      ctx.fillRect(-13 + i * 5.5, -15, 4, 8);
      ctx.fillStyle = cols[(i + 2) % 5];
      ctx.fillRect(-13 + i * 5.5, -3, 4, 8);
    }
    ctx.restore();
  }

  function drawBoardStation(ctx, x, y, busy, theme) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = 'rgba(24, 48, 28, 0.24)';
    ctx.beginPath();
    ctx.ellipse(2, 11, 25, 6.5, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = theme.woodDark;
    ctx.fillRect(-15, -4, 5, 14);
    ctx.fillRect(10, -4, 5, 14);

    // Little shingle roof cap on bulletin board
    ctx.fillStyle = theme.woodMid;
    ctx.strokeStyle = theme.woodDark;
    ctx.lineWidth = 1.6;
    roundedRectPath(ctx, -25, -31, 50, 6, 3);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = theme.woodLight;
    roundedRectPath(ctx, -23, -26, 46, 24, 4);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#fef3c7';
    ctx.fillRect(-18, -22, 12, 11);
    ctx.fillStyle = '#bae6fd';
    ctx.fillRect(-3, -21, 11, 13);
    ctx.fillStyle = '#fecdd3';
    ctx.fillRect(10, -22, 9, 9);

    if (busy) {
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.arc(15, -34, 3.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.moveTo(18, -34);
      ctx.lineTo(21, -33);
      ctx.lineTo(18, -32);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawWorkbenchStation(ctx, x, y, theme) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = 'rgba(24, 48, 28, 0.24)';
    ctx.beginPath();
    ctx.ellipse(2, 12, 24, 6.5, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = theme.woodDark;
    ctx.fillRect(-15, 2, 7, 10);
    ctx.fillRect(8, 2, 7, 10);

    // 2.5D tabletop depth thickness
    ctx.fillStyle = theme.woodDark;
    roundedRectPath(ctx, -22, -9, 44, 15, 5);
    ctx.fill();
    ctx.fillStyle = theme.woodLight;
    ctx.strokeStyle = theme.woodDark;
    ctx.lineWidth = 1.9;
    roundedRectPath(ctx, -22, -14, 44, 16, 6);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#dbeafe';
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 1;
    ctx.fillRect(-16, -11, 15, 10);
    ctx.strokeRect(-16, -11, 15, 10);

    ctx.fillStyle = '#ef4444';
    ctx.strokeStyle = '#7f1d1d';
    ctx.lineWidth = 1.2;
    roundedRectPath(ctx, 4, -15, 13, 9, 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#9ca3af';
    ctx.fillRect(7, -18, 7, 3);
    ctx.restore();
  }

  function drawGeneratorStation(ctx, x, y, active, animSec, theme, reducedMotion) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = 'rgba(24, 48, 28, 0.24)';
    ctx.beginPath();
    ctx.ellipse(2, 11, 22, 6.5, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -18);
    ctx.lineTo(0, -29);
    ctx.stroke();
    const dishW = active && !reducedMotion ? 5 * Math.cos(animSec * 4) : 5;
    ctx.fillStyle = '#cbd5e1';
    ctx.beginPath();
    ctx.ellipse(0, -30, Math.max(1.5, Math.abs(dishW)), 3.2, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2.5D side bevel on cabinet
    ctx.fillStyle = '#25555a';
    roundedRectPath(ctx, -17, -17, 41, 27, 6);
    ctx.fill();

    ctx.fillStyle = '#3b7c82';
    ctx.strokeStyle = '#20494d';
    ctx.lineWidth = 1.9;
    roundedRectPath(ctx, -19, -19, 38, 27, 6);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#142a2e';
    roundedRectPath(ctx, -13, -14, 26, 13, 3);
    ctx.fill();

    const blink = active && (reducedMotion || Math.sin(animSec * 7) > 0);
    ctx.fillStyle = blink ? '#34d399' : '#64748b';
    ctx.beginPath();
    ctx.arc(-7, -7.5, 2.6, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = active ? '#38bdf8' : '#475569';
    ctx.fillRect(-1, -9, 10, 3);
    ctx.restore();
  }

  function drawAirportStation(ctx, x, y, animSec, theme, reducedMotion) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = 'rgba(86, 209, 216, 0.48)';
    ctx.beginPath();
    ctx.ellipse(2, 10, 29, 7.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Wooden pilings under pier
    ctx.fillStyle = theme.woodDark;
    ctx.fillRect(-19, 7, 4, 8);
    ctx.fillRect(19, 7, 4, 8);

    ctx.fillStyle = theme.woodLight;
    ctx.strokeStyle = theme.woodDark;
    ctx.lineWidth = 1.8;
    roundedRectPath(ctx, -22, -6, 48, 17, 4);
    ctx.fill();
    ctx.stroke();

    const bob = reducedMotion ? 0 : Math.sin(animSec * 2.5) * 1.4;
    ctx.save();
    ctx.translate(-11, -13 + bob);
    ctx.fillStyle = '#0ea5e9';
    ctx.strokeStyle = '#075985';
    ctx.lineWidth = 1.4;
    roundedRectPath(ctx, -8, -4, 16, 8, 4);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#facc15';
    ctx.fillRect(-12, -1, 24, 2.5);
    ctx.restore();

    ctx.strokeStyle = theme.woodDark;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(4, -3);
    ctx.lineTo(9, -16);
    ctx.lineTo(14, -3);
    ctx.stroke();

    ctx.save();
    ctx.translate(9, -18);
    ctx.rotate(-0.2 + (reducedMotion ? 0 : Math.sin(animSec * 1.5) * 0.08));
    ctx.fillStyle = '#eab308';
    roundedRectPath(ctx, -8, -3, 17, 6, 2);
    ctx.fill();
    ctx.restore();
    ctx.restore();
  }

  // --- ACNH 2.5-Proportion Villager Renderer ---
  function drawVillagerSprite(ctx, actor, animSec, isSelected, isHovered, isCurrentConv, reducedMotion) {
    const v = actor.data;
    const moving = Math.hypot(actor.targetX - actor.x, actor.targetY - actor.y) > 2;
    const walkPhase = moving && !reducedMotion ? animSec * 14 : 0;
    const bob = reducedMotion
      ? 0
      : moving
        ? Math.abs(Math.sin(walkPhase)) * 4.5
        : v.activity === 'sleeping'
          ? Math.sin(animSec * 1.8) * 1
          : Math.sin(animSec * 3.4 + actor.x * 0.05) * 1.5;

    const px = actor.x;
    const py = actor.y - bob;
    const pal = getSpeciesPalette(actor.species);
    const outline = '#3e2718';

    for (let i = actor.dust.length - 1; i >= 0; i -= 1) {
      const d = actor.dust[i];
      ctx.fillStyle = `rgba(255, 250, 235, ${d.life * 0.72})`;
      ctx.beginPath();
      ctx.arc(d.x, d.y, (1.4 - d.life) * 7.5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = 'rgba(24, 50, 26, 0.30)';
    ctx.beginPath();
    ctx.ellipse(actor.x, actor.y + 11, 13.5, 5.2, 0, 0, Math.PI * 2);
    ctx.fill();

    if (isSelected || isHovered || isCurrentConv) {
      ctx.strokeStyle = isSelected ? '#d97706' : isHovered ? '#38bdf8' : '#16a34a';
      ctx.lineWidth = isSelected ? 2.8 : 2.1;
      ctx.beginPath();
      ctx.ellipse(actor.x, actor.y + 11, 17, 6.8, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.save();
    ctx.translate(px, py);
    if (actor.facing < 0) ctx.scale(-1, 1);

    const stride = moving ? Math.sin(walkPhase) * 3.5 : 0;
    ctx.fillStyle = pal.fur;
    ctx.strokeStyle = outline;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.ellipse(-4.5 + stride, 10, 3.3, 2.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(4.5 - stride, 10, 3.3, 2.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    if (actor.species === 'squirrel' || actor.species === 'fox') {
      ctx.fillStyle = pal.fur;
      ctx.beginPath();
      ctx.ellipse(-11, 3, 6.5, 4.2, -0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    ctx.fillStyle = actor.shirt;
    roundedRectPath(ctx, -9.5, -3, 19, 13, 6);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#fff9eb';
    ctx.beginPath();
    ctx.arc(0, -2, 3.5, 0, Math.PI);
    ctx.fill();

    ctx.fillStyle = pal.fur;
    if (actor.species === 'bunny') {
      roundedRectPath(ctx, -10.5, -36, 6, 16, 3);
      ctx.fill();
      ctx.stroke();
      roundedRectPath(ctx, 4.5, -36, 6, 16, 3);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = pal.inner;
      roundedRectPath(ctx, -9, -34, 3, 10, 1.5);
      ctx.fill();
      roundedRectPath(ctx, 6, -34, 3, 10, 1.5);
      ctx.fill();
    } else if (actor.species === 'bear' || actor.species === 'frog') {
      ctx.beginPath();
      ctx.arc(-9.5, -22, 5.2, 0, Math.PI * 2);
      ctx.arc(9.5, -22, 5.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = pal.inner;
      ctx.beginPath();
      ctx.arc(-9.5, -22, 2.6, 0, Math.PI * 2);
      ctx.arc(9.5, -22, 2.6, 0, Math.PI * 2);
      ctx.fill();
    } else if (actor.species === 'duck') {
      ctx.beginPath();
      ctx.moveTo(-2, -24);
      ctx.quadraticCurveTo(0, -30, 4, -27);
      ctx.quadraticCurveTo(2, -24, 0, -24);
      ctx.fill();
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.moveTo(-12.5, -17);
      ctx.lineTo(-10.5, -29.5);
      ctx.lineTo(-3, -22);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(12.5, -17);
      ctx.lineTo(10.5, -29.5);
      ctx.lineTo(3, -22);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    ctx.fillStyle = pal.fur;
    ctx.beginPath();
    ctx.ellipse(0, -14, 14, 11.8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    if (actor.species === 'duck') {
      ctx.fillStyle = pal.bill || '#fb923c';
      ctx.beginPath();
      ctx.ellipse(1.5, -9.5, 5.8, 3.2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else {
      ctx.fillStyle = pal.muzzle;
      ctx.beginPath();
      ctx.ellipse(0, -9.5, 6.8, 4.6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#4a2e1b';
      ctx.beginPath();
      ctx.arc(0, -11, 1.6, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = 'rgba(244, 114, 182, 0.48)';
    ctx.beginPath();
    ctx.arc(-8, -11, 2.5, 0, Math.PI * 2);
    ctx.arc(8, -11, 2.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#2d1c10';
    ctx.strokeStyle = '#2d1c10';
    if (v.activity === 'sleeping') {
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(-7, -14.5);
      ctx.quadraticCurveTo(-5, -13, -3, -14.5);
      ctx.moveTo(3, -14.5);
      ctx.quadraticCurveTo(5, -13, 7, -14.5);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(-5, -15, 2, 0, Math.PI * 2);
      ctx.arc(5, -15, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(-5.6, -15.7, 0.7, 0, Math.PI * 2);
      ctx.arc(4.4, -15.7, 0.7, 0, Math.PI * 2);
      ctx.fill();
    }

    const rc = v.roleCode || (v.isSubagent ? 'helper' : 'mayor');
    if (rc === 'mayor') {
      ctx.fillStyle = '#7c4724';
      ctx.strokeStyle = outline;
      ctx.lineWidth = 1.3;
      roundedRectPath(ctx, -9.5, -27.5, 19, 4, 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#9a5c30';
      roundedRectPath(ctx, -6.5, -33.5, 13, 7, 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(-6, -28.5, 12, 2);
    } else if (rc === 'curator') {
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(-5, -15, 3.6, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(5, -15, 3.6, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-1.4, -15);
      ctx.lineTo(1.4, -15);
      ctx.stroke();
    } else if (rc === 'pilot') {
      ctx.fillStyle = '#0369a1';
      ctx.strokeStyle = outline;
      ctx.lineWidth = 1.2;
      roundedRectPath(ctx, -9, -28.5, 18, 5, 2.5);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#bae6fd';
      roundedRectPath(ctx, -7, -27.5, 5.5, 3.2, 1.2);
      ctx.fill();
      roundedRectPath(ctx, 1.5, -27.5, 5.5, 3.2, 1.2);
      ctx.fill();
    } else if (rc === 'rescue') {
      ctx.fillStyle = '#facc15';
      ctx.strokeStyle = outline;
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.arc(0, -24.5, 8.5, Math.PI, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillRect(-10, -25.5, 20, 2.5);
    } else if (rc === 'atelier') {
      ctx.fillStyle = '#ec4899';
      ctx.strokeStyle = outline;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.ellipse(-2, -26, 9, 4.2, -0.18, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else {
      ctx.strokeStyle = '#15803d';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(0, -25);
      ctx.quadraticCurveTo(2, -31, 6, -32);
      ctx.stroke();
      ctx.fillStyle = '#4ade80';
      ctx.beginPath();
      ctx.ellipse(7, -32, 4.4, 2.4, -0.4, 0, Math.PI * 2);
      ctx.fill();
    }

    drawActivityProp(ctx, v.activity, animSec, actor.facing, reducedMotion);
    ctx.restore();

    if (actor.reaction && actor.reaction.life > 0) {
      const rx = actor.facing >= 0 ? px + 16 : px - 16;
      drawReactionBurst(ctx, rx, py - 24, actor.reaction.type, actor.reaction.life);
    }
  }

  function drawActivityProp(ctx, activity, animSec, facing, reducedMotion) {
    if (activity === 'crafting') {
      ctx.save();
      ctx.translate(12, 0);
      ctx.rotate(-0.4 + (reducedMotion ? 0 : Math.sin(animSec * 12) * 0.55));
      ctx.fillStyle = '#7c4a21';
      ctx.fillRect(-1.5, -10, 3, 12);
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(-5, -13, 10, 5);
      ctx.restore();
      if (reducedMotion || Math.sin(animSec * 10) > 0.2) {
        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.arc(17, -10, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (activity === 'reading') {
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 1.4;
      roundedRectPath(ctx, 8, -6, 11, 8, 2);
      ctx.fill();
      ctx.stroke();
    } else if (activity === 'command') {
      ctx.save();
      ctx.translate(14, -4);
      ctx.rotate(reducedMotion ? 0 : animSec * 4);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 4.5, 0, Math.PI * 1.4);
      ctx.stroke();
      ctx.restore();
    } else if (activity === 'thinking') {
      const floatY = reducedMotion ? 0 : Math.sin(animSec * 3) * 2.2;
      ctx.save();
      if (facing < 0) ctx.scale(-1, 1);
      ctx.fillStyle = '#fffdf5';
      ctx.strokeStyle = '#16a34a';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(11, -28 + floatY, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      roundedRectPath(ctx, 7, -46 + floatY, 24, 14, 7);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#185735';
      for (let d = 0; d < 3; d += 1) {
        const activeDot = reducedMotion || Math.floor(animSec * 3) % 3 === d;
        ctx.beginPath();
        ctx.arc(13 + d * 6, -39 + floatY, activeDot ? 1.7 : 1.1, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    } else if (activity === 'coffee') {
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1.1;
      roundedRectPath(ctx, 9, -3, 7, 7, 2);
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.78)';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(12, -5);
      ctx.quadraticCurveTo(10, -10 - (reducedMotion ? 2 : (animSec * 8) % 6), 14, -14);
      ctx.stroke();
    } else if (activity === 'sleeping') {
      const drift = reducedMotion ? 4 : (animSec * 12) % 14;
      ctx.save();
      if (facing < 0) ctx.scale(-1, 1);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.94)';
      ctx.font = `800 11px ${CANVAS_FONT}`;
      ctx.fillText('Z', 12, -24 - drift * 0.7);
      ctx.restore();
    } else if (activity === 'error') {
      const drop = reducedMotion ? 4 : (animSec * 16) % 10;
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(14, -18 + drop, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawReactionBurst(ctx, cx, cy, type, life) {
    ctx.save();
    ctx.globalAlpha = Math.min(1, life * 1.5);
    const lift = (1 - life) * 10;
    ctx.translate(cx, cy - lift);
    if (type === 'idea') {
      ctx.fillStyle = '#fde047';
      ctx.strokeStyle = '#b45309';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, 0, 6.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      for (let i = 0; i < 4; i += 1) {
        const a = -Math.PI * 0.8 + i * 0.55;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * 9, Math.sin(a) * 9);
        ctx.lineTo(Math.cos(a) * 12, Math.sin(a) * 12);
        ctx.stroke();
      }
    } else if (type === 'joy') {
      const cols = ['#fb7185', '#facc15', '#34d399', '#f472b6'];
      for (let i = 0; i < 6; i += 1) {
        const a = (i * Math.PI) / 3 + (1 - life) * 2;
        const r = 6 + (1 - life) * 10;
        ctx.fillStyle = cols[i % cols.length];
        ctx.beginPath();
        ctx.arc(Math.cos(a) * r, Math.sin(a) * r, 2.3, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (type === 'music') {
      ctx.strokeStyle = '#227446';
      ctx.fillStyle = '#227446';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(-4, 2, 2.6, 0, Math.PI * 2);
      ctx.arc(4, 0, 2.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-1.8, 2);
      ctx.lineTo(-1.8, -7);
      ctx.lineTo(6.2, -9);
      ctx.lineTo(6.2, 0);
      ctx.stroke();
    } else if (type === 'sweat') {
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 2;
      for (let i = -1; i <= 1; i += 2) {
        ctx.beginPath();
        ctx.moveTo(i * 6, 0);
        ctx.lineTo(i * 11, -6);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  function drawCanvasIcon(ctx, iconName, cx, cy, size = 11) {
    const r = size / 2;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 1.7;

    if (iconName === 'book') {
      ctx.fillStyle = '#dbeafe';
      ctx.strokeStyle = '#1d4ed8';
      roundedRectPath(ctx, -r, -r * 0.85, size, size * 0.85, 2);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, -r * 0.85);
      ctx.lineTo(0, r * 0.65);
      ctx.stroke();
    } else if (iconName === 'hammer') {
      ctx.strokeStyle = '#9a3412';
      ctx.beginPath();
      ctx.moveTo(-r * 0.6, r * 0.6);
      ctx.lineTo(r * 0.35, -r * 0.35);
      ctx.stroke();
      ctx.fillStyle = '#64748b';
      ctx.fillRect(0, -r * 0.85, r * 0.8, r * 0.45);
    } else if (iconName === 'gear') {
      ctx.strokeStyle = '#0f766e';
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.6, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.22, 0, Math.PI * 2);
      ctx.stroke();
    } else if (iconName === 'plane') {
      ctx.fillStyle = '#0284c7';
      ctx.beginPath();
      ctx.moveTo(r * 0.85, 0);
      ctx.lineTo(-r * 0.6, -r * 0.65);
      ctx.lineTo(-r * 0.2, 0);
      ctx.lineTo(-r * 0.6, r * 0.65);
      ctx.closePath();
      ctx.fill();
    } else if (iconName === 'megaphone') {
      ctx.fillStyle = '#fde68a';
      ctx.strokeStyle = '#b45309';
      ctx.beginPath();
      ctx.moveTo(-r * 0.72, -r * 0.15);
      ctx.lineTo(r * 0.48, -r * 0.65);
      ctx.lineTo(r * 0.48, r * 0.45);
      ctx.lineTo(-r * 0.72, r * 0.12);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-r * 0.35, r * 0.16);
      ctx.lineTo(-r * 0.2, r * 0.68);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(r * 0.62, -r * 0.1, r * 0.34, -0.7, 0.7);
      ctx.stroke();
    } else if (iconName === 'clipboard') {
      ctx.strokeStyle = '#b45309';
      roundedRectPath(ctx, -r * 0.65, -r * 0.75, size * 0.65, size * 0.75, 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-r * 0.3, -r * 0.2);
      ctx.lineTo(r * 0.3, -r * 0.2);
      ctx.moveTo(-r * 0.3, r * 0.25);
      ctx.lineTo(r * 0.2, r * 0.25);
      ctx.stroke();
    } else if (iconName === 'coffee') {
      ctx.strokeStyle = '#78350f';
      ctx.fillStyle = '#fde68a';
      roundedRectPath(ctx, -r * 0.65, -r * 0.35, size * 0.62, size * 0.55, 2);
      ctx.fill();
      ctx.stroke();
    } else if (iconName === 'sweat') {
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.72, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-0.9, -r * 0.42, 1.8, r * 0.52);
      ctx.fillRect(-0.9, r * 0.24, 1.8, 1.8);
    } else {
      ctx.fillStyle = '#15803d';
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  window.VillageSprites = {
    CANVAS_FONT,
    TERRAIN_PAD,
    PROVIDER_COLORS,
    hashStr,
    buildOrganicPerimeterPath,
    clearTerrainCache: () => {
      terrainCache.clear();
      houseCache.clear();
      patternCache.clear();
    },
    getLightingTheme,
    drawOceanBackdrop,
    getIslandTerrainCanvas,
    drawAgentHouse,
    drawIslandSignboard,
    drawBookshelfStation,
    drawBoardStation,
    drawWorkbenchStation,
    drawGeneratorStation,
    drawAirportStation,
    drawVillagerSprite,
    drawCanvasIcon,
    renderIconSvg,
    renderProviderIconSvg,
    renderSpeciesPortraitSvg,
  };
})();

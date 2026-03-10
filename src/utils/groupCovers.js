const TOPIC_THEMES = [
  {
    key: 'javascript',
    patterns: [/\bjavascript\b/i, /\bjs\b/i],
    headerGradient: 'from-amber-400 to-yellow-500',
    emblemGradient: 'from-amber-400 to-yellow-500',
    emblemText: 'JS',
    tagText: 'TRENDING',
    bgStart: '#FACC15',
    bgEnd: '#F59E0B',
    fg: '#111827',
    symbol: 'JS',
  },
  {
    key: 'python',
    patterns: [/\bpython\b/i],
    headerGradient: 'from-blue-500 to-yellow-400',
    emblemGradient: 'from-blue-500 to-yellow-400',
    emblemText: 'PY',
    tagText: 'LEARNING',
    bgStart: '#2563EB',
    bgEnd: '#FACC15',
    fg: '#FFFFFF',
    symbol: 'PY',
  },
  {
    key: 'java',
    patterns: [/\bjava\b/i],
    headerGradient: 'from-orange-500 to-amber-500',
    emblemGradient: 'from-orange-500 to-amber-500',
    emblemText: 'JAVA',
    tagText: 'BACKEND',
    bgStart: '#EA580C',
    bgEnd: '#F59E0B',
    fg: '#FFFFFF',
    symbol: 'JAVA',
  },
  {
    key: 'c-plus-plus',
    patterns: [/\bc\+\+\b/i],
    headerGradient: 'from-blue-600 to-indigo-600',
    emblemGradient: 'from-blue-600 to-indigo-600',
    emblemText: 'C++',
    tagText: 'SYSTEMS',
    bgStart: '#2563EB',
    bgEnd: '#4338CA',
    fg: '#FFFFFF',
    symbol: 'C++',
  },
  {
    key: 'c-language',
    patterns: [/\bc\b/i],
    headerGradient: 'from-slate-700 to-blue-700',
    emblemGradient: 'from-slate-700 to-blue-700',
    emblemText: 'C',
    tagText: 'CORE',
    bgStart: '#334155',
    bgEnd: '#1D4ED8',
    fg: '#FFFFFF',
    symbol: 'C',
  },
  {
    key: 'dsa',
    patterns: [/\bdsa\b/i, /data structures/i, /algorithms?/i, /leetcode/i],
    headerGradient: 'from-indigo-500 to-cyan-500',
    emblemGradient: 'from-indigo-500 to-cyan-500',
    emblemText: 'DSA',
    tagText: 'PROBLEM SOLVING',
    bgStart: '#4F46E5',
    bgEnd: '#06B6D4',
    fg: '#FFFFFF',
    symbol: 'DSA',
  },
  {
    key: 'machine-learning',
    patterns: [/machine learning/i, /\bml\b/i],
    headerGradient: 'from-violet-500 to-indigo-600',
    emblemGradient: 'from-violet-500 to-indigo-600',
    emblemText: 'ML',
    tagText: 'INTELLIGENCE',
    bgStart: '#7C3AED',
    bgEnd: '#4338CA',
    fg: '#FFFFFF',
    symbol: 'ML',
  },
  {
    key: 'ai',
    patterns: [/\bai\b/i, /artificial intelligence/i, /neural/i],
    headerGradient: 'from-purple-500 to-indigo-600',
    emblemGradient: 'from-purple-500 to-indigo-600',
    emblemText: 'AI',
    tagText: 'KNOWLEDGE',
    bgStart: '#6D28D9',
    bgEnd: '#3730A3',
    fg: '#FFFFFF',
    symbol: 'AI',
  },
  {
    key: 'web-development',
    patterns: [/web development/i, /web dev/i, /frontend/i, /backend/i, /full stack/i, /html/i, /css/i],
    headerGradient: 'from-indigo-500 to-cyan-500',
    emblemGradient: 'from-indigo-500 to-cyan-500',
    emblemText: '</>',
    tagText: 'EXCLUSIVE',
    bgStart: '#4F46E5',
    bgEnd: '#06B6D4',
    fg: '#FFFFFF',
    symbol: '</>',
  },
  {
    key: 'react',
    patterns: [/\breact\b/i],
    headerGradient: 'from-cyan-500 to-blue-500',
    emblemGradient: 'from-cyan-500 to-blue-500',
    emblemText: 'RE',
    tagText: 'FRONTEND',
    bgStart: '#06B6D4',
    bgEnd: '#3B82F6',
    fg: '#FFFFFF',
    symbol: 'RE',
  },
  {
    key: 'node',
    patterns: [/\bnode\b/i, /node\.js/i],
    headerGradient: 'from-emerald-500 to-lime-500',
    emblemGradient: 'from-emerald-500 to-lime-500',
    emblemText: 'ND',
    tagText: 'SERVER',
    bgStart: '#10B981',
    bgEnd: '#84CC16',
    fg: '#FFFFFF',
    symbol: 'ND',
  },
  {
    key: 'cyber-security',
    patterns: [/cyber\s*security/i, /cybersecurity/i, /security/i],
    headerGradient: 'from-slate-800 to-slate-600',
    emblemGradient: 'from-slate-800 to-slate-600',
    emblemText: 'SEC',
    tagText: 'PROTECTION',
    bgStart: '#0F172A',
    bgEnd: '#475569',
    fg: '#FFFFFF',
    symbol: 'SEC',
  },
  {
    key: 'cloud',
    patterns: [/\bcloud\b/i],
    headerGradient: 'from-sky-500 to-blue-600',
    emblemGradient: 'from-sky-500 to-blue-600',
    emblemText: 'CLD',
    tagText: 'SCALABLE',
    bgStart: '#0EA5E9',
    bgEnd: '#2563EB',
    fg: '#FFFFFF',
    symbol: 'CLD',
  },
  {
    key: 'devops',
    patterns: [/\bdevops\b/i],
    headerGradient: 'from-orange-500 to-red-500',
    emblemGradient: 'from-orange-500 to-red-500',
    emblemText: 'OPS',
    tagText: 'PIPELINE',
    bgStart: '#F97316',
    bgEnd: '#EF4444',
    fg: '#FFFFFF',
    symbol: 'OPS',
  },
  {
    key: 'mobile-development',
    patterns: [/mobile development/i, /android/i, /ios/i],
    headerGradient: 'from-teal-500 to-emerald-500',
    emblemGradient: 'from-teal-500 to-emerald-500',
    emblemText: 'APP',
    tagText: 'MOBILE',
    bgStart: '#14B8A6',
    bgEnd: '#10B981',
    fg: '#FFFFFF',
    symbol: 'APP',
  },
  {
    key: 'game-development',
    patterns: [/game development/i, /game dev/i, /gaming/i],
    headerGradient: 'from-fuchsia-500 to-violet-600',
    emblemGradient: 'from-fuchsia-500 to-violet-600',
    emblemText: 'GM',
    tagText: 'CREATIVE',
    bgStart: '#D946EF',
    bgEnd: '#7C3AED',
    fg: '#FFFFFF',
    symbol: 'GM',
  },
  {
    key: 'ui-ux',
    patterns: [/ui\s*\/\s*ux/i, /ui ux/i, /\bux\b/i],
    headerGradient: 'from-pink-500 to-rose-500',
    emblemGradient: 'from-pink-500 to-rose-500',
    emblemText: 'UX',
    tagText: 'DESIGN',
    bgStart: '#EC4899',
    bgEnd: '#F43F5E',
    fg: '#FFFFFF',
    symbol: 'UX',
  },
  {
    key: 'data-science',
    patterns: [/data science/i, /analytics/i],
    headerGradient: 'from-blue-500 to-violet-500',
    emblemGradient: 'from-blue-500 to-violet-500',
    emblemText: 'DS',
    tagText: 'INSIGHTS',
    bgStart: '#3B82F6',
    bgEnd: '#8B5CF6',
    fg: '#FFFFFF',
    symbol: 'DS',
  },
  {
    key: 'general',
    patterns: [/\bgeneral\b/i],
    headerGradient: 'from-slate-500 to-gray-600',
    emblemGradient: 'from-slate-500 to-gray-600',
    emblemText: 'GEN',
    tagText: 'COMMUNITY',
    bgStart: '#64748B',
    bgEnd: '#6B7280',
    fg: '#FFFFFF',
    symbol: 'GEN',
  },
]

const DEFAULT_THEME = {
  key: 'fallback',
  headerGradient: 'from-purple-500 to-pink-500',
  emblemGradient: 'from-purple-500 to-pink-500',
  emblemText: 'GRP',
  tagText: 'GROUP',
  bgStart: '#8B5CF6',
  bgEnd: '#EC4899',
  fg: '#FFFFFF',
  symbol: 'GRP',
}

export const SKILL_CATEGORIES = [
  'All Skills',
  'JavaScript',
  'Python',
  'Java',
  'C',
  'C++',
  'DSA',
  'Machine Learning',
  'AI',
  'Web Development',
  'Frontend',
  'Backend',
  'Full Stack',
  'React',
  'Node',
  'Cyber Security',
  'Cloud',
  'DevOps',
  'Mobile Development',
  'Game Development',
  'UI/UX',
  'Data Science',
  'General',
]

const escapeXml = (text) => {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

const getTopicInitials = (topic) => {
  const cleaned = String(topic || 'General').trim()
  if (!cleaned) return 'GEN'

  const words = cleaned.split(/\s+/).filter(Boolean)
  if (words.length === 1) {
    return words[0].slice(0, 3).toUpperCase()
  }

  return words.slice(0, 3).map((w) => w[0]).join('').toUpperCase()
}

const buildCoverSvg = ({ label, symbol, bgStart, bgEnd, fg }) => {
  const safeLabel = escapeXml(label)
  const safeSymbol = escapeXml(symbol)

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 240" width="600" height="240" role="img" aria-label="${safeLabel} group cover">
  <defs>
    <linearGradient id="coverGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${bgStart}"/>
      <stop offset="100%" stop-color="${bgEnd}"/>
    </linearGradient>
  </defs>
  <rect width="600" height="240" fill="url(#coverGrad)"/>
  <circle cx="530" cy="-10" r="120" fill="rgba(255,255,255,0.12)"/>
  <circle cx="40" cy="250" r="90" fill="rgba(255,255,255,0.10)"/>
  <text x="32" y="70" font-size="56" font-weight="800" font-family="Inter, Arial, sans-serif" fill="${fg}" opacity="0.92">${safeSymbol}</text>
  <text x="32" y="212" font-size="26" font-weight="700" font-family="Inter, Arial, sans-serif" fill="${fg}" opacity="0.95">${safeLabel}</text>
</svg>`
}

const getThemeForText = (text) => {
  for (const theme of TOPIC_THEMES) {
    if (theme.patterns.some((pattern) => pattern.test(text))) {
      return theme
    }
  }
  return DEFAULT_THEME
}

export const getGroupVisualTheme = (group) => {
  const topic = [group?.skillCategory, group?.name, group?.description].filter(Boolean).join(' ').trim()
  const lowered = topic.toLowerCase()
  const matchedTheme = getThemeForText(lowered)

  const fallbackInitials = getTopicInitials(group?.skillCategory || group?.name || 'General')
  const symbol = matchedTheme === DEFAULT_THEME ? fallbackInitials : matchedTheme.symbol
  const emblemText = matchedTheme === DEFAULT_THEME ? fallbackInitials : matchedTheme.emblemText

  const svg = buildCoverSvg({
    label: group?.skillCategory || group?.name || 'General',
    symbol,
    bgStart: matchedTheme.bgStart,
    bgEnd: matchedTheme.bgEnd,
    fg: matchedTheme.fg,
  })

  return {
    headerGradient: matchedTheme.headerGradient,
    emblemGradient: matchedTheme.emblemGradient,
    emblemText,
    tagText: matchedTheme.tagText,
    coverSrc: `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`,
  }
}

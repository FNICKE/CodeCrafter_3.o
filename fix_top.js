const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'frontend/src/pages/Recommendations.jsx');
let content = fs.readFileSync(file, 'utf8');

const insert = `import { useState, useEffect, useRef, useMemo } from 'react';
import API, { apiGetStockSummary, apiGetStockSymbols, apiGetWatchlist } from '../api';
import {
  TrendingUp, TrendingDown, ExternalLink, Search,
  ShieldCheck, ShieldX, Minus, ChevronDown, ChevronUp,
  Zap, BarChart2, Newspaper, RefreshCw, Info, Sparkles, Clock as ClockIcon, Shield
} from 'lucide-react';

const CSS = \`
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Mono:wght@400;500&family=Instrument+Sans:wght@400;500;600;700&display=swap');
`;

let newContent = content.replace(/^.*\.sp-root\s*\{/s, insert + "\n  .sp-root {");
fs.writeFileSync(file, newContent, 'utf8');
console.log("Fixed top of file!");

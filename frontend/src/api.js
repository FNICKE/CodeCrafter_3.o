import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000/api',
  timeout: 12000,
});

// JWT Token Interceptor
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('hacktrix_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for auth errors
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('hacktrix_token');
    }
    return Promise.reject(error);
  }
);

// ── Simple in-memory response cache for GET requests ─────────────────────────
// Prevents hammering the backend when user navigates between pages quickly.
// Each cache entry stores { data, ts } where ts = timestamp of last fetch.
const _clientCache = new Map();

/**
 * Cached GET wrapper. Use for expensive read-only endpoints.
 * @param {string} url - relative URL (e.g. '/market/watchlist')
 * @param {object} params - query params object
 * @param {number} ttlMs - how long to cache (ms). Default: 2 minutes.
 */
function cachedGet(url, params = {}, ttlMs = 2 * 60 * 1000) {
  const key = url + JSON.stringify(params);
  const hit = _clientCache.get(key);
  if (hit && Date.now() - hit.ts < ttlMs) {
    return Promise.resolve(hit.data);
  }
  return API.get(url, { params }).then((res) => {
    _clientCache.set(key, { data: res, ts: Date.now() });
    return res;
  });
}

// Clear client cache entry (call after mutations if needed)
export function invalidateClientCache(urlPrefix) {
  for (const key of _clientCache.keys()) {
    if (key.startsWith(urlPrefix)) _clientCache.delete(key);
  }
}

// ====================== AUTH ======================
export const registerUser = (data) => API.post('/auth/register', data);
export const loginUser    = (data) => API.post('/auth/login', data);
export const getProfile   = ()     => API.get('/auth/profile');


export const listResearchDocs = () => API.get('/research-docs');
export const addResearchNote = (data) => API.post('/research-docs/note', data);
export const uploadResearchDoc = (formData) =>
  API.post('/research-docs/upload', formData, { timeout: 60000 });
export const deleteResearchDoc = (id) => API.delete(`/research-docs/${id}`);

//export const getRegulatoryFilings = (params) => API.get('/regulatory/filings', { params });

// ====================== PORTFOLIO ======================
export const getPortfolios = () => API.get('/portfolio');
export const createPortfolio = (data) => API.post('/portfolio', data);
export const getHoldings = (id) => API.get(`/portfolio/${id}/holdings`);
export const addHolding = (id, data) => API.post(`/portfolio/${id}/holdings`, data);
export const updateHolding = (portfolioId, holdingId, data) =>
  API.put(`/portfolio/${portfolioId}/holdings/${holdingId}`, data);
export const deleteHolding = (portfolioId, holdingId) =>
  API.delete(`/portfolio/${portfolioId}/holdings/${holdingId}`);
export const deletePortfolio = (id) => API.delete(`/portfolio/${id}`);

// ====================== RESEARCH ======================
export const getNews = (params) =>
  API.get('/research/news', {
    params,
    timeout: params?.ticker ? 20000 : 30000,
  });
export const getMarketSentiment = () =>
  cachedGet('/research/market-sentiment', {}, 5 * 60 * 1000);
export const getSectorPerformance = () =>
  cachedGet('/research/sector-performance', {}, 10 * 60 * 1000);
export const getAssets = () => API.get('/research/assets');
export const getAssetByTicker = (ticker) =>
  cachedGet(`/research/assets/${ticker}`, {}, 5 * 60 * 1000);

/** Fast initial load: no news. Use newsLimit > 0 if you need news (slower). */
export const getCompaniesWithNews = (params) =>
  cachedGet('/research/companies-overview', params || { newsLimit: 0 }, 5 * 60 * 1000);

// ====================== MARKET ======================
export const getQuote = (symbol) =>
  cachedGet(`/market/quote/${symbol}`, {}, 2 * 60 * 1000);
export const getCandles = (symbol, params) =>
  API.get(`/market/candles/${symbol}`, { params, timeout: 15000 });
export const getWatchlist = () =>
  cachedGet('/market/watchlist', {}, 2 * 60 * 1000);
export const searchSymbol = (q) => API.get('/market/search', { params: { q } });
export const searchStocks = (q) => API.get('/market/search', { params: { q } });
export const getCryptoPrices = () =>
  cachedGet('/market/crypto', {}, 2 * 60 * 1000);

// ====================== STOCKS & RECOMMENDATIONS ======================
export const getStock = (symbol) => API.get(`/stocks/${symbol}`);
export const getRecommendations = (data) =>
  API.post('/recommendations', data, { timeout: 60000 });
export const getTopStocks = (budget) =>
  cachedGet('/recommendations/top', { budget }, 5 * 60 * 1000);

// ====================== ALERTS ======================
export const getAlerts = () => API.get('/alerts');
export const createAlert = (data) => API.post('/alerts', data);
export const deleteAlert = (id) => API.delete(`/alerts/${id}`);
export const toggleAlert = (id) => API.put(`/alerts/${id}/toggle`);

export const sendChatMessage = (messages) =>
  API.post('/chat', { messages }, { timeout: 30000 });

export const getRegulatoryFilings = (params) =>
  API.get('/regulatory/filings', { params });

// ====================== AI ADVISOR ======================
export const getAIPrediction = (data) =>
  API.post('/ai/predict', data, { timeout: 60000 });
export const getQuickStockAdvice = (data) =>
  API.post('/ai/quick-advice', data, { timeout: 30000 });
export const getPortfolioBuilder = (data) =>
  API.post('/ai/portfolio', data, { timeout: 45000 });
export const getSIPCalculator = (data) =>
  API.post('/ai/sip', data, { timeout: 30000 });
export const getLiquidStrategy = (data) =>
  API.post('/ai/liquid', data, { timeout: 30000 });

export const getStockSummary = (symbol) =>
  API.get(`/summary/${encodeURIComponent(symbol)}`, { timeout: 45000 });


export const getStockSymbols = (params) =>
  cachedGet('/market/symbols', params || {}, 6 * 60 * 60 * 1000); // 6h cache



export default API;
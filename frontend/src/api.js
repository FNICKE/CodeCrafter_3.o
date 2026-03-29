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

// ====================== AUTH ======================
export const registerUser = (data) => API.post('/auth/register', data);
export const loginUser = (data) => API.post('/auth/login', data);
export const getProfile = () => API.get('/auth/profile');

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
    timeout: params?.category === 'all' ? 60000 : 15000,
  });
export const getMarketSentiment = () => API.get('/research/market-sentiment');
export const getSectorPerformance = () => API.get('/research/sector-performance');   // ← Added
export const getAssets = () => API.get('/research/assets');
export const getAssetByTicker = (ticker) => API.get(`/research/assets/${ticker}`);
/** All POPULAR_TICKERS with quote + profile + optional news. Use newsLimit: 0 for dropdown index only (no news fetch). */
export const getCompaniesWithNews = (params) =>
  API.get('/research/companies-overview', { params, timeout: 90000 });

// ====================== MARKET ======================
export const getQuote = (symbol) => API.get(`/market/quote/${symbol}`);
export const getCandles = (symbol, params) => API.get(`/market/candles/${symbol}`, { params });
export const getWatchlist = () => API.get('/market/watchlist');
export const searchSymbol = (q) => API.get('/market/search', { params: { q } });
export const searchStocks = (q) => API.get('/market/search', { params: { q } });
export const getCryptoPrices = () => API.get('/market/crypto');

// ====================== STOCKS & RECOMMENDATIONS ======================
export const getStock = (symbol) => API.get(`/stocks/${symbol}`);
export const getRecommendations = (data) => API.post('/recommendations', data);
export const getTopStocks = (budget) => API.get(`/recommendations/top`, { params: { budget } });

// ====================== ALERTS ======================
export const getAlerts = () => API.get('/alerts');
export const createAlert = (data) => API.post('/alerts', data);
export const deleteAlert = (id) => API.delete(`/alerts/${id}`);
export const toggleAlert = (id) => API.put(`/alerts/${id}/toggle`);

export const sendChatMessage = (messages) => API.post('/chat', { messages }, { timeout: 30000 });

export const getRegulatoryFilings = (params) => API.get('/regulatory/filings', { params });
// ====================== AI ADVISOR ======================
// Enhanced with all new endpoints
export const getAIPrediction = (data) => 
  API.post('/ai/predict', data, { timeout: 30000 });

export const getQuickStockAdvice = (data) => 
  API.post('/ai/quick-advice', data, { timeout: 15000 });

export const getPortfolioBuilder = (data) => 
  API.post('/ai/portfolio', data, { timeout: 25000 });

export const getSIPCalculator = (data) => 
  API.post('/ai/sip', data, { timeout: 20000 });

export const getLiquidStrategy = (data) => 
  API.post('/ai/liquid', data, { timeout: 15000 });


export default API;
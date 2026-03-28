  import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000/api',
});

// Attach JWT token to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('hacktrix_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auth
export const registerUser = (data) => API.post('/auth/register', data);
export const loginUser = (data) => API.post('/auth/login', data);
export const getProfile = () => API.get('/auth/profile');

// Portfolio
export const getPortfolios = () => API.get('/portfolio');
export const createPortfolio = (data) => API.post('/portfolio', data);
export const getHoldings = (id) => API.get(`/portfolio/${id}/holdings`);
export const addHolding = (id, data) => API.post(`/portfolio/${id}/holdings`, data);
export const deletePortfolio = (id) => API.delete(`/portfolio/${id}`);

// Research
export const getAssets = () => API.get('/research/assets');
export const getAssetByTicker = (ticker) => API.get(`/research/assets/${ticker}`);
export const getNews = (params) => API.get('/research/news', { params });
export const getMarketSentiment = () => API.get('/research/market-sentiment');
export const getSectorPerformance = () => API.get('/research/sector-performance');

// Market
export const getQuote = (symbol) => API.get(`/market/quote/${symbol}`);
export const getCandles = (symbol, params) => API.get(`/market/candles/${symbol}`, { params });
export const getWatchlist = () => API.get('/market/watchlist');
export const searchSymbol = (q) => API.get('/market/search', { params: { q } });
export const getCryptoPrices = () => API.get('/market/crypto');

// New Services
export const getStock = (symbol) => API.get(`/stocks/${symbol}`);
export const getRecommendations = (data) => API.post('/recommendations', data);

// Alerts
export const getAlerts = () => API.get('/alerts');
export const createAlert = (data) => API.post('/alerts', data);
export const deleteAlert = (id) => API.delete(`/alerts/${id}`);
export const toggleAlert = (id) => API.put(`/alerts/${id}/toggle`);

export default API;

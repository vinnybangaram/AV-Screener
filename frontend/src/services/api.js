import axios from 'axios';
import toast from 'react-hot-toast';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";
console.log("🌐 [API] Base URL:", API_BASE_URL);

// ── AXIOS INSTANCE ──
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// ── AUTH INTERCEPTOR (Request) ──
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => Promise.reject(error));

// ── AUTH INTERCEPTOR (Response) ──
api.interceptors.response.use(
    (response) => response.data,
    (error) => {
        const isAuthEndpoint = error.config?.url?.includes('/auth/');
        if (error.response?.status === 401 && !isAuthEndpoint) {
            console.error("🔑 [Auth] Session expired or invalid. Redirecting to login...");
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            // Force redirect if we are not already on the login page
            if (!window.location.pathname.includes('/login')) {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

/**
 * Institutional Dashboard API
 */
export const fetchDashboard = async (category = 'All', timeframe = 'This Month') => {
    try {
        const url = `/dashboard?category=${category}&timeframe=${timeframe}`;
        return await api.get(url);
    } catch (error) {
        console.error("fetchDashboard error:", error);
        throw error;
    }
};

/**
 * Authentication
 */
export const googleLogin = async (credential) => {
    return await api.post('/auth/google', { token: credential });
};

export const manualLogin = async (username_or_email, password) => {
    return await api.post('/auth/login', { username_or_email, password });
};

export const signupUser = async (signupData) => {
    return await api.post('/auth/signup', signupData);
};

export const verifyEmail = async (token) => {
    return await api.post('/auth/verify-email', { token });
};

/**
 * Market/Stock APIs
 */
export const fetchMultibaggers = async (refresh = false) => {
    try {
        const result = await api.get(`/multibagger/${refresh ? '?refresh=true' : ''}`);
        if (result.success) {
            // Map to camelCase expected by Multibaggers.tsx
            const mappedData = result.data.map(d => ({
                ...d,
                symbol: d.ticker,
                ticker: d.ticker ? d.ticker.replace('.NS', '').replace('.BO', '') : 'UNKNOWN',
                currentPrice: d.current_price,
                classification: d.signal_classification,
                confidence: d.score,
                confidence_level: d.score, // Frontend uses this for toFixed(0)
                breakdown: {
                    momentum: { achieved: d.scores_breakdown?.momentum_score || 0 },
                    structure: { achieved: d.scores_breakdown?.volume_score || 0 },
                    aiQuality: { achieved: d.scores_breakdown?.fundamental_score || 0 },
                    risk: { achieved: d.scores_breakdown?.risk_score || 0 }
                }
            }));
            return { success: true, data: mappedData };
        }
        return result;
    } catch (error) {
        console.error("Error in fetchMultibaggers:", error);
        return { success: false, error: error.message };
    }
};

export const fetchScreenerResults = async (filters = {}) => {
    try {
        const params = new URLSearchParams();
        if (filters.marketCap) params.append('market_cap', filters.marketCap);
        if (filters.sector) params.append('sector', filters.sector);
        if (filters.peRange) {
            params.append('pe_min', filters.peRange[0]);
            params.append('pe_max', filters.peRange[1]);
        }
        if (filters.roeMin) params.append('roe_min', filters.roeMin[0]);
        if (filters.rsiRange) {
            params.append('rsi_min', filters.rsiRange[0]);
            params.append('rsi_max', filters.rsiRange[1]);
        }
        if (filters.aiScoreMin) params.append('score_min', filters.aiScoreMin[0]);
        if (filters.riskLevel) params.append('risk_level', filters.riskLevel);

        return await api.get(`/market/screener?${params.toString()}`);
    } catch (error) {
        console.error("fetchScreenerResults error:", error);
        return { success: false, error: error.message };
    }
};

export const fetchStockAnalysis = async (symbol, period = "1y") => {
    try {
        const result = await api.get(`/analyse-stock?symbol=${symbol}&period=${period}`);
        if (result.success) {
            const { analysis, ai_insights, scores, forecasts, price_targets } = result.data;
            return {
                success: true,
                analysis: {
                    ...analysis,
                    ticker: (analysis.ticker || "").replace('.NS', '').replace('.BO', ''),
                    change_pct: analysis.change_pct || 0,
                },
                scores: scores,
                ai_insights: ai_insights,
                forecasts: forecasts,
                price_targets: price_targets
            };
        }
        return null;
    } catch (error) {
        console.error("Error in fetchStockAnalysis:", error);
        return null;
    }
};

export const fetchAiStatus = async () => {
    return await api.get('/ai-status');
};

export const searchTickers = async (query) => {
    return await api.get(`/analyse-stock/search?q=${query}`);
};

export const fetchPennyStorm = async (refresh = false) => {
    try {
        const result = await api.get(`/penny-storm/scan${refresh ? '?refresh=true' : ''}`);
        if (result.success) {
            // Map backend names (verdict, price, score) to frontend names (storm_status, currentPrice, confidence)
            const mappedData = (result.data || []).map(d => ({
                ...d,
                symbol: d.ticker,
                ticker: d.ticker,
                currentPrice: d.price,
                storm_status: d.verdict === "STORM READY" ? "STORM_READY" : d.verdict,
                confidence: d.score,
                confidence_level: d.score 
            }));
            return { success: true, data: mappedData };
        }
        return result;
    } catch (error) {
        console.error("Error in fetchPennyStorm:", error);
        return { success: false, error: error.message };
    }
};

export const fetchIntraday = async (refresh = false) => {
    try {
        const result = await api.get(`/intraday/scan${refresh ? '?refresh=true' : ''}`);
        if (result.success) {
            // Backend returns {longs: [], shorts: []}. Flatten and map for Intraday.tsx
            const longs = (result.data.longs || []).map(d => ({ 
                ...d, 
                side: 'LONG', 
                symbol: d.ticker, 
                change_pct: d.gap_pct,
                price: d.price,
                score: d.score
            }));
            const shorts = (result.data.shorts || []).map(d => ({ 
                ...d, 
                side: 'SHORT', 
                symbol: d.ticker, 
                change_pct: d.gap_pct,
                price: d.price,
                score: d.score
            }));
            return { success: true, data: [...longs, ...shorts] };
        }
        return result;
    } catch (error) {
        console.error("Error in fetchIntraday:", error);
        return { success: false, error: error.message };
    }
};

/**
 * Watchlist API
 */
export const fetchWatchlist = async () => {
    return await api.get('/watchlist');
};

export const addToWatchlist = async (data) => {
    return await api.post('/watchlist/add', data);
};

export const updateWatchlist = async (watchlistId, data) => {
    return await api.put(`/watchlist/update?watchlist_id=${watchlistId}`, data);
};

export const removeFromWatchlist = async (watchlistId) => {
    return await api.post(`/watchlist/remove?watchlist_id=${watchlistId}`);
};

export const fetchTopMovers = async () => {
    return await api.get('/market/top-movers');
};

export const fetchDashboardMetrics = async (category = 'All') => {
    return await api.get(`/dashboard/metrics?category=${category}`);
};

/**
 * Admin APIs
 */
export const fetchAdminAnalytics = async () => {
    return await api.get('/admin/analytics');
};

export const sendBroadcast = async (title, message, group = 'all') => {
    return await api.post(`/admin/notify?title=${title}&message=${message}&group=${group}`);
};

export const fetchMarketContext = async () => {
    return await api.get('/market/context');
};

export const fetchMarketIndices = async () => {
    return await api.get('/market/indices');
};

export const fetchMarketRegime = async () => {
    return await api.get('/market/regime/current');
};

export const fetchRegimeHistory = async (days = 30) => {
    return await api.get(`/market/regime/history?days=${days}`);
};

export const fetchStockConviction = async (symbol) => {
    return await api.get(`/stocks/conviction/${symbol}`);
};

export const fetchTopConviction = async (limit = 20) => {
    return await api.get(`/stocks/conviction/top?limit=${limit}`);
};

/**
 * Portfolio Health & Risk Engine
 */
export const fetchPortfolioHealth = async () => {
    return await api.get('/portfolio/health');
};

export const fetchHealthHistory = async (days = 90) => {
    return await api.get(`/portfolio/health/history?days=${days}`);
};


export const fetchNotifications = async (userId) => {
    return await api.get(`/notifications?user_id=${userId}`);
};

export const markNotificationRead = async (userId, notificationId) => {
    return await api.post(`/notifications/mark-read?user_id=${userId}&notification_id=${notificationId}`);
};



/**
 * AI Chat Analyst API
 */
export const askAnalyst = async (symbol, question) => {
    try {
        return await api.post('/chat/ask', { symbol, question });
    } catch (error) {
        console.error("askAnalyst error:", error);
        throw error;
    }
};

export const fetchChatHistory = async (symbol = null) => {
    try {
        const url = symbol ? `/chat/history?symbol=${symbol}` : '/chat/history';
        return await api.get(url);
    } catch (error) {
        console.error("fetchChatHistory error:", error);
        throw error;
    }
};

export const fetchForecast = async (symbol, horizon) => {
    try {
        return await api.get(`/forecast/${symbol}?horizon=${horizon}`);
    } catch (error) {
        console.error("fetchForecast error:", error);
        throw error;
    }
};


export const fetchConfluence = async (symbol) => {
    try {
        return await api.get('/confluence/' + symbol);
    } catch (error) {
        console.error("fetchConfluence error:", error);
        throw error;
    }
};


export const fetchTradeSetup = async (symbol) => {
    try {
        return await api.get('/trade-setup/' + symbol);
    } catch (error) {
        console.error("fetchTradeSetup error:", error);
        throw error;
    }
};


export const fetchPriceTargets = async (symbol) => {
    try {
        return await api.get('/price-target/' + symbol);
    } catch (error) {
        console.error("fetchPriceTargets error:", error);
        throw error;
    }
};


export const fetchAlerts = async () => {
    try {
        return await api.get('/alerts');
    } catch (error) {
        console.error("fetchAlerts error:", error);
        throw error;
    }
};

export const fetchUnreadAlertCount = async () => {
    try {
        return await api.get('/alerts/unread-count');
    } catch (error) {
        console.error("fetchUnreadAlertCount error:", error);
        throw error;
    }
};

export const markAlertRead = async (id) => {
    try {
        return await api.post('/alerts/read/' + id);
    } catch (error) {
        console.error("markAlertRead error:", error);
        throw error;
    }
};

export const markAllAlertsRead = async () => {
    try {
        return await api.post('/alerts/read-all');
    } catch (error) {
        console.error("markAllAlertsRead error:", error);
        throw error;
    }
};


export const submitFeedback = async (data) => {
    try {
        return await api.post('/feedback', data);
    } catch (error) {
        console.error("submitFeedback error:", error);
        throw error;
    }
};

export const fetchComments = async (symbol) => {
    try {
        return await api.get('/comments/' + symbol);
    } catch (error) {
        console.error("fetchComments error:", error);
        throw error;
    }
};

export const postComment = async (symbol, message) => {
    try {
        return await api.post('/comments/' + symbol, { message });
    } catch (error) {
        console.error("postComment error:", error);
        throw error;
    }
};

export const likeComment = async (id) => {
    try {
        return await api.post('/comments/' + id + '/like');
    } catch (error) {
        console.error("likeComment error:", error);
        throw error;
    }
};

export const trackShare = async (symbol, platform) => {
    try {
        return await api.post('/share/track', { symbol, platform });
    } catch (error) {
        console.error("trackShare error:", error);
        throw error;
    }
};

/**
 * Option Signals API
 */
export const fetchOptionSignalsDashboard = async (userId = null) => {
    const url = userId ? `/option-signals/dashboard?user_id=${userId}` : '/option-signals/dashboard';
    return await api.get(url);
};

export const fetchOptionSignalsSettings = async (userId = null) => {
    const url = userId ? `/option-signals/settings?user_id=${userId}` : '/option-signals/settings';
    return await api.get(url);
};

export const updateOptionSignalsSettings = async (settings, userId = null) => {
    const url = userId ? `/option-signals/settings?user_id=${userId}` : '/option-signals/settings';
    return await api.post(url, settings);
};

export const forceOptionSignalsSync = async () => {
    return await api.post('/option-signals/force-sync');
};

export const fetchOptionSignalsStats = async (days = 30, fromDate = null, toDate = null, userId = null) => {
    let url = `/option-signals/stats?days=${days}`;
    if (fromDate) url += `&from_date=${fromDate}`;
    if (toDate) url += `&to_date=${toDate}`;
    if (userId) url += `&user_id=${userId}`;
    return await api.get(url);
};

export const exportOptionSignalsTrades = async (userId = null) => {
    const url = userId ? `/option-signals/export?user_id=${userId}` : '/option-signals/export';
    // Use window.location for direct download
    window.location.href = `${API_BASE_URL}${url}`;
};

export const fetchMarketTicker = async () => {
    return await api.get('/market/ticker');
};

/**
 * Portfolio Management APIs
 */
export const fetchPortfolioSummary = async () => {
    return await api.get('/portfolio/summary');
};

export const addPortfolioHolding = async (data) => {
    return await api.post('/portfolio/holdings', data);
};

export const updatePortfolioHolding = async (id, data) => {
    return await api.patch(`/portfolio/holdings/${id}`, data);
};

export const removePortfolioHolding = async (id) => {
    return await api.delete(`/portfolio/holdings/${id}`);
};

/**
 * Backtesting API
 */
export const runBacktest = async (data) => {
    return await api.post('/backtest/run', data);
};

export const saveBacktest = async (data) => {
    return await api.post('/backtest/save', data);
};

export const fetchBacktestHistory = async () => {
    return await api.get('/backtest/history');
};

/**
 * Investor Reports API
 */
export const fetchReports = async () => {
    return await api.get('/reports/');
};

export const generateReport = async (data) => {
    return await api.post('/reports/generate', data);
};

export const deleteReport = async (id) => {
    return await api.delete(`/reports/${id}`);
};

/**
 * Upstox Integration APIs
 */
export const fetchUpstoxLoginUrl = async () => {
    return await api.get('/upstox/login');
};

export const submitUpstoxCallback = async (code) => {
    return await api.post('/upstox/callback', { code });
};

export const fetchUpstoxProfile = async () => {
    return await api.get('/upstox/profile');
};

export const fetchUpstoxQuote = async (symbol) => {
    return await api.get(`/upstox/quote?symbol=${symbol}`);
};

export const fetchUpstoxOptions = async (symbol, expiryDate = null) => {
    const url = expiryDate ? `/upstox/options?symbol=${symbol}&expiry_date=${expiryDate}` : `/upstox/options?symbol=${symbol}`;
    return await api.get(url);
};

export const disconnectUpstox = async () => {
    return await api.post('/upstox/disconnect');
};






/**
 * News & Sentiment API
 */
export const fetchGeneralNews = async () => {
    try {
        return await api.get('/news/');
    } catch (error) {
        console.error("fetchGeneralNews error:", error);
        throw error;
    }
};

export const fetchStockNews = async (symbol) => {
    try {
        return await api.get(`/news/${symbol}`);
    } catch (error) {
        console.error("fetchStockNews error:", error);
        throw error;
    }
};

export const fetchSectorSentiment = async () => {
    try {
        return await api.get('/news/sectors');
    } catch (error) {
        console.error("fetchSectorSentiment error:", error);
        throw error;
    }
};


export default api;



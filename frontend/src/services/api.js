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
export const fetchDashboard = async () => {
    try {
        return await api.get('/dashboard/');
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

export const manualLogin = async (username, email) => {
    return await api.post('/auth/manual', { username, email });
};

/**
 * Market/Stock APIs
 */
export const fetchMultibaggers = async (refresh = false) => {
    try {
        const result = await api.get(`/multibagger/${refresh ? '?refresh=true' : ''}`);
        if (result.success) {
            // Map to camelCase expected by Multibagger.jsx and StockCard.jsx
            const mappedData = result.data.map(d => ({
                ...d,
                symbol: d.ticker,
                ticker: d.ticker ? d.ticker.replace('.NS', '').replace('.BO', '') : 'UNKNOWN',
                currentPrice: d.current_price,
                classification: d.signal_classification,
                confidence: d.confidence_level,
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

export const fetchScreenerResults = fetchMultibaggers;

export const fetchStockAnalysis = async (symbol) => {
    try {
        const result = await api.get(`/analyse-stock?symbol=${symbol}`);
        if (result.success) {
            const { analysis, ai_insights, scores } = result.data;
            return {
                success: true,
                analysis: {
                    ...analysis,
                    ticker: analysis.ticker.replace('.NS', '').replace('.BO', ''),
                    change_pct: analysis.change_pct || 0,
                },
                scores: scores,
                ai_insights: ai_insights
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
    return await api.get(`/penny-storm/scan${refresh ? '?refresh=true' : ''}`);
};

export const fetchIntraday = async (refresh = false) => {
    return await api.get(`/intraday/scan${refresh ? '?refresh=true' : ''}`);
};

/**
 * Watchlist API
 */
export const fetchWatchlist = async (userId) => {
    return await api.get(`/watchlist?user_id=${userId}`);
};

export const addToWatchlist = async (userId, data) => {
    return await api.post(`/watchlist/add?user_id=${userId}`, data);
};

export const updateWatchlist = async (userId, watchlistId, data) => {
    return await api.put(`/watchlist/update?user_id=${userId}&watchlist_id=${watchlistId}`, data);
};

export const removeFromWatchlist = async (userId, watchlistId) => {
    return await api.delete(`/watchlist/remove?user_id=${userId}&watchlist_id=${watchlistId}`);
};

export const fetchTopMovers = async () => {
    return await api.get('/market/top-movers');
};

export const fetchDashboardMetrics = async (userId) => {
    return await api.get(`/dashboard/metrics?user_id=${userId}`);
};

export const fetchMarketContext = async () => {
    return await api.get('/market/context');
};


export const fetchNotifications = async (userId) => {
    return await api.get(`/notifications?user_id=${userId}`);
};

export const markNotificationRead = async (userId, notificationId) => {
    return await api.post(`/notifications/mark-read?user_id=${userId}&notification_id=${notificationId}`);
};

export const fetchStockNews = async (symbol) => {
    return await api.get(`/news/${symbol}`);
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
        return await api.get(/confluence/ + symbol);
    } catch (error) {
        console.error("fetchConfluence error:", error);
        throw error;
    }
};


export const fetchTradeSetup = async (symbol) => {
    try {
        return await api.get(/trade-setup/ + symbol);
    } catch (error) {
        console.error("fetchTradeSetup error:", error);
        throw error;
    }
};


export const fetchPriceTargets = async (symbol) => {
    try {
        return await api.get(/price-target/ + symbol);
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

export default api;





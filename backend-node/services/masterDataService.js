const db = require('../db/client');
const cache = require('./cacheService');

class EliteMasterDataService {
    /**
     * Elite Fuzzy Search
     * Uses pg_trgm for partial/typo tolerance and TSVECTOR for ranking.
     */
    async search(query, limit = 30) {
        if (!query || query.trim().length < 2) return [];
        const q = query.trim().toUpperCase();
        
        // Check Cache
        const cacheKey = `search:${q}:${limit}`;
        const cached = await cache.get(cacheKey);
        if (cached) return cached;

        const sql = `
            SELECT 
                symbol, company_name, instrument_type, isin, exchange,
                ts_rank(search_vector, plainto_tsquery('english', $1)) as rank,
                similarity(symbol, $2) as sym_similarity
            FROM instruments
            WHERE 
                (search_vector @@ plainto_tsquery('english', $1) 
                 OR symbol % $2 
                 OR company_name % $1
                 OR symbol LIKE $3)
                AND is_active = TRUE
            ORDER BY 
                rank DESC, 
                sym_similarity DESC,
                CASE WHEN symbol LIKE $3 THEN 0 ELSE 1 END
            LIMIT $4;
        `;
        
        try {
            const { rows } = await db.query(sql, [query, q, `${q}%`, limit]);
            await cache.set(cacheKey, rows, 300); // Cache for 5 mins
            return rows;
        } catch (error) {
            console.error('❌ [EliteSearch] Error:', error);
            throw error;
        }
    }

    async getDashboardStats() {
        const cacheKey = 'stats:dashboard';
        const cached = await cache.get(cacheKey);
        if (cached) return cached;

        const sql = `
            SELECT 
                (SELECT COUNT(*) FROM instruments) as total,
                (SELECT COUNT(*) FROM instruments WHERE instrument_type = 'EQUITY') as equities,
                (SELECT COUNT(*) FROM instruments WHERE last_synced_at > NOW() - INTERVAL '24 hours') as synced_today,
                (SELECT started_at FROM sync_logs WHERE status = 'SUCCESS' ORDER BY started_at DESC LIMIT 1) as last_sync_time
        `;
        const { rows } = await db.query(sql);
        await cache.set(cacheKey, rows[0], 600); // Cache for 10 mins
        return rows[0];
    }

    async logAdminAction(userId, action, details, ip) {
        await db.query('INSERT INTO audit_logs (user_id, action, details, ip_address) VALUES ($1, $2, $3, $4)', 
            [userId, action, details, ip]);
    }

    async getPerformanceMetrics() {
        const sql = `
            SELECT 
                CAST(started_at AS DATE) as date,
                AVG(performance_ms) as avg_ms,
                SUM(records_processed) as volume
            FROM sync_logs
            WHERE status = 'SUCCESS'
            GROUP BY 1 ORDER BY 1 DESC LIMIT 14
        `;
        const { rows } = await db.query(sql);
        return rows;
    }
}

module.exports = new EliteMasterDataService();

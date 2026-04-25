const axios = require('axios');
const axiosRetry = require('axios-retry').default;
const { parse } = require('csv-parse/sync');
const db = require('../db/client');
const cache = require('./cacheService');

axiosRetry(axios, { 
    retries: 5, 
    retryDelay: axiosRetry.exponentialDelay,
    retryCondition: (error) => axiosRetry.isNetworkOrIdempotentRequestError(error) || error.code === 'ECONNABORTED'
});

class EliteImportEngine {
    constructor() {
        this.NSE_URLS = {
            EQUITY: 'https://archives.nseindia.com/content/equities/EQUITY_L.csv',
            SME: 'https://archives.nseindia.com/content/equities/SME_EQUITY_L.csv',
            ETF: 'https://archives.nseindia.com/content/equities/ETF_L.csv',
            SYMBOL_CHANGES: 'https://archives.nseindia.com/content/equities/symbolchange.csv'
        };
        this.HEADERS = { 'User-Agent': 'Mozilla/5.0' };
    }

    async syncAll(triggeredBy = 'SYSTEM') {
        const start = Date.now();
        const logId = await this.createSyncLog('FULL_SYNC');
        
        try {
            await this.createSnapshot(`Elite-Backup-${new Date().toISOString()}`);

            let totalProcessed = 0;
            for (const type of ['EQUITY', 'SME', 'ETF']) {
                totalProcessed += await this.processSegment(type);
            }

            await this.processSymbolChanges();
            await this.cleanupStaleData();
            
            // Invalidate Cache
            await cache.del('search:*');
            await cache.del('stats:dashboard');

            const duration = Date.now() - start;
            await this.completeSyncLog(logId, 'SUCCESS', totalProcessed, null, duration);
            await this.logAudit(triggeredBy, 'SYNC_COMPLETE', { processed: totalProcessed });
            
            return { success: true, processed: totalProcessed };
        } catch (error) {
            await this.completeSyncLog(logId, 'FAILED', 0, error.stack, Date.now() - start);
            await this.sendWebhookAlert(`🚨 Master Data Sync Failed: ${error.message}`);
            throw error;
        }
    }

    async processSegment(type) {
        const response = await axios.get(this.NSE_URLS[type], { headers: this.HEADERS });
        const records = parse(response.data, { columns: true, skip_empty_lines: true, trim: true });
        
        const client = await db.pool.connect();
        try {
            await client.query('BEGIN');
            for (const row of records) {
                const sym = row.SYMBOL || row.Symbol;
                if (!sym) continue;

                // Sector Enrichment (Basic logic, can be expanded with external API)
                const sector = row.industry || row.INDUSTRY || 'General';

                await client.query(`
                    INSERT INTO instruments (symbol, company_name, instrument_type, isin, series, sector, last_synced_at)
                    VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
                    ON CONFLICT (symbol) DO UPDATE SET
                        company_name = EXCLUDED.company_name,
                        sector = EXCLUDED.sector,
                        last_synced_at = CURRENT_TIMESTAMP,
                        is_active = TRUE;
                `, [sym, row.NAME_OF_COMPANY || row['NAME OF COMPANY'], type, row.ISIN_NUMBER || row.ISIN, row.SERIES || row.Series, sector]);
            }
            await client.query('COMMIT');
            return records.length;
        } finally { client.release(); }
    }

    async processSymbolChanges() {
        try {
            const res = await axios.get(this.NSE_URLS.SYMBOL_CHANGES, { headers: this.HEADERS });
            const records = parse(res.data, { columns: true, skip_empty_lines: true, trim: true });

            for (const row of records) {
                const oldSym = row['SM_OLD_SYMBOL'];
                const newSym = row['SM_NEW_SYMBOL'];
                if (!oldSym || !newSym) continue;

                // 1. Update Instrument
                await db.query(`
                    UPDATE instruments SET symbol = $1, old_symbols = array_append(old_symbols, $2)
                    WHERE symbol = $2;
                `, [newSym, oldSym]);

                // 2. Elite Feature: Watchlist Migration
                // Assuming watchlists are in a table 'watchlists' with 'symbol' column
                const { rowCount } = await db.query('UPDATE watchlists SET symbol = $1 WHERE symbol = $2', [newSym, oldSym]);
                if (rowCount > 0) console.log(`📦 [Migration] Migrated ${rowCount} watchlist entries from ${oldSym} to ${newSym}`);

                await db.query('INSERT INTO symbol_change_logs (old_symbol, new_symbol, effective_date) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING', 
                    [oldSym, newSym, row['SM_APPLICABLE_FROM']]);
            }
        } catch (e) { /* ignore */ }
    }

    async sendWebhookAlert(message) {
        if (!process.env.ALERTS_WEBHOOK_URL) return;
        try {
            await axios.post(process.env.ALERTS_WEBHOOK_URL, { content: message });
        } catch (e) { console.error('Webhook Failed'); }
    }

    async logAudit(userId, action, details) {
        await db.query('INSERT INTO audit_logs (user_id, action, details) VALUES ($1, $2, $3)', [userId, action, details]);
    }

    async createSnapshot(name) {
        const { rows } = await db.query('SELECT * FROM instruments');
        await db.query('INSERT INTO master_data_snapshots (snapshot_name, record_count, data_json) VALUES ($1, $2, $3)', [name, rows.length, JSON.stringify(rows)]);
    }

    async createSyncLog(type) {
        const { rows } = await db.query('INSERT INTO sync_logs (sync_type, status) VALUES ($1, $2) RETURNING id', [type, 'RUNNING']);
        return rows[0].id;
    }

    async completeSyncLog(id, status, count, failures, duration) {
        await db.query('UPDATE sync_logs SET status = $1, records_processed = $2, failures = $3, performance_ms = $4, completed_at = CURRENT_TIMESTAMP WHERE id = $5',
            [status, count, failures, duration, id]);
    }

    async cleanupStaleData() {
        await db.query("UPDATE instruments SET is_active = FALSE WHERE last_synced_at < NOW() - INTERVAL '7 days' AND is_active = TRUE");
    }
}

module.exports = new EliteImportEngine();

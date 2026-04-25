const db = require('../db/client');

class DataQualityEngine {
    /**
     * OHLC Anomaly Detection
     * Validates if price data is realistic.
     */
    async validateOHLC(symbol, ohlc) {
        const { open, high, low, close } = ohlc;
        const anomalies = [];

        // 1. High-Low Check
        if (high < low) anomalies.push('CRITICAL: High lower than Low');
        
        // 2. Out-of-Bound Check (e.g. 20% circuit limit in single day)
        const dailyChange = Math.abs((close - open) / open);
        if (dailyChange > 0.25) {
            anomalies.push(`WARNING: Suspicious Daily Move (${(dailyChange * 100).toFixed(2)}%)`);
        }

        // 3. Zero Check
        if (open === 0 || close === 0) anomalies.push('CRITICAL: Zero Price Detected');

        if (anomalies.length > 0) {
            await this.logAnomaly(symbol, 'OHLC_VALIDATION', anomalies);
            return { valid: false, anomalies };
        }

        return { valid: true };
    }

    async logAnomaly(symbol, type, details) {
        const severity = details.some(d => d.includes('CRITICAL')) ? 'CRITICAL' : 'HIGH';
        await db.query(`
            INSERT INTO data_anomalies (symbol, anomaly_type, severity, details)
            VALUES ($1, $2, $3, $4)
        `, [symbol, type, severity, JSON.stringify(details)]);
    }

    /**
     * Market Holiday Checker
     */
    async isMarketOpen(date = new Date()) {
        const d = date.toISOString().split('T')[0];
        
        // Weekend Check
        const day = date.getUTCDay();
        if (day === 0 || day === 6) return false;

        // Holiday DB Check
        const { rows } = await db.query('SELECT 1 FROM market_holidays WHERE holiday_date = $1', [d]);
        return rows.length === 0;
    }
}

module.exports = new DataQualityEngine();

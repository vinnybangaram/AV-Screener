/**
 * Master Data Engine - Core Logic Tests
 */

const masterDataService = require('../services/masterDataService');
const importEngine = require('../services/importEngine');

describe('Master Data Service', () => {
    test('Search should return empty array for null query', async () => {
        const results = await masterDataService.search(null);
        expect(results).toEqual([]);
    });

    test('Search should handle whitespace gracefully', async () => {
        const results = await masterDataService.search('   ');
        expect(results).toEqual([]);
    });
});

describe('Import Engine', () => {
    test('Should have correct NSE URLs', () => {
        expect(importEngine.NSE_URLS.EQUITY).toContain('nseindia.com');
        expect(importEngine.NSE_URLS.SYMBOL_CHANGES).toContain('symbolchange.csv');
    });

    test('Should have retry mechanism configured', () => {
        expect(importEngine.RETRY_ATTEMPTS).toBeGreaterThanOrEqual(3);
    });
});

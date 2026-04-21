// Market session = 09:15 to 15:30 IST.
export const scheduler = {
  isMarketOpen(now = new Date()): boolean {
    // Convert to IST regardless of host timezone.
    const ist = new Date(now.getTime() + (330 - now.getTimezoneOffset()) * 60_000);
    const day = ist.getUTCDay(); // 0=Sun .. 6=Sat (we shifted clock, so use UTC getters)
    if (day === 0 || day === 6) return false;
    const mins = ist.getUTCHours() * 60 + ist.getUTCMinutes();
    return mins >= 9 * 60 + 15 && mins <= 15 * 60 + 30;
  },

  sessionLabel(now = new Date()): string {
    return this.isMarketOpen(now) ? "LIVE" : "CLOSED";
  },

  maxHoldingMs(): number {
    return 30 * 60_000; // 30 minutes max hold for paper intraday
  },

  isSessionEndingSoon(now = new Date()): boolean {
    const ist = new Date(now.getTime() + (330 - now.getTimezoneOffset()) * 60_000);
    const mins = ist.getUTCHours() * 60 + ist.getUTCMinutes();
    return mins >= 15 * 60 + 25;
  },
};
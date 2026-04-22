def format_symbol(symbol: str) -> str:
    """
    Standardizes Indian stock symbols for Yahoo Finance.
    Appends .NS for NSE stocks if no suffix exists.
    """
    symbol = symbol.upper().strip()

    # Institutional Index Mapping
    INDEX_MAP = {
        "NIFTY": "^NSEI",
        "BANKNIFTY": "^NSEBANK",
        "NIFTY_BANK": "^NSEBANK",
        "SENSEX": "^BSESN",
        "MIDCAP": "^NSEMDCP50",
        "SMALLCAP": "^CNXSC",
        "NIFTY_SMALLCAP_100": "^CNXSC",
        "INDIAVIX": "^INDIAVIX"
    }

    if symbol in INDEX_MAP:
        return INDEX_MAP[symbol]

    # If already formatted, return as is
    if symbol.endswith(".NS") or symbol.endswith(".BO") or symbol.startswith("^"):
        return symbol

    # Default to NSE
    return f"{symbol}.NS"

def strip_symbol(symbol: str) -> str:
    """Removes Yahoo Finance suffixes (.NS, .BO)."""
    return symbol.replace('.NS', '').replace('.BO', '').upper().strip()

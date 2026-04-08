def format_symbol(symbol: str) -> str:
    """
    Standardizes Indian stock symbols for Yahoo Finance.
    Appends .NS for NSE stocks if no suffix exists.
    """
    symbol = symbol.upper().strip()

    # If already formatted, return as is
    if symbol.endswith(".NS") or symbol.endswith(".BO"):
        return symbol

    # Default to NSE
    return f"{symbol}.NS"

def strip_symbol(symbol: str) -> str:
    """Removes Yahoo Finance suffixes (.NS, .BO)."""
    return symbol.replace('.NS', '').replace('.BO', '').upper().strip()

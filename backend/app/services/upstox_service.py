import httpx
from typing import Dict, Any, Optional
from app.utils.config import settings
from app.models.upstox_account import UpstoxAccount
from sqlalchemy.orm import Session
from datetime import datetime
import json
from urllib.parse import quote

class UpstoxService:
    def __init__(self):
        self.api_key = settings.UPSTOX_API_KEY
        self.api_secret = settings.UPSTOX_API_SECRET
        self.redirect_uri = settings.UPSTOX_REDIRECT_URI
        self.base_url = settings.UPSTOX_BASE_URL
        
        # Debug Logs
        print(f"[Upstox] Initialized with API Key: {self.api_key[:8]}...{self.api_key[-4:]}")
        print(f"[Upstox] Redirect URI: {self.redirect_uri}")


    def get_login_url(self) -> str:
        """Generate the login URL for Upstox OAuth."""
        encoded_uri = quote(self.redirect_uri, safe='')
        return f"https://api.upstox.com/v2/login/authorization/dialog?response_type=code&client_id={self.api_key}&redirect_uri={encoded_uri}"


    async def get_access_token(self, code: str) -> Dict[str, Any]:
        """Exchange auth code for access token."""
        url = "https://api.upstox.com/v2/login/authorization/token"
        data = {
            "code": code,
            "client_id": self.api_key,
            "client_secret": self.api_secret,
            "redirect_uri": self.redirect_uri,
            "grant_type": "authorization_code"
        }
        headers = {
            "accept": "application/json",
            "Content-Type": "application/x-www-form-urlencoded"
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(url, data=data, headers=headers)
            if response.status_code != 200:
                raise Exception(f"Failed to get access token: {response.text}")
            return response.json()

    async def get_profile(self, access_token: str) -> Dict[str, Any]:
        """Fetch Upstox user profile."""
        url = f"{self.base_url}/user/profile"
        headers = {
            "accept": "application/json",
            "Authorization": f"Bearer {access_token}"
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.get(url, headers=headers)
            if response.status_code != 200:
                raise Exception(f"Failed to fetch profile: {response.text}")
            return response.json()

    async def get_market_quote(self, access_token: str, symbol: str) -> Dict[str, Any]:
        """Fetch market quote for a symbol."""
        url = f"{self.base_url}/market-quote/quotes"
        params = {"instrument_key": symbol}
        headers = {
            "accept": "application/json",
            "Authorization": f"Bearer {access_token}"
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.get(url, params=params, headers=headers)
            if response.status_code != 200:
                raise Exception(f"Failed to fetch quote: {response.text}")
            return response.json()

    async def get_historical_candles(self, access_token: str, symbol: str, interval: str = "1minute") -> Dict[str, Any]:
        """Fetch historical candle data."""
        url = f"{self.base_url}/historical-candle/{symbol}/{interval}/{datetime.now().strftime('%Y-%m-%d')}"
        headers = {
            "accept": "application/json"
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.get(url, headers=headers)
            if response.status_code != 200:
                raise Exception(f"Failed to fetch candles: {response.text}")
            return response.json()

    async def get_option_chain(self, access_token: str, symbol: str, expiry_date: str = None) -> Dict[str, Any]:
        """Fetch option chain data."""
        url = f"{self.base_url}/option/chain"
        params = {"instrument_key": symbol}
        if expiry_date:
            params["expiry_date"] = expiry_date
            
        headers = {
            "accept": "application/json",
            "Authorization": f"Bearer {access_token}"
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.get(url, params=params, headers=headers)
            if response.status_code != 200:
                raise Exception(f"Failed to fetch option chain: {response.text}")
            return response.json()

    def save_upstox_account(self, db: Session, user_id: int, token_data: Dict[str, Any], profile_data: Dict[str, Any]):
        """Save or update Upstox account in DB."""
        account = db.query(UpstoxAccount).filter(UpstoxAccount.user_id == user_id).first()
        
        if not account:
            account = UpstoxAccount(user_id=user_id)
            db.add(account)
            
        account.access_token = token_data["access_token"]
        # Upstox doesn't always provide a refresh token in the same way, but we save if present
        account.refresh_token = token_data.get("refresh_token")
        account.expires_in = token_data.get("expires_in")
        
        # Profile info
        data = profile_data.get("data", {})
        account.client_id = data.get("user_id")
        account.user_name = data.get("user_name")
        account.email = data.get("email")
        account.profile_data = profile_data
        
        db.commit()
        db.refresh(account)
        return account

upstox_service = UpstoxService()

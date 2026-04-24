import sys
import os

# Add backend directory to sys.path so we can import app modules
sys.path.append(os.path.abspath("backend"))

from app.database import SessionLocal
from app.models.user import User
from app.models.upstox_account import UpstoxAccount
# Import all models to populate the SQLAlchemy registry
from app.models import (
    watchlist, notification, screener_result, chat, daily_price,
    market_regime, conviction, portfolio_health, portfolio, backtest,
    report, news, intraday_history, dashboard_cache
)


def inject_token():
    db = SessionLocal()
    try:
        # Try to find the user
        user = db.query(User).filter(User.email == "vinny009@gmail.com").first()
        if not user:
            # Fallback to the first user in the DB
            user = db.query(User).first()
            
        if not user:
            print("ERROR: No users found in the database. Please log in to AV Screener first.")
            return

        print(f"Found User: {user.name} ({user.email})")

        # Check if they already have an UpstoxAccount
        account = db.query(UpstoxAccount).filter(UpstoxAccount.user_id == user.id).first()
        
        token = "eyJ0eXAiOiJKV1QiLCJrZXlfaWQiOiJza192MS4wIiwiYWxnIjoiSFMyNTYifQ.eyJzdWIiOiIzU0FNMlciLCJqdGkiOiI2OWViMjBlMzMyNTNmMDIyZDQ1NTE2OWYiLCJpc011bHRpQ2xpZW50IjpmYWxzZSwiaXNQbHVzUGxhbiI6dHJ1ZSwiaWF0IjoxNzc3MDE3MDU5LCJpc3MiOiJ1ZGFwaS1nYXRld2F5LXNlcnZpY2UiLCJleHAiOjE3Nzk1NzM2MDB9.5OsRvCT66t6pRKImqoKb3Imtz6dFdYwfo4TEB0SLDWc"

        if not account:
            account = UpstoxAccount(
                user_id=user.id,
                client_id="3SAM2W",
                access_token=token,
                user_name="Sandbox User",
                email="sandbox@upstox.com"
            )
            db.add(account)
            print("Created NEW Upstox connection.")
        else:
            account.access_token = token
            account.client_id = "3SAM2W"
            print("Updated EXISTING Upstox connection.")

        db.commit()
        print("SUCCESS! Token injected into the database.")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    inject_token()

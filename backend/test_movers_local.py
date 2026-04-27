
import asyncio
import os
import sys

# Ensure current dir is in path
sys.path.append(os.getcwd())

from app.services.market_service import get_top_movers

async def test():
    print("Fetching top movers...")
    movers = await get_top_movers()
    print("Movers result:", movers)

if __name__ == "__main__":
    asyncio.run(test())

import requests
import json
import time

url = "http://localhost:8000/api"
endpoints = ["/", "/ai-status", "/dashboard?category=All&timeframe=This%20Month", "/watchlist"]

print("Starting Pulse Check...")

for ep in endpoints:
    full_url = url + ep
    start = time.time()
    try:
        # Note: Dashboard/Watchlist require auth token normally,
        # but if we get 401 it means the API is alive.
        # If it hangs, it's a bug.
        r = requests.get(full_url, timeout=10)
        dur = round(time.time() - start, 2)
        print(f"[{ep}] Status: {r.status_code} | Time: {dur}s")
        if r.status_code == 200:
            print(f"     Data: {str(r.json())[:100]}...")
    except Exception as e:
        dur = round(time.time() - start, 2)
        print(f"[{ep}] ERROR: {e} | Time: {dur}s")

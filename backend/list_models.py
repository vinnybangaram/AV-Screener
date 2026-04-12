import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    # Try getting from settings if local .env doesn't work
    print("No API key found in .env, checking app settings...")
    try:
        from app.utils.config import settings
        api_key = settings.GEMINI_API_KEY
    except:
        pass

if not api_key:
    print("CRITICAL: No GEMINI_API_KEY found.")
else:
    genai.configure(api_key=api_key)
    print("--- AVAILABLE MODELS ---")
    try:
        for m in genai.list_models():
            if 'generateContent' in m.supported_generation_methods:
                print(f"Model ID: {m.name} | Display Name: {m.display_name}")
    except Exception as e:
        print(f"Error listing models: {e}")

import requests

def test_signup():
    url = "http://localhost:8000/api/auth/signup"
    payload = {
        "username": "diag_user",
        "email": "diag@example.com",
        "password": "Password123",
        "confirm_password": "Password123"
    }
    
    try:
        print(f"Testing POST {url}...")
        response = requests.post(url, json=payload, headers={"Origin": "http://localhost:5173"})
        print(f"Status Code: {response.status_code}")
        print(f"Headers: {response.headers}")
        print(f"Body: {response.text}")
    except Exception as e:
        print(f"Request failed: {e}")

if __name__ == "__main__":
    test_signup()

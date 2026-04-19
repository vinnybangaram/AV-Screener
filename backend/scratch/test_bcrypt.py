from passlib.context import CryptContext
import hashlib

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def test():
    pw = "Password123"
    pw_hash = hashlib.sha256(pw.encode('utf-8')).hexdigest()
    print(f"SHA-256 length: {len(pw_hash)}")
    
    try:
        h = pwd_context.hash(pw_hash)
        print("Success!")
    except Exception as e:
        print(f"Failure: {e}")

if __name__ == "__main__":
    test()

from sqlalchemy.orm import sessionmaker
from app.database import engine
from app.models.user import User

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def set_admin(email: str):
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email).first()
        if user:
            user.role = 'admin'
            db.commit()
            print(f"Successfully set {email} as admin.")
        else:
            print(f"User with email {email} not found. They must log in at least once first.")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    import sys
    # Using the email from the prompt: vinny009@gmail.com
    email = "vinny009@gmail.com" 
    set_admin(email)

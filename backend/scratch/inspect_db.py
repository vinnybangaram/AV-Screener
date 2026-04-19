from app.database import engine
from sqlalchemy import text, inspect

def check_db():
    print(f"Engine URL: {engine.url}")
    with engine.connect() as conn:
        insp = inspect(conn)
        tables = insp.get_table_names()
        print(f"Tables: {tables}")
        if 'users' in tables:
            columns = [c['name'] for c in insp.get_columns('users')]
            print(f"Users columns: {columns}")
        else:
            print("Users table MISSING!")

if __name__ == "__main__":
    check_db()

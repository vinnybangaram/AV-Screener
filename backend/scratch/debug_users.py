import sqlite3

def list_users():
    conn = sqlite3.connect('screener.db')
    cursor = conn.cursor()
    cursor.execute("SELECT id, email, name, is_verified, verification_token FROM users ORDER BY id DESC LIMIT 5")
    users = cursor.fetchall()
    print("Recent Users:")
    for u in users:
        print(f"ID: {u[0]}, Email: {u[1]}, Name: {u[2]}, Verified: {u[3]}, Token: {u[4]}")
    conn.close()

if __name__ == "__main__":
    list_users()

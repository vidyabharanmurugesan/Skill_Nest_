import sqlite3

def test_db():
    conn = sqlite3.connect('d:/project 22/backend/data/users.db')
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    
    # Check total users
    c.execute("SELECT * FROM users")
    rows = c.fetchall()
    
    print(f"Total Users: {len(rows)}")
    print("-" * 30)
    for row in rows:
        print(f"[{row['role'].upper()}] {row['name']} ({row['email']}) - ID: {row['id']}")
    
    conn.close()

if __name__ == "__main__":
    test_db()

import sqlite3
import os
import sys

BASE_DIR = os.path.dirname(__file__)
DB_PATH = os.path.join(BASE_DIR, 'trade_finance.db')

if not os.path.exists(DB_PATH):
    print(f"Database file not found at {DB_PATH}. Start the app first to create the DB.")
    sys.exit(1)

conn = sqlite3.connect(DB_PATH)
cur = conn.cursor()

cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='organizations';")
if not cur.fetchone():
    print('organizations table does not exist. Run the application once to create tables (Base.metadata.create_all).')
    conn.close()
    sys.exit(1)

cur.execute('SELECT id, name FROM organizations WHERE id = 1;')
row = cur.fetchone()
if row:
    print(f"Organization already exists: id={row[0]}, name={row[1]}")
else:
    cur.execute('INSERT INTO organizations (id, name) VALUES (?, ?);', (1, 'Default Organization'))
    conn.commit()
    print('Inserted Default Organization with id=1')

conn.close()

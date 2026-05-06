"""
Run a SQL migration file against the eadeymehidcndudeycnf Supabase project.
Usage: python scripts/run_migration_remix.py <path-to-sql-file>
"""
import requests
import sys
from pathlib import Path

URL = "https://eadeymehidcndudeycnf.supabase.co"
ANON_KEY = (
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"
    ".eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVhZGV5bWVoaWRjbmR1ZGV5Y25mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4Mzg2ODQsImV4cCI6MjA4NDQxNDY4NH0"
    ".8t74NyPPHaWXHGyllAvdjPZ6DfAWM9fsAKopVEVogpM"
)
EMAIL = "jj1212t@gmail.com"
PASSWORD = "543211"

def login():
    r = requests.post(
        f"{URL}/auth/v1/token?grant_type=password",
        json={"email": EMAIL, "password": PASSWORD},
        headers={"apikey": ANON_KEY, "Content-Type": "application/json"},
        timeout=15,
    )
    if r.status_code != 200:
        print(f"X Login failed ({r.status_code}): {r.text[:300]}")
        sys.exit(1)
    data = r.json()
    print(f"Logged in as: {data['user']['email']}")
    return data["access_token"]

def run_sql(token: str, sql: str):
    r = requests.post(
        f"{URL}/rest/v1/rpc/exec_sql",
        json={"query": sql},
        headers={
            "apikey": ANON_KEY,
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        },
        timeout=120,
    )
    return r.status_code, r.text

def main():
    if len(sys.argv) < 2:
        print("Usage: python scripts/run_migration_remix.py <sql-file>")
        sys.exit(1)
    sql_path = Path(sys.argv[1])
    if not sql_path.exists():
        print(f"X File not found: {sql_path}")
        sys.exit(1)
    sql = sql_path.read_text(encoding="utf-8")
    print(f"File: {sql_path.name}  ({len(sql)} chars)")
    token = login()
    status, text = run_sql(token, sql)
    if status == 200:
        print("OK - migration applied")
    else:
        print(f"FAILED HTTP {status}: {text[:500]}")
        sys.exit(1)

if __name__ == "__main__":
    main()

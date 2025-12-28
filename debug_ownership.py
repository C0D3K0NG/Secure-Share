import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv('frontend/.env')

url = os.environ.get("VITE_SUPABASE_URL")
key = os.environ.get("VITE_SUPABASE_KEY")

if not url:
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_KEY")

supabase = create_client(url, key)

print("\n--- 1. Checking SHARES (Recent 5) ---")
try:
    res = supabase.table("shares").select("*").order("created_at", desc=True).limit(5).execute()
    if not res.data:
        print("No shares found at all.")
    for s in res.data:
        print(f"File: {s.get('original_name')} | ID: {s.get('id')} | User ID: {s.get('user_id')} (Is None: {s.get('user_id') is None})")
except Exception as e:
    print(f"Error checking shares: {e}")

print("\n--- 2. Checking ACCESS LOGS (Recent 5) ---")
try:
    res = supabase.table("access_logs").select("*").order("accessed_at", desc=True).limit(5).execute()
    if not res.data:
        print("No access logs found at all.")
    for l in res.data:
        print(f"Log: {l.get('status')} | File ID: {l.get('file_id')} | Time: {l.get('accessed_at')}")
except Exception as e:
    print(f"Error checking logs: {e}")

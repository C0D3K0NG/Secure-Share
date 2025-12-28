import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv('frontend/.env')

url = os.environ.get("VITE_SUPABASE_URL") or os.environ.get("SUPABASE_URL")
key = os.environ.get("VITE_SUPABASE_KEY") or os.environ.get("SUPABASE_KEY")

supabase = create_client(url, key)

print("\n--- CHECKING SHARES FOR USER_ID ---")
try:
    # Just get the last 5 inserted rows (Supabase returns default order usually insertion)
    # or just get all and print last few if small
    res = supabase.table("shares").select("*").limit(10).execute()
    
    count_with_user = 0
    count_without = 0
    
    for s in res.data:
        uid = s.get('user_id')
        print(f"ID: {s['id'][:8]}... | UserID: {uid}")
        if uid: count_with_user += 1
        else: count_without += 1
        
    print(f"\nSummary: {count_with_user} files have Owner. {count_without} files are Orphan.")

except Exception as e:
    print(f"Error: {e}")

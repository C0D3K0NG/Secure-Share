import os
from supabase import create_client
from dotenv import load_dotenv

# Load env from frontend/.env or existing logic
# Assuming we run this from root where app.py is, but .env might be in frontend
load_dotenv('frontend/.env') 

url = os.environ.get("VITE_SUPABASE_URL") # Frontend uses VITE_ prefix
key = os.environ.get("VITE_SUPABASE_KEY")

if not url or not key:
    # Try backup standard names
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_KEY")

print(f"URL: {url}")
print("Connecting...")

supabase = create_client(url, key)

print("\n--- DEBUG: Inspecting Shares ---")
res_shares = supabase.table("shares").select("*").limit(5).execute()
for share in res_shares.data:
    print(f"Share ID: {share['id']} | User ID: {share.get('user_id')}")

print("\n--- DEBUG: Inspecting Logs ---")
res_logs = supabase.table("access_logs").select("*").limit(5).execute()
for log in res_logs.data:
    print(f"Log ID: {log['id']} | File ID: {log.get('file_id')}")

print("\n--- TEST: Running Linked Query (The one failing) ---")
# This simulates the query in app.py
try:
    # We need a user_id that actually exists in shares to test
    user_id_to_test = None
    if res_shares.data:
        # Find one with a user_id
        for s in res_shares.data:
            if s.get('user_id'):
                user_id_to_test = s['user_id']
                break
    
    if not user_id_to_test:
        print("WARNING: No shares found with a user_id. Upload a file first!")
    else:
        print(f"Testing with User ID: {user_id_to_test}")
        query = supabase.table("access_logs").select("*, shares!inner(user_id)")
        query = query.eq("shares.user_id", user_id_to_test)
        result = query.execute()
        print(f"SUCCESS! Found {len(result.data)} logs linked to this user.")
        print(result.data)

except Exception as e:
    print(f"QUERY FAILED: {e}")

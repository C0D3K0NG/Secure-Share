import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv('frontend/.env')
url = os.environ.get("VITE_SUPABASE_URL") or os.environ.get("SUPABASE_URL")
key = os.environ.get("VITE_SUPABASE_KEY") or os.environ.get("SUPABASE_KEY")
supabase = create_client(url, key)

print("\n--- DEBUG: LOGS FOR OWNED FILES ---")

# 1. Find an owned file
res_shares = supabase.table("shares").select("*").neq("user_id", "null").limit(5).execute()
owned_files = res_shares.data

if not owned_files:
    print("RESULT: No owned files found. (Upload failed to attach ID?)")
else:
    print(f"Found {len(owned_files)} owned files.")
    for f in owned_files:
        fid = f['id']
        uid = f['user_id']
        # 2. Count logs for this file
        res_logs = supabase.table("access_logs").select("*", count="exact").eq("file_id", fid).execute()
        count = len(res_logs.data)
        print(f"File {fid} (Owner: {uid}) -> Log Count: {count}")

print("--- END DEBUG ---")

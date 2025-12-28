import os
import datetime
from supabase import create_client
from dotenv import load_dotenv

load_dotenv('frontend/.env')
url = os.environ.get("VITE_SUPABASE_URL") or os.environ.get("SUPABASE_URL")
key = os.environ.get("VITE_SUPABASE_KEY") or os.environ.get("SUPABASE_KEY")
supabase = create_client(url, key)

print("\n--- DEBUG: MANUAL LOG INSERT ---")
try:
    # 1. Get ANY text file or share to link against (or use a fake UUID if we want to confirm FK constraint)
    # We'll try to get a real share ID to be safe
    res = supabase.table("shares").select("id").limit(1).execute()
    if not res.data:
        print("No shares found, cannot insert log (FK constraint).")
    else:
        fid = res.data[0]['id']
        print(f"Using File ID: {fid}")
        
        # 2. Insert dummy log
        data = {
            "file_id": fid,
            "ip_address": "8.8.8.8",
            "user_agent": "DEBUG_SCRIPT",
            "status": "Granted:Debug",
            "accessed_at": datetime.datetime.now().isoformat()
        }
        res_ins = supabase.table("access_logs").insert(data).execute()
        print("SUCCESS! Inserted log.")
        print(res_ins.data)

except Exception as e:
    print(f"INSERT FAILED: {e}")

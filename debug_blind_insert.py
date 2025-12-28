import os
import uuid
import datetime
from supabase import create_client
from dotenv import load_dotenv

load_dotenv('frontend/.env')
url = os.environ.get("VITE_SUPABASE_URL") or os.environ.get("SUPABASE_URL")
key = os.environ.get("VITE_SUPABASE_KEY") or os.environ.get("SUPABASE_KEY")
supabase = create_client(url, key)

print("\n--- DEBUG: BLIND LOG INSERT ---")
try:
    # Use a random UUID for file_id to test write permissions
    # If this fails with FK constraint, then table exists and write works (but constraint blocks)
    # If this fails with Permission Denied, then RLS is blocking.
    fake_id = str(uuid.uuid4())
    print(f"Attempting to insert log for Fake ID: {fake_id}")
    
    data = {
        "file_id": fake_id,
        "ip_address": "8.8.8.8",
        "user_agent": "DEBUG_BLIND",
        "status": "Granted:DebugBlind",
        "accessed_at": datetime.datetime.now().isoformat()
    }
    res_ins = supabase.table("access_logs").insert(data).execute()
    print("SUCCESS! Inserted blind log (Constraints might be missing?)")
    print(res_ins.data)

except Exception as e:
    print(f"INSERT FAILED: {e}")

import os
import time
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()
url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_KEY")
supabase = create_client(url, key)

print("--- DIAGNOSTIC START ---")

print("--- LIVE LOG MONITOR ---")
print("Waiting for access logs... (Ctrl+C to stop)")
last_id = None

while True:
    try:
        # Fetch latest log
        res = supabase.table("access_logs").select("*").order("accessed_at", desc=True).limit(1).execute()
        if res.data:
            log = res.data[0]
            if log['id'] != last_id:
                print(f" [NEW] {log['accessed_at']} | {log['status']} | File: {log.get('filename')} | IP: {log['ip_address']}")
                last_id = log['id']
        time.sleep(2)
    except Exception as e:
        print(f"Error: {e}")
        time.sleep(5)

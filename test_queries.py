import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_KEY")

if not url or not key:
    print("Error: Env vars missing")
    exit(1)

supabase: Client = create_client(url, key)

print("1. Testing Total Uploads...")
try:
    # Try without head=True first, or with it?
    # res_total = supabase.table("shares").select("*", count='exact', head=True).execute()
    # It seems 'head' might be a separate parameter or method in some versions?
    # Let's try the standard way
    res_total = supabase.table("shares").select("*", count='exact').execute()
    print(f"Total Uploads Count: {res_total.count}")
except Exception as e:
    print(f"FAIL Total Uploads: {e}")

print("\n2. Testing Threats Blocked (NEQ)...")
try:
    res_threats = supabase.table("access_logs").select("*", count='exact').neq("status", "Granted").execute()
    print(f"Threats Blocked Count: {res_threats.count}")
except Exception as e:
    import json
    try:
        # Try to parse or just print string
        print(f"FAIL Threats Blocked: {e}")
        if hasattr(e, 'code'): print(f"Error Code: {e.code}")
        if hasattr(e, 'message'): print(f"Error Message: {e.message}")
        if hasattr(e, 'details'): print(f"Error Details: {e.details}")
    except:
        print(f"FAIL Clean Print: {e}")


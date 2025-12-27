import requests
import random
import time
from concurrent.futures import ThreadPoolExecutor

BASE_URL = "http://127.0.0.1:5000"

def simulate_access():
    # 1. Upload a file to get a share ID
    print("Uploading file with Custom Name 'ProjectAlpha'...")
    files = {'file': ('secret_plans.txt', 'This is secret content')}
    # Add custom_name param
    res = requests.post(f"{BASE_URL}/upload", files=files, data={'max_views': 100, 'custom_name': 'ProjectAlpha'})
    
    if res.status_code != 200:
        print(f"Upload failed: {res.text}")
        return

    share_id = res.json()['share_link']
    print(f"File uploaded. ID: {share_id}")

    # 2. Simulate User Traffic
    user_agents = [
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)",
        "Mozilla/5.0 (Linux; Android 10; SM-G960U)",
        "EvilBot/1.0",
        "SecurityScanner/2.0"
    ]

    print("Simulating 20 access attempts...")
    
    def hit_endpoint(i):
        ua = random.choice(user_agents)
        headers = {'User-Agent': ua}
        
        # Simulate different scenarios
        if i % 5 == 0:
            # Expired link simulation (fake ID) or just normal access
            r = requests.get(f"{BASE_URL}/access/{share_id}", headers=headers)
        elif i % 5 == 1:
            # Blocked bot? (Logic relies on headers, but our backend just logs everything)
            # We'll just hit it normally. Backend marks "Denied" if views exceeded or expired.
            # To simulate "Denied", we need to trigger a rule.
            # Currently backend only denies if Expired or Max Views.
            # Let's hit a fake ID to get 404 (not logged) or exhaust views?
            r = requests.get(f"{BASE_URL}/access/{share_id}", headers=headers)
        else:
            r = requests.get(f"{BASE_URL}/access/{share_id}", headers=headers)
        
        status = "Granted" if r.status_code == 200 else "Denied/Error"
        print(f"Request {i+1}: {r.status_code} ({status})")

    with ThreadPoolExecutor(max_workers=5) as executor:
        for i in range(20):
            executor.submit(hit_endpoint, i)
            time.sleep(0.1)

    print("\nSimulation Complete! Check your Dashboard.")

if __name__ == "__main__":
    simulate_access()

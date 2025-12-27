import os
import uuid
from datetime import datetime, timedelta, timezone
from flask import Flask, request, jsonify
from flask_cors import CORS
from supabase import create_client, Client
from dotenv import load_dotenv
from werkzeug.utils import secure_filename

# 1. Setup & Config
load_dotenv()
app = Flask(__name__)
CORS(app)  # Allow frontend to talk to this backend

# Connect to Supabase Cloud
url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")

# Safety check if env vars are missing
if not url or not key:
    raise ValueError("Supabase URL or Key is missing in .env file")

supabase: Client = create_client(url, key)

BUCKET_NAME = "secure-files"

# 2. Helper: Check if link is valid
def is_link_active(share_data):
    # Check Expiry
    # Fix: Make sure database time implies UTC
    expiry = datetime.fromisoformat(share_data['expires_at'])
    
    # If the stored time doesn't have timezone info, force it to UTC
    if expiry.tzinfo is None:
        expiry = expiry.replace(tzinfo=timezone.utc)

    # Compare with current UTC time
    if datetime.now(timezone.utc) > expiry:
        return False, "Link Expired"
    
    # Check View Limit
    if share_data['current_views'] >= share_data['max_views']:
        return False, "Max views reached"
        
    return True, "Valid"

# 3. API Route: UPLOAD FILE
@app.route('/upload', methods=['POST'])
def upload_file():
    try:
        if 'file' not in request.files:
            return jsonify({"error": "No file part"}), 400
            
        file = request.files['file']
        if file.filename == '':
            return jsonify({"error": "No selected file"}), 400

        max_views = int(request.form.get('max_views', 1))
        expiry_mins = int(request.form.get('expiry_mins', 60))
        
        # A. Secure the filename & Create unique ID
        filename = secure_filename(file.filename)
        unique_id = str(uuid.uuid4())
        file_path = f"{unique_id}/{filename}"  # Store as folder/file structure

        # B. Upload file to Supabase Storage (The Vault)
        file_content = file.read()
        res = supabase.storage.from_(BUCKET_NAME).upload(
            path=file_path, 
            file=file_content,
            file_options={"content-type": file.content_type}
        )

        # C. Calculate Expiry Time (FIXED: Using UTC Aware Time)
        expires_at = datetime.now(timezone.utc) + timedelta(minutes=expiry_mins)

        # D. Save Metadata to Database (The Ledger)
        data = {
            "id": unique_id,
            "file_path": file_path,
            "original_name": filename,
            "expires_at": expires_at.isoformat(),
            "max_views": max_views,
            "current_views": 0
        }
        supabase.table("shares").insert(data).execute()

        return jsonify({
            "message": "File secured successfully!",
            "share_link": f"{unique_id}",
            "expires_at": expires_at.isoformat()
        })

    except Exception as e:
        print(f"Upload Error: {e}")
        return jsonify({"error": str(e)}), 500

# 4. API Route: ACCESS FILE (Zero Trust Logic)
@app.route('/access/<share_id>', methods=['GET'])
def access_file(share_id):
    ip = request.remote_addr
    ua = request.user_agent.string
    
    try:
        # A. Fetch Metadata
        response = supabase.table("shares").select("*").eq("id", share_id).execute()
        
        if not response.data:
            return jsonify({"error": "Link not found"}), 404
            
        share_data = response.data[0]

        # B. Validate Policy (Expiry & Counts)
        is_valid, reason = is_link_active(share_data)
        
        # Log attempt (Honeypot) - Log BEFORE returning error
        log_entry = {
            "file_id": share_id,
            "ip_address": ip,  # In prod, mask this e.g. 192.168.x.x
            "user_agent": ua,
            "status": "Granted" if is_valid else f"Denied: {reason}",
            "accessed_at": datetime.now(timezone.utc).isoformat()
        }
        # Fire and forget log? Supabase insert is quick.
        try:
            supabase.table("access_logs").insert(log_entry).execute()
        except Exception as log_err:
             print(f"Logging Failed: {log_err}")

        if not is_valid:
            print(f"Access Denied: {reason}")
            return jsonify({"error": reason}), 403

        # C. Increment View Count (Audit Trail)
        new_count = share_data['current_views'] + 1
        supabase.table("shares").update({"current_views": new_count}).eq("id", share_id).execute()

        # D. Generate One-Time Signed URL (The Key)
        signed_url_res = supabase.storage.from_(BUCKET_NAME).create_signed_url(
            share_data['file_path'], 
            60 
        )
        final_url = signed_url_res['signedURL'] if isinstance(signed_url_res, dict) else signed_url_res

        return jsonify({
            "file_url": final_url,
            "filename": share_data['original_name'],
            "views_left": share_data['max_views'] - new_count
        })

    except Exception as e:
        print(f"Access Error: {e}")
        return jsonify({"error": str(e)}), 500

# 5. API Route: MONITORING LOGS
@app.route('/logs', methods=['GET'])
def get_logs():
    try:
        # Fetch last 50 logs
        response = supabase.table("access_logs").select("*").order("accessed_at", desc=True).limit(50).execute()
        return jsonify(response.data)
    except Exception as e:
        print(f"Logs Error: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
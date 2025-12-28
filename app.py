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
key: str = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

supabase: Client = None

try:
    if not url or not key:
        print("WARNING: Supabase URL or Key is missing. Database features will fail.")
    else:
        supabase = create_client(url, key)
except Exception as e:
    print(f"Supabase Init Error: {e}")

BUCKET_NAME = "secure-files"

# 2. Helper: Check if link is valid
def is_link_active(share_data):
    # Check Expiry
    # ... (existing code) ...
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

# Root route for API Health Check & Guidance
@app.route('/', methods=['GET'])
def home():
    return jsonify({
        "status": "online",
        "service": "SecureShare Backend API",
        "message": "You have hit the Backend API directly. To use the App, please visit the Frontend URL.",
        "documentation": "/api/stats, /api/logs",
        "note": "If you are on Vercel, this means the Frontend build might have failed or routing is misconfigured."
    })

@app.route('/debug-files', methods=['GET'])
def debug_files():
    import os
    try:
        root_files = os.listdir('.')
        dist_files = os.listdir('./dist') if os.path.exists('./dist') else "dist folder not found"
        return jsonify({
            "cwd": os.getcwd(),
            "root_files": root_files,
            "dist_files": dist_files
        })
    except Exception as e:
        return jsonify({"error": str(e)})

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
        custom_name = request.form.get('custom_name')
        
        # A. Secure the filename & Create unique ID
        filename = secure_filename(file.filename)
        unique_id = str(uuid.uuid4())
        file_path = f"{unique_id}/{filename}"  # Store as folder/file structure

        # Determine Display Name
        if custom_name and custom_name.strip():
            # Append original extension if user didn't provide one
            ext = os.path.splitext(filename)[1]
            if not custom_name.endswith(ext):
                display_name = custom_name + ext
            else:
                display_name = custom_name
        else:
            display_name = filename

        # B. Upload file to Supabase Storage (The Vault)
        file_content = file.read()
        res = supabase.storage.from_(BUCKET_NAME).upload(
            path=file_path, 
            file=file_content,
            file_options={"content-type": file.content_type}
        )

        # C. Calculate Expiry Time (FIXED: Using UTC Aware Time)
        expires_at = datetime.now(timezone.utc) + timedelta(minutes=expiry_mins)
        
        user_id = request.form.get('user_id')

        # D. Save Metadata to Database (The Ledger)
        data = {
            "id": unique_id,
            "file_path": file_path,
            "original_name": display_name,
            "expires_at": expires_at.isoformat(),
            "max_views": max_views,
            "current_views": 0
        }
        
        if user_id:
            data["user_id"] = user_id
            
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
            "filename": share_data.get('original_name', 'Unknown'),
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
        time_range = request.args.get('range', 'all')
        sort_by = request.args.get('sort', 'newest')
        user_id = request.args.get('user_id')
        
        # Base Query
        query = supabase.table("access_logs").select("*")

        # User Filtering (Personal Ownership)
        # Note: This relies on access_logs.file_id -> shares.id foreign key relationship
        # If user_id is provided, we filter logs where the associated share belongs to that user.
        if user_id and user_id != 'undefined':
             # Querying referenced table: shares.user_id
             # Syntax assumes Foreign Key exists: access_logs.file_id -> shares.id
             # We use the !inner join hint to filter rows based on the joined table
             query = supabase.table("access_logs").select("*, shares!inner(user_id)")
             query = query.eq("shares.user_id", user_id)
        
        # Apply Logic for Sort
        if sort_by == 'oldest':
            query = query.order("accessed_at", desc=False)
        elif sort_by == 'status_granted':
             query = query.order("status", desc=True).order("accessed_at", desc=True)
        elif sort_by == 'status_denied':
             query = query.order("status", desc=False).order("accessed_at", desc=True)
        else: # newest
            query = query.order("accessed_at", desc=True)

        query = query.limit(100)
        
        if time_range != 'all':
            now = datetime.now(timezone.utc)
            start_date = None
            
            if time_range == '1h':
                start_date = now - timedelta(hours=1)
            elif time_range == '24h':
                start_date = now - timedelta(days=1)
            elif time_range == '7d':
                start_date = now - timedelta(days=7)
            elif time_range == '30d':
                start_date = now - timedelta(days=30)
            elif time_range == '3m':
                start_date = now - timedelta(days=90)
            elif time_range == '6m':
                start_date = now - timedelta(days=180)
            elif time_range == '1y':
                start_date = now - timedelta(days=365)
            
            if start_date:
                query = query.gte("accessed_at", start_date.isoformat())

        response = query.execute()
        return jsonify(response.data)
    except Exception as e:
        print(f"Logs Error: {e}")
        return jsonify({"error": str(e)}), 500

# 6. API Route: DASHBOARD STATS
@app.route('/stats', methods=['GET'])
def get_stats():
    try:
        user_id = request.args.get('user_id')
        now_iso = datetime.now(timezone.utc).isoformat()
        
        # Helper params for user filtering
        filter_user_shares = lambda q: q.eq("user_id", user_id) if (user_id and user_id != 'undefined') else q
        # For logs, we need to join again
        
        # 1. Total Uploads
        q_total = supabase.table("shares").select("*", count='exact', head=True)
        q_total = filter_user_shares(q_total)
        res_total = q_total.execute()
        total_uploads = res_total.count if res_total.count is not None else 0

        # 2. Active Links (Expires later than now)
        q_active = supabase.table("shares").select("*", count='exact', head=True).gt("expires_at", now_iso)
        q_active = filter_user_shares(q_active)
        res_active = q_active.execute()
        active_links = res_active.count if res_active.count is not None else 0

        # 3. Threats Blocked (Status contains "Denied")
        threats_blocked = 0
        try:
             q_threats = supabase.table("access_logs").select("*", count='exact', head=True).like("status", "%Denied%")
             if user_id and user_id != 'undefined':
                  # Filter logs by user_id via join
                  q_threats = supabase.table("access_logs").select("*, shares!inner(user_id)", count='exact', head=True).like("status", "%Denied%").eq("shares.user_id", user_id)
                  
             res_threats = q_threats.execute()
             threats_blocked = res_threats.count if res_threats.count is not None else 0
        except Exception:
             pass 

        # 4. Graph Data (Activity in last 24 hours)
        hourly_counts = [0] * 24
        try:
            one_day_ago = (datetime.now(timezone.utc) - timedelta(days=1)).isoformat()
            
            # Base Query
            q_activity = supabase.table("access_logs").select("accessed_at")
            
            if user_id and user_id != 'undefined':
                 q_activity = supabase.table("access_logs").select("accessed_at, shares!inner(user_id)").eq("shares.user_id", user_id)
            
            q_activity = q_activity.gte("accessed_at", one_day_ago)
            res_activity = q_activity.execute()
        
            now = datetime.now(timezone.utc)
            for log in res_activity.data:
                dt = datetime.fromisoformat(log['accessed_at'])
                if dt.tzinfo is None: dt = dt.replace(tzinfo=timezone.utc)
                
                diff = now - dt
                hours_ago = int(diff.total_seconds() / 3600)
                if 0 <= hours_ago < 24:
                    hourly_counts[23 - hours_ago] += 1
        except Exception:
             pass 

        return jsonify({
            "total_uploads": total_uploads,
            "active_links": active_links,
            "threats_blocked": threats_blocked,
            "activity_graph": hourly_counts
        })

    except Exception as e:
        print(f"Stats Error: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
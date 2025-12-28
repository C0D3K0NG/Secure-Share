# SecureShare 2.0 🛡️

**Zero-Trust File Transfer & Cyber-Security Dashboard**

SecureShare allows you to share files with absolute control. Unlike traditional tools that assume trust, SecureShare verifies every access, encrypts data on the client side, and logs every interaction in real-time.

![SecureShare Logo](logo/logo.png)

## 🚀 Key Features

### 🔐 The Vault (Client-Side Encryption)
- **AES-256 Encryption**: Files are encrypted in your browser *before* they ever touch our servers.
- **Zero-Knowledge**: We cannot read your files even if we wanted to. Only the password holder can decrypt them.
- **Secure Uploads**: Drag & Drop interface with instant encryption.

### 🕸️ The Honeypot (Access Monitoring)
- **Granular Logging**: detailed logs of who accessed your files, including IP address, User Agent, and Timestamp.
- **Real-Time Alerts**: See exactly when your link is opened.
- **Access Control**: One-time links and expiration timers.

### ⚡ Modern Tech Stack
- **Frontend**: React + Vite (Fast, Responsive, Interactive).
- **Backend**: Python Flask (Robust API, Logging).
- **Database**: Supabase (Real-time DB, Auth, Storage).
- **Style**: Tailwind CSS + Framer Motion (Cyber-Industrial Aesthetics).

---

## 🛠️ Local Development Setup

 Prerequisites: Node.js 18+, Python 3.9+

1.  **Clone the Repository**
    ```bash
    git clone https://github.com/C0D3K0NG/Secure-Share.git
    cd Secure-Share
    ```

2.  **Backend Setup**
    ```bash
    # Install dependencies
    pip install -r requirements.txt
    
    # Run the server (Port 5000)
    python app.py
    ```

3.  **Frontend Setup**
    ```bash
    cd frontend
    
    # Install dependencies
    npm install
    
    # Run the development server (Port 5173 or similar)
    npm run dev
    ```

4.  **Environment Variables**
    Create a `.env` file in the root with your keys:
    ```env
    SUPABASE_URL=your_url
    SUPABASE_SERVICE_ROLE_KEY=your_key
    
    VITE_SUPABASE_URL=your_url
    VITE_SUPABASE_KEY=your_key
    ```

---

## ☁️ Deployment (Vercel)

This project is optimized for **Vercel**.

1.  **Import Project**: Select the GitHub Repo.
2.  **Framework Preset**: Select **Vite**.
3.  **Build Command**: `npm run build` (Override if needed).
4.  **Output Directory**: `dist` (Override).
5.  **Environment Variables**: Add the 4 keys from `.env`.

**Note**: The project uses a hybrid architecture.
- Frontend is served statically from `dist/`.
- Backend runs as a Serverless Function via `api/index.py`.
- `vercel.json` handles the routing between them.

## 🤝 Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

---

*SecureShare &copy; 2025. Trust No One. Enrypt Everything.*

import React, { useState } from 'react';
import CryptoJS from 'crypto-js';
import QRCode from 'react-qr-code';
import { CloudUpload, Lock, Key, Copy, CheckCircle, AlertTriangle } from 'lucide-react';

const UploadVault = () => {
  const [file, setFile] = useState(null);
  const [password, setPassword] = useState('');
  const [enableEncryption, setEnableEncryption] = useState(true);
  const [expiry, setExpiry] = useState(60);
  const [maxViews, setMaxViews] = useState(1);
  const [status, setStatus] = useState('idle'); // idle, encrypting, uploading, success, error
  const [shareLink, setShareLink] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setFile(e.target.files[0]);
      setStatus('idle');
    }
  };

  const uploadFile = async () => {
    if (!file) return;
    setStatus('encrypting');

    try {
      let fileToUpload = file;

      // 1. Encryption
      if (enableEncryption && password) {
        // Read file as ArrayBuffer
        const arrayBuffer = await file.arrayBuffer();
        const wordArray = CryptoJS.lib.WordArray.create(arrayBuffer);

        // Encrypt
        const encrypted = CryptoJS.AES.encrypt(wordArray, password).toString();

        // Convert encrypted string back to Blob
        fileToUpload = new Blob([encrypted], { type: 'application/encrypted' });
        console.log("File encrypted. Original Size:", file.size, "Encrypted Size:", fileToUpload.size);
      }

      // 2. Upload
      setStatus('uploading');
      const formData = new FormData();
      formData.append('file', fileToUpload, file.name + (enableEncryption ? '.enc' : ''));
      formData.append('max_views', maxViews);
      formData.append('expiry_mins', expiry);

      // Assuming backend is on localhost:5000 from current knowledge
      const res = await fetch('http://127.0.0.1:5000/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Upload failed');

      setShareLink(data.share_link);
      setStatus('success');
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message);
      setStatus('error');
    }
  };

  const fullShareLink = `${window.location.origin}?shareId=${shareLink}`;

  return (
    <div className="flex flex-col h-full">
      {status === 'success' ? (
        <div className="flex flex-col items-center justify-center p-8 bg-card rounded-xl border border-primary/20 animate-fade-in">
          <CheckCircle size={64} className="text-primary mb-4" />
          <h3 className="text-2xl font-bold text-white mb-2">File Secured!</h3>
          <p className="text-gray-400 mb-6">Your file has been encrypted and bolted into the vault.</p>

          <div className="bg-white p-2 rounded-lg mb-6">
            <QRCode value={fullShareLink} size={128} />
          </div>

          <div className="bg-black/50 p-4 rounded-lg flex items-center justify-between w-full max-w-md border border-white/10">
            <code className="text-primary truncate mr-4">{fullShareLink}</code>
            <button
              onClick={() => navigator.clipboard.writeText(fullShareLink)}
              className="p-2 hover:bg-white/10 rounded-md transition-colors"
            >
              <Copy size={20} className="text-gray-400 hover:text-white" />
            </button>
          </div>

          <div className="mt-8 flex gap-4">
            <button
              onClick={() => { setStatus('idle'); setFile(null); setPassword(''); }}
              className="text-gray-400 hover:text-white underline"
            >
              Upload Another
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col md:flex-row gap-8 h-full">
          {/* Left: Upload Zone */}
          <div className="flex-1">
            <div
              className={`border-2 border-dashed rounded-xl h-64 flex flex-col items-center justify-center transition-colors cursor-pointer relative
                ${file ? 'border-primary bg-primary/5' : 'border-white/20 hover:border-white/40 hover:bg-white/5'}
              `}
            >
              <input
                type="file"
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <CloudUpload size={48} className={file ? "text-primary px-1" : "text-gray-500"} />
              <p className={`mt-4 font-medium ${file ? "text-primary" : "text-gray-400"}`}>
                {file ? file.name : "Drop file here or click to upload"}
              </p>
              {file && <p className="text-xs text-gray-500 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>}
            </div>

            {/* Error Message */}
            {status === 'error' && (
              <div className="mt-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg flex items-center text-red-200 text-sm">
                <AlertTriangle size={16} className="mr-2" />
                {errorMsg}
              </div>
            )}
          </div>

          {/* Right: Security Settings */}
          <div className="w-full md:w-80 bg-card rounded-xl border border-white/10 p-6 flex flex-col gap-6">
            <h3 className="font-bold flex items-center text-lg">
              <Lock size={20} className="mr-2 text-primary" />
              Security Config
            </h3>

            <div className="space-y-4">
              {/* Encryption Toggle */}
              <label className="flex items-center justify-between cursor-pointer group">
                <span className="text-sm text-gray-300 group-hover:text-white">Client-Side Encryption</span>
                <div
                  className={`w-10 h-6 rounded-full p-1 transition-colors ${enableEncryption ? 'bg-primary' : 'bg-gray-600'}`}
                  onClick={() => setEnableEncryption(!enableEncryption)}
                >
                  <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${enableEncryption ? 'translate-x-4' : ''}`} />
                </div>
              </label>

              {/* Password */}
              {enableEncryption && (
                <div className="animate-fade-in">
                  <label className="text-xs text-gray-500 mb-1 block">Secret Key (Password)</label>
                  <div className="relative">
                    <Key size={14} className="absolute left-3 top-3 text-gray-500" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Required to unlock"
                      className="w-full bg-black/50 border border-white/10 rounded-lg py-2 pl-9 pr-3 text-sm focus:border-primary focus:outline-none"
                    />
                  </div>
                </div>
              )}

              <hr className="border-white/10" />

              {/* Expiry */}
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Self-Destruct Timer</label>
                <select
                  value={expiry}
                  onChange={(e) => setExpiry(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-lg py-2 px-3 text-sm focus:border-primary focus:outline-none"
                >
                  <option value="15">15 Minutes</option>
                  <option value="60">1 Hour</option>
                  <option value="1440">24 Hours</option>
                  <option value="10080">7 Days</option>
                </select>
              </div>

              {/* Max Views */}
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Max Downloads</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={maxViews}
                  onChange={(e) => setMaxViews(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-lg py-2 px-3 text-sm focus:border-primary focus:outline-none"
                />
              </div>
            </div>

            <div className="mt-auto">
              <button
                onClick={uploadFile}
                disabled={!file || (enableEncryption && !password) || status === 'encrypting' || status === 'uploading'}
                className="w-full bg-primary text-black font-bold py-3 rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {status === 'encrypting' ? 'Encrypting...' : status === 'uploading' ? 'Uploading...' : 'Secure & Upload'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UploadVault;

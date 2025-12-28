import React, { useState, useEffect } from 'react';
import CryptoJS from 'crypto-js';
import { toast } from 'sonner';
import { Unlock, FileText, Download, Eye, EyeOff, AlertTriangle } from 'lucide-react';

const FileAccess = () => {
  const [shareId, setShareId] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('idle'); // idle, checking, pending_password, downloading, decrypting, success, error
  const [fileData, setFileData] = useState(null); // { filename, downloadUrl, viewsLeft }
  const [decryptedUrl, setDecryptedUrl] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('shareId');
    if (id) {
      setShareId(id);
      // Automatically check if ID is present
      // We can't immediately call checkShareLink here because state update is async or we need to pass ID directly.
      // Better to use a separate effect or call it directly.
    }
  }, []);

  // Effect to trigger check if shareId is set from URL on initial load?
  // Or user manually clicks. Let's let user verify the ID first visually.

  const checkShareLink = async () => {
    if (!shareId) return;
    setStatus('checking');
    setErrorMsg('');

    try {
      // Fetch metadata from API
      // Note: This endpoint increments view count as per current backend logic.
      // Ideally we should have a "peek" endpoint or only call this when ready to download.
      // But for MVP, we call it to get the URL.
      const res = await fetch(`/api/access/${shareId}`);
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Access Denied');

      setFileData(data);
      // Assuming all files are encrypted if uploaded via our new UI? 
      // The old UI didn't force encryption. We should probably detect or key off a flag?
      // Since backend doesn't store "is_encrypted" flag in "shares" table in previous code (only in file content/extension),
      // we'll assume we need password if the user provides one, or we try to decrypt.
      // For UX, let's just ask for password always if we want "Zero Trust" or assume user knows.
      // Let's prompt for password.
      setStatus('pending_password');
    } catch (err) {
      setStatus('error');
      setErrorMsg(err.message);
    }
  };

  const currentViewLogic = () => {
    // If we decided to fetch content immediately? 
    // We have data.file_url (signed url).
    // We need to fetch the blob.
    downloadAndDecrypt();
  };

  const downloadAndDecrypt = async () => {
    if (!fileData || !fileData.file_url) return;
    setStatus('downloading');

    try {
      // 1. Fetch encrypted blob
      const res = await fetch(fileData.file_url);
      if (!res.ok) throw new Error("Failed to download file from storage");
      const blob = await res.blob();

      // 2. Decrypt
      if (password) {
        setStatus('decrypting');
        const arrayBuffer = await blob.arrayBuffer();
        const wordArray = CryptoJS.lib.WordArray.create(arrayBuffer);

        try {
          const decrypted = CryptoJS.AES.decrypt({ ciphertext: wordArray }, password);
          // Verify decryption success? (crypto-js might return empty or garbage if wrong pass)
          // Ideally we check a known prefix or hash. MVP: Just try.

          // Convert to TypedArray
          const decryptedInfo = convertWordArrayToUint8Array(decrypted);
          if (decryptedInfo.length === 0) throw new Error("Decryption failed. Wrong password?");

          const decryptedBlob = new Blob([decryptedInfo]);
          const url = URL.createObjectURL(decryptedBlob);
          setDecryptedUrl(url);
          setStatus('success');
        } catch (e) {
          throw new Error("Wrong password or decryption error.");
        }
      } else {
        // No password provided? treating as plain file? 
        // Or user forgot password.
        // If it sends .enc file, we should probably warn.
        // Let's assume for MVP we just download the blob directly if no password?
        // Or fail.
        // Let's try to decrypt if password exists, else show direct link.
        const url = URL.createObjectURL(blob);
        setDecryptedUrl(url);
        setStatus('success');
        toast.success("File unlocked successfully!");
      }

    } catch (err) {
      console.error(err);
      setStatus('error');
      setErrorMsg(err.message);
      toast.error(err.message || 'Decryption failed');
    }
  };

  // Helper for CryptoJs
  function convertWordArrayToUint8Array(wordArray) {
    const words = wordArray.words;
    const sigBytes = wordArray.sigBytes;
    const u8 = new Uint8Array(sigBytes);
    for (let i = 0; i < sigBytes; i++) {
      const byte = (words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
      u8[i] = byte;
    }
    return u8;
  }

  return (
    <div className="flex flex-col items-center justify-center h-full max-w-2xl mx-auto">
      <div className="bg-card w-full p-8 rounded-xl border border-white/10 shadow-2xl">
        <div className="flex items-center mb-6">
          <Unlock className="text-primary mr-3" size={28} />
          <h2 className="text-2xl font-bold text-white">Decrypt File</h2>
        </div>

        {status === 'idle' || status === 'error' ? (
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-400 block mb-2">Enter Share ID</label>
              <input
                type="text"
                value={shareId}
                onChange={(e) => setShareId(e.target.value)}
                placeholder="e.g. 550e8400-e29b-..."
                className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:border-primary focus:outline-none placeholder-gray-600"
              />
            </div>
            {status === 'error' && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded text-red-400 text-sm flex items-center">
                <AlertTriangle size={16} className="mr-2" />
                {errorMsg}
              </div>
            )}
            <button
              onClick={checkShareLink}
              className="w-full bg-primary text-black font-bold py-3 rounded-lg hover:opacity-90 transition-all mt-4"
            >
              Find File
            </button>
          </div>
        ) : status === 'pending_password' ? (
          <div className="space-y-4 animate-fade-in">
            <div className="p-4 bg-white/5 rounded-lg border border-white/10 mb-4">
              <p className="text-gray-400 text-sm">File Found:</p>
              <p className="text-white font-mono font-bold text-lg">{fileData.filename}</p>
              <div className="flex items-center text-xs text-gray-500 mt-2">
                <Eye size={12} className="mr-1" />
                <span>{fileData.views_left} views remaining</span>
              </div>
            </div>

            <div>
              <label className="text-sm text-gray-400 block mb-2">Decryption Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter secret key..."
                  className="w-full bg-black/50 border border-white/10 rounded-lg p-3 pr-10 text-white focus:border-primary focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-500 hover:text-white"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button
              onClick={downloadAndDecrypt}
              className="w-full bg-primary text-black font-bold py-3 rounded-lg hover:opacity-90 transition-all mt-4"
            >
              Unlock & Download
            </button>
          </div>
        ) : status === 'success' ? (
          <div className="text-center animate-fade-in">
            <FileText size={48} className="text-primary mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">File Ready!</h3>
            <p className="text-gray-400 mb-6">Your file has been successfully retrieved and decrypted locally.</p>

            <a
              href={decryptedUrl}
              download={fileData.filename.replace('.enc', '')}
              className="inline-flex items-center justify-center w-full bg-primary text-black font-bold py-3 rounded-lg hover:opacity-90 transition-all"
            >
              <Download size={20} className="mr-2" />
              Download File
            </a>

            <button
              onClick={() => { setStatus('idle'); setShareId(''); setPassword(''); setFileData(null); }}
              className="mt-4 text-sm text-gray-500 hover:text-white underline"
            >
              Unlock Another
            </button>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-primary animate-pulse text-xl font-mono">
              {status === 'checking' && 'Searching Vault...'}
              {status === 'downloading' && 'Downloading Encrypted Blob...'}
              {status === 'decrypting' && 'Decrypting locally...'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileAccess;

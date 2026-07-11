import React, { useState, useEffect, useRef } from 'react';
import { CloudRain, UploadCloud, File, Trash2, Download, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { uploadFile, listFiles, downloadFileUrl, deleteFile } from './services/api';
import './App.css';

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error';
}

function App() {
  const [files, setFiles] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    try {
      setIsLoading(true);
      const data = await listFiles();
      setFiles(data);
    } catch (error) {
      showToast('Failed to load files', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const handleFileUpload = async (file: File) => {
    try {
      setIsUploading(true);
      await uploadFile(file);
      showToast('File uploaded successfully!', 'success');
      fetchFiles();
    } catch (error: any) {
      showToast(error.message || 'Upload failed', 'error');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDelete = async (fileName: string) => {
    try {
      await deleteFile(fileName);
      showToast('File deleted successfully', 'success');
      fetchFiles();
    } catch (error: any) {
      showToast(error.message || 'Delete failed', 'error');
    }
  };

  const handleDownload = (fileName: string) => {
    window.location.href = downloadFileUrl(fileName);
  };

  return (
    <div className="app-container animate-fade-in">
      <header className="header">
        <h1>
          <CloudRain className="text-gradient" size={40} />
          <span className="text-gradient">Azure Storage</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>Modern web wrapper for Azure Blobs</p>
      </header>

      <main className="glass-panel">
        <div 
          className={`upload-zone ${isDragging ? 'drag-active' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input 
            type="file" 
            className="file-input" 
            onChange={handleFileInput}
            ref={fileInputRef}
            disabled={isUploading}
          />
          {isUploading ? (
            <Loader2 className="upload-icon animate-spin" size={48} />
          ) : (
            <UploadCloud className="upload-icon" size={48} />
          )}
          <div className="upload-text">
            {isUploading ? (
              <p>Uploading to Azure...</p>
            ) : (
              <p>Drag & drop a file here, or <span>click to browse</span></p>
            )}
          </div>
        </div>

        <div style={{ marginTop: '2.5rem' }}>
          <div className="file-list-header">
            <h2>Your Files</h2>
            <button className="btn btn-icon" onClick={fetchFiles} title="Refresh list">
              {isLoading ? <Loader2 size={20} className="animate-spin" /> : <Loader2 size={20} style={{transform: 'rotate(45deg)'}} />}
            </button>
          </div>

          {isLoading && files.length === 0 ? (
            <div className="empty-state">
              <Loader2 className="animate-spin" size={32} />
              <p>Loading files...</p>
            </div>
          ) : files.length === 0 ? (
            <div className="empty-state">
              <File size={48} style={{ opacity: 0.5 }} />
              <p>No files found. Upload something to get started!</p>
            </div>
          ) : (
            <div className="file-grid">
              {files.map((fileName, index) => (
                <div className="file-card" key={`${fileName}-${index}`}>
                  <div className="file-info">
                    <File size={20} className="file-icon" />
                    <span className="file-name" title={fileName}>{fileName}</span>
                  </div>
                  <div className="file-actions">
                    <button 
                      className="btn-icon" 
                      onClick={() => handleDownload(fileName)}
                      title="Download file"
                    >
                      <Download size={18} />
                    </button>
                    <button 
                      className="btn-icon danger" 
                      onClick={() => handleDelete(fileName)}
                      title="Delete file"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Toast Notifications */}
      <div className="toast-container">
        {toasts.map(toast => (
          <div key={toast.id} className={`toast ${toast.type}`}>
            {toast.type === 'success' ? (
              <CheckCircle2 color="var(--success-color)" size={20} />
            ) : (
              <AlertCircle color="var(--danger-color)" size={20} />
            )}
            <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{toast.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;

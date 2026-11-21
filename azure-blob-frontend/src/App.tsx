import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Cloud,
  UploadCloud,
  File,
  Trash2,
  Download,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Settings,
  Search,
  RefreshCw,
  LayoutGrid,
  List,
  Copy,
  Check,
  Eye,
  EyeOff,
  X,
  FileText,
  Image,
  Archive,
  Code,
  Database,
  HardDrive,
  AlertTriangle,
  ArrowUpDown
} from 'lucide-react';
import { uploadFile, listFiles, downloadFile, deleteFile } from './services/api';
import './App.css';

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

type ViewMode = 'grid' | 'table';
type SortOrder = 'name-asc' | 'name-desc';

const getFileIcon = (fileName: string) => {
  const ext = fileName.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'gif':
    case 'svg':
    case 'webp':
      return <Image size={20} className="file-icon icon-image" aria-hidden="true" />;
    case 'pdf':
    case 'txt':
    case 'doc':
    case 'docx':
    case 'md':
      return <FileText size={20} className="file-icon icon-text" aria-hidden="true" />;
    case 'zip':
    case 'tar':
    case 'gz':
    case '7z':
    case 'rar':
      return <Archive size={20} className="file-icon icon-archive" aria-hidden="true" />;
    case 'js':
    case 'ts':
    case 'tsx':
    case 'jsx':
    case 'json':
    case 'html':
    case 'css':
    case 'java':
    case 'py':
    case 'sql':
      return <Code size={20} className="file-icon icon-code" aria-hidden="true" />;
    default:
      return <File size={20} className="file-icon icon-generic" aria-hidden="true" />;
  }
};

const getFileExtensionBadge = (fileName: string) => {
  const parts = fileName.split('.');
  if (parts.length > 1) {
    return parts.pop()?.toUpperCase();
  }
  return 'FILE';
};

function App() {
  const [files, setFiles] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadFileName, setUploadFileName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortOrder, setSortOrder] = useState<SortOrder>('name-asc');
  const [copiedFileName, setCopiedFileName] = useState<string | null>(null);
  const [fileToDelete, setFileToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Settings states
  const [showSettings, setShowSettings] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [connectionString, setConnectionString] = useState(
    localStorage.getItem('azure_connection_string') || ''
  );
  const [containerName, setContainerName] = useState(
    localStorage.getItem('azure_container_name') || ''
  );
  const [isCustomConfig, setIsCustomConfig] = useState(
    !!localStorage.getItem('azure_connection_string')
  );

  const fileInputRef = useRef<HTMLInputElement>(null);
  const settingsModalRef = useRef<HTMLDivElement>(null);
  const deleteModalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchFiles();
  }, []);

  // Escape key handler for dialogs
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (fileToDelete) setFileToDelete(null);
        if (showSettings) setShowSettings(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [fileToDelete, showSettings]);

  const fetchFiles = async () => {
    try {
      setIsLoading(true);
      setLoadError(null);
      const data = await listFiles();
      setFiles(data);
    } catch (error: any) {
      const errMsg = error.message || 'Failed to load files';
      setLoadError(errMsg);
      showToast('Could not load blob list. Check your Azure connection.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
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
      setUploadFileName(file.name);
      await uploadFile(file);
      showToast(`Uploaded "${file.name}" successfully`, 'success');
      await fetchFiles();
    } catch (error: any) {
      showToast(error.message || `Upload failed for ${file.name}`, 'error');
    } finally {
      setIsUploading(false);
      setUploadFileName('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const confirmDelete = async () => {
    if (!fileToDelete) return;
    try {
      setIsDeleting(true);
      await deleteFile(fileToDelete);
      showToast(`Deleted "${fileToDelete}" successfully`, 'success');
      setFileToDelete(null);
      await fetchFiles();
    } catch (error: any) {
      showToast(error.message || 'Delete operation failed', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDownload = async (fileName: string) => {
    try {
      showToast(`Downloading "${fileName}"...`, 'info');
      const blob = await downloadFile(fileName);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      showToast(error.message || `Failed to download ${fileName}`, 'error');
    }
  };

  const handleCopyName = (fileName: string) => {
    navigator.clipboard.writeText(fileName);
    setCopiedFileName(fileName);
    showToast(`Copied filename to clipboard`, 'info');
    setTimeout(() => {
      setCopiedFileName((curr) => (curr === fileName ? null : curr));
    }, 2000);
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (connectionString.trim()) {
      localStorage.setItem('azure_connection_string', connectionString.trim());
      if (containerName.trim()) {
        localStorage.setItem('azure_container_name', containerName.trim());
      } else {
        localStorage.removeItem('azure_container_name');
      }
      setIsCustomConfig(true);
      showToast('Azure Storage configuration saved!', 'success');
    } else {
      handleResetSettings();
      return;
    }
    setShowSettings(false);
    fetchFiles();
  };

  const handleResetSettings = () => {
    localStorage.removeItem('azure_connection_string');
    localStorage.removeItem('azure_container_name');
    setConnectionString('');
    setContainerName('');
    setIsCustomConfig(false);
    showToast('Switched to default Azurite local emulator', 'info');
    setShowSettings(false);
    fetchFiles();
  };

  // Filtered and sorted files
  const filteredFiles = useMemo(() => {
    let result = files.filter((f) =>
      f.toLowerCase().includes(searchQuery.trim().toLowerCase())
    );
    if (sortOrder === 'name-asc') {
      result.sort((a, b) => a.localeCompare(b));
    } else {
      result.sort((a, b) => b.localeCompare(a));
    }
    return result;
  }, [files, searchQuery, sortOrder]);

  return (
    <div className="app-container">
      {/* App Header */}
      <header className="app-header">
        <div className="brand-group">
          <div className="brand-icon-wrapper" aria-hidden="true">
            <Cloud className="brand-icon" size={28} />
          </div>
          <div>
            <h1 className="brand-title">Azure Blob Explorer</h1>
            <p className="brand-subtitle">
              High-performance object storage manager & workbench
            </p>
          </div>
        </div>

        <div className="header-controls">
          <div
            className={`status-chip ${isCustomConfig ? 'status-cloud' : 'status-local'}`}
            title={
              isCustomConfig
                ? 'Connected using custom Azure credentials'
                : 'Connected to local Azurite emulator'
            }
          >
            {isCustomConfig ? (
              <Database size={14} aria-hidden="true" />
            ) : (
              <HardDrive size={14} aria-hidden="true" />
            )}
            <span>{isCustomConfig ? 'Azure Cloud' : 'Azurite (Local)'}</span>
            {containerName && <span className="container-tag">{containerName}</span>}
          </div>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setShowSettings(true)}
            aria-label="Storage configuration"
          >
            <Settings size={17} aria-hidden="true" />
            <span>Settings</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="app-main">
        {/* Upload Drop Zone Card */}
        <section className="section-card upload-section" aria-label="Upload files">
          <div
            className={`drop-zone ${isDragging ? 'is-dragging' : ''} ${isUploading ? 'is-busy' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => !isUploading && fileInputRef.current?.click()}
            role="region"
            aria-label="File upload dropzone"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                fileInputRef.current?.click();
              }
            }}
          >
            <input
              type="file"
              ref={fileInputRef}
              className="sr-only"
              onChange={handleFileInput}
              disabled={isUploading}
              aria-label="Upload file"
            />

            <div className="drop-zone-content">
              {isUploading ? (
                <div className="upload-progress-state" aria-live="polite">
                  <Loader2 className="spinner upload-spinner" size={44} aria-hidden="true" />
                  <p className="upload-state-title">Uploading to Azure Blob...</p>
                  <p className="upload-state-file">{uploadFileName}</p>
                </div>
              ) : (
                <>
                  <div className="upload-icon-circle" aria-hidden="true">
                    <UploadCloud size={32} />
                  </div>
                  <div className="upload-copy">
                    <p className="drop-title">
                      Drop your files here, or <span className="browse-link">browse</span>
                    </p>
                    <p className="drop-subtitle">
                      Supports documents, images, archives, code files, and binary data
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </section>

        {/* Toolbar & Explorer View */}
        <section className="section-card explorer-section" aria-label="Blob storage files">
          <div className="explorer-toolbar">
            <div className="toolbar-left">
              <div className="search-field">
                <Search size={16} className="search-icon" aria-hidden="true" />
                <label htmlFor="blob-search" className="sr-only">
                  Search files in container
                </label>
                <input
                  id="blob-search"
                  type="text"
                  placeholder="Filter by filename..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                />
                {searchQuery && (
                  <button
                    type="button"
                    className="btn-icon clear-btn"
                    onClick={() => setSearchQuery('')}
                    aria-label="Clear search"
                  >
                    <X size={14} aria-hidden="true" />
                  </button>
                )}
              </div>

              <div className="file-count-badge" aria-live="polite">
                {isLoading ? (
                  <span>Scanning...</span>
                ) : (
                  <span>
                    {filteredFiles.length} {filteredFiles.length === 1 ? 'file' : 'files'}
                    {searchQuery ? ` of ${files.length}` : ''}
                  </span>
                )}
              </div>
            </div>

            <div className="toolbar-right">
              <div className="segmented-control" role="group" aria-label="View layout toggle">
                <button
                  type="button"
                  className={`segment-btn ${viewMode === 'grid' ? 'active' : ''}`}
                  onClick={() => setViewMode('grid')}
                  aria-pressed={viewMode === 'grid'}
                  title="Grid View"
                >
                  <LayoutGrid size={16} aria-hidden="true" />
                  <span className="sr-only">Grid View</span>
                </button>
                <button
                  type="button"
                  className={`segment-btn ${viewMode === 'table' ? 'active' : ''}`}
                  onClick={() => setViewMode('table')}
                  aria-pressed={viewMode === 'table'}
                  title="Table View"
                >
                  <List size={16} aria-hidden="true" />
                  <span className="sr-only">Table View</span>
                </button>
              </div>

              <button
                type="button"
                className="btn btn-secondary sort-btn"
                onClick={() =>
                  setSortOrder((prev) => (prev === 'name-asc' ? 'name-desc' : 'name-asc'))
                }
                title={`Sort: ${sortOrder === 'name-asc' ? 'A to Z' : 'Z to A'}`}
                aria-label={`Sort: ${sortOrder === 'name-asc' ? 'A to Z' : 'Z to A'}`}
              >
                <ArrowUpDown size={15} aria-hidden="true" />
                <span className="btn-label-responsive">
                  {sortOrder === 'name-asc' ? 'A → Z' : 'Z → A'}
                </span>
              </button>

              <button
                type="button"
                className="btn btn-secondary refresh-btn"
                onClick={fetchFiles}
                disabled={isLoading}
                title="Refresh list"
                aria-label="Refresh files list"
              >
                <RefreshCw size={15} className={isLoading ? 'spinner' : ''} aria-hidden="true" />
                <span className="btn-label-responsive">Refresh</span>
              </button>
            </div>
          </div>

          {/* Loading Skeleton */}
          {isLoading && files.length === 0 && (
            <div className="skeleton-grid" aria-busy="true" aria-label="Loading files">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="skeleton-card">
                  <div className="skeleton-shimmer skeleton-icon" />
                  <div className="skeleton-content">
                    <div className="skeleton-shimmer skeleton-line w-75" />
                    <div className="skeleton-shimmer skeleton-line w-40" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Error State */}
          {!isLoading && loadError && files.length === 0 && (
            <div className="state-panel error-panel" role="alert">
              <AlertCircle size={36} className="error-icon" aria-hidden="true" />
              <h3 className="state-title">Unable to Connect to Azure Storage</h3>
              <p className="state-description">{loadError}</p>
              <div className="state-actions">
                <button type="button" className="btn btn-primary" onClick={fetchFiles}>
                  <RefreshCw size={15} aria-hidden="true" />
                  Try Again
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowSettings(true)}
                >
                  <Settings size={15} aria-hidden="true" />
                  Check Settings
                </button>
              </div>
            </div>
          )}

          {/* Empty State - No Files in Storage */}
          {!isLoading && !loadError && files.length === 0 && (
            <div className="state-panel empty-panel">
              <div className="empty-icon-wrapper" aria-hidden="true">
                <HardDrive size={36} />
              </div>
              <h3 className="state-title">Your Blob Container is Empty</h3>
              <p className="state-description">
                There are currently no objects stored in this container. Upload a document, image,
                or archive above to get started.
              </p>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => fileInputRef.current?.click()}
              >
                <UploadCloud size={16} aria-hidden="true" />
                Upload Your First File
              </button>
            </div>
          )}

          {/* Search Empty State */}
          {!isLoading && files.length > 0 && filteredFiles.length === 0 && (
            <div className="state-panel no-results-panel">
              <Search size={32} className="no-results-icon" aria-hidden="true" />
              <h3 className="state-title">No matching files found</h3>
              <p className="state-description">
                No blobs matched <strong>"{searchQuery}"</strong>. Try checking your spelling or clear
                the search filter.
              </p>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setSearchQuery('')}
              >
                Clear Search Filter
              </button>
            </div>
          )}

          {/* Files List: Grid View */}
          {!isLoading && filteredFiles.length > 0 && viewMode === 'grid' && (
            <div className="file-grid" role="list" aria-label="Blob files grid">
              {filteredFiles.map((fileName) => (
                <div key={fileName} className="file-card" role="listitem">
                  <div className="card-top">
                    <div className="file-icon-box">{getFileIcon(fileName)}</div>
                    <span className="file-ext-badge">{getFileExtensionBadge(fileName)}</span>
                  </div>

                  <div className="card-body">
                    <p className="file-name" title={fileName}>
                      {fileName}
                    </p>
                  </div>

                  <div className="card-actions">
                    <button
                      type="button"
                      className="btn-action"
                      onClick={() => handleCopyName(fileName)}
                      title="Copy file name"
                      aria-label={`Copy filename ${fileName}`}
                    >
                      {copiedFileName === fileName ? (
                        <Check size={16} className="text-success" aria-hidden="true" />
                      ) : (
                        <Copy size={16} aria-hidden="true" />
                      )}
                    </button>

                    <button
                      type="button"
                      className="btn-action"
                      onClick={() => handleDownload(fileName)}
                      title="Download file"
                      aria-label={`Download ${fileName}`}
                    >
                      <Download size={16} aria-hidden="true" />
                    </button>

                    <button
                      type="button"
                      className="btn-action action-danger"
                      onClick={() => setFileToDelete(fileName)}
                      title="Delete file"
                      aria-label={`Delete ${fileName}`}
                    >
                      <Trash2 size={16} aria-hidden="true" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Files List: Table View */}
          {!isLoading && filteredFiles.length > 0 && viewMode === 'table' && (
            <div className="table-responsive-container">
              <table className="files-table">
                <caption className="sr-only">List of Azure Blob Storage files</caption>
                <thead>
                  <tr>
                    <th scope="col" className="th-type">
                      Type
                    </th>
                    <th scope="col" className="th-name">
                      File Name
                    </th>
                    <th scope="col" className="th-actions text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFiles.map((fileName) => (
                    <tr key={fileName}>
                      <td className="td-type">
                        <div className="table-file-icon">{getFileIcon(fileName)}</div>
                      </td>
                      <td className="td-name">
                        <div className="table-name-wrapper">
                          <span className="table-file-name" title={fileName}>
                            {fileName}
                          </span>
                          <span className="table-ext-tag">{getFileExtensionBadge(fileName)}</span>
                        </div>
                      </td>
                      <td className="td-actions text-right">
                        <div className="table-actions-group">
                          <button
                            type="button"
                            className="btn-action"
                            onClick={() => handleCopyName(fileName)}
                            title="Copy file name"
                            aria-label={`Copy filename ${fileName}`}
                          >
                            {copiedFileName === fileName ? (
                              <Check size={15} className="text-success" aria-hidden="true" />
                            ) : (
                              <Copy size={15} aria-hidden="true" />
                            )}
                          </button>
                          <button
                            type="button"
                            className="btn-action"
                            onClick={() => handleDownload(fileName)}
                            title="Download file"
                            aria-label={`Download ${fileName}`}
                          >
                            <Download size={15} aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            className="btn-action action-danger"
                            onClick={() => setFileToDelete(fileName)}
                            title="Delete file"
                            aria-label={`Delete ${fileName}`}
                          >
                            <Trash2 size={15} aria-hidden="true" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      {/* Delete Confirmation Modal (Accessibility & Destructive action protection) */}
      {fileToDelete && (
        <div
          className="modal-backdrop"
          onClick={() => !isDeleting && setFileToDelete(null)}
          role="presentation"
        >
          <div
            className="modal-dialog delete-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-dialog-title"
            aria-describedby="delete-dialog-desc"
            onClick={(e) => e.stopPropagation()}
            ref={deleteModalRef}
          >
            <div className="modal-header">
              <div className="modal-danger-badge" aria-hidden="true">
                <AlertTriangle size={24} />
              </div>
              <div>
                <h2 id="delete-dialog-title" className="modal-title">
                  Delete Blob
                </h2>
                <p className="modal-subtitle">Confirm permanent deletion</p>
              </div>
            </div>

            <div className="modal-body">
              <p id="delete-dialog-desc">
                Are you sure you want to permanently delete{' '}
                <strong className="delete-target-name">{fileToDelete}</strong>? This action cannot
                be undone and the file will be removed from Azure Storage immediately.
              </p>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setFileToDelete(null)}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger-solid"
                onClick={confirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <Loader2 size={16} className="spinner" aria-hidden="true" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 size={16} aria-hidden="true" />
                    <span>Delete Permanently</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div
          className="modal-backdrop"
          onClick={() => setShowSettings(false)}
          role="presentation"
        >
          <div
            className="modal-dialog settings-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="settings-dialog-title"
            onClick={(e) => e.stopPropagation()}
            ref={settingsModalRef}
          >
            <div className="modal-header">
              <div className="modal-icon-badge" aria-hidden="true">
                <Settings size={22} />
              </div>
              <div className="modal-header-text">
                <h2 id="settings-dialog-title" className="modal-title">
                  Storage Configuration
                </h2>
                <p className="modal-subtitle">
                  Configure custom Azure Blob credentials or use default local Azurite
                </p>
              </div>
              <button
                type="button"
                className="btn-icon close-modal-btn"
                onClick={() => setShowSettings(false)}
                aria-label="Close settings modal"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            <form onSubmit={handleSaveSettings} className="modal-body">
              <div className="form-group">
                <label htmlFor="connString" className="form-label">
                  Azure Connection String
                </label>
                <div className="input-with-action">
                  <input
                    id="connString"
                    type={showPassword ? 'text' : 'password'}
                    className="form-input"
                    placeholder="DefaultEndpointsProtocol=https;AccountName=...;AccountKey=..."
                    value={connectionString}
                    onChange={(e) => setConnectionString(e.target.value)}
                    autoComplete="off"
                    spellCheck={false}
                  />
                  <button
                    type="button"
                    className="input-inline-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide connection string' : 'Show connection string'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <span className="form-hint">
                  Leave empty to default to local Azurite emulator (127.0.0.1:10000).
                </span>
              </div>

              <div className="form-group">
                <label htmlFor="containerName" className="form-label">
                  Container Name <span className="label-optional">(Optional)</span>
                </label>
                <input
                  id="containerName"
                  type="text"
                  className="form-input"
                  placeholder="e.g., documents, media (defaults to server config)"
                  value={containerName}
                  onChange={(e) => setContainerName(e.target.value)}
                />
                <span className="form-hint">
                  Overrides default container specified in backend application properties.
                </span>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleResetSettings}
                >
                  Reset to Azurite
                </button>
                <button type="submit" className="btn btn-primary">
                  Save & Connect
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Accessible Toast Notification System */}
      <div className="toast-container" role="region" aria-label="Notifications" aria-live="polite">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast-${toast.type}`} role="status">
            <div className="toast-icon">
              {toast.type === 'success' && <CheckCircle2 size={18} aria-hidden="true" />}
              {toast.type === 'error' && <AlertCircle size={18} aria-hidden="true" />}
              {toast.type === 'info' && <Cloud size={18} aria-hidden="true" />}
            </div>
            <p className="toast-message">{toast.message}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;

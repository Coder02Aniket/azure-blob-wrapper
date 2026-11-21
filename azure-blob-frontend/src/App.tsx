import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import {
  Grid2X2,
  List,
  Search,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Trash2,
  X,
} from 'lucide-react';
import type { BlobMetadata, FileCategory, ViewMode, SortField } from './types';
import { deleteBlob, downloadBlob } from './lib/api';
import { formatBytes } from './lib/format';
import { useTheme } from './hooks/useTheme';
import { usePersistedConfig } from './hooks/usePersistedConfig';
import { useToasts } from './hooks/useToasts';
import { useDialog } from './hooks/useDialog';
import { useBlobs } from './hooks/useBlobs';
import { useUploadQueue } from './hooks/useUploadQueue';

import { AppShell } from './components/layout/AppShell';
import { Rail } from './components/layout/Rail';
import { Topbar } from './components/layout/Topbar';
import { IntakeStrip } from './components/upload/IntakeStrip';
import { DropOverlay } from './components/upload/DropOverlay';
import { UploadQueue } from './components/upload/UploadQueue';
import { ManifestTable } from './components/blobs/ManifestTable';
import { BlobGrid } from './components/blobs/BlobGrid';
import { BulkBar } from './components/blobs/BulkBar';
import { EmptyState } from './components/blobs/EmptyState';
import { ErrorState } from './components/blobs/ErrorState';
import { NoResults } from './components/blobs/NoResults';
import { Skeleton } from './components/blobs/Skeleton';
import { ConnectionDrawer } from './components/settings/ConnectionDrawer';
import { BlobViewer } from './components/viewers/BlobViewer';
import { Button } from './components/ui/Button';
import { Dialog } from './components/ui/Dialog';
import { SegmentedControl } from './components/ui/SegmentedControl';
import { ToastContainer } from './components/ui/Toast';
import './App.css';

const CATEGORY_OPTIONS: { value: FileCategory; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'documents', label: 'Docs' },
  { value: 'images', label: 'Images' },
  { value: 'media', label: 'Media' },
  { value: 'archives', label: 'Archives' },
  { value: 'code', label: 'Code' },
  { value: 'data', label: 'Data' },
  { value: 'other', label: 'Other' },
];

const SORT_OPTIONS: { value: SortField; label: string }[] = [
  { value: 'name', label: 'Key' },
  { value: 'size', label: 'Size' },
  { value: 'lastModified', label: 'Modified' },
];

function App() {
  const { theme, setTheme } = useTheme();
  const { config, saveConfig, resetToDefault, isCustomConfig } = usePersistedConfig();
  const { toasts, addToast, dismissToast } = useToasts();
  const {
    dialogRef: deleteDialogRef,
    open: openDeleteDialog,
    close: closeDeleteDialog,
  } = useDialog();
  const {
    dialogRef: shortcutsDialogRef,
    open: openShortcutsDialog,
    close: closeShortcutsDialog,
  } = useDialog();

  const {
    blobs,
    filteredBlobs,
    paginatedBlobs,
    isLoading,
    error,
    reload,
    searchQuery,
    setSearchQuery,
    category,
    setCategory,
    sortField,
    setSortField,
    sortDirection,
    setSortDirection,
    page,
    setPage,
    totalPages,
    pageSize,
    selectedKeys,
    toggleSelect,
    selectAll,
    clearSelection,
    totalBytes,
  } = useBlobs(config);

  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [previewBlob, setPreviewBlob] = useState<BlobMetadata | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const dragDepth = useRef(0);

  const existingNames = useMemo(() => new Set(blobs.map((blob) => blob.name)), [blobs]);

  const handleUploadSuccess = useCallback(() => {
    void reload();
  }, [reload]);

  const {
    queue,
    addFiles,
    cancelUpload,
    retryUpload,
    clearFinished,
    dismissItem,
    activeCount,
  } = useUploadQueue(config, existingNames, handleUploadSuccess, addToast);

  // Global drag-and-drop staging.
  useEffect(() => {
    const hasFiles = (e: DragEvent) =>
      Array.from(e.dataTransfer?.types ?? []).includes('Files');

    const onDragEnter = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      dragDepth.current += 1;
      setIsDragging(true);
    };
    const onDragOver = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
    };
    const onDragLeave = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      dragDepth.current = Math.max(0, dragDepth.current - 1);
      if (dragDepth.current === 0) setIsDragging(false);
    };
    const onDrop = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      dragDepth.current = 0;
      setIsDragging(false);
      const files = Array.from(e.dataTransfer?.files ?? []);
      if (files.length > 0) addFiles(files);
    };

    window.addEventListener('dragenter', onDragEnter);
    window.addEventListener('dragover', onDragOver);
    window.addEventListener('dragleave', onDragLeave);
    window.addEventListener('drop', onDrop);
    return () => {
      window.removeEventListener('dragenter', onDragEnter);
      window.removeEventListener('dragover', onDragOver);
      window.removeEventListener('dragleave', onDragLeave);
      window.removeEventListener('drop', onDrop);
    };
  }, [addFiles]);

  const browseFiles = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length > 0) addFiles(files);
    e.target.value = '';
  };

  const handleDownload = useCallback(
    (name: string) => {
      void downloadBlob(name, config).catch((err: unknown) => {
        addToast('Download failed', err instanceof Error ? err.message : String(err), 'error');
      });
    },
    [config, addToast]
  );

  const handleView = useCallback((blob: BlobMetadata) => {
    setPreviewBlob(blob);
  }, []);

  const handleCopy = useCallback(
    async (text: string) => {
      try {
        await navigator.clipboard.writeText(text);
        addToast('Key copied', text, 'success');
      } catch {
        addToast('Could not copy', 'Clipboard access is unavailable in this browser.', 'error');
      }
    },
    [addToast]
  );

  const requestDelete = useCallback((names: string[]) => {
    if (names.length === 0) return;
    setPendingDelete(names);
    openDeleteDialog();
  }, [openDeleteDialog]);

  const confirmDelete = async () => {
    if (pendingDelete.length === 0) return;
    setIsDeleting(true);
    let succeeded = 0;
    let failed = 0;
    for (const name of pendingDelete) {
      try {
        await deleteBlob(name, config);
        succeeded += 1;
      } catch (err: unknown) {
        failed += 1;
        addToast(`Could not delete ${name}`, err instanceof Error ? err.message : String(err), 'error');
      }
    }
    setIsDeleting(false);
    closeDeleteDialog();
    setPendingDelete([]);
    clearSelection();
    if (previewBlob && pendingDelete.includes(previewBlob.name)) {
      setPreviewBlob(null);
    }
    if (succeeded > 0) {
      addToast('Delete complete', `${succeeded} object${succeeded === 1 ? '' : 's'} removed.`, 'success');
      void reload();
    }
    if (failed === 0 && succeeded === 0) {
      addToast('Nothing deleted', 'Select at least one object.', 'warning');
    }
  };

  // Keyboard shortcuts.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isTyping =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        target?.isContentEditable;

      if (e.key === 'Escape') {
        if (previewBlob) setPreviewBlob(null);
        if (isSettingsOpen) setIsSettingsOpen(false);
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey || isTyping) return;

      if (e.key === '?') {
        e.preventDefault();
        openShortcutsDialog();
      } else if (e.key === ',') {
        e.preventDefault();
        setIsSettingsOpen(true);
      } else if (e.key.toLowerCase() === 't') {
        e.preventDefault();
        setTheme(theme === 'dark' ? 'light' : 'dark');
      } else if (e.key === '/') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [theme, setTheme, openShortcutsDialog, isSettingsOpen, previewBlob]);

  const hasFilters = Boolean(searchQuery.trim()) || category !== 'all';
  const startIndex = (page - 1) * pageSize;
  const displayedCount = filteredBlobs.length;
  const totalCount = blobs.length;

  const showSkeleton = isLoading && totalCount === 0;
  const showError = Boolean(error) && totalCount === 0;
  const showEmpty = !isLoading && !error && displayedCount === 0 && totalCount === 0;
  const showNoResults = !isLoading && !error && displayedCount === 0 && totalCount > 0 && hasFilters;

  return (
    <AppShell
      rail={
        <Rail
          objectCount={totalCount}
          totalBytesLabel={formatBytes(totalBytes)}
          environmentLabel={isCustomConfig ? 'CUSTOM' : 'DEFAULT'}
          containerName={config.containerName || '—'}
          theme={theme}
          onThemeToggle={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          onSettings={() => setIsSettingsOpen(true)}
          onShortcuts={openShortcutsDialog}
        />
      }
    >
      <a href="#manifest" className="skip-link">Skip to manifest</a>

      <Topbar
        title="Blob manifest"
        subtitle={`${displayedCount} of ${totalCount} objects · ${formatBytes(totalBytes)} stored`}
        isRefreshing={isLoading}
        onRefresh={() => void reload()}
      />

      <main className="depot-content">
        <IntakeStrip isDragging={isDragging} fileCount={activeCount} onBrowse={browseFiles} />

        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="sr-only"
          onChange={handleFileInput}
          aria-label="Choose files to upload"
        />

        {queue.length > 0 && (
          <UploadQueue
            items={queue}
            onCancel={cancelUpload}
            onRetry={retryUpload}
            onDismiss={dismissItem}
            onClearCompleted={clearFinished}
          />
        )}

        <section className="depot-manifest" id="manifest" aria-label="Blob manifest">
          <div className="depot-manifest-toolbar">
            <div className="depot-search-wrap">
              <Search size={14} aria-hidden="true" />
              <input
                ref={searchInputRef}
                type="search"
                className="depot-search"
                placeholder="Filter by key…  /"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Filter blobs by key"
              />
              {searchQuery && (
                <button type="button" className="depot-search-clear" onClick={() => setSearchQuery('')} aria-label="Clear filter">
                  <X size={13} />
                </button>
              )}
            </div>

            <div className="depot-category-chips" role="group" aria-label="Filter by file type">
              {CATEGORY_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={`depot-chip ${category === option.value ? 'is-active' : ''}`}
                  onClick={() => setCategory(option.value)}
                  aria-pressed={category === option.value}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <div className="depot-toolbar-right">
              <label className="depot-sort-control">
                <SlidersHorizontal size={13} aria-hidden="true" />
                <span className="sr-only">Sort by</span>
                <select
                  value={sortField}
                  onChange={(e) => setSortField(e.target.value as SortField)}
                  aria-label="Sort field"
                >
                  {SORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
                <button
                  type="button"
                  className="depot-sort-dir"
                  onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
                  aria-label={`Sort ${sortDirection === 'asc' ? 'descending' : 'ascending'}`}
                >
                  {sortDirection === 'asc' ? '↑' : '↓'}
                </button>
              </label>

              <SegmentedControl<ViewMode>
                ariaLabel="Manifest view"
                value={viewMode}
                onChange={setViewMode}
                options={[
                  { value: 'table', label: 'Table', icon: <List size={13} /> },
                  { value: 'grid', label: 'Grid', icon: <Grid2X2 size={13} /> },
                ]}
              />
            </div>
          </div>

          {selectedKeys.size > 0 && (
            <BulkBar
              selectedCount={selectedKeys.size}
              onDelete={() => requestDelete(Array.from(selectedKeys))}
              onCopyKeys={() => void handleCopy(Array.from(selectedKeys).join('\n'))}
              onClear={clearSelection}
              isDeleting={isDeleting}
            />
          )}

          <div className="depot-manifest-body">
            {showSkeleton && <Skeleton />}
            {showError && (
              <ErrorState
                message={error ?? 'Unknown error'}
                endpoint={config.endpoint}
                onRetry={() => void reload()}
                onSettings={() => setIsSettingsOpen(true)}
              />
            )}
            {showEmpty && <EmptyState onUpload={browseFiles} />}
            {showNoResults && <NoResults query={searchQuery} onClear={() => { setSearchQuery(''); setCategory('all'); }} />}
            {!showSkeleton && !showError && !showEmpty && !showNoResults && (
              viewMode === 'table' ? (
                <ManifestTable
                  blobs={paginatedBlobs}
                  startIndex={startIndex}
                  selectedKeys={selectedKeys}
                  onToggleSelect={toggleSelect}
                  onSelectAll={selectAll}
                  allSelected={paginatedBlobs.length > 0 && selectedKeys.size === paginatedBlobs.length}
                  onDownload={handleDownload}
                  onView={handleView}
                  onDelete={(name) => requestDelete([name])}
                  onCopy={(name) => void handleCopy(name)}
                  sortField={sortField}
                  sortDirection={sortDirection}
                />
              ) : (
                <BlobGrid
                  blobs={paginatedBlobs}
                  startIndex={startIndex}
                  selectedKeys={selectedKeys}
                  onToggleSelect={toggleSelect}
                  onView={handleView}
                  onDownload={handleDownload}
                />
              )
            )}
          </div>

          {displayedCount > pageSize && (
            <div className="depot-pagination">
              <span className="font-mono">
                {startIndex + 1}–{Math.min(startIndex + pageSize, displayedCount)} of {displayedCount}
              </span>
              <div className="depot-pagination-controls">
                <Button size="sm" variant="secondary" icon={<ChevronLeft size={14} />} onClick={() => setPage(page - 1)} disabled={page <= 1}>
                  Previous
                </Button>
                <span className="font-mono depot-page-label">PAGE {page} / {totalPages}</span>
                <Button size="sm" variant="secondary" icon={<ChevronRight size={14} />} iconPosition="right" onClick={() => setPage(page + 1)} disabled={page >= totalPages}>
                  Next
                </Button>
              </div>
            </div>
          )}
        </section>
      </main>

      <ConnectionDrawer
        key={isSettingsOpen ? 'open' : 'closed'}
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        config={config}
        onSave={saveConfig}
        onReset={resetToDefault}
        isCustomConfig={isCustomConfig}
      />

      <Dialog
        dialogRef={deleteDialogRef}
        title={pendingDelete.length > 1 ? 'Delete selected objects?' : 'Delete object?'}
        description="This permanently removes the object(s) from the container. This action cannot be undone."
        onClose={() => { setPendingDelete([]); }}
      >
        <div className="depot-delete-list">
          {pendingDelete.slice(0, 8).map((name) => (
            <div key={name} className="depot-delete-item font-mono">{name}</div>
          ))}
          {pendingDelete.length > 8 && (
            <div className="depot-delete-more font-mono">+{pendingDelete.length - 8} more…</div>
          )}
        </div>
        <div className="depot-dialog-actions">
          <Button variant="secondary" onClick={closeDeleteDialog} disabled={isDeleting}>Cancel</Button>
          <Button variant="danger" icon={<Trash2 size={14} />} onClick={() => void confirmDelete()} loading={isDeleting}>
            Delete {pendingDelete.length > 1 ? `${pendingDelete.length} objects` : 'object'}
          </Button>
        </div>
      </Dialog>

      <Dialog
        dialogRef={shortcutsDialogRef}
        title="Keyboard map"
        description="Navigate the ledger without leaving the keyboard."
        onClose={closeShortcutsDialog}
      >
        <dl className="depot-shortcuts">
          <div><dt><kbd>/</kbd></dt><dd>Focus the key filter</dd></div>
          <div><dt><kbd>?</kbd></dt><dd>Open this keyboard map</dd></div>
          <div><dt><kbd>,</kbd></dt><dd>Open connection settings</dd></div>
          <div><dt><kbd>T</kbd></dt><dd>Toggle light / dark theme</dd></div>
          <div><dt><kbd>Esc</kbd></dt><dd>Close settings or dialog</dd></div>
        </dl>
        <div className="depot-dialog-actions">
          <Button variant="primary" onClick={closeShortcutsDialog}>Got it</Button>
        </div>
      </Dialog>

      {previewBlob && (
        <BlobViewer
          blob={previewBlob}
          config={config}
          onClose={() => setPreviewBlob(null)}
          onDownload={handleDownload}
        />
      )}

      <DropOverlay isVisible={isDragging} />
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </AppShell>
  );
}

export default App;

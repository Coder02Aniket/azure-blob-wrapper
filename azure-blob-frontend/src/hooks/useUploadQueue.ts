import { useState, useCallback, useRef, useEffect } from 'react';
import type { UploadItem, BlobConfig } from '../types';
import { uploadBlobWithProgress } from '../lib/api';
import { validateFileSize } from '../lib/validation';

export function useUploadQueue(
  config: BlobConfig,
  existingNames: Set<string>,
  onUploadSuccess: (file: File) => void,
  onToast: (title: string, message?: string, type?: 'success' | 'error' | 'warning' | 'info') => void
) {
  const [queue, setQueue] = useState<UploadItem[]>([]);
  const isProcessingRef = useRef(false);

  const addFiles = useCallback(
    (files: File[]) => {
      const newItems: UploadItem[] = [];

      for (const file of files) {
        const val = validateFileSize(file.size);
        if (!val.valid) {
          onToast(`Cannot upload "${file.name}"`, val.error, 'error');
          continue;
        }

        if (existingNames.has(file.name)) {
          onToast(`Overwriting existing file`, `"${file.name}" will overwrite the existing blob.`, 'warning');
        }

        const id = `upl_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        newItems.push({
          id,
          file,
          status: 'queued',
          progress: 0,
          loaded: 0,
          total: file.size,
        });
      }

      if (newItems.length > 0) {
        setQueue((prev) => [...prev, ...newItems]);
      }
    },
    [existingNames, onToast]
  );

  const cancelUpload = useCallback((id: string) => {
    setQueue((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          if (item.xhr) {
            item.xhr.abort();
          }
          return { ...item, status: 'canceled', error: 'Canceled by user' };
        }
        return item;
      })
    );
  }, []);

  const retryUpload = useCallback((id: string) => {
    setQueue((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          return { ...item, status: 'queued', progress: 0, loaded: 0, error: undefined };
        }
        return item;
      })
    );
  }, []);

  const clearFinished = useCallback(() => {
    setQueue((prev) => prev.filter((i) => i.status === 'uploading' || i.status === 'queued'));
  }, []);

  const dismissItem = useCallback((id: string) => {
    setQueue((prev) => prev.filter((i) => i.id !== id));
  }, []);

  // Worker loop for queue processing (max 2 concurrent)
  useEffect(() => {
    const activeCount = queue.filter((i) => i.status === 'uploading').length;
    const nextItem = queue.find((i) => i.status === 'queued');

    if (activeCount < 2 && nextItem && !isProcessingRef.current) {
      isProcessingRef.current = true;

      const currentItem = nextItem;
      const { promise, xhr } = uploadBlobWithProgress(
        currentItem.file,
        config,
        (loaded, total) => {
          const percent = total > 0 ? Math.round((loaded / total) * 100) : 0;
          setQueue((prev) =>
            prev.map((it) =>
              it.id === currentItem.id
                ? { ...it, loaded, total, progress: percent }
                : it
            )
          );
        }
      );

      // Mark as uploading
      setQueue((prev) =>
        prev.map((it) => (it.id === currentItem.id ? { ...it, status: 'uploading', xhr } : it))
      );

      isProcessingRef.current = false;

      promise
        .then(() => {
          setQueue((prev) =>
            prev.map((it) =>
              it.id === currentItem.id
                ? { ...it, status: 'done', progress: 100, loaded: currentItem.file.size }
                : it
            )
          );
          onUploadSuccess(currentItem.file);
          onToast(`Upload complete`, `"${currentItem.file.name}" stored successfully.`, 'success');
        })
        .catch((err: unknown) => {
          const msg = err instanceof Error ? err.message : 'Upload failed';
          setQueue((prev) =>
            prev.map((it) =>
              it.id === currentItem.id
                ? { ...it, status: it.status === 'canceled' ? 'canceled' : 'error', error: msg }
                : it
            )
          );
        });
    }
  }, [queue, config, onUploadSuccess, onToast]);

  const activeCount = queue.filter((i) => i.status === 'uploading' || i.status === 'queued').length;
  const isUploading = activeCount > 0;

  return {
    queue,
    addFiles,
    cancelUpload,
    retryUpload,
    clearFinished,
    dismissItem,
    isUploading,
    activeCount,
  };
}

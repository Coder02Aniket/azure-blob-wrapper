const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/blobs';

export const uploadFile = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(await response.text() || 'Failed to upload file');
  }

  return response.text();
};

export const listFiles = async (): Promise<string[]> => {
  const response = await fetch(`${API_BASE_URL}/list`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch files');
  }

  return response.json();
};

export const downloadFileUrl = (fileName: string): string => {
  return `${API_BASE_URL}/download/${encodeURIComponent(fileName)}`;
};

export const deleteFile = async (fileName: string): Promise<string> => {
  const response = await fetch(`${API_BASE_URL}/delete/${encodeURIComponent(fileName)}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error(await response.text() || 'Failed to delete file');
  }

  return response.text();
};

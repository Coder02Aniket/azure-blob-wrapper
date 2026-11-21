const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/blobs';

const getHeaders = (): Record<string, string> => {
  const connectionString = localStorage.getItem('azure_connection_string');
  const containerName = localStorage.getItem('azure_container_name');
  const headers: Record<string, string> = {};
  if (connectionString) {
    headers['X-Azure-Connection-String'] = connectionString;
  }
  if (containerName) {
    headers['X-Azure-Container-Name'] = containerName;
  }
  return headers;
};

export const uploadFile = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/upload`, {
    method: 'POST',
    headers: getHeaders(),
    body: formData,
  });

  if (!response.ok) {
    throw new Error(await response.text() || 'Failed to upload file');
  }

  return response.text();
};

export const listFiles = async (): Promise<string[]> => {
  const response = await fetch(`${API_BASE_URL}/list`, {
    headers: getHeaders(),
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch files');
  }

  return response.json();
};

export const downloadFile = async (fileName: string): Promise<Blob> => {
  const response = await fetch(`${API_BASE_URL}/download/${encodeURIComponent(fileName)}`, {
    method: 'GET',
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to download file');
  }

  return response.blob();
};

export const deleteFile = async (fileName: string): Promise<string> => {
  const response = await fetch(`${API_BASE_URL}/delete/${encodeURIComponent(fileName)}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error(await response.text() || 'Failed to delete file');
  }

  return response.text();
};

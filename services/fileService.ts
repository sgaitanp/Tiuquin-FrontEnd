const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080/api/v1';

function getToken(): string {
  return sessionStorage.getItem('token') ?? '';
}

export async function downloadFile(fileId: string, filename: string) {
  const res = await fetch(`${API_BASE}/files/${fileId}/download`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (!res.ok) throw new Error(`Failed to download file (${res.status})`);
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export async function previewFile(fileId: string) {
  const res = await fetch(`${API_BASE}/files/${fileId}/download`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (!res.ok) throw new Error(`Failed to preview file (${res.status})`);
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
}

export function getFileUrl(fileId: string) {
  return `${API_BASE}/files/${fileId}/download`;
}

export function getAuthHeaders() {
  return { Authorization: `Bearer ${getToken()}` };
}

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:4000').replace(/\/$/, '');

export async function getMessages() {
  const res = await fetch(`${API_URL}/api/messages`);
  if (!res.ok) {
    throw new Error(`Request failed with status ${res.status}`);
  }
  const body = await res.json();
  return body.data;
}

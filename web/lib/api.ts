export async function apiFetch(path: string, init?: RequestInit) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  const response = await fetch(`${apiUrl}${path}`, init);
  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`API error: ${response.status} ${response.statusText} ${text}`);
  }
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

export function generateIdempotencyKey(): string {
  return crypto.randomUUID();
}


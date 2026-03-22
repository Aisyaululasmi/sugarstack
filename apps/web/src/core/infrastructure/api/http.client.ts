const BASE_URL = (process.env.NEXT_PUBLIC_API_URL ?? '') + '/api';

interface FetchOptions extends RequestInit {
  token?: string;
}

export async function apiClient<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const { token, ...rest } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(rest.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, { ...rest, headers });
  const json = await res.json();

  if (!res.ok || !json.success) {
    throw new Error(json.error ?? 'Request failed');
  }

  return json.data as T;
}

export class HttpError extends Error {
  status: number;
  constructor(status: number) {
    super(`Request failed: ${status}`);
    this.status = status;
  }
}

export async function fetcher<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new HttpError(res.status);
  return res.json();
}

export function failureText(err: unknown) {
  return err instanceof Error ? err.message : "network error";
}

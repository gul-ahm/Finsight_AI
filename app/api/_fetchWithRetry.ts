// app/api/_fetchWithRetry.ts

/**
 * Performs a fetch with retry logic on network errors or non‑2xx responses.
 * Retries are attempted with exponential back‑off (500 ms → 1 s → 2 s ...).
 * If the response status is 429 (rate limit), the function respects the "Retry‑After"
 * header when present, otherwise waits the exponential back‑off interval.
 */
export async function fetchWithRetry(
  url: string,
  options?: RequestInit,
  retries = 2,
  backoffMs = 500,
): Promise<Response> {
  let attempt = 0;
  while (true) {
    try {
      const response = await fetch(url, options);
      if (response.ok) {
        return response;
      }
      // Handle rate limiting specially
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After');
        const waitMs = retryAfter ? parseInt(retryAfter, 10) * 1000 : backoffMs * Math.pow(2, attempt);
        if (attempt < retries) {
          console.warn(`Rate limited (${response.status}). Waiting ${waitMs} ms before retry ${attempt + 1}`);
          await new Promise((r) => setTimeout(r, waitMs));
          attempt++;
          continue;
        }
      }
      // For other non‑ok responses, throw to trigger retry logic
      const errorData = await response.json().catch(() => ({}));
      const errMsg = errorData.message || response.statusText || 'Fetch error';
      throw new Error(errMsg);
    } catch (err) {
      if (attempt >= retries) {
        throw err;
      }
      const waitMs = backoffMs * Math.pow(2, attempt);
      console.warn(`Fetch attempt ${attempt + 1} failed: ${(err as Error).message}. Retrying in ${waitMs} ms`);
      await new Promise((r) => setTimeout(r, waitMs));
      attempt++;
    }
  }
}

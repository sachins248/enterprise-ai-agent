/**
 * API client — thin wrapper around fetch that:
 * 1. Auto-adds Authorization: Bearer <token> when a token is provided
 * 2. Sets Content-Type: application/json on POST/PUT requests
 * 3. Throws on non-2xx responses with the error message from the response body
 */

export async function apiFetch(url, options = {}, token = null) {
  const headers = { ...options.headers };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (options.body && typeof options.body === 'object') {
    headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(options.body);
  }

  const response = await fetch(url, { ...options, headers });

  if (!response.ok) {
    let message = `HTTP ${response.status}`;
    try {
      const err = await response.json();
      message = err.message || err.error || message;
    } catch {
      // ignore — keep the generic message
    }
    throw new Error(message);
  }

  return response;
}

/**
 * Streams a POST SSE endpoint using the Fetch API.
 *
 * Why not EventSource?
 * The standard EventSource API only supports GET requests and cannot send
 * a request body or custom headers (like Authorization: Bearer ...).
 * Fetch + ReadableStream gives us the same SSE streaming with full control.
 *
 * @param {string} url
 * @param {object} body       — JSON body to send
 * @param {string} token      — JWT access token
 * @param {function} onChunk  — called with each text chunk as it arrives
 * @param {function} onDone   — called when the stream ends
 * @param {function} onError  — called if an error occurs
 */
export async function streamSSE(url, body, token, onChunk, onDone, onError) {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // SSE events are delimited by blank lines (\n\n)
      const parts = buffer.split('\n\n');
      buffer = parts.pop();  // last part may be incomplete — keep it in the buffer

      for (const part of parts) {
        const lines = part.split('\n');
        // SSE spec allows "field:value" or "field: value" — handle both
        const eventLine = lines.find(l => l.startsWith('event:'));
        const dataLine  = lines.find(l => l.startsWith('data:'));

        if (!dataLine) continue;

        const eventType = eventLine
          ? eventLine.slice(eventLine.indexOf(':') + 1).trim()
          : 'message';
        const data = dataLine.slice(dataLine.indexOf(':') + 1).trimStart();

        if (eventType === 'done') {
          onDone?.();
          return;
        }

        if (eventType === 'message') {
          onChunk(data);
        }
      }
    }

    onDone?.();
  } catch (err) {
    onError?.(err.message);
  }
}

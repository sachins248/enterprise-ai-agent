/**
 * API client — thin wrapper around fetch that:
 * 1. Auto-adds Authorization: Bearer <token> when a token is provided
 * 2. Sets Content-Type: application/json on POST/PUT requests
 * 3. Throws on non-2xx responses with the error message from the response body
 */

// Sends a request to the server and throws a clear error if it fails
export async function apiFetch(url, options = {}, token = null) {
  // Copy the headers we were given so we don't change the original
  const headers = { ...options.headers };

  // If we have a token, send it so the server knows who we are
  if (token) {
    // "Bearer" is the standard word that goes before a token
    headers['Authorization'] = `Bearer ${token}`;
  }
  // If the body is an object, send it as JSON
  if (options.body && typeof options.body === 'object') {
    // Tell the server the body is JSON
    headers['Content-Type'] = 'application/json';
    // Turn the object into JSON text
    options.body = JSON.stringify(options.body);
  }

  // Send the request and wait for the answer
  const response = await fetch(url, { ...options, headers });

  // If the server said something went wrong (not a 2xx status)
  if (!response.ok) {
    // Start with a simple message like "HTTP 403"
    let message = `HTTP ${response.status}`;
    // Reading the error body can fail, so we use try
    try {
      // Read the error JSON the server sent
      const err = await response.json();
      // Use the server's message if there is one
      message = err.message || err.error || message;
    } catch {
      // ignore — keep the generic message
    }
    // Stop and report the error
    throw new Error(message);
  }

  // Everything worked, so give back the response
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
// Sends a request and reads the answer piece by piece as it arrives
export async function streamSSE(url, body, token, onChunk, onDone, onError) {
  // Anything can fail on the network, so we use try
  try {
    // Send the POST request
    const response = await fetch(url, {
      // We send data, so use POST
      method: 'POST',
      // The headers for the request
      headers: {
        // Tell the server the body is JSON
        'Content-Type': 'application/json',
        // Add the token only if we have one
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
      // Turn the body object into JSON text
      body: JSON.stringify(body),
    });

    // If the server said something went wrong, stop
    if (!response.ok) {
      // Report the status code
      throw new Error(`HTTP ${response.status}`);
    }

    // A reader lets us take the answer one piece at a time
    const reader = response.body.getReader();
    // Turns raw bytes into text
    const decoder = new TextDecoder();
    // Holds text that has arrived but is not a full event yet
    let buffer = '';

    // Keep reading until the stream ends
    while (true) {
      // Wait for the next piece of the answer
      const { done, value } = await reader.read();
      // If there is nothing more, leave the loop
      if (done) break;

      // Add the new text to the buffer (stream: true keeps split characters safe)
      buffer += decoder.decode(value, { stream: true });

      // SSE events are delimited by blank lines (\n\n)
      // Split the buffer into complete events
      const parts = buffer.split('\n\n');
      buffer = parts.pop();  // last part may be incomplete — keep it in the buffer

      // Handle each complete event
      for (const part of parts) {
        // An event is made of lines like "event: message" and "data: hello"
        const lines = part.split('\n');
        // SSE spec allows "field:value" or "field: value" — handle both
        // Find the line that names the event
        const eventLine = lines.find(l => l.startsWith('event:'));
        // Find the line that holds the data
        const dataLine  = lines.find(l => l.startsWith('data:'));

        // An event without data is not useful, so skip it
        if (!dataLine) continue;

        // Read the event name, or use "message" if none was given
        const eventType = eventLine
          ? eventLine.slice(eventLine.indexOf(':') + 1).trim()
          : 'message';
        // Read the data (remove the "data:" part and the space after it)
        const data = dataLine.slice(dataLine.indexOf(':') + 1).trimStart();

        // The "done" event means the answer is finished
        if (eventType === 'done') {
          // Tell the caller we are done (if they gave a function for it)
          onDone?.();
          // Stop reading
          return;
        }

        // A "message" event holds a piece of the answer
        if (eventType === 'message') {
          // Give the piece to the caller
          onChunk(data);
        }
      }
    }

    // The stream ended without a "done" event, so still tell the caller
    onDone?.();
  } catch (err) {
    // Tell the caller what went wrong (if they gave a function for it)
    onError?.(err.message);
  }
}

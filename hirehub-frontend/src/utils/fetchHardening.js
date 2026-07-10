/**
 * fetchHardening.js
 * Standardized utility to handle fetch requests with:
 * - 30 seconds request timeout (via AbortController)
 * - Automatic retries (max 3 times) on:
 *   - HTTP Statuses: 429, 500, 502, 503, 504
 *   - Network timeout / abort errors
 *   - Invalid AI responses (determined by a custom validator function)
 * - Backoff delays: 1s, 2s, 4s
 * - Duplicate request prevention (deduplicating concurrent identical calls)
 */

const activeRequests = new Map();

export async function fetchWithRetry(url, options = {}, validateFn = null, maxRetries = 3, initialBackoff = 1000) {
  // Generate request key for deduplication
  const requestKey = `${options.method || 'GET'}:${url}:${JSON.stringify(options.body || '')}`;
  
  if (activeRequests.has(requestKey)) {
    console.log(`[Deduplicator] Reusing active concurrent request for: ${url}`);
    return activeRequests.get(requestKey);
  }

  const promise = (async () => {
    let attempt = 0;
    let lastError = null;

    while (attempt <= maxRetries) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

      try {
        const fetchOptions = {
          ...options,
          signal: controller.signal
        };

        const response = await fetch(url, fetchOptions);
        clearTimeout(timeoutId);

        // Check for specific retryable status codes
        if ([429, 500, 502, 503, 504].includes(response.status)) {
          throw new Error(`Server returned HTTP status ${response.status}`);
        }

        // If response is not ok and not retryable status, throw non-retryable error
        if (!response.ok) {
          let errData = {};
          try {
            errData = await response.json();
          } catch (e) {}
          const nonRetryError = new Error(errData.message || `Server returned HTTP status ${response.status}`);
          nonRetryError.nonRetryable = true;
          nonRetryError.code = errData.code;
          throw nonRetryError;
        }

        const data = await response.json();
        
        // If API returned failure state (business rule validation)
        if (data && data.success === false) {
          const nonRetryError = new Error(data.message || "API returned success false");
          nonRetryError.nonRetryable = true;
          nonRetryError.code = data.code;
          throw nonRetryError;
        }

        // Validate AI response payload structure
        if (validateFn) {
          const payload = data.data || data;
          const isValid = validateFn(payload);
          if (!isValid) {
            throw new Error("Invalid AI JSON structure validation failure");
          }
        }

        return data;
      } catch (error) {
        clearTimeout(timeoutId);
        lastError = error;

        if (error.nonRetryable) {
          console.warn(`[AI Request Non-Retryable Failure] for ${url} - Error: ${error.message}`);
          throw error;
        }

        const isTimeout = error.name === "AbortError";
        console.warn(
          `[AI Request Failed] Attempt ${attempt + 1}/${maxRetries + 1} for ${url} - Error: ${error.message} ${isTimeout ? '(Timeout)' : ''}`
        );

        attempt++;
        if (attempt <= maxRetries) {
          const backoff = Math.pow(2, attempt - 1) * initialBackoff;
          console.warn(`[AI Request Retry] Retrying in ${backoff}ms...`);
          await new Promise(resolve => setTimeout(resolve, backoff));
        }
      }
    }

    throw lastError || new Error("Request failed after maximum retries");
  })();

  // Track active request and clean up on completion
  activeRequests.set(requestKey, promise);
  try {
    return await promise;
  } finally {
    activeRequests.delete(requestKey);
  }
}

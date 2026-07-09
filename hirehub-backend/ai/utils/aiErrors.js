/**
 * AI Error Handling Utility
 *
 * Standardized error codes and response formatter for AI features.
 * Prevents raw Google SDK or internal errors from being exposed to the frontend.
 */

const ERROR_CODES = {
  AI_RATE_LIMIT:          "AI_RATE_LIMIT",
  AI_UNAVAILABLE:         "AI_UNAVAILABLE",
  AI_CONFIGURATION_ERROR: "AI_CONFIGURATION_ERROR",
  AI_INVALID_RESPONSE:    "AI_INVALID_RESPONSE",
  RESUME_PARSE_ERROR:     "RESUME_PARSE_ERROR",
  VALIDATION_ERROR:       "VALIDATION_ERROR",
};

class AIError extends Error {
  /**
   * @param {string} code - One of ERROR_CODES
   * @param {string} message - User-friendly error message
   * @param {number} statusCode - HTTP status code (default: 500)
   */
  constructor(code, message, statusCode = 500) {
    super(message);
    this.name = "AIError";
    this.code = code;
    this.statusCode = statusCode;
  }
}

/**
 * Normalizes any error into a standardized JSON response format.
 * @param {Error} err
 * @returns {{ statusCode: number, body: { success: false, code: string, message: string } }}
 */
function formatAIErrorResponse(err) {
  if (err instanceof AIError) {
    return {
      statusCode: err.statusCode,
      body: {
        success: false,
        code: err.code,
        message: err.message,
      },
    };
  }

  // Handle known error patterns if unhandled elsewhere
  const msg = err.message || "";

  if (msg.includes("429") || msg.includes("quota") || msg.includes("Quota exceeded")) {
    return {
      statusCode: 429,
      body: {
        success: false,
        code: ERROR_CODES.AI_RATE_LIMIT,
        message: "AI service rate limit reached. Please try again in a few seconds.",
      },
    };
  }

  if (msg.includes("503") || msg.includes("high demand") || msg.includes("Unavailable")) {
    return {
      statusCode: 503,
      body: {
        success: false,
        code: ERROR_CODES.AI_UNAVAILABLE,
        message: "AI service is temporarily busy. Please try again shortly.",
      },
    };
  }

  if (msg.includes("GEMINI_API_KEY") || msg.includes("API key") || msg.includes("API_KEY_INVALID")) {
    return {
      statusCode: 503,
      body: {
        success: false,
        code: ERROR_CODES.AI_CONFIGURATION_ERROR,
        message: "AI service is not properly configured. Please check server settings.",
      },
    };
  }

  return {
    statusCode: 500,
    body: {
      success: false,
      code: "AI_ERROR",
      message: "An unexpected error occurred during AI processing. Please try again.",
    },
  };
}

module.exports = {
  ERROR_CODES,
  AIError,
  formatAIErrorResponse,
};

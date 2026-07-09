/**
 * Gemini Provider — Wrapper for Google Generative AI (@google/generative-ai)
 *
 * Models verified against the API key's ListModels response (July 2026):
 *   1. gemini-2.5-flash  — confirmed working (primary)
 *   2. gemini-2.0-flash  — confirmed available (fallback)
 *   3. gemini-2.0-flash-lite — confirmed available (last resort)
 *
 * NOTE: gemini-1.5-flash, gemini-1.5-pro, gemini-2.0-flash-exp, gemini-2.5-pro
 * are NOT available on this API key and must NOT be used.
 */

const { GoogleGenerativeAI } = require("@google/generative-ai");
const { AIError, ERROR_CODES } = require("../utils/aiErrors");

class GeminiProvider {
  constructor(apiKey) {
    if (!apiKey || apiKey === "your_gemini_api_key_here") {
      throw new AIError(
        ERROR_CODES.AI_CONFIGURATION_ERROR,
        "Gemini API key is not configured. Please set GEMINI_API_KEY in server environment.",
        503
      );
    }
    this.client = new GoogleGenerativeAI(apiKey);
    // Only models confirmed working via ListModels API on this key
    this.models = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-2.0-flash-lite"];
  }

  async sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async generateContent(prompt) {
    let lastError = null;

    for (const modelName of this.models) {
      for (let attempt = 0; attempt <= 1; attempt++) {
        try {
          const model = this.client.getGenerativeModel({ model: modelName });
          const result = await model.generateContent(prompt);
          const response = await result.response;
          const text = response.text();

          if (text && text.trim().length > 0) {
            console.log(`[GeminiProvider] Success with model '${modelName}'`);
            return text;
          }
        } catch (err) {
          lastError = err;
          const msg = err.message || "";
          const isRateLimit = msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED");

          if (isRateLimit && attempt === 0) {
            const backoffMs = 2000 + Math.floor(Math.random() * 1000);
            console.warn(`[GeminiProvider] Model '${modelName}' rate limited, retrying in ${backoffMs}ms...`);
            await this.sleep(backoffMs);
          } else {
            console.warn(`[GeminiProvider] Model '${modelName}' failed: ${msg.substring(0, 120)}`);
            break; // Try next model
          }
        }
      }
    }

    const msg = lastError ? lastError.message : "Unknown error";

    if (msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED") || msg.includes("quota")) {
      throw new AIError(
        ERROR_CODES.AI_RATE_LIMIT,
        "AI service rate limit reached. Please wait a moment and try again.",
        429
      );
    }

    if (msg.includes("API_KEY_INVALID") || msg.includes("401") || msg.includes("403")) {
      throw new AIError(
        ERROR_CODES.AI_CONFIGURATION_ERROR,
        "Invalid Gemini API key. Please check your GEMINI_API_KEY in the server .env file.",
        503
      );
    }

    if (msg.includes("404")) {
      throw new AIError(
        ERROR_CODES.AI_UNAVAILABLE,
        "AI model not available. Please contact the administrator to update the model configuration.",
        503
      );
    }

    throw new AIError(
      ERROR_CODES.AI_UNAVAILABLE,
      "AI service is temporarily unavailable. Please try again.",
      500
    );
  }
}

module.exports = GeminiProvider;

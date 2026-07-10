/**
 * AI Provider Factory
 *
 * Central creation hub for AI providers.
 * Decouples the rest of the application from specific LLM vendors.
 *
 * Supported providers:
 *   - gemini    (active)
 *   - openai    (future)
 *   - claude    (future)
 *   - groq      (future)
 *   - openrouter(future)
 *   - ollama    (future)
 */

const GeminiProvider = require("./geminiProvider");
const { AIError, ERROR_CODES } = require("../utils/aiErrors");

let _instance = null;

/**
 * Creates and returns the configured AI provider instance.
 * @returns {GeminiProvider}
 */
function getAIProvider() {
  if (_instance) return _instance;

  const providerType = (process.env.AI_PROVIDER || "gemini").toLowerCase().trim();

  switch (providerType) {
    case "gemini":
      _instance = new GeminiProvider(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY);
      break;

    // Prepared for future LLM providers:
    // case "openai":
    //   _instance = new OpenAIProvider(process.env.OPENAI_API_KEY);
    //   break;
    // case "claude":
    //   _instance = new ClaudeProvider(process.env.ANTHROPIC_API_KEY);
    //   break;
    // case "groq":
    //   _instance = new GroqProvider(process.env.GROQ_API_KEY);
    //   break;
    // case "openrouter":
    //   _instance = new OpenRouterProvider(process.env.OPENROUTER_API_KEY);
    //   break;
    // case "ollama":
    //   _instance = new OllamaProvider(process.env.OLLAMA_BASE_URL || "http://localhost:11434");
    //   break;

    default:
      throw new AIError(
        ERROR_CODES.AI_CONFIGURATION_ERROR,
        `Unsupported AI_PROVIDER: '${providerType}'. Supported providers: gemini`,
        500
      );
  }

  return _instance;
}

/**
 * Reset singleton instance (useful for testing or dynamic config reloads)
 */
function resetAIProvider() {
  _instance = null;
}

module.exports = {
  getAIProvider,
  resetAIProvider,
};

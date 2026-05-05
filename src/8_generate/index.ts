/**
 * 8_generate Module Entry Point
 *
 * Exports public API for local LLM-based translation generation
 */

// Services
export { WordTranslationService, createWordTranslationService, translateWord } from "./services/WordTranslationService"
export { FragmentTranslationService, createFragmentTranslationService, translateFragment } from "./services/FragmentTranslationService"
export { TextExplanationService, createTextExplanationService, explainText, parseTextExplanationResponse } from "./services/TextExplanationService"
export { OpenAICompatibleClient, createOpenAICompatibleClient } from "./services/llm/OpenAICompatibleClient"

// Types
export type {
    LLMConfig,
    WordTranslationRequest,
    WordTranslationResult,
    FragmentTranslationRequest,
    FragmentTranslationResult,
    TextExplanationExample,
    TextExplanationPartOfSpeech,
    TextExplanationRequest,
    TextExplanationResult,
    TextExplanationSelectionType,
    ChatMessage,
    ChatRole,
} from "./types/GenerateTypes"

// Constants
export { DEFAULT_TEMPERATURE, DEFAULT_MAX_TOKENS, DEFAULT_TIMEOUT } from "./constants/GenerateConstants"

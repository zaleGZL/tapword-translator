/**
 * Translation Module
 *
 * Main entry point for translation functionality
 *
 * This module handles all translation-related business logic,
 * including word translation, context-aware translation, and result formatting.
 */

// Export types
export type {
    ExplainTextParams,
    FragmentTranslationResult,
    TextExplanationExample,
    TextExplanationPartOfSpeech,
    TextExplanationResult,
    TextExplanationSelectionType,
    TranslateFragmentParams,
    TranslateParams,
    TranslationResult,
} from "./types/TranslationModels"
export { TranslationError } from "./types/TranslationError"

// Export services
export { explainText, translateFragment, translateWord } from "./services/TranslationService"

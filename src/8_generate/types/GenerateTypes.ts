/**
 * Type definitions for 8_generate module
 */

/**
 * LLM chat message role
 */
export type ChatRole = "system" | "user" | "assistant"

/**
 * LLM chat message
 */
export interface ChatMessage {
    role: ChatRole
    content: string
}

/**
 * LLM provider configuration
 */
export interface LLMConfig {
    /** API key for authentication */
    apiKey: string
    /** Base URL for API endpoint */
    baseUrl: string
    /** Model name/identifier */
    model: string
    /** Temperature for generation (0-2, default: 0.35) */
    temperature?: number
    /** Maximum tokens to generate (default: 1200) */
    maxTokens?: number
    /** Request timeout in milliseconds (default: 10000) */
    timeout?: number
}

/**
 * Word translation request parameters
 */
export interface WordTranslationRequest {
    /** Word to translate */
    word: string
    /** Text before the word in the sentence */
    leadingText?: string
    /** Text after the word in the sentence */
    trailingText?: string
    /** Source language code (e.g., 'en', 'zh') */
    sourceLanguage?: string
    /** Target language code (e.g., 'zh', 'en', default: 'zh') */
    targetLanguage?: string
    /** Optional context information */
    contextInfo?: {
        /** Sentences before the current sentence */
        previousSentences?: string[]
        /** Sentences after the current sentence */
        nextSentences?: string[]
        /** Source title (e.g., book name, article title) */
        sourceTitle?: string
        /** Source author */
        sourceAuthor?: string
        /** Source type (e.g., 'book', 'article', 'webpage') */
        sourceType?: string
        /** Dictionary definition for reference */
        dictionaryDefinition?: string
    }
}

/**
 * Word translation result
 */
export interface WordTranslationResult {
    /** Translation of the target word */
    wordTranslation: string
    /** Translation of the text fragment/sentence containing the word */
    fragmentTranslation?: string
}

/**
 * Fragment translation request parameters
 */
export interface FragmentTranslationRequest {
    /** Text fragment to translate */
    fragment: string
    /** Text before the fragment inside the sentence */
    leadingText?: string
    /** Text after the fragment inside the sentence */
    trailingText?: string
    /** Source language code (e.g., 'en', 'zh') */
    sourceLanguage?: string
    /** Target language code (e.g., 'zh', 'en', default: 'zh') */
    targetLanguage?: string
    /** Optional context information */
    contextInfo?: {
        /** Sentences before the current sentence */
        previousSentences?: string[]
        /** Sentences after the current sentence */
        nextSentences?: string[]
        /** Source title (e.g., book name, article title) */
        sourceTitle?: string
        /** Source author */
        sourceAuthor?: string
        /** Source type (e.g., 'book', 'article', 'webpage') */
        sourceType?: string
    }
}

/**
 * Fragment translation result
 */
export interface FragmentTranslationResult {
    /** Translation of the target fragment */
    translation: string
    /** Translation of the complete sentence containing the fragment */
    sentenceTranslation?: string
}

export type TextExplanationSelectionType = "word" | "fragment"

export interface TextExplanationRequest {
    /** Selected word, phrase, or sentence to explain */
    text: string
    /** Whether the selection is treated as a single word or longer text */
    selectionType: TextExplanationSelectionType
    /** Text before the selection in the same sentence */
    leadingText?: string
    /** Text after the selection in the same sentence */
    trailingText?: string
    /** Source language code */
    sourceLanguage?: string
    /** Target language code used for the explanation */
    targetLanguage?: string
    /** Optional context information */
    contextInfo?: {
        previousSentences?: string[]
        nextSentences?: string[]
        sourceTitle?: string
        sourceAuthor?: string
        sourceType?: string
    }
}

export interface TextExplanationExample {
    sentence: string
    translation: string
    note?: string
}

export interface TextExplanationPartOfSpeech {
    partOfSpeech: string
    meanings: string[]
}

export interface TextExplanationResult {
    summary: string
    meaning: string
    usage: string
    grammar?: string
    partsOfSpeech?: TextExplanationPartOfSpeech[]
    examples: TextExplanationExample[]
    collocations?: string[]
    wordFormation?: string
    memoryTips?: string[]
}

export interface LLMTextExplanationResponse {
    summary: string
    meaning: string
    usage: string
    grammar?: string
    parts_of_speech?: Array<{
        part_of_speech?: string
        meanings?: string[]
    }>
    examples?: Array<{
        sentence?: string
        translation?: string
        note?: string
    }>
    collocations?: string[]
    word_formation?: string
    memory_tips?: string[]
}

/**
 * Raw fragment LLM response format (JSON structure)
 */
export interface LLMFragmentTranslationResponse {
    /** Translation of the target fragment */
    translation: string
    /** Translation of the complete sentence containing the fragment */
    sentence_translation?: string
}

/**
 * Raw LLM response format (JSON structure)
 */
export interface LLMTranslationResponse {
    /** Translation of the target word */
    word_translation: string
    /** Translation of the text fragment */
    fragment_translation: string
}

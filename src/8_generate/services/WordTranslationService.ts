/**
 * Word Translation Service
 *
 * Orchestrates word translation using LLM generation
 */

import * as loggerModule from "@/0_common/utils/logger"
import type { LLMConfig, WordTranslationRequest, WordTranslationResult, LLMTranslationResponse, ChatMessage } from "../types/GenerateTypes"
import * as promptLoaderModule from "../utils/promptLoader"
import * as templateRendererModule from "../utils/templateRenderer"
import * as languageUtilsModule from "../utils/languageUtils"
import * as constants from "../constants/GenerateConstants"
import { OpenAICompatibleClient } from "./llm/OpenAICompatibleClient"

const logger = loggerModule.createLogger("8_generate/WordTranslationService")

/**
 * Escape XML special characters
 * @param text Text to escape
 * @returns Escaped text
 */
function escapeXmlChars(text: string): string {
    return text.replace(/</g, "&lt;").replace(/>/g, "&gt;")
}

/**
 * Build optional section with title and value
 * Returns formatted section if value exists, otherwise returns empty string
 * @param title Section title
 * @param value Section value
 * @returns Formatted section (# Title\nvalue) or empty string
 */
function buildOptionalSection(title: string, value: string | undefined): string {
    if (value && value.trim().length > 0) {
        return `# ${title}\n${value.trim()}`
    }
    return ""
}

function normalizePromptText(text: string | undefined): string {
    return (text ?? "").replace(/\n/g, " ")
}

function buildHighlightedSentence(sentence: string, target: string, leadingText: string, trailingText: string): string {
    const escapedTarget = escapeXmlChars(target)

    if (leadingText || trailingText) {
        return `<fragment>${escapeXmlChars(leadingText)}<target>${escapedTarget}</target>${escapeXmlChars(trailingText)}</fragment>`
    }

    const targetIndex = sentence.indexOf(target)
    if (targetIndex < 0) {
        return `<fragment>${escapeXmlChars(sentence)}</fragment>`
    }

    const beforeTarget = sentence.slice(0, targetIndex)
    const matchedTarget = sentence.slice(targetIndex, targetIndex + target.length)
    const afterTarget = sentence.slice(targetIndex + target.length)
    return `<fragment>${escapeXmlChars(beforeTarget)}<target>${escapeXmlChars(matchedTarget)}</target>${escapeXmlChars(
        afterTarget
    )}</fragment>`
}

/**
 * Word Translation Service
 *
 * Class-based service for word translation with pre-initialized prompts and client
 */
export class WordTranslationService {
    private client: OpenAICompatibleClient
    private systemPrompt: string | null = null
    private userPromptTemplate: string | null = null

    /**
     * Create a new WordTranslationService instance
     * @param config LLM provider configuration
     */
    constructor(config: LLMConfig) {
        this.client = new OpenAICompatibleClient(config)
        logger.info("WordTranslationService initialized")
    }

    /**
     * Initialize prompts by loading from resources
     * This should be called once after construction before first translation
     */
    async initialize(): Promise<void> {
        logger.debug("Loading prompts for word translation")
        this.systemPrompt = await promptLoaderModule.loadSystemPrompt(constants.TASK_WORD_TRANSLATION)
        this.userPromptTemplate = await promptLoaderModule.loadUserPromptTemplate(constants.TASK_WORD_TRANSLATION)
        logger.info("Prompts loaded successfully")
    }

    /**
     * Build user prompt for word translation
     * @param request Translation request
     * @returns Rendered user prompt
     */
    private buildUserPrompt(request: WordTranslationRequest): string {
        if (!this.userPromptTemplate) {
            throw new Error("Service not initialized. Call initialize() first.")
        }

        const { word, leadingText, trailingText, originalSentence, sourceLanguage, targetLanguage, contextInfo } = request

        // Get language names
        const { sourceName, targetName } = languageUtilsModule.getLanguageNames(sourceLanguage, targetLanguage)

        // Clean input text: replace newlines with spaces and trim
        const cleanWord = normalizePromptText(word).trim()

        let contextText = ""
        let sentenceValue = ""

        if (!leadingText && !trailingText && !originalSentence) {
            // No context provided
            contextText = ""
            sentenceValue = ""
        } else {
            // Context provided: construct sentence and context
            const cleanLeadingText = normalizePromptText(leadingText)
            const cleanTrailingText = normalizePromptText(trailingText)
            const cleanTarget = cleanWord

            // Construct full sentence
            const fullSentence = normalizePromptText(originalSentence) || cleanLeadingText + cleanTarget + cleanTrailingText
            const cleanSentence = fullSentence.trim()

            // Build contextText with <fragment> and <target> tags
            const highlightedSentenceInContext = buildHighlightedSentence(
                cleanSentence,
                cleanTarget,
                cleanLeadingText,
                cleanTrailingText
            )

            // Include previous and next sentences if available
            const cleanPreviousSentences = (contextInfo?.previousSentences ?? []).map((s) => s.replace(/\n/g, " ").trim())
            const cleanNextSentences = (contextInfo?.nextSentences ?? []).map((s) => s.replace(/\n/g, " ").trim())

            contextText = [cleanPreviousSentences.join(" "), highlightedSentenceInContext, cleanNextSentences.join(" ")]
                .filter((part) => part && part.trim().length > 0)
                .join(" ")

            sentenceValue = cleanSentence
        }

        // Build all sections with titles using buildOptionalSection
        const sourceLanguageSection = buildOptionalSection("Source Language", sourceName)
        const targetLanguageSection = buildOptionalSection("Target Language", targetName)
        const targetWordSection = buildOptionalSection("Target Word", cleanWord)
        const dictionaryDefinitionSection = buildOptionalSection("Dictionary Definition", contextInfo?.dictionaryDefinition)
        const textFragmentSection = buildOptionalSection("Text Fragment", sentenceValue)
        const paragraphContextSection = buildOptionalSection("Paragraph Context", contextText)
        const sourceTypeSection = buildOptionalSection("Source Type", contextInfo?.sourceType)
        const sourceTitleSection = buildOptionalSection("Source Title", contextInfo?.sourceTitle)
        const sourceAuthorSection = buildOptionalSection("Source Author", contextInfo?.sourceAuthor)

        // Prepare template variables
        const variables: Record<string, string | undefined> = {
            sourceLanguageSection,
            targetLanguageSection,
            targetWordSection,
            dictionaryDefinitionSection,
            textFragmentSection,
            paragraphContextSection,
            sourceTypeSection,
            sourceTitleSection,
            sourceAuthorSection,
        }

        return templateRendererModule.renderTemplate(this.userPromptTemplate, variables)
    }

    /**
     * Build chat messages for LLM
     * @param request Translation request
     * @param fewshotExamples Few-shot examples
     * @returns Array of chat messages
     */
    private buildMessages(request: WordTranslationRequest, fewshotExamples: ChatMessage[]): ChatMessage[] {
        if (!this.systemPrompt) {
            throw new Error("Service not initialized. Call initialize() first.")
        }

        const userPrompt = this.buildUserPrompt(request)

        return [{ role: "system" as const, content: this.systemPrompt }, ...fewshotExamples, { role: "user" as const, content: userPrompt }]
    }

    /**
     * Parse LLM response to structured result
     * @param content Raw LLM response (JSON string)
     * @returns Parsed translation result
     * @throws Error if response is invalid JSON or missing required fields
     */
    private parseModelResponse(content: string): WordTranslationResult {
        try {
            const parsed = JSON.parse(content) as LLMTranslationResponse

            if (!parsed.word_translation) {
                throw new Error("Missing word_translation in response")
            }

            return {
                wordTranslation: parsed.word_translation.trim(),
                fragmentTranslation: parsed.fragment_translation?.trim() || undefined,
            }
        } catch (error) {
            logger.error("Failed to parse LLM response:", error)
            throw new Error("Could not parse translation response from LLM")
        }
    }

    /**
     * Translate a word with context using LLM
     *
     * @param request Translation request parameters
     * @returns Translation result with word translation and optional fragment translation
     *
     * @example
     * ```typescript
     * const service = new WordTranslationService(config);
     * await service.initialize();
     *
     * const result = await service.translateWord({
     *     word: 'light',
     *     leadingText: 'The room was filled with natural ',
     *     trailingText: ' from the large windows.',
     *     sourceLanguage: 'en',
     *     targetLanguage: 'zh'
     * });
     *
     * console.log(result.wordTranslation); // "光线"
     * ```
     */
    async translateWord(request: WordTranslationRequest): Promise<WordTranslationResult> {
        if (!this.systemPrompt || !this.userPromptTemplate) {
            throw new Error("Service not initialized. Call initialize() first.")
        }

        logger.debug("Starting word translation:", request.word)

        // Load few-shot examples (language-specific, so loaded per request)
        const fewshotExamples = await promptLoaderModule.loadFewshot(constants.TASK_WORD_TRANSLATION, request.targetLanguage)

        // Build messages
        const messages = this.buildMessages(request, fewshotExamples)

        logger.debug(`Built ${messages.length} messages for LLM request`)

        // Generate translation
        const rawContent = await this.client.generate(messages)

        // Parse and return result
        const result = this.parseModelResponse(rawContent)

        logger.info("Word translation completed:", result.wordTranslation)

        return result
    }
}

/**
 * Create and initialize a WordTranslationService instance
 *
 * @param config LLM provider configuration
 * @returns Initialized WordTranslationService instance
 *
 * @example
 * ```typescript
 * const service = await createWordTranslationService(config);
 * const result = await service.translateWord(request);
 * ```
 */
export async function createWordTranslationService(config: LLMConfig): Promise<WordTranslationService> {
    const service = new WordTranslationService(config)
    await service.initialize()
    return service
}

/**
 * Convenience function for one-off translations
 * Creates a new service instance, initializes it, performs translation
 *
 * @param request Translation request parameters
 * @param config LLM provider configuration
 * @returns Translation result
 *
 * @example
 * ```typescript
 * const result = await translateWord({
 *     word: 'light',
 *     leadingText: 'The room was filled with natural ',
 *     trailingText: ' from the large windows.',
 *     sourceLanguage: 'en',
 *     targetLanguage: 'zh'
 * }, config);
 * ```
 */
export async function translateWord(request: WordTranslationRequest, config: LLMConfig): Promise<WordTranslationResult> {
    const service = await createWordTranslationService(config)
    return service.translateWord(request)
}

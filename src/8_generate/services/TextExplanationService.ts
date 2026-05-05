/**
 * Text Explanation Service
 *
 * Generates learner-oriented explanations for selected words or fragments.
 */

import * as loggerModule from "@/0_common/utils/logger"
import type {
    ChatMessage,
    LLMConfig,
    LLMTextExplanationResponse,
    TextExplanationExample,
    TextExplanationPartOfSpeech,
    TextExplanationRequest,
    TextExplanationResult,
} from "../types/GenerateTypes"
import * as constants from "../constants/GenerateConstants"
import * as languageUtilsModule from "../utils/languageUtils"
import * as promptLoaderModule from "../utils/promptLoader"
import * as templateRendererModule from "../utils/templateRenderer"
import { OpenAICompatibleClient } from "./llm/OpenAICompatibleClient"

const logger = loggerModule.createLogger("8_generate/TextExplanationService")

function escapeXmlChars(text: string): string {
    return text.replace(/</g, "&lt;").replace(/>/g, "&gt;")
}

function buildOptionalSection(title: string, value: string | undefined): string {
    if (value && value.trim().length > 0) {
        return `# ${title}\n${value.trim()}`
    }
    return ""
}

function normalizeString(value: unknown): string | undefined {
    if (typeof value !== "string") {
        return undefined
    }
    const trimmed = value.trim()
    return trimmed.length > 0 ? trimmed : undefined
}

function normalizeStringList(value: unknown): string[] | undefined {
    if (!Array.isArray(value)) {
        return undefined
    }

    const items = value.map((item) => normalizeString(item)).filter((item): item is string => Boolean(item))
    return items.length > 0 ? items : undefined
}

function normalizeExamples(value: unknown): TextExplanationExample[] {
    if (!Array.isArray(value)) {
        return []
    }

    return value
        .map((item) => {
            if (!item || typeof item !== "object") {
                return null
            }

            const record = item as Record<string, unknown>
            const sentence = normalizeString(record.sentence)
            const translation = normalizeString(record.translation)
            if (!sentence || !translation) {
                return null
            }

            const note = normalizeString(record.note)
            return note ? { sentence, translation, note } : { sentence, translation }
        })
        .filter((item): item is TextExplanationExample => Boolean(item))
}

function normalizePartsOfSpeech(value: unknown): TextExplanationPartOfSpeech[] | undefined {
    if (!Array.isArray(value)) {
        return undefined
    }

    const items = value
        .map((item) => {
            if (!item || typeof item !== "object") {
                return null
            }

            const record = item as Record<string, unknown>
            const partOfSpeech = normalizeString(record.part_of_speech)
            const meanings = normalizeStringList(record.meanings)

            if (!partOfSpeech || !meanings) {
                return null
            }

            return { partOfSpeech, meanings }
        })
        .filter((item): item is TextExplanationPartOfSpeech => Boolean(item))

    return items.length > 0 ? items : undefined
}

/**
 * Parse and normalize the JSON response from the LLM.
 */
export function parseTextExplanationResponse(content: string): TextExplanationResult {
    try {
        const parsed = JSON.parse(content) as LLMTextExplanationResponse

        const summary = normalizeString(parsed.summary)
        const meaning = normalizeString(parsed.meaning)
        const usage = normalizeString(parsed.usage)

        if (!summary || !meaning || !usage) {
            throw new Error("Missing required explanation fields")
        }

        const result: TextExplanationResult = {
            summary,
            meaning,
            usage,
            examples: normalizeExamples(parsed.examples),
        }

        const grammar = normalizeString(parsed.grammar)
        const partsOfSpeech = normalizePartsOfSpeech(parsed.parts_of_speech)
        const wordFormation = normalizeString(parsed.word_formation)
        const collocations = normalizeStringList(parsed.collocations)
        const memoryTips = normalizeStringList(parsed.memory_tips)

        if (grammar) result.grammar = grammar
        if (partsOfSpeech) result.partsOfSpeech = partsOfSpeech
        if (wordFormation) result.wordFormation = wordFormation
        if (collocations) result.collocations = collocations
        if (memoryTips) result.memoryTips = memoryTips

        return result
    } catch (error) {
        logger.error("Failed to parse text explanation response:", error)
        throw new Error("Could not parse text explanation response from LLM")
    }
}

export class TextExplanationService {
    private client: OpenAICompatibleClient
    private systemPrompt: string | null = null
    private userPromptTemplate: string | null = null

    constructor(config: LLMConfig) {
        this.client = new OpenAICompatibleClient(config)
        logger.info("TextExplanationService initialized")
    }

    async initialize(): Promise<void> {
        logger.debug("Loading prompts for text explanation")
        this.systemPrompt = await promptLoaderModule.loadSystemPrompt(constants.TASK_TEXT_EXPLANATION)
        this.userPromptTemplate = await promptLoaderModule.loadUserPromptTemplate(constants.TASK_TEXT_EXPLANATION)
        logger.info("Text explanation prompts loaded successfully")
    }

    private buildUserPrompt(request: TextExplanationRequest): string {
        if (!this.userPromptTemplate) {
            throw new Error("Service not initialized. Call initialize() first.")
        }

        const { text, selectionType, leadingText, trailingText, sourceLanguage, targetLanguage, contextInfo } = request
        const { sourceName, targetName } = languageUtilsModule.getLanguageNames(sourceLanguage, targetLanguage)

        const cleanText = text.replace(/\n/g, " ").trim()
        const cleanLeadingText = (leadingText ?? "").replace(/\n/g, " ")
        const cleanTrailingText = (trailingText ?? "").replace(/\n/g, " ")
        const escapedText = escapeXmlChars(cleanText)
        const escapedLeading = escapeXmlChars(cleanLeadingText)
        const escapedTrailing = escapeXmlChars(cleanTrailingText)
        const sentence = `${cleanLeadingText}${cleanText}${cleanTrailingText}`.trim()

        const highlightedSentence =
            sentence.length > cleanText.length
                ? `<sentence>${escapedLeading}<target>${escapedText}</target>${escapedTrailing}</sentence>`
                : `<target>${escapedText}</target>`

        const previousText = (contextInfo?.previousSentences ?? []).map((item) => item.replace(/\n/g, " ").trim()).filter(Boolean).join(" ")
        const nextText = (contextInfo?.nextSentences ?? []).map((item) => item.replace(/\n/g, " ").trim()).filter(Boolean).join(" ")
        const contextText = [previousText, highlightedSentence, nextText].filter((part) => part.trim().length > 0).join(" ")

        return templateRendererModule.renderTemplate(this.userPromptTemplate, {
            sourceLanguageSection: buildOptionalSection("Source Language", sourceName),
            targetLanguageSection: buildOptionalSection("Explanation Language", targetName),
            selectionTypeSection: buildOptionalSection("Selection Type", selectionType),
            selectedTextSection: buildOptionalSection("Selected Text", cleanText),
            sentenceSection: buildOptionalSection("Current Sentence", sentence),
            contextSection: buildOptionalSection("Context", contextText),
            sourceTypeSection: buildOptionalSection("Source Type", contextInfo?.sourceType),
            sourceTitleSection: buildOptionalSection("Source Title", contextInfo?.sourceTitle),
            sourceAuthorSection: buildOptionalSection("Source Author", contextInfo?.sourceAuthor),
        })
    }

    private buildMessages(request: TextExplanationRequest): ChatMessage[] {
        if (!this.systemPrompt) {
            throw new Error("Service not initialized. Call initialize() first.")
        }

        return [
            { role: "system", content: this.systemPrompt },
            { role: "user", content: this.buildUserPrompt(request) },
        ]
    }

    async explainText(request: TextExplanationRequest): Promise<TextExplanationResult> {
        if (!this.systemPrompt || !this.userPromptTemplate) {
            throw new Error("Service not initialized. Call initialize() first.")
        }

        logger.debug("Starting text explanation:", request.text)
        const rawContent = await this.client.generate(this.buildMessages(request))
        const result = parseTextExplanationResponse(rawContent)
        logger.info("Text explanation completed:", result.summary)
        return result
    }
}

export async function createTextExplanationService(config: LLMConfig): Promise<TextExplanationService> {
    const service = new TextExplanationService(config)
    await service.initialize()
    return service
}

export async function explainText(request: TextExplanationRequest, config: LLMConfig): Promise<TextExplanationResult> {
    const service = await createTextExplanationService(config)
    return service.explainText(request)
}

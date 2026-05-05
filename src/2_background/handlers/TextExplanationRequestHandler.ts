/**
 * Text Explanation Request Handler
 *
 * Handles learner-oriented explanation requests from content scripts.
 */

import type { TextExplanationRequestMessage, TextExplanationResponseMessage } from "@/0_common/types"
import * as loggerModule from "@/0_common/utils/logger"
import { getQuotaManager } from "@/5_backend"
import * as translateModule from "@/6_translate"
import * as errorHandler from "./BackgroundErrorHandler"
import * as serviceInitializer from "../services/ServiceInitializer"

const logger = loggerModule.createLogger("TextExplanationRequestHandler")

export async function handleTextExplanationRequest(
    message: TextExplanationRequestMessage,
    sendResponse: (response: TextExplanationResponseMessage) => void
): Promise<void> {
    try {
        await serviceInitializer.ensureCriticalServicesReady()
        serviceInitializer.startBackgroundWarmUp()

        const {
            text,
            selectionType,
            leadingText,
            trailingText,
            previousSentences,
            nextSentences,
            bookName,
            sourceLanguage,
            targetLanguage,
        } = message.data

        logger.info("Explaining selected text:", text, selectionType)

        const quotaManager = getQuotaManager()
        await quotaManager.checkTranslationQuota()

        const result = await translateModule.explainText({
            text,
            selectionType,
            leadingText,
            trailingText,
            sourceLanguage,
            targetLanguage,
            contextInfo: {
                previousSentences,
                nextSentences,
                bookName,
            },
        })

        await quotaManager.incrementTranslationCount()

        sendResponse({
            type: "TEXT_EXPLANATION_RESPONSE",
            success: true,
            data: result,
        })
    } catch (error: unknown) {
        logger.error("Text explanation error:", error)
        errorHandler.handleTextExplanationRequestError(error, sendResponse)
    }
}

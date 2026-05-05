/**
 * Translation Error Handler Utility
 *
 * Handles error responses for translation and speech synthesis requests
 * Errors are now properly typed and wrapped by TranslationService
 */

import {
    QuotaExceededError,
    type FragmentTranslateResponseMessage,
    type SpeechSynthesisResponseMessage,
    type TextExplanationResponseMessage,
    type TranslateResponseMessage,
} from "@/0_common/types"
import { TranslationError } from "@/6_translate"
import { SpeechError } from "@/7_speech"

function sendTranslationErrorResponse(error: TranslationError, sendResponse: (response: TranslateResponseMessage) => void): void {
    sendResponse({
        type: "TRANSLATE_RESPONSE",
        success: false,
        error: error.message,
        errorType: "TranslationError",
        ...(error.shortMessage ? { shortMessage: error.shortMessage } : {}),
    })
}

function sendFragmentTranslationErrorResponse(error: TranslationError, sendResponse: (response: FragmentTranslateResponseMessage) => void): void {
    sendResponse({
        type: "FRAGMENT_TRANSLATE_RESPONSE",
        success: false,
        error: error.message,
        errorType: "TranslationError",
        ...(error.shortMessage ? { shortMessage: error.shortMessage } : {}),
    })
}

function sendTextExplanationErrorResponse(error: TranslationError, sendResponse: (response: TextExplanationResponseMessage) => void): void {
    sendResponse({
        type: "TEXT_EXPLANATION_RESPONSE",
        success: false,
        error: error.message,
        errorType: "TranslationError",
        ...(error.shortMessage ? { shortMessage: error.shortMessage } : {}),
    })
}

/**
 * Handle translation request errors
 *
 * @param error - The error to handle (QuotaExceededError or TranslationError)
 * @param sendResponse - Response callback function
 */
export function handleTranslationRequestError(error: unknown, sendResponse: (response: TranslateResponseMessage) => void): void {
    // Handle QuotaExceededError
    if (error instanceof QuotaExceededError) {
        sendResponse({
            type: "TRANSLATE_RESPONSE",
            success: false,
            error: error.message,
            errorType: "QuotaExceeded",
        })
        return
    }

    // Handle TranslationError (from TranslationService)
    if (error instanceof TranslationError) {
        sendTranslationErrorResponse(error, sendResponse)
        return
    }

    // Unexpected error - should not happen if TranslationService is working correctly
    sendResponse({
        type: "TRANSLATE_RESPONSE",
        success: false,
        error: error instanceof Error ? error.message : "Translation failed",
        errorType: "GenericError",
    })
}

/**
 * Handle fragment translation request errors
 *
 * @param error - The error to handle (QuotaExceededError or TranslationError)
 * @param sendResponse - Response callback function
 */
export function handleFragmentTranslationRequestError(error: unknown, sendResponse: (response: FragmentTranslateResponseMessage) => void): void {
    // Handle QuotaExceededError
    if (error instanceof QuotaExceededError) {
        sendResponse({
            type: "FRAGMENT_TRANSLATE_RESPONSE",
            success: false,
            error: error.message,
            errorType: "QuotaExceeded",
        })
        return
    }

    // Handle TranslationError (from TranslationService)
    if (error instanceof TranslationError) {
        sendFragmentTranslationErrorResponse(error, sendResponse)
        return
    }

    // Unexpected error - should not happen if TranslationService is working correctly
    sendResponse({
        type: "FRAGMENT_TRANSLATE_RESPONSE",
        success: false,
        error: error instanceof Error ? error.message : "Fragment translation failed",
        errorType: "GenericError",
    })
}

export function handleTextExplanationRequestError(error: unknown, sendResponse: (response: TextExplanationResponseMessage) => void): void {
    if (error instanceof QuotaExceededError) {
        sendResponse({
            type: "TEXT_EXPLANATION_RESPONSE",
            success: false,
            error: error.message,
            errorType: "QuotaExceeded",
        })
        return
    }

    if (error instanceof TranslationError) {
        sendTextExplanationErrorResponse(error, sendResponse)
        return
    }

    sendResponse({
        type: "TEXT_EXPLANATION_RESPONSE",
        success: false,
        error: error instanceof Error ? error.message : "Text explanation failed",
        errorType: "GenericError",
    })
}

/**
 * Handle speech synthesis request errors
 *
 * @param error - The error to handle
 * @param sendResponse - Response callback function
 */
export function handleSpeechSynthesisRequestError(error: unknown, sendResponse: (response: SpeechSynthesisResponseMessage) => void): void {
    // Handle QuotaExceededError directly
    if (error instanceof QuotaExceededError) {
        sendResponse({
            type: "SPEECH_SYNTHESIS_RESPONSE",
            success: false,
            error: error.message,
            errorType: "QuotaExceeded",
        })
        return
    }

    if (error instanceof SpeechError) {
        sendResponse({
            type: "SPEECH_SYNTHESIS_RESPONSE",
            success: false,
            error: error.message,
            errorType: "GenericError",
        })
        return
    }

    // Send generic error response
    sendResponse({
        type: "SPEECH_SYNTHESIS_RESPONSE",
        success: false,
        error: error instanceof Error ? error.message : "Speech synthesis failed",
    })
}

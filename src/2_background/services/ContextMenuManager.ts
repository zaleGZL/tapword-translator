/**
 * Context Menu Manager
 *
 * Registers browser context-menu entries and forwards user intent to content scripts.
 */

import type { OpenTextExplanationMessage } from "@/0_common/types"
import * as loggerModule from "@/0_common/utils/logger"

const logger = loggerModule.createLogger("ContextMenuManager")
const EXPLAIN_SELECTION_MENU_ID = "tapword-explain-selection"

function getContextMenuTitle(): string {
    return chrome.i18n?.getMessage("contextMenuExplain") || "Explain with TapWord"
}

function sendOpenExplanationMessage(tabId: number, info: chrome.contextMenus.OnClickData): void {
    const message: OpenTextExplanationMessage = {
        type: "OPEN_TEXT_EXPLANATION",
        data: {
            selectedText: info.selectionText,
        },
    }

    const callback = () => {
        if (chrome.runtime.lastError) {
            logger.warn("Failed to send text explanation command:", chrome.runtime.lastError.message)
        }
    }

    if (typeof info.frameId === "number") {
        chrome.tabs.sendMessage(tabId, message, { frameId: info.frameId }, callback)
        return
    }

    chrome.tabs.sendMessage(tabId, message, callback)
}

function handleContextMenuClicked(info: chrome.contextMenus.OnClickData, tab?: chrome.tabs.Tab): void {
    if (info.menuItemId !== EXPLAIN_SELECTION_MENU_ID) {
        return
    }

    if (!tab?.id) {
        logger.warn("Context menu clicked without a tab id")
        return
    }

    sendOpenExplanationMessage(tab.id, info)
}

export function setupContextMenus(): void {
    if (!chrome.contextMenus) {
        logger.warn("chrome.contextMenus API is unavailable")
        return
    }

    chrome.contextMenus.removeAll(() => {
        if (chrome.runtime.lastError) {
            logger.warn("Failed to clear context menus:", chrome.runtime.lastError.message)
            return
        }

        chrome.contextMenus.create(
            {
                id: EXPLAIN_SELECTION_MENU_ID,
                title: getContextMenuTitle(),
                contexts: ["selection"],
            },
            () => {
                if (chrome.runtime.lastError) {
                    logger.warn("Failed to create context menu:", chrome.runtime.lastError.message)
                    return
                }
                logger.info("Context menu registered")
            }
        )
    })

    chrome.contextMenus.onClicked.removeListener(handleContextMenuClicked)
    chrome.contextMenus.onClicked.addListener(handleContextMenuClicked)
}

/**
 * Translation modal components.
 *
 * Builds modal UI with DOM nodes instead of raw HTML templates so model/user
 * text is inserted via textContent and cannot become executable markup.
 */

import type { TextExplanationExample, TextExplanationPartOfSpeech } from "@/0_common/types"
import { APP_EDITION } from "@/0_common/constants"
import * as i18nModule from "@/0_common/utils/i18n"
import { containsMeaningfulWords, isSingleWord } from "@/0_common/utils/textUtils"
import type { TranslationDetailData } from "@/1_content/ui/translationModal"

type Child = Node | string | null | undefined | false

interface ElementOptions {
    className?: string
    text?: string
    title?: string
    attrs?: Record<string, string>
    disabled?: boolean
}

const SVG_NS = "http://www.w3.org/2000/svg"

// ============================================================================
// Public Renderers
// ============================================================================

export function renderModalContent(data: TranslationDetailData, showUpdateLabel?: boolean): DocumentFragment {
    if (data.translationType === "fragment") {
        return renderFragmentContent(data, showUpdateLabel)
    }

    return renderWordContent(data, showUpdateLabel)
}

export function renderSuccessContent(data: TranslationDetailData, showUpdateLabel?: boolean): DocumentFragment {
    return data.translationType === "fragment" ? renderFragmentSuccess(data, showUpdateLabel) : renderWordSuccess(data, showUpdateLabel)
}

// ============================================================================
// State Renderers
// ============================================================================

function renderWordContent(data: TranslationDetailData, showUpdateLabel?: boolean): DocumentFragment {
    switch (data.status) {
        case "loading":
            return renderWordLoading(data)
        case "success":
            return renderWordSuccess(data, showUpdateLabel)
        case "error":
            return renderWordError(data)
        default:
            return renderWordError({ ...data, status: "error", errorMessage: "Unknown status" })
    }
}

function renderFragmentContent(data: TranslationDetailData, showUpdateLabel?: boolean): DocumentFragment {
    switch (data.status) {
        case "loading":
            return renderFragmentLoading(data)
        case "success":
            return renderFragmentSuccess(data, showUpdateLabel)
        case "error":
            return renderFragmentError(data)
        default:
            return renderFragmentError({ ...data, status: "error", errorMessage: "Unknown status" })
    }
}

function renderWordLoading(data: TranslationDetailData): DocumentFragment {
    return fragment(
        createWordHeader(data, {
            translationNode: createLoadingInline(),
            speakDisabled: true,
            refreshDisabled: true,
        })
    )
}

function renderWordError(data: TranslationDetailData): DocumentFragment {
    return fragment(
        createWordHeader(data, {
            translationNode: createErrorInline(data.errorMessage || i18nModule.translate("modal.error.default")),
            speakDisabled: true,
        })
    )
}

function renderWordSuccess(data: TranslationDetailData, showUpdateLabel?: boolean): DocumentFragment {
    const phoneticText = data.phonetic ? `/${data.phonetic}/` : ""
    const content = fragment(createWordHeader(data, { translationNode: data.translation, phoneticText }))

    if (data.leadingText !== undefined && data.trailingText !== undefined) {
        content.appendChild(createWordSentenceSection(data, showUpdateLabel))
    }

    const dictionarySection = createDictionarySection(data)
    if (dictionarySection) {
        content.appendChild(dictionarySection)
    }

    const explanationSection = createExplanationSection(data)
    if (explanationSection) {
        content.appendChild(explanationSection)
    }

    return content
}

function renderFragmentLoading(data: TranslationDetailData): DocumentFragment {
    return fragment(
        createFragmentHeader({ refreshDisabled: true }),
        createDivider(),
        createFragmentSection(data, createLoadingInline(), true)
    )
}

function renderFragmentError(data: TranslationDetailData): DocumentFragment {
    return fragment(
        createFragmentHeader(),
        createDivider(),
        createFragmentSection(data, createErrorInline(data.errorMessage || i18nModule.translate("modal.error.default")), true)
    )
}

function renderFragmentSuccess(data: TranslationDetailData, showUpdateLabel?: boolean): DocumentFragment {
    const content = fragment(
        createFragmentHeader(),
        createDivider(),
        createFragmentSection(data, data.translation, false, showUpdateLabel)
    )

    if (
        data.leadingText !== undefined &&
        data.trailingText !== undefined &&
        data.sentenceTranslation &&
        (containsMeaningfulWords(data.leadingText) || containsMeaningfulWords(data.trailingText))
    ) {
        content.appendChild(createFragmentSentenceSection(data))
    }

    const explanationSection = createExplanationSection(data)
    if (explanationSection) {
        content.appendChild(explanationSection)
    }

    return content
}

// ============================================================================
// Header Components
// ============================================================================

function createWordHeader(
    data: TranslationDetailData,
    options: {
        translationNode: Child
        phoneticText?: string
        speakDisabled?: boolean
        refreshDisabled?: boolean
    }
): HTMLElement {
    return el(
        "div",
        { className: "ai-translator-modal-view", attrs: { "data-app-edition": APP_EDITION } },
        el(
            "div",
            { className: "ai-translator-modal-top-row" },
            el(
                "div",
                { className: "ai-translator-modal-left-group" },
                el(
                    "div",
                    { className: "ai-translator-modal-word-section" },
                    el("div", { className: "ai-translator-modal-word", text: data.text }),
                    el("div", { className: getWordTranslationClass(options.translationNode) }, options.translationNode)
                ),
                el(
                    "div",
                    { className: "ai-translator-modal-phonetic-group" },
                    options.phoneticText ? el("div", { className: "ai-translator-modal-phonetic", text: options.phoneticText }) : null,
                    createActionButton("speak", "ai-translator-speak-btn", "modal.button.pronounce", "speaker", {
                        disabled: options.speakDisabled,
                        communityHide: true,
                    }),
                    createActionButton("refresh", "ai-translator-refresh-btn", "modal.button.refresh", "refresh", {
                        disabled: options.refreshDisabled,
                    }),
                    createActionButton("delete", "ai-translator-delete-btn", "modal.button.delete", "trash")
                )
            ),
            createCloseButtonContainer()
        )
    )
}

function createFragmentHeader(options: { refreshDisabled?: boolean } = {}): HTMLElement {
    return el(
        "div",
        { className: "ai-translator-modal-view", attrs: { "data-app-edition": APP_EDITION } },
        el(
            "div",
            { className: "ai-translator-modal-top-row" },
            el(
                "div",
                { className: "ai-translator-modal-left-group" },
                el(
                    "div",
                    { className: "ai-translator-modal-phonetic-group" },
                    createActionButton("refresh", "ai-translator-refresh-btn", "modal.button.refresh", "refresh", {
                        disabled: options.refreshDisabled,
                    }),
                    createActionButton("delete", "ai-translator-delete-btn", "modal.button.delete", "trash")
                )
            ),
            createCloseButtonContainer()
        )
    )
}

function createCloseButtonContainer(): HTMLElement {
    return el(
        "div",
        { className: "ai-translator-modal-close-btn-container" },
        el("button", {
            className: "ai-translator-modal-close",
            title: i18nModule.translate("modal.button.close"),
            text: "\u00d7",
        })
    )
}

// ============================================================================
// Section Components
// ============================================================================

function createWordSentenceSection(data: TranslationDetailData, showUpdateLabel?: boolean): DocumentFragment {
    return fragment(
        createDivider(),
        el(
            "div",
            { className: "ai-translator-modal-sentence-section" },
            createSectionHeader("modal.section.excerpt", [
                createActionButton("speak-original", "ai-translator-speak-original-btn", "modal.button.pronounceOriginal", "speaker", {
                    communityHide: true,
                }),
                showUpdateLabel ? createUpdateLabel() : null,
            ]),
            el(
                "div",
                { className: "ai-translator-modal-sentence-container" },
                el("p", { className: "ai-translator-modal-sentence-original" }, createHighlightedText(data.leadingText || "", data.text, data.trailingText || "")),
                el("div", { className: "ai-translator-modal-sentence-translation", text: data.sentenceTranslation || "" })
            )
        )
    )
}

function createFragmentSentenceSection(data: TranslationDetailData): DocumentFragment {
    return fragment(
        createDivider(),
        el(
            "div",
            { className: "ai-translator-modal-sentence-section" },
            createSectionHeader("modal.section.excerpt", [
                createActionButton("speak-sentence", "ai-translator-speak-sentence-btn", "modal.button.pronounceSentence", "speaker", {
                    communityHide: true,
                }),
            ]),
            el(
                "div",
                { className: "ai-translator-modal-sentence-container" },
                el("p", { className: "ai-translator-modal-sentence-original" }, createHighlightedText(data.leadingText || "", data.text, data.trailingText || "")),
                el("div", { className: "ai-translator-modal-sentence-translation", text: data.sentenceTranslation || "" })
            )
        )
    )
}

function createDictionarySection(data: TranslationDetailData): DocumentFragment | null {
    const isChinese = data.targetLanguage === "zh"
    const dictionaryContent = isChinese ? data.chineseDefinition : data.targetDefinition
    if (!dictionaryContent) {
        return null
    }

    const lemmaText = data.lemma || ""
    const phoneticText = data.lemma ? (data.lemmaPhonetic ? `/${data.lemmaPhonetic}/` : "") : ""
    const isSourceEnglish = data.sourceLanguage === "en" || (data.sourceLanguage === "auto" && isSingleWord(data.text))
    const titleKey = isSourceEnglish && data.targetLanguage === "zh" ? "modal.section.dictionary.enZh" : "modal.section.dictionary"

    return fragment(
        createDivider(),
        el(
            "div",
            { className: "ai-translator-modal-dictionary-section" },
            el("div", { className: "ai-translator-modal-section-label", text: i18nModule.translate(titleKey) }),
            el(
                "div",
                { className: "ai-translator-modal-dictionary-container" },
                el(
                    "div",
                    { className: "ai-translator-modal-lemma-row" },
                    el("span", { className: "ai-translator-modal-lemma-text", text: lemmaText }),
                    el("span", { className: "ai-translator-modal-lemma-phonetic", text: phoneticText }),
                    createActionButton("speak-lemma", "ai-translator-speak-lemma-btn", "modal.button.pronounceLemma", "speaker", {
                        communityHide: true,
                    })
                ),
                el("div", { className: "ai-translator-modal-dictionary-content", text: dictionaryContent })
            )
        )
    )
}

function createFragmentSection(
    data: TranslationDetailData,
    translationNode: Child,
    isDisabledSpeech: boolean,
    showUpdateLabel?: boolean
): HTMLElement {
    return el(
        "div",
        { className: "ai-translator-modal-fragment-section" },
        createSectionHeader("modal.section.fragment", [
            createActionButton("speak-original", "ai-translator-speak-original-btn", "modal.button.pronounceOriginal", "speaker", {
                disabled: isDisabledSpeech,
                communityHide: true,
            }),
            showUpdateLabel ? createUpdateLabel() : null,
        ]),
        el(
            "div",
            { className: "ai-translator-modal-fragment-container" },
            el("p", { className: "ai-translator-modal-fragment-original", text: data.text }),
            el("div", { className: getFragmentTranslationClass(translationNode) }, translationNode)
        )
    )
}

function createExplanationSection(data: TranslationDetailData): DocumentFragment | null {
    const explanation = data.explanation
    if (!explanation) {
        return null
    }

    const blocks = compactNodes([
        createExplanationBlock("modal.explanation.partsOfSpeech", createPartsOfSpeechList(explanation.partsOfSpeech)),
        createExplanationBlock("modal.explanation.meaning", explanation.meaning),
        createExplanationBlock("modal.explanation.usage", explanation.usage),
        createExplanationBlock("modal.explanation.grammar", explanation.grammar),
        createExplanationBlock("modal.explanation.examples", createExamplesList(explanation.examples)),
        createExplanationBlock("modal.explanation.collocations", createStringList(explanation.collocations)),
        createExplanationBlock("modal.explanation.wordFormation", explanation.wordFormation),
        createExplanationBlock("modal.explanation.memoryTips", createStringList(explanation.memoryTips)),
    ])

    if (blocks.length === 0) {
        return null
    }

    return fragment(
        createDivider(),
        el(
            "div",
            { className: "ai-translator-modal-explanation-section" },
            el("div", { className: "ai-translator-modal-section-label", text: i18nModule.translate("modal.section.explanation") }),
            el("div", { className: "ai-translator-modal-explanation-container" }, ...blocks)
        )
    )
}

function createExplanationBlock(titleKey: string, body: Child): HTMLElement | null {
    if (!hasRenderableContent(body)) {
        return null
    }

    return el(
        "div",
        { className: "ai-translator-modal-explanation-block" },
        el("div", { className: "ai-translator-modal-explanation-title", text: i18nModule.translate(titleKey) }),
        el("div", { className: "ai-translator-modal-explanation-body" }, body)
    )
}

function createStringList(items: string[] | undefined): HTMLElement | null {
    if (!items || items.length === 0) {
        return null
    }

    return el("ul", { className: "ai-translator-modal-explanation-list" }, ...items.map((item) => el("li", { text: item })))
}

function createExamplesList(examples: TextExplanationExample[] | undefined): HTMLElement | null {
    if (!examples || examples.length === 0) {
        return null
    }

    return el(
        "div",
        { className: "ai-translator-modal-examples" },
        ...examples.map((example) =>
            el(
                "div",
                { className: "ai-translator-modal-example" },
                el("div", { className: "ai-translator-modal-example-sentence", text: example.sentence }),
                el("div", { className: "ai-translator-modal-example-translation", text: example.translation }),
                example.note ? el("div", { className: "ai-translator-modal-example-note", text: example.note }) : null
            )
        )
    )
}

function createPartsOfSpeechList(partsOfSpeech: TextExplanationPartOfSpeech[] | undefined): HTMLElement | null {
    if (!partsOfSpeech || partsOfSpeech.length === 0) {
        return null
    }

    return el(
        "div",
        { className: "ai-translator-modal-pos-list" },
        ...partsOfSpeech.map((item) =>
            el(
                "div",
                { className: "ai-translator-modal-pos-item" },
                el("div", { className: "ai-translator-modal-pos-label", text: item.partOfSpeech }),
                el("ul", { className: "ai-translator-modal-pos-meanings" }, ...item.meanings.map((meaning) => el("li", { text: meaning })))
            )
        )
    )
}

function createSectionHeader(titleKey: string, actions: Array<Child>): HTMLElement {
    return el(
        "div",
        { className: "ai-translator-modal-section-header" },
        el("div", { className: "ai-translator-modal-section-label", text: i18nModule.translate(titleKey) }),
        ...actions
    )
}

// ============================================================================
// Primitive Components
// ============================================================================

function createActionButton(
    action: string,
    className: string,
    titleKey: string,
    icon: "speaker" | "refresh" | "trash",
    options: { disabled?: boolean; communityHide?: boolean } = {}
): HTMLButtonElement {
    const attrs: Record<string, string> = { "data-action": action }
    if (options.communityHide) {
        attrs["data-community-hide"] = "speech"
    }

    return el(
        "button",
        {
            className: `ai-translator-modal-action-btn ${className}`,
            title: i18nModule.translate(titleKey),
            attrs,
            disabled: options.disabled,
        },
        createIcon(icon)
    ) as HTMLButtonElement
}

function createUpdateLabel(): HTMLAnchorElement {
    return el(
        "a",
        {
            className: "ai-translator-modal-update-label",
            text: i18nModule.translate("modal.updateLabel"),
            attrs: { href: "#", "data-action": "download-update" },
        }
    ) as HTMLAnchorElement
}

function createDivider(): HTMLElement {
    return el("div", { className: "ai-translator-modal-divider" })
}

function createLoadingInline(): DocumentFragment {
    return fragment(el("span", { className: "ai-translator-loading" }), i18nModule.translate("modal.loading"))
}

function createErrorInline(message: string): DocumentFragment {
    return fragment(createIcon("error"), el("span", { text: message }))
}

function createHighlightedText(leadingText: string, selectedText: string, trailingText: string): DocumentFragment {
    return fragment(leadingText, el("span", { className: "ai-translator-modal-word-highlight", text: selectedText }), trailingText)
}

function createIcon(icon: "speaker" | "refresh" | "trash" | "error"): SVGSVGElement {
    const svg = document.createElementNS(SVG_NS, "svg")
    svg.setAttribute("width", icon === "error" ? "14" : "16")
    svg.setAttribute("height", icon === "error" ? "14" : "16")
    svg.setAttribute("viewBox", "0 0 16 16")
    svg.setAttribute("fill", "none")
    if (icon === "error") {
        svg.classList.add("ai-translator-error-icon")
    }

    if (icon === "speaker") {
        appendSvgPath(svg, "M7.5 3.5L4.5 6H2.5C2.22 6 2 6.22 2 6.5V9.5C2 9.78 2.22 10 2.5 10H4.5L7.5 12.5V3.5Z")
        appendSvgPath(svg, "M10 5.5C10.8284 6.32843 11.25 7.42857 11.25 8.5C11.25 9.57143 10.8284 10.6716 10 11.5")
        appendSvgPath(svg, "M12 3.5C13.5 5 14 6.5 14 8.5C14 10.5 13.5 12 12 13.5")
        return svg
    }

    if (icon === "refresh") {
        appendSvgPath(svg, "M13.5 8C13.5 11.0376 11.0376 13.5 8 13.5C4.96243 13.5 2.5 11.0376 2.5 8C2.5 4.96243 4.96243 2.5 8 2.5C9.7 2.5 11.2 3.3 12.2 4.5M12.2 4.5V2M12.2 4.5H9.7")
        return svg
    }

    if (icon === "trash") {
        appendSvgPath(svg, "M3 4H13")
        appendSvgPath(svg, "M5.5 4V3C5.5 2.44772 5.94772 2 6.5 2H9.5C10.0523 2 10.5 2.44772 10.5 3V4")
        appendSvgPath(svg, "M4.5 4V13C4.5 13.5523 4.94772 14 5.5 14H10.5C11.0523 14 11.5 13.5523 11.5 13V4")
        appendSvgPath(svg, "M6.5 7V11")
        appendSvgPath(svg, "M9.5 7V11")
        return svg
    }

    appendSvgPath(svg, "M8 1L1 14H15L8 1Z", { stroke: "#FF6B35" })
    appendSvgPath(svg, "M8 6V9", { stroke: "#FF6B35" })
    const circle = document.createElementNS(SVG_NS, "circle")
    circle.setAttribute("cx", "8")
    circle.setAttribute("cy", "11.5")
    circle.setAttribute("r", "0.5")
    circle.setAttribute("fill", "#FF6B35")
    svg.appendChild(circle)
    return svg
}

function appendSvgPath(svg: SVGSVGElement, d: string, options: { stroke?: string } = {}): void {
    const path = document.createElementNS(SVG_NS, "path")
    path.setAttribute("d", d)
    path.setAttribute("stroke", options.stroke || "currentColor")
    path.setAttribute("stroke-width", "1.5")
    path.setAttribute("stroke-linecap", "round")
    path.setAttribute("stroke-linejoin", "round")
    svg.appendChild(path)
}

// ============================================================================
// DOM Helpers
// ============================================================================

function el<K extends keyof HTMLElementTagNameMap>(
    tag: K,
    options: ElementOptions = {},
    ...children: Child[]
): HTMLElementTagNameMap[K] {
    const node = document.createElement(tag)

    if (options.className) {
        node.className = options.className
    }
    if (options.text !== undefined) {
        node.textContent = options.text
    }
    if (options.title !== undefined) {
        node.title = options.title
    }
    if (options.disabled !== undefined && "disabled" in node) {
        ;(node as HTMLButtonElement).disabled = options.disabled
    }
    if (options.attrs) {
        for (const [key, value] of Object.entries(options.attrs)) {
            node.setAttribute(key, value)
        }
    }

    appendChildren(node, children)
    return node
}

function fragment(...children: Child[]): DocumentFragment {
    const result = document.createDocumentFragment()
    appendChildren(result, children)
    return result
}

function appendChildren(parent: Node, children: Child[]): void {
    for (const child of children) {
        if (child === null || child === undefined || child === false) {
            continue
        }

        if (typeof child === "string") {
            parent.appendChild(document.createTextNode(child))
        } else {
            parent.appendChild(child)
        }
    }
}

function compactNodes(nodes: Array<HTMLElement | null>): HTMLElement[] {
    return nodes.filter((node): node is HTMLElement => node !== null)
}

function hasRenderableContent(value: Child): boolean {
    if (value === null || value === undefined || value === false) {
        return false
    }

    if (typeof value === "string") {
        return value.length > 0
    }

    return value.textContent !== null && value.textContent.length > 0
}

function getWordTranslationClass(translationNode: Child): string {
    return hasErrorIcon(translationNode) ? "ai-translator-modal-word-translation ai-translator-modal-error-message" : "ai-translator-modal-word-translation"
}

function getFragmentTranslationClass(translationNode: Child): string {
    return hasErrorIcon(translationNode) ? "ai-translator-modal-fragment-translation ai-translator-modal-fragment-error" : "ai-translator-modal-fragment-translation"
}

function hasErrorIcon(value: Child): boolean {
    return value instanceof DocumentFragment && Boolean(value.querySelector(".ai-translator-error-icon"))
}

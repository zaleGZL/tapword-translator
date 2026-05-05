import { beforeEach, describe, expect, it } from "vitest"
import * as i18nModule from "@/0_common/utils/i18n"
import * as modalTemplates from "@/1_content/ui/modalTemplates"

class FakeClassList {
    constructor(private readonly owner: FakeElement) {}

    add(value: string): void {
        const classes = new Set(this.owner.className.split(/\s+/).filter(Boolean))
        classes.add(value)
        this.owner.className = Array.from(classes).join(" ")
    }
}

class FakeNode {
    childNodes: FakeNode[] = []

    appendChild<T extends FakeNode>(node: T): T {
        this.childNodes.push(node)
        return node
    }

    get textContent(): string {
        return this.childNodes.map((child) => child.textContent).join("")
    }

    set textContent(value: string) {
        this.childNodes = [new FakeTextNode(value)]
    }
}

class FakeTextNode extends FakeNode {
    constructor(private readonly value: string) {
        super()
    }

    override get textContent(): string {
        return this.value
    }

    override set textContent(_value: string) {}
}

class FakeElement extends FakeNode {
    className = ""
    title = ""
    disabled = false
    readonly attributes = new Map<string, string>()
    readonly classList = new FakeClassList(this)

    constructor(readonly tagName: string) {
        super()
    }

    setAttribute(key: string, value: string): void {
        this.attributes.set(key, value)
        if (key === "class") {
            this.className = value
        }
    }

    querySelector(selector: string): FakeElement | null {
        return findElement(this, selector)
    }

    get innerHTML(): string {
        return this.childNodes.map(serializeNode).join("")
    }
}

class FakeDocumentFragment extends FakeNode {
    querySelector(selector: string): FakeElement | null {
        return findElement(this, selector)
    }
}

class FakeDocument {
    body = new FakeElement("body")

    createElement(tagName: string): FakeElement {
        return new FakeElement(tagName)
    }

    createElementNS(_namespace: string, tagName: string): FakeElement {
        return new FakeElement(tagName)
    }

    createDocumentFragment(): FakeDocumentFragment {
        return new FakeDocumentFragment()
    }

    createTextNode(value: string): FakeTextNode {
        return new FakeTextNode(value)
    }
}

function installFakeDom(): void {
    ;(globalThis as any).document = new FakeDocument()
    ;(globalThis as any).DocumentFragment = FakeDocumentFragment
}

function findElement(root: FakeNode, selector: string): FakeElement | null {
    for (const child of root.childNodes) {
        if (child instanceof FakeElement && matchesSelector(child, selector)) {
            return child
        }

        const descendant = findElement(child, selector)
        if (descendant) {
            return descendant
        }
    }

    return null
}

function matchesSelector(node: FakeElement, selector: string): boolean {
    if (selector.startsWith(".")) {
        return node.className.split(/\s+/).includes(selector.slice(1))
    }

    return node.tagName.toLowerCase() === selector.toLowerCase()
}

function serializeNode(node: FakeNode): string {
    if (node instanceof FakeTextNode) {
        return escapeHtml(node.textContent)
    }

    if (node instanceof FakeDocumentFragment) {
        return node.childNodes.map(serializeNode).join("")
    }

    if (node instanceof FakeElement) {
        const classAttribute = node.className ? ` class="${escapeHtml(node.className)}"` : ""
        const children = node.childNodes.map(serializeNode).join("")
        return `<${node.tagName}${classAttribute}>${children}</${node.tagName}>`
    }

    return ""
}

function escapeHtml(value: string): string {
    return value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
}

describe("modalTemplates explanation rendering", () => {
    beforeEach(() => {
        installFakeDom()
        i18nModule.setLocale("zh")
    })

    it("renders explanation sections with DOM components and escapes model-provided HTML", () => {
        const container = document.createElement("div")
        container.appendChild(
            modalTemplates.renderSuccessContent({
                status: "success",
                translationType: "word",
                text: "comprehend",
                translation: "理解",
                targetLanguage: "zh",
                explanation: {
                    summary: "理解",
                    meaning: "理解 <img src=x onerror=alert(1)>",
                    usage: "Use it for deeper understanding.",
                    grammar: "Usually transitive.",
                    partsOfSpeech: [
                        {
                            partOfSpeech: "verb",
                            meanings: ["理解", "领会 <b>idea</b>"],
                        },
                    ],
                    examples: [
                        {
                            sentence: "She can comprehend complex ideas.",
                            translation: "她能理解复杂的想法。",
                            note: "<script>alert(1)</script>",
                        },
                    ],
                    collocations: ["fully comprehend"],
                    wordFormation: "com- + prehend",
                    memoryTips: ["Link it to apprehend."],
                },
            })
        )

        expect(container.textContent).toContain("学习讲解")
        expect(container.textContent).toContain("词性和释义")
        expect(container.textContent).toContain("verb")
        expect(container.textContent).toContain("核心含义")
        expect(container.textContent).toContain("fully comprehend")
        expect(container.textContent).toContain("com- + prehend")
        expect(container.textContent).toContain("理解 <img src=x onerror=alert(1)>")
        expect(container.textContent).toContain("领会 <b>idea</b>")
        expect(container.textContent).toContain("<script>alert(1)</script>")
        expect(container.querySelector("img")).toBeNull()
        expect(container.querySelector("script")).toBeNull()
        expect(container.innerHTML).toContain("&lt;img src=x onerror=alert(1)&gt;")
        expect(container.innerHTML).toContain("&lt;script&gt;alert(1)&lt;/script&gt;")
    })
})

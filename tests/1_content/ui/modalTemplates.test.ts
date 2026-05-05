import { beforeEach, describe, expect, it } from "vitest"
import { renderSuccessTemplate } from "@/1_content/ui/modalTemplates"
import * as i18nModule from "@/0_common/utils/i18n"

describe("modalTemplates explanation rendering", () => {
    beforeEach(() => {
        ;(globalThis as any).document = {
            createElement: () => {
                let escaped = ""
                return {
                    set textContent(value: string) {
                        escaped = value
                            .replace(/&/g, "&amp;")
                            .replace(/</g, "&lt;")
                            .replace(/>/g, "&gt;")
                            .replace(/"/g, "&quot;")
                    },
                    get innerHTML() {
                        return escaped
                    },
                }
            },
        }
    })

    it("renders explanation sections and escapes model-provided HTML", () => {
        i18nModule.setLocale("zh")

        const html = renderSuccessTemplate({
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

        expect(html).toContain("学习讲解")
        expect(html).toContain("词性和释义")
        expect(html).toContain("verb")
        expect(html).toContain("核心含义")
        expect(html).toContain("fully comprehend")
        expect(html).toContain("com- + prehend")
        expect(html).toContain("&lt;img src=x onerror=alert(1)&gt;")
        expect(html).toContain("领会 &lt;b&gt;idea&lt;/b&gt;")
        expect(html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;")
        expect(html).not.toContain("<img src=x")
        expect(html).not.toContain("<script>alert")
    })
})

import { describe, expect, it } from "vitest"
import { parseTextExplanationResponse } from "@/8_generate/services/TextExplanationService"

describe("parseTextExplanationResponse", () => {
    it("normalizes a valid text explanation response", () => {
        const result = parseTextExplanationResponse(
            JSON.stringify({
                summary: "理解",
                meaning: "在上下文中表示 grasp the meaning.",
                usage: "Used as a transitive verb.",
                grammar: "Often followed by a noun clause.",
                parts_of_speech: [
                    { part_of_speech: "verb", meanings: ["理解", "领会"] },
                    { part_of_speech: "noun", meanings: ["理解力"] },
                ],
                examples: [
                    {
                        sentence: "I understand the rule.",
                        translation: "我理解这条规则。",
                        note: "Direct object pattern.",
                    },
                ],
                collocations: ["understand clearly", "fully understand"],
                word_formation: "under + stand",
                memory_tips: ["Think of standing under an idea."],
            })
        )

        expect(result).toEqual({
            summary: "理解",
            meaning: "在上下文中表示 grasp the meaning.",
            usage: "Used as a transitive verb.",
            grammar: "Often followed by a noun clause.",
            partsOfSpeech: [
                { partOfSpeech: "verb", meanings: ["理解", "领会"] },
                { partOfSpeech: "noun", meanings: ["理解力"] },
            ],
            examples: [
                {
                    sentence: "I understand the rule.",
                    translation: "我理解这条规则。",
                    note: "Direct object pattern.",
                },
            ],
            collocations: ["understand clearly", "fully understand"],
            wordFormation: "under + stand",
            memoryTips: ["Think of standing under an idea."],
        })
    })

    it("drops empty optional fields and malformed examples", () => {
        const result = parseTextExplanationResponse(
            JSON.stringify({
                summary: "take care of",
                meaning: "照顾",
                usage: "Use it as a phrasal verb.",
                grammar: "",
                parts_of_speech: [
                    { part_of_speech: "verb phrase", meanings: ["照顾"] },
                    { part_of_speech: "", meanings: ["ignored"] },
                ],
                examples: [
                    { sentence: "Look after your sister.", translation: "照看你的妹妹。" },
                    { sentence: "Missing translation" },
                ],
                collocations: ["", "look after someone"],
                word_formation: " ",
                memory_tips: [" "],
            })
        )

        expect(result).toEqual({
            summary: "take care of",
            meaning: "照顾",
            usage: "Use it as a phrasal verb.",
            partsOfSpeech: [{ partOfSpeech: "verb phrase", meanings: ["照顾"] }],
            examples: [{ sentence: "Look after your sister.", translation: "照看你的妹妹。" }],
            collocations: ["look after someone"],
        })
    })

    it("throws when required fields are missing", () => {
        expect(() => parseTextExplanationResponse(JSON.stringify({ summary: "x" }))).toThrow(
            "Could not parse text explanation response from LLM"
        )
    })
})

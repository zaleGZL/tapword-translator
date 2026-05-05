/**
 * Translation Models
 *
 * Type definitions for translation functionality
 */

/**
 * Translation function parameters
 */
export interface TranslateParams {
    /** 要翻译的单词 */
    word: string
    /** 单词前的文本 (句子内部) */
    leadingText: string
    /** 单词后的文本 (句子内部) */
    trailingText: string
    /** 源语言 (可选, 例如 "en") */
    sourceLanguage?: string
    /** 目标语言 (可选, 默认 "zh") */
    targetLanguage?: string
    /** 使用升级模型 (可选, 用于刷新请求) */
    upgradeModel?: boolean
    /** 上下文信息 (可选) */
    contextInfo?: {
        /** 之前的句子 */
        previousSentences?: string[]
        /** 之后的句子 */
        nextSentences?: string[]
        /** 书名 */
        bookName?: string
        /** 作者 */
        bookAuthor?: string
    }
}

/**
 * Translation result
 */
export interface TranslationResult {
    /** 单词翻译 */
    wordTranslation: string
    /** 句子翻译 (如果提供了上下文) */
    sentenceTranslation?: string
    /** 中文词典定义 (仅对单个英文单词存在) */
    chineseDefinition?: string
    /** 英文词典定义 (仅对单个英文单词存在) */
    englishDefinition?: string
    /** 目标语言词典定义 (仅当 FreeDict 词典可用时存在) */
    targetDefinition?: string
    /** 词形还原后的基本形式 (例如 "running" → "run") */
    lemma?: string | null
    /** IPA 格式的音标 (仅对单个英文单词存在) */
    phonetic?: string
    /** 词形还原后的基本形式的音标 (仅当词形还原时存在) */
    lemmaPhonetic?: string
}

/**
 * Fragment translation function parameters
 */
export interface TranslateFragmentParams {
    /** 要翻译的片段 */
    fragment: string
    /** 片段前的文本 (句子内部, 可选) */
    leadingText?: string
    /** 片段后的文本 (句子内部, 可选) */
    trailingText?: string
    /** 源语言 (可选, 例如 "en") */
    sourceLanguage?: string
    /** 目标语言 (可选, 默认 "zh") */
    targetLanguage?: string
    /** 使用升级模型 (可选, 用于刷新请求) */
    upgradeModel?: boolean
    /** 上下文信息 (可选) */
    contextInfo?: {
        /** 之前的句子 */
        previousSentences?: string[]
        /** 之后的句子 */
        nextSentences?: string[]
        /** 书名 */
        bookName?: string
        /** 作者 */
        bookAuthor?: string
    }
}

/**
 * Fragment translation result
 */
export interface FragmentTranslationResult {
    /** 片段翻译 */
    translation: string
    /** 完整句子翻译 (可选: 当提供 leadingText 和 trailingText 时返回) */
    sentenceTranslation?: string
}

export type TextExplanationSelectionType = "word" | "fragment"

export interface ExplainTextParams {
    /** 要讲解的文本 */
    text: string
    /** 文本类型 */
    selectionType: TextExplanationSelectionType
    /** 文本前的句内上下文 */
    leadingText?: string
    /** 文本后的句内上下文 */
    trailingText?: string
    /** 源语言 */
    sourceLanguage?: string
    /** 讲解目标语言 */
    targetLanguage?: string
    /** 上下文信息 */
    contextInfo?: {
        previousSentences?: string[]
        nextSentences?: string[]
        bookName?: string
        bookAuthor?: string
    }
}

export interface TextExplanationExample {
    /** 原语言例句 */
    sentence: string
    /** 目标语言翻译 */
    translation: string
    /** 用法说明 */
    note?: string
}

export interface TextExplanationPartOfSpeech {
    /** 词性 */
    partOfSpeech: string
    /** 该词性的释义 */
    meanings: string[]
}

export interface TextExplanationResult {
    /** 简短译义/摘要 */
    summary: string
    /** 核心含义 */
    meaning: string
    /** 用法说明 */
    usage: string
    /** 语法说明 */
    grammar?: string
    /** 按词性分组的释义 */
    partsOfSpeech?: TextExplanationPartOfSpeech[]
    /** 例句 */
    examples: TextExplanationExample[]
    /** 常见搭配或句型 */
    collocations?: string[]
    /** 词根/构词 */
    wordFormation?: string
    /** 记忆方法 */
    memoryTips?: string[]
}

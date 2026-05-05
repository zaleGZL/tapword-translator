/**
 * Translation Service Tests
 */

import * as backend from '@/5_backend';
import { translateWord } from '@/6_translate/services/TranslationService';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock the backend post function
vi.mock('@/5_backend', () => {
    class APIError extends Error {
        type: string;
        code?: number;

        constructor(params: { type: string; code?: number; message?: string }) {
            super(params.message ?? '');
            this.name = 'APIError';
            this.type = params.type;
            this.code = params.code;
        }
    }

    return {
        APIError,
        post: vi.fn(),
    };
});

vi.mock('@/0_common/utils/i18n', () => ({
    translate: vi.fn((key: string) => key),
}));

describe('TranslationService', () => {
    beforeEach(() => {
        // Clear all mocks before each test
        vi.clearAllMocks();
    });

    describe('translateWord', () => {
        it('should translate a word with context', async () => {
            // Mock API response
            const mockResponse = {
                wordTranslation: '光线',
                sentenceTranslation: '房间里充满了从大窗户射入的自然光线。',
                provider: 'openai',
            };

            vi.mocked(backend.post).mockResolvedValue(mockResponse);

            // Call translateWord function
            const result = await translateWord({
                word: 'light',
                leadingText: 'The room was filled with natural ',
                trailingText: ' from the large windows.',
                originalSentence: 'The room was filled with natural light from the large windows.',
                sourceLanguage: 'en',
                targetLanguage: 'zh',
                contextInfo: {
                    previousSentences: ['He opened the curtains.'],
                    nextSentences: ['It made the space feel warm and inviting.'],
                },
            });

            // Verify result
            expect(result).toEqual({
                wordTranslation: '光线',
                sentenceTranslation: '房间里充满了从大窗户射入的自然光线。',
            });

            // Verify API call
            expect(backend.post).toHaveBeenCalledTimes(1);
            expect(backend.post).toHaveBeenCalledWith(
                '/api/v1/translate',
                {
                    text: 'light',
                    sourceLanguage: 'en',
                    targetLanguage: 'zh',
                    context: {
                        leadingText: 'The room was filled with natural ',
                        trailingText: ' from the large windows.',
                        originalSentence: 'The room was filled with natural light from the large windows.',
                        previousSentences: ['He opened the curtains.'],
                        nextSentences: ['It made the space feel warm and inviting.'],
                        bookName: undefined,
                        bookAuthor: undefined,
                    },
                }
            );
        });

        it('should use default target language', async () => {
            const mockResponse = {
                wordTranslation: '你好',
                provider: 'openai',
            };

            vi.mocked(backend.post).mockResolvedValue(mockResponse);

            await translateWord({
                word: 'hello',
                leadingText: '',
                trailingText: '',
            });

            // Verify default targetLanguage is 'zh'
            expect(backend.post).toHaveBeenCalledWith(
                '/api/v1/translate',
                expect.objectContaining({
                    targetLanguage: 'zh',
                })
            );
        });

        it('should include book information when provided', async () => {
            const mockResponse = {
                wordTranslation: '魔法',
                sentenceTranslation: '他施展了强大的魔法。',
                provider: 'openai',
            };

            vi.mocked(backend.post).mockResolvedValue(mockResponse);

            await translateWord({
                word: 'magic',
                leadingText: 'He cast a powerful ',
                trailingText: '.',
                contextInfo: {
                    bookName: 'Harry Potter',
                    bookAuthor: 'J.K. Rowling',
                },
            });

            expect(backend.post).toHaveBeenCalledWith(
                '/api/v1/translate',
                expect.objectContaining({
                    context: expect.objectContaining({
                        bookName: 'Harry Potter',
                        bookAuthor: 'J.K. Rowling',
                    }),
                })
            );
        });
    });

    describe('error handling', () => {
        it('should propagate API errors', async () => {
            const mockError = new backend.APIError({
                type: 'requestError',
                message: 'Internal server error',
            });

            vi.mocked(backend.post).mockRejectedValue(mockError);

            await expect(
                translateWord({
                    word: 'test',
                    leadingText: '',
                    trailingText: '',
                })
            ).rejects.toMatchObject({
                name: 'TranslationError',
            });
        });
    });
});

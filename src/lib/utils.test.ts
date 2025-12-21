
import { describe, it, expect } from 'vitest';
import { calculateSimilarity } from './utils';

describe('calculateSimilarity', () => {
    it('should return 1 for identical strings', () => {
        expect(calculateSimilarity('hello', 'hello')).toBe(1);
    });

    it('should return 0 for completely different strings', () => {
        expect(calculateSimilarity('abc', 'def')).toBe(0);
    });

    it('should match case-insensitively', () => {
        expect(calculateSimilarity('Hello', 'hello')).toBe(1);
    });

    it('should ignore leading/trailing whitespace', () => {
        expect(calculateSimilarity(' hello ', 'hello')).toBe(1);
    });

    it('should return a high score for similar strings', () => {
        expect(calculateSimilarity('hello world', 'hello worl')).toBeGreaterThan(0.9);
    });

    it('should return a low score for dissimilar strings', () => {
        expect(calculateSimilarity('hello world', 'goodbye moon')).toBeLessThan(0.3);
    });

    it('should handle empty strings', () => {
        expect(calculateSimilarity('', '')).toBe(1);
        expect(calculateSimilarity('a', '')).toBe(0);
    });
});

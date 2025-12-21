// src/lib/utils.ts
import { nanoid } from 'nanoid'; // Make sure nanoid is installed: npm install nanoid
import levenshtein from 'js-levenshtein';

/**
 * Calculates the similarity between two strings using Levenshtein distance.
 * Returns a value between 0 (completely different) and 1 (identical).
 */
export function calculateSimilarity(a: string, b: string): number {
    const normalizedA = a.toLowerCase().trim();
    const normalizedB = b.toLowerCase().trim();

    if (normalizedA === normalizedB) return 1;
    if (normalizedA.length === 0 || normalizedB.length === 0) return 0;

    const distance = levenshtein(normalizedA, normalizedB);
    const maxLength = Math.max(normalizedA.length, normalizedB.length);
    if (maxLength === 0) return 1; // Should be covered by equality check, but safety
    return 1 - (distance / maxLength);
}

/**
 * Generates a cryptographically strong, URL-friendly API key.
 * @returns A string representing the API key.
 */
export function generateApiKey(): string {
    // Using a length of 32 characters provides a very high number of possible combinations
    // (64^32 for base64url alphabet), making it extremely difficult to guess.
    return nanoid(32);
}
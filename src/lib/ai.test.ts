
import { describe, it, expect } from 'vitest';
import { QueryCleaning } from './ai';
import { config } from 'dotenv';
import { SongInfo } from '../dto/SongInfo';

// Load environment variables from .env
config();

describe('AI Query Cleaning', () => {
    it('should clean a complex song query using the real API', async () => {
        const apiKey = process.env.GROQ_API_KEY;
        if (!apiKey) {
            console.warn('Skipping AI test because GROQ_API_KEY is not set');
            return;
        }

        const rawQuery = "Stone Cold Eyes by artists: it's murph & Emi Grace";
        // Convert the logic to match what the user likely expects or what the prompt does.
        // Based on the prompt in src/lib/queryRefinePrompt.ts:
        // "Keep: Only the actual song name (trim spaces) (No ft or names of artists)"
        // The prompt examples show separating title and artists.

        const result = await QueryCleaning(rawQuery, apiKey);

        console.log('AI Result:', result);

        expect(result).toBeDefined();
        expect(result).toBeInstanceOf(SongInfo);
        expect(result.title).toBe("Stone Cold Eyes");
        // Artist expectations might vary based on AI response, but effectively it should identify them.
        expect(result.artist).toContain("it's murph");
        expect(result.artist).toContain("Emi Grace");
    }, 20000); // Increase timeout for API call
});

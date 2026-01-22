// Mapping of countries with identical or nearly identical flags
// These groups contain countries whose flags look the same visually

// Use the English common names from restcountries API
export const similarFlagGroups: string[][] = [
    // Tricolor vertical blue-white-red (identical)
    ["France", "Saint Martin"],

    // Horizontal red-white bicolor (nearly identical, slight ratio/shade differences)
    ["Indonesia", "Monaco"],

    // Tricolor vertical blue-yellow-red (nearly identical, slight shade differences)
    ["Romania", "Chad"],

    // Horizontal white-red bicolor (reversed Indonesia/Monaco)
    ["Poland", "Indonesia", "Monaco"], // Poland is white-red (reversed), but we exclude for safety

    // Note: We're being conservative here. Only truly identical flags are grouped.
];

// Build a lookup map for fast access
const similarFlagLookup: Map<string, string[]> = new Map();

for (const group of similarFlagGroups) {
    for (const country of group) {
        const others = group.filter(c => c !== country);
        const existing = similarFlagLookup.get(country) || [];
        similarFlagLookup.set(country, [...new Set([...existing, ...others])]);
    }
}

/**
 * Get all countries that have a similar/identical flag to the given country.
 * @param countryName - The English common name of the country (from API)
 * @returns Array of country names with similar flags (excluding the input country)
 */
export function getSimilarFlags(countryName: string): string[] {
    return similarFlagLookup.get(countryName) || [];
}

/**
 * Check if two countries have similar/identical flags.
 * @param a - First country name
 * @param b - Second country name
 * @returns True if the flags are similar
 */
export function areSimilarFlags(a: string, b: string): boolean {
    const similarToA = getSimilarFlags(a);
    return similarToA.includes(b);
}

/**
 * FlagHistory manages a circular buffer of recently shown flags
 * to prevent the same flag from appearing within a configurable window.
 */
export class FlagHistory {
    private history: string[] = [];
    private readonly maxSize: number;

    /**
     * Create a new FlagHistory instance
     * @param maxSize Maximum number of flags to track (default: 40)
     */
    constructor(maxSize: number = 40) {
        this.maxSize = maxSize;
    }

    /**
     * Add a flag to the history
     * @param cca2 The country code (cca2) of the flag
     */
    addFlag(cca2: string): void {
        this.history.push(cca2);

        // Keep only the last maxSize flags
        if (this.history.length > this.maxSize) {
            this.history.shift();
        }
    }

    /**
     * Check if a flag can be shown (i.e., it's not in the recent history)
     * @param cca2 The country code (cca2) to check
     * @returns true if the flag can be shown, false otherwise
     */
    canShowFlag(cca2: string): boolean {
        return !this.history.includes(cca2);
    }

    /**
     * Reset the history (clear all tracked flags)
     */
    reset(): void {
        this.history = [];
    }

    /**
     * Get the current size of the history
     * @returns The number of flags currently tracked
     */
    getSize(): number {
        return this.history.length;
    }

    /**
     * Get a copy of the current history
     * @returns Array of country codes in the history
     */
    getHistory(): string[] {
        return [...this.history];
    }
}

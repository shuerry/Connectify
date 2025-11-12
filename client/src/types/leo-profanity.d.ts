declare module 'leo-profanity' {
  interface LeoProfanity {
    /**
     * Checks whether the provided text contains profanity.
     */
    check: (text: string) => boolean;

    /**
     * Returns a censored version of the provided text.
     * The replaceKey determines the character used for censorship (default: '*').
     */
    clean: (text: string, replaceKey?: string) => string;

    /**
     * Returns an array of bad words used in the provided text.
     */
    badWordsUsed: (text: string) => string[];

    /**
     * Loads the built-in dictionary.
     * Optionally specify language and extra words to include.
     */
    loadDictionary: (language?: string, extraWords?: string[]) => string[];

    /**
     * Adds word(s) to the current dictionary.
     */
    add: (word: string | string[]) => void;

    /**
     * Removes word(s) from the current dictionary.
     */
    remove: (word: string | string[]) => void;

    /**
     * Resets the dictionary to defaults.
     */
    reset: () => void;
  }

  const leoProfanity: LeoProfanity;
  export default leoProfanity;
}


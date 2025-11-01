/**
 * Check if a message contains any prohibited words
 * @param message The message to check
 * @returns Object with isValid flag and array of found prohibited words
 */
export function checkProhibitedWords(message: string): {
  isValid: boolean;
  prohibitedWordsFound: string[];
} {
  // Get prohibited words from localStorage
  const stored = localStorage.getItem('prohibitedWords');
  const prohibitedWords: string[] = stored ? JSON.parse(stored) : ['bamboo'];

  // Convert message to lowercase for case-insensitive matching
  const messageLower = message.toLowerCase();

  // Find prohibited words in the message
  const found = prohibitedWords.filter((word) => {
    // Use word boundary regex to match whole words only
    const regex = new RegExp(`\\b${word.toLowerCase()}\\b`, 'i');
    return regex.test(messageLower);
  });

  return {
    isValid: found.length === 0,
    prohibitedWordsFound: found
  };
}

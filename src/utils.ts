/**
 * Find the position of the matching closing bracket in a text,
 * accounting for nested brackets.
 * 
 * @param text - The text to search
 * @param startPos - The position right after the opening bracket
 * @param openBracket - The opening bracket character ('[' or '(')
 * @param closeBracket - The closing bracket character (']' or ')')
 * @returns The index of the matching closing bracket, -1 if not found
 */
export function findMatchingBracket(
  text: string,
  startPos: number,
  openBracket: '[' | '(',
  closeBracket: ']' | ')'
): number {
  let count = 1;
  let inDoubleQuote = false;
  let inSingleQuote = false;

  for (let i = startPos; i < text.length; i++) {
    const char = text[i];
    if (char === '\\') {
      i++; // Skip the next character as it's escaped
      continue;
    }

    if (openBracket === '(') {
      if (char === '"' && !inSingleQuote) {
        inDoubleQuote = !inDoubleQuote;
        continue;
      }
      if (char === "'" && !inDoubleQuote) {
        inSingleQuote = !inSingleQuote;
        continue;
      }
      if (inDoubleQuote || inSingleQuote) {
        continue; // Ignore brackets inside quotes
      }
    }

    if (char === openBracket) {
      count++;
    }
    if (char === closeBracket) {
      count--;
      if (count === 0) {
        return i;
      }
    }
  }
  return -1; // No matching closing bracket found
}
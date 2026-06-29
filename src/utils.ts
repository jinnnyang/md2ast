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
  for (let i = startPos; i < text.length; i++) {
    if (text[i] === openBracket) {
      count++;
    }
    if (text[i] === closeBracket) {
      count--;
      if (count === 0) {
        return i;
      }
    }
  }
  return -1; // No matching closing bracket found
}
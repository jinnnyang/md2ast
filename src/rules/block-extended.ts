import { BlockState } from '../state.js';

export function blockquote(state: BlockState): boolean {
  const line = state.getLine(state.line);
  if (!/^ {0,3}>/.test(line)) return false;

  let nextLine = state.line;
  const contentLines: string[] = [];
  
  while (nextLine < state.lineMax) {
    const curLine = state.getLine(nextLine);
    const match = curLine.match(/^ {0,3}>(?:\s?(.*))$/);
    if (match) {
      contentLines.push(match[1] || '');
      nextLine++;
    } else {
      if (state.isEmpty(nextLine)) break; // stop at empty line
      contentLines.push(curLine);
      nextLine++;
    }
  }

  const innerSrc = contentLines.join('\n');
  const innerAst = state.md.parse(innerSrc); 

  state.doc.children.push({
    type: 'blockquote',
    children: innerAst.children,
    line_num: state.line,
    char_num: state.getCharNum(state.line)
  });
  
  state.line = nextLine;
  return true;
}

const LIST_RE = /^ {0,3}(?:[*+-]|\d{1,9}[.)])(?:\s+|$)/;

export function list(state: BlockState): boolean {
  const line = state.getLine(state.line);
  const match = line.match(LIST_RE);
  if (!match) return false;

  let isOrdered = false;
  if (match[0] && /\d/.test(match[0])) {
    isOrdered = true;
  }
  const markerLength = match[0] ? match[0].length : 0;
  
  let nextLine = state.line;
  const items: string[] = [];
  let currentItemLines: string[] = [];
  
  while (nextLine < state.lineMax) {
    const curLine = state.getLine(nextLine);
    if (state.isEmpty(nextLine)) {
      currentItemLines.push('');
      nextLine++;
      
      // Stop if double empty line
      if (nextLine < state.lineMax && state.isEmpty(nextLine)) {
        break;
      }
      continue;
    }

    const itemMatch = curLine.match(LIST_RE);
    if (itemMatch) {
      if (currentItemLines.length > 0) {
        items.push(currentItemLines.join('\n'));
        currentItemLines = [];
      }
      const mLen = itemMatch[0] ? itemMatch[0].length : 0;
      currentItemLines.push(curLine.slice(mLen));
      nextLine++;
    } else {
      const indentMatch = curLine.match(/^(\s*)(.*)$/);
      if (indentMatch && indentMatch[1] && indentMatch[1].length >= markerLength) {
        currentItemLines.push(curLine.slice(markerLength));
      } else {
        // Not a list item marker, not indented: break on any other block-level element
        const isOtherBlock =
          /^(#{1,6})(?:\s+(.*))?$/.test(curLine) ||  // heading
          /^ {0,3}>/.test(curLine) ||                  // blockquote
          /^ {0,3}(`{3,}|~{3,})/.test(curLine) ||     // fenced code
          /^ {0,3}<[A-Za-z]/.test(curLine) ||          // html block
          curLine.includes('|');                        // table row
        if (isOtherBlock) break;
        currentItemLines.push(curLine);
      }
      nextLine++;
    }
  }
  
  if (currentItemLines.length > 0) {
    items.push(currentItemLines.join('\n'));
  }

  const listChildren = items.map((itemStr, index) => {
    // Note: line_num estimation for list items is complex without tracking each item's actual line.
    // For simplicity we just use the list's starting line_num, or we can leave it to the list wrapper.
    const innerAst = state.md.parse(itemStr);
    return {
      type: 'listItem' as const,
      spread: false,
      children: innerAst.children
    };
  });

  state.doc.children.push({
    type: 'list',
    ordered: isOrdered,
    spread: false,
    children: listChildren,
    line_num: state.line,
    char_num: state.getCharNum(state.line)
  });

  state.line = nextLine;
  return true;
}

import { InlineState } from '../state.js';
import { findMatchingBracket } from '../utils.js';

export function emphasisRegex(state: InlineState): boolean {
  const tail = state.src.slice(state.pos);
  
  const strongMatch = tail.match(/^\*\*(.+?)\*\*/);
  if (strongMatch) {
    state.tokens.push({
      type: 'strong',
      children: [{ type: 'text', value: strongMatch[1] || '' }],
      char_num: state.getCharNum()
    });
    state.pos += strongMatch[0].length;
    return true;
  }
  
  const emMatch = tail.match(/^\*(.+?)\*/);
  if (emMatch) {
    state.tokens.push({
      type: 'emphasis',
      children: [{ type: 'text', value: emMatch[1] || '' }],
      char_num: state.getCharNum()
    });
    state.pos += emMatch[0].length;
    return true;
  }
  
  return false;
}

export function inlineCode(state: InlineState): boolean {
  const tail = state.src.slice(state.pos);
  const codeMatch = tail.match(/^`([^`]+)`/);
  if (codeMatch) {
    state.tokens.push({ type: 'inlineCode', value: codeMatch[1] || '', char_num: state.getCharNum() });
    state.pos += codeMatch[0].length;
    return true;
  }
  return false;
}

export function link(state: InlineState): boolean {
  const tail = state.src.slice(state.pos);
  if (!tail.startsWith('[')) {
    return false;
  }

  // Parse link text with nested square brackets
  const textEnd = findMatchingBracket(tail, 1, '[', ']');
  if (textEnd === -1) return false; // Unclosed bracket

  const text = tail.slice(1, textEnd);
  
  // Check for opening paren after closing bracket
  const afterText = tail.slice(textEnd + 1);
  const openParenMatch = afterText.match(/^\s*\(\s*/);
  if (!openParenMatch) return false;
  
  let parenStart = textEnd + 1 + openParenMatch[0].length;
  const parenEnd = findMatchingBracket(tail, parenStart, '(', ')');
  if (parenEnd === -1) return false; // Unclosed paren

  const insideParen = tail.slice(parenStart, parenEnd).trim();
  let url: string;
  let title: string | undefined;

  // Split into url and title (title can be in quotes or parens)
  const titleMatch = insideParen.match(/^(.*?)\s+(?:"([^"]*)"|\(([^)]*)\)|'([^']*)')\s*$/);
  if (titleMatch) {
    url = (titleMatch[1] || '').trim();
    title = titleMatch[2] || titleMatch[3] || titleMatch[4];
  } else {
    url = insideParen;
    title = undefined;
  }

  const token: any = {
    type: 'link',
    url,
    children: [{ type: 'text', value: text }],
    char_num: state.getCharNum()
  };
  if (title) token.title = title;
  state.tokens.push(token);
  state.pos += parenEnd + 1;
  return true;
}

export function image(state: InlineState): boolean {
  const tail = state.src.slice(state.pos);
  if (!tail.startsWith('![')) {
    return false;
  }

  // Parse alt text with nested square brackets
  const textEnd = findMatchingBracket(tail, 2, '[', ']');
  if (textEnd === -1) return false; // Unclosed bracket

  const alt = tail.slice(2, textEnd);
  
  // Check for opening paren after closing bracket
  const afterText = tail.slice(textEnd + 1);
  const openParenMatch = afterText.match(/^\s*\(\s*/);
  if (!openParenMatch) return false;
  
  let parenStart = textEnd + 1 + openParenMatch[0].length;
  const parenEnd = findMatchingBracket(tail, parenStart, '(', ')');
  if (parenEnd === -1) return false; // Unclosed paren

  const insideParen = tail.slice(parenStart, parenEnd).trim();
  let url: string;
  let title: string | undefined;

  // Split into url and title (title can be in quotes or parens)
  const titleMatch = insideParen.match(/^(.*?)\s+(?:"([^"]*)"|\(([^)]*)\)|'([^']*)')\s*$/);
  if (titleMatch) {
    url = (titleMatch[1] || '').trim();
    title = titleMatch[2] || titleMatch[3] || titleMatch[4];
  } else {
    url = insideParen;
    title = undefined;
  }

  const token: any = {
    type: 'image',
    alt,
    url,
    char_num: state.getCharNum()
  };
  if (title) token.title = title;
  state.tokens.push(token);
  state.pos += parenEnd + 1;
  return true;
}

export function htmlInline(state: InlineState): boolean {
  const tail = state.src.slice(state.pos);
  const tagMatch = tail.match(/^<[A-Za-z/][^>]*>/);
  if (tagMatch) {
    state.tokens.push({
      type: 'htmlInline',
      value: tagMatch[0] || '',
      char_num: state.getCharNum()
    });
    state.pos += tagMatch[0].length;
    return true;
  }
  return false;
}

// Underscore-based emphasis: __strong__ and _em_
export function emphasisUnderscore(state: InlineState): boolean {
  const tail = state.src.slice(state.pos);
  
  const strongMatch = tail.match(/^__(.+?)__/);
  if (strongMatch) {
    state.tokens.push({
      type: 'strong',
      children: [{ type: 'text', value: strongMatch[1] || '' }],
      char_num: state.getCharNum()
    });
    state.pos += strongMatch[0].length;
    return true;
  }
  
  const emMatch = tail.match(/^_(.+?)_/);
  if (emMatch) {
    state.tokens.push({
      type: 'emphasis',
      children: [{ type: 'text', value: emMatch[1] || '' }],
      char_num: state.getCharNum()
    });
    state.pos += emMatch[0].length;
    return true;
  }
  
  return false;
}

// GFM Strikethrough: ~~deleted~~
export function strikethrough(state: InlineState): boolean {
  const tail = state.src.slice(state.pos);
  const delMatch = tail.match(/^~~(.+?)~~/);
  if (delMatch) {
    state.tokens.push({
      type: 'delete',
      children: [{ type: 'text', value: delMatch[1] || '' }],
      char_num: state.getCharNum()
    });
    state.pos += delMatch[0].length;
    return true;
  }
  return false;
}

// CommonMark autolink: <https://example.com> or <user@example.com>
export function autolink(state: InlineState): boolean {
  const tail = state.src.slice(state.pos);
  
  // URI autolink
  const uriMatch = tail.match(/^<([A-Za-z][A-Za-z0-9+.\-]{1,31}:[^\s<>]*)>/);
  if (uriMatch) {
    const url = uriMatch[1] || '';
    state.tokens.push({
      type: 'link',
      url,
      children: [{ type: 'text', value: url }],
      char_num: state.getCharNum()
    });
    state.pos += uriMatch[0].length;
    return true;
  }
  
  // Email autolink
  const emailMatch = tail.match(/^<([A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)*)>/);
  if (emailMatch) {
    const email = emailMatch[1] || '';
    state.tokens.push({
      type: 'link',
      url: `mailto:${email}`,
      children: [{ type: 'text', value: email }],
      char_num: state.getCharNum()
    });
    state.pos += emailMatch[0].length;
    return true;
  }
  
  return false;
}

// Hard line break: two+ spaces or backslash before newline
export function hardBreak(state: InlineState): boolean {
  const tail = state.src.slice(state.pos);
  
  const match = tail.match(/^(?:  +|\\ *)\n/);
  if (match) {
    state.tokens.push({ type: 'break' as any, char_num: state.getCharNum() });
    state.pos += match[0].length;
    return true;
  }
  
  return false;
}

// Soft line break: single newline
export function softBreak(state: InlineState): boolean {
  if (state.src[state.pos] === '\n') {
    state.tokens.push({ type: 'break' as any, char_num: state.getCharNum() });
    state.pos++;
    return true;
  }
  return false;
}

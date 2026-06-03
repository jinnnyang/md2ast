import { InlineState } from '../state.js';

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
  const linkMatch = tail.match(/^\[(.*?)\]\(\s*([^ \t)]+)(?:\s+"(.*?)")?\s*\)/);
  if (linkMatch) {
    const token: any = {
      type: 'link',
      url: linkMatch[2] || '',
      children: [{ type: 'text', value: linkMatch[1] || '' }],
      char_num: state.getCharNum()
    };
    if (linkMatch[3]) token.title = linkMatch[3];
    state.tokens.push(token);
    state.pos += linkMatch[0].length;
    return true;
  }
  return false;
}

export function image(state: InlineState): boolean {
  const tail = state.src.slice(state.pos);
  const imgMatch = tail.match(/^!\[(.*?)\]\(\s*([^ \t)]+)(?:\s+"(.*?)")?\s*\)/);
  if (imgMatch) {
    const token: any = {
      type: 'image',
      alt: imgMatch[1] || '',
      url: imgMatch[2] || '',
      char_num: state.getCharNum()
    };
    if (imgMatch[3]) token.title = imgMatch[3];
    state.tokens.push(token);
    state.pos += imgMatch[0].length;
    return true;
  }
  return false;
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

import { BlockState } from '../state.js';
import type { CodeBlock } from '../ast.js';

export function thematicBreak(state: BlockState): boolean {
  const line = state.getLine(state.line);
  if (/^ {0,3}(?:(?:-[ \t]*){3,}|(?:_[ \t]*){3,}|(?:\*[ \t]*){3,})$/.test(line)) {
    state.doc.children.push({ type: 'thematicBreak' });
    state.line++;
    return true;
  }
  return false;
}

export function yamlFrontmatter(state: BlockState): boolean {
  if (state.line !== 0) return false;
  const startLine = state.getLine(state.line);
  if (startLine.trim() !== '---') return false;

  let endLine = state.line + 1;
  while (endLine < state.lineMax) {
    const curLine = state.getLine(endLine);
    if (curLine.trim() === '---') {
      const content = state.lines.slice(state.line + 1, endLine).join('\n');
      state.doc.children.push({
        type: 'yaml',
        value: content
      });
      state.line = endLine + 1;
      return true;
    }
    endLine++;
  }

  return false;
}

export function heading(state: BlockState): boolean {
  const line = state.getLine(state.line);
  const match = line.match(/^(#{1,6})(?:\s+(.*))?$/);
  if (!match) return false;

  const depth = (match[1] || '').length as 1|2|3|4|5|6;
  const content = (match[2] || '').trim();

  state.doc.children.push({
    type: 'heading',
    depth,
    children: [{ type: 'text', value: content }]
  });

  state.line++;
  return true;
}

export function fencedCode(state: BlockState): boolean {
  const line = state.getLine(state.line);
  const match = line.match(/^ {0,3}(`{3,}|~{3,})([^`]*)$/);
  if (!match) return false;

  const marker = match[1] || '';
  const info = (match[2] || '').trim();
  let nextLine = state.line + 1;
  let content = '';

  while (nextLine < state.lineMax) {
    const curLine = state.getLine(nextLine);
    if (curLine.trim().startsWith(marker)) {
      break;
    }
    content += curLine + '\n';
    nextLine++;
  }

  const codeNode: CodeBlock = {
    type: 'code',
    value: content.slice(0, -1) // remove trailing newline
  };
  if (info) {
    const parsedLang = info.split(/\s+/)[0];
    if (parsedLang) {
      codeNode.lang = parsedLang;
    }
    codeNode.meta = info;
  }
  state.doc.children.push(codeNode);

  state.line = nextLine < state.lineMax ? nextLine + 1 : nextLine;
  return true;
}

const HTML_BLOCK_RE = /^ {0,3}<[A-Za-z][A-Za-z0-9\-]*(?:\s|>|\/>|$)/;

export function htmlBlock(state: BlockState): boolean {
  const line = state.getLine(state.line);
  if (!HTML_BLOCK_RE.test(line)) return false;

  let nextLine = state.line;
  let content = '';
  
  while (nextLine < state.lineMax) {
    const curLine = state.getLine(nextLine);
    if (state.isEmpty(nextLine)) {
      break;
    }
    content += curLine + '\n';
    nextLine++;
  }
  
  state.doc.children.push({
    type: 'htmlBlock',
    value: content.slice(0, -1)
  });
  
  state.line = nextLine;
  return true;
}

// CommonMark: Indented code block (4 spaces or 1 tab)
export function indentedCode(state: BlockState): boolean {
  const line = state.getLine(state.line);
  if (!/^(?: {4}|\t)/.test(line)) return false;
  
  // Must not be inside a list context (simplification: check if prev was list)
  let nextLine = state.line;
  let content = '';

  while (nextLine < state.lineMax) {
    const curLine = state.getLine(nextLine);
    if (/^(?: {4}|\t)/.test(curLine)) {
      // Strip exactly the first 4 spaces or 1 tab
      content += curLine.replace(/^(?: {4}|\t)/, '') + '\n';
      nextLine++;
    } else if (state.isEmpty(nextLine)) {
      // Blank lines can appear inside indented code  
      content += '\n';
      nextLine++;
    } else {
      break;
    }
  }

  // Trim trailing blank lines from content
  content = content.replace(/\n+$/, '');

  state.doc.children.push({
    type: 'code',
    value: content
  });

  state.line = nextLine;
  return true;
}

// CommonMark: Setext heading (underline with === or ---)
export function setextHeading(state: BlockState): boolean {
  if (state.line + 1 >= state.lineMax) return false;

  const nextLineStr = state.getLine(state.line + 1);
  const setextMatch = nextLineStr.match(/^ {0,3}(={1,}|-{1,})\s*$/);
  if (!setextMatch) return false;

  const line = state.getLine(state.line);
  // The content line must not be blank or look like another block
  if (state.isEmpty(state.line)) return false;
  if (/^ {0,3}>/.test(line)) return false;

  const marker = setextMatch[1] || '';
  const depth = marker.startsWith('=') ? 1 : 2;
  const content = line.trim();

  state.doc.children.push({
    type: 'heading',
    depth: depth as 1 | 2,
    children: [{ type: 'text', value: content }]
  });

  state.line += 2;
  return true;
}

// CommonMark: Table (GFM extension, widely expected)
export function table(state: BlockState): boolean {
  // Need at least 2 lines: header + separator
  if (state.line + 1 >= state.lineMax) return false;
  
  const headerLine = state.getLine(state.line);
  const separatorLine = state.getLine(state.line + 1);
  
  // Header must contain at least one pipe to be a table row
  if (!headerLine.includes('|')) return false;

  // Separator must contain only |, -, :, and spaces with at least one --- cell
  const sepStripped = separatorLine.replace(/^\s*\||\|\s*$/g, '').trim();
  if (!sepStripped) return false;
  const sepParts = sepStripped.split('|').map(s => s.trim());
  const isValidSep = sepParts.length >= 1 && sepParts.every(p => /^:?-+:?$/.test(p));
  if (!isValidSep) return false;
  
  // Parse alignment from separator
  const sepCells = separatorLine.replace(/^\||\|$/g, '').split('|');
  const align: ('left' | 'right' | 'center' | null)[] = sepCells.map(cell => {
    const trimmed = cell.trim();
    if (trimmed.startsWith(':') && trimmed.endsWith(':')) return 'center';
    if (trimmed.endsWith(':')) return 'right';
    if (trimmed.startsWith(':')) return 'left';
    return null;
  });
  
  const parseRow = (rowLine: string) => {
    const raw = rowLine.replace(/^\||\|$/g, '');
    const cells = raw.split('|').map(c => c.trim());
    return {
      type: 'tableRow' as const,
      children: cells.map(cellText => ({
        type: 'tableCell' as const,
        children: [{ type: 'text' as const, value: cellText }]
      }))
    };
  };
  
  const rows = [parseRow(headerLine)];
  let nextLine = state.line + 2;
  
  while (nextLine < state.lineMax) {
    const curLine = state.getLine(nextLine);
    if (state.isEmpty(nextLine) || !curLine.includes('|')) break;
    rows.push(parseRow(curLine));
    nextLine++;
  }
  
  state.doc.children.push({
    type: 'table',
    align,
    children: rows
  });
  
  state.line = nextLine;
  return true;
}

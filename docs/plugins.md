# Plugin Development Guide

`md2ast` is designed with pluggability at its core. You can extend the parser to recognize custom Markdown grammar, block elements, or inline markers without editing the core library.

---

## The Rule Lifecycles

Parsing happens in three key phases managed by `Ruler` instances:
1. **`core`**: Normalization, preprocessing, and globally resolving link reference tags.
2. **`block`**: Identifying multi-line structural elements (headings, paragraphs, blockquotes, lists, custom containers) line-by-line.
3. **`inline`**: Identifying styles, links, and customized text tags within text elements character-by-character.

Rules are executed sequentially. If a rule returns `true`, it signals that it successfully handled the current state segment, advanced the pointer, and the parsing loop restarts for the next segment.

---

## Writing an Inline Plugin: Custom Text Highlight (`==highlight==`)

Let's implement a plugin that parses text wrapped in double equal signs (e.g. `==highlight==`) into a custom `highlight` AST node.

### 1. Extend AST types (TypeScript)

If you are using TypeScript, declare your custom node structure:

```typescript
import { Parent, AnyNode } from 'md2ast';

export interface HighlightNode extends Parent {
  type: 'highlight';
}

// Add it to the main inline union type
declare module 'md2ast' {
  interface NodeMap {
    highlight: HighlightNode;
  }
}
```

### 2. Implement the Inline Rule function

An inline rule inspects `state.src` from `state.pos` onwards. If it matches, it pushes to `state.tokens` and advances `state.pos`.

```typescript
import { InlineState } from 'md2ast';

export function highlightRule(state: InlineState): boolean {
  // Get slice of text starting at the current cursor position
  const tail = state.src.slice(state.pos);

  // Check if we match the double equal pattern
  const match = tail.match(/^==(.+?)==/);
  if (!match) {
    return false; // Yield to other inline rules
  }

  // Extract the text inside the wrapper
  const highlightedText = match[1] || '';

  // Push our new node
  state.tokens.push({
    type: 'highlight',
    children: [{ type: 'text', value: highlightedText }]
  });

  // CRITICAL: Advance the state cursor by the length of the matched text
  state.pos += match[0].length;

  return true; // Signal success
}
```

### 3. Register the Plugin via `.use()`

Wrap your rule registration inside a plugin function, and load it into your parser:

```typescript
import { MarkdownParser } from 'md2ast';

function highlightPlugin(parser: MarkdownParser) {
  // Put our rule before the emphasis rules to prevent '*' from getting priority 
  parser.inline.before('emphasisRegex', 'highlightText', highlightRule);
}

// Instantiate and apply the plugin
const parser = new MarkdownParser().use(highlightPlugin);
const ast = parser.parse("This is ==extremely important== text.");
```

---

## Writing a Block Plugin: Custom Info Callouts (`:::info`)

Let's create a plugin to parse custom markdown callout blocks similar to Docusaurus:
```markdown
:::info
This is an alert box.
:::
```

### 1. Implement the Block Rule function

A block rule parses lines starting at `state.line`. It must find its boundaries, advance `state.line`, and append the child node to `state.doc.children`.

```typescript
import { BlockState } from 'md2ast';

export function calloutBlockRule(state: BlockState): boolean {
  const startLine = state.line;
  const firstLineText = state.getLine(startLine);

  // Match syntax like :::info or :::warning
  const match = firstLineText.match(/^ {0,3}:::\s*([a-zA-Z0-9\-]+)\s*$/);
  if (!match) {
    return false; // Yield to other block rules
  }

  const kind = match[1] || 'info';
  let endLine = startLine + 1;
  let linesCollected: string[] = [];
  let closed = false;

  // Search for the closing ::: block boundary
  while (endLine < state.lineMax) {
    const curLine = state.getLine(endLine);
    if (/^ {0,3}:::\s*$/.test(curLine)) {
      closed = true;
      break;
    }
    linesCollected.push(curLine);
    endLine++;
  }

  if (!closed) {
    // Record warnings for unclosed blocks instead of throwing
    state.md?.warnings.push(`Unclosed callout block at line ${startLine + 1}`);
  }

  // Recursively parse inner lines as blocks
  const innerSource = linesCollected.join('\n');
  const innerAst = state.md.parse(innerSource);

  // Append new custom block node
  state.doc.children.push({
    type: 'callout',
    kind,
    children: innerAst.children,
    line_num: startLine,
    char_num: state.getCharNum(startLine)
  } as any);

  // Advance the line pointer past the closed block
  state.line = closed ? endLine + 1 : endLine;

  return true;
}
```

### 2. Register the Block Plugin

```typescript
import { MarkdownParser } from 'md2ast';

function calloutPlugin(parser: MarkdownParser) {
  // Prioritize callouts before standard blockquote or indented code rules
  parser.block.before('blockquote', 'callout', calloutBlockRule);
}

const parser = new MarkdownParser().use(calloutPlugin);
const ast = parser.parse(`
:::warning
Beware of the dog!
:::
`);
```

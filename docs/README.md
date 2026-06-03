# md2ast Documentation

Welcome to the official documentation for **md2ast**, a lightweight, highly extensible, strictly typed Markdown parser and renderer written in TypeScript. 

`md2ast` conforms strictly to the CommonMark specification while providing special features designed for programmatic analysis, AST manipulation, and LLM-driven document cleaning/processing.

---

## Key Features

1. **Precision Positional Tracking**: Every AST node retains lightweight `line_num` and `char_num` offsets relative to the original raw document. By comparing sibling nodes, you can determine exact substring boundaries without bloating the AST memory footprint.
2. **Robust Plugin System**: Seamlessly extend the parser with your own block-level and inline-level rules via `.use(pluginFn)`. Customize parsing behavior or add new custom syntax in just a few lines of code.
3. **Lossless / Round-trip Rendering**: With `MarkdownRender`, you can serialize the modified AST back into valid CommonMark Markdown string.
4. **Detailed Warning System**: Rather than silently failing or crashing on syntax anomalies (like unclosed code fences or malformed HTML blocks), `md2ast` records anomalies into a `warnings` queue for auditing.
5. **No External Runtime Dependencies**: Built entirely with pure TypeScript/JavaScript, keeping your dependency tree clean.

---

## Table of Contents

- [AST Specification](ast.md) - Deep dive into all syntax nodes and the positional tracking mechanism.
- [API Reference](api.md) - Detailed breakdown of the classes (`MarkdownParser`, `MarkdownRender`, `BlockState`, `InlineState`, `Ruler`) and standard usage.
- [Plugin Development Guide](plugins.md) - Learn how to write custom block and inline rules to extend the Markdown grammar.

---

## Quick Start

### Installation

```bash
npm install md2ast
```

### Basic Parsing & Rendering

```typescript
import { MarkdownParser, MarkdownRender } from 'md2ast';

const source = `
# Welcome to md2ast

Here is some **bold text** and a [link](https://example.com).
`;

// Initialize the parser
const parser = new MarkdownParser();

// 1. Parse Markdown text to an AST (Abstract Syntax Tree)
const ast = parser.parse(source);
console.log(JSON.stringify(ast, null, 2));

// 2. Render the AST back to a Markdown string
const renderer = new MarkdownRender();
const renderedMarkdown = renderer.render(ast);
console.log(renderedMarkdown);
```

### Inspection of Warnings

```typescript
const malformedMarkdown = `
\`\`\`typescript
console.log("Forgot to close this code block!");
`;

const parser = new MarkdownParser();
const ast = parser.parse(malformedMarkdown);

if (parser.warnings.length > 0) {
  console.warn('Parser warnings encountered:', parser.warnings);
  // Output: ["Unclosed fenced code block at line 1"]
}
```

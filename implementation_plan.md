# Markdown Parser Design Plan

This document outlines the architecture and design of a TypeScript-based Markdown parser that outputs a structured Abstract Syntax Tree (AST).

## Goal and Objectives
- **Input**: Plain Markdown text.
- **Output**: Structural AST (Abstract Syntax Tree), representing the document accurately while preserving Markdown semantics and raw HTML tags.
- **Language**: TypeScript (strict mode, zero dependencies for the core parser).
- **Extensibility**: Support plugin mechanisms (Core, Block, Inline rules) inspired by `markdown-it`.

## User Decisions

> [!NOTE]
> - **Specification Strictness**: Fully implement strict CommonMark specifications.
> - **HTML Handling**: Matched HTML will be directly preserved as untouched strings in the AST as `HtmlInline` / `HtmlBlock` nodes to be passed down.
> - **Build System**: Use pure `tsc` for building.

## Proposed Changes / Architecture

### 1. AST Data Structure (`src/ast.ts`)

We will adopt a structure inspired by `mdast` (Markdown Abstract Syntax Tree) to define a robust standard. Every node has a string `type` and an optional `position` recording original source lines.

```typescript
export interface Point {
  line: number;
  column: number;
  offset?: number;
}

export interface Position {
  start: Point;
  end: Point;
}

export interface Node {
  type: string;
  position?: Position;
}

export interface Parent extends Node {
  children: Node[];
}

export interface Literal extends Node {
  value: string;
}
```

**Common Node Types:**
- **Block Nodes**: `Document` (Root), `Heading`, `Paragraph`, `Blockquote`, `List`, `ListItem`, `CodeBlock`, `Table`, `TableRow`, `TableCell`, `ThematicBreak`, `HtmlBlock`.
- **Inline Nodes**: `Text`, `Strong` (Bold), `Emphasis` (Italic), `InlineCode`, `Link`, `Image`, `HtmlInline`, `Delete` (Strikethrough).

### 2. Parsing Architecture (Three-Phase)

The parsing process will be managed by a `Parser` class, delegating execution to a `Ruler` (managing priority chains):

#### Phase 1: Core Rules (Normalization)
- **Normalize**: Unify newline conventions (CRLF -> LF) and handle tabs/null characters.
- **Pre-process**: Extract reference links (`[target]: url` at the document root level).

#### Phase 2: Block Parsing (Line-by-Line)
Scans text identifying block-level structural domains.
- **State**: A `BlockState` instance tracking current line, indentation, and open blocks (which resolves deeply nested Blockquote and List elements).
- **Priority Chain**: `HtmlBlock -> CodeFence -> Blockquote -> List -> ThematicBreak -> Heading -> Table -> Paragraph`.
- **Output**: An AST containing only Block nodes. Paragraphs and heading contents remain as raw literal strings.

#### Phase 3: Inline Parsing (Fragmented)
Walks the Block AST generated in Phase 2. For any block node types known to contain inline text (e.g., `Paragraph`, `Heading`, `TableCell`), we apply inline parsing rules.
- **State**: An `InlineState` instance tracking the current character index.
- **Priority Chain**: `HtmlInline -> InlineCode -> Link/Image -> Strong/Emphasis -> Delete -> Text`.
- **Output**: The completed AST.

### 3. File Structure

- `src/index.ts` - Entry point and public API.
- `src/ast.ts` - TypeScript interfaces defining the AST structure.
- `src/parser.ts` - Core engine handling the three phases.
- `src/state.ts` - Defines state classes (`BlockState`, `InlineState`) used to keep track of cursor indices.
- `src/rules/` - Organized implementations of rules by category (`core`, `block`, `inline`).
- `src/utils.ts` - Utility functions (Regex helpers, HTML escaping/unescaping).


## Verification Plan

### Automated Tests
- Initialize **Vitest** or **Jest**.
- Produce text fixtures matching your requirement text (Lists, Quotations, Anchor links, Task lists, etc.).
- Snapshot tests comparing the AST JSON tree generated versus the expected structure.

### Manual Verification
- Create a test script (`test.ts`) that runs the parser against your provided markdown snippet examples and logs the AST output to console/file.

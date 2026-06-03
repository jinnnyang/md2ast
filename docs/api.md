# API Reference

This page provides detail about the public classes, interfaces, and methods exported by the `md2ast` library.

---

## `MarkdownParser`

The core orchestrator responsible for compiling Markdown text into a structured AST.

### Constructor
```typescript
constructor()
```
Creates a new parser instance and pre-registers standard CommonMark rules for the core, block, and inline phases.

### Methods

#### `parse(src: string): Document`
Parses raw Markdown content into an AST Document.
* **Parameters**:
  * `src`: Raw markdown source text.
* **Returns**: An AST `Document` node wrapping all children.

#### `use(pluginFn: (parser: MarkdownParser, options?: any) => void, options?: any): this`
Registers a plugin to extend parser rules. Supports chaining.
* **Parameters**:
  * `pluginFn`: A callback function receiving the parser instance and options.
  * `options`: Custom options passed to the plugin function.
* **Returns**: The current `MarkdownParser` instance for chaining.

### Properties
* `core`: `Ruler<BlockState>` - Ruler governing the initial preprocessing pipeline.
* `block`: `Ruler<BlockState>` - Ruler governing block-level grammar parsing.
* `inline`: `Ruler<InlineState>` - Ruler governing inline-level text decoration mapping.
* `warnings`: `string[]` - Array of recorded warnings/anomalies (e.g. unclosed code fences, unclosed HTML blocks).
* `references`: `Map<string, { url: string; title?: string }>` - Extracted reference link mapping.

---

## `MarkdownRender`

The reverse of the parser. Serializes an AST back into formatted Markdown string.

### Constructor
```typescript
constructor()
```

### Methods

#### `render(node: AnyNode): string`
Converts any AST node (usually the root `Document`) back into standard Markdown string.
* **Parameters**:
  * `node`: Target AST node.
* **Returns**: Formatted Markdown string (ends with a newline).

---

## `Ruler<S>`

Rule container and priority pipeline manager.

### Methods

#### `push(name: string, action: (state: S, ...args: any[]) => boolean): void`
Appends a rule to the end of the rule list.
* **Parameters**:
  * `name`: Unique name identifier for the rule.
  * `action`: Action handler executing parsing. Returns `true` if rule succeeded, `false` otherwise.

#### `before(beforeName: string, name: string, action: (state: S, ...args: any[]) => boolean): void`
Inserts a rule immediately before an existing rule.
* **Throws**: Error if `beforeName` is not found.

#### `after(afterName: string, name: string, action: (state: S, ...args: any[]) => boolean): void`
Inserts a rule immediately after an existing rule.
* **Throws**: Error if `afterName` is not found.

#### `getRules(): Rule<S>[]`
Returns the array of active rules.

---

## `BlockState`

State manager during the core and block-level parsing.

### Constructor
```typescript
constructor(src: string, mdInstance?: MarkdownParser, baseOffset?: number)
```

### Properties & Methods
* `src`: `string` - Raw markdown source segment.
* `lines`: `string[]` - Source split into individual lines.
* `line`: `number` - Current 0-indexed scanning line pointer.
* `lineMax`: `number` - Total line count.
* `doc`: `Document` - Root document being built.
* `parent`: `AnyNode` - Target parent node children are currently being appended to.
* `baseOffset`: `number` - Cumulative character offset.
* `getLine(line: number): string` - Returns line text or `""` if index is out of bounds.
* `isEmpty(line: number): boolean` - Safely checks if line consists solely of whitespaces.
* `getCharNum(line: number): number` - Maps 0-indexed line number to absolute 0-indexed character offset relative to the original source document in O(1) time.

---

## `InlineState`

State manager during the inline-level processing.

### Constructor
```typescript
constructor(src: string, baseOffset?: number)
```

### Properties & Methods
* `src`: `string` - Inline raw text segment.
* `pos`: `number` - Current 0-indexed character index within the segment.
* `posMax`: `number` - Length of the segment.
* `tokens`: `AnyNode[]` - Array of resolved inline AST nodes.
* `baseOffset`: `number` - Absolute character offset where this segment starts in the parent document.
* `getCharNum(): number` - Maps current state pos cursor to absolute 0-indexed character offset.

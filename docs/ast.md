# AST Specification & Positional Tracking

`md2ast` produces a clean, strongly typed Abstract Syntax Tree (AST) that is compliant with the general shapes of Unist/Mdast, optimized for easy modification and rendering.

---

## The Node Interfaces

All AST nodes implement the base `Node` interface:

```typescript
export interface Node {
  /** The type of the AST node (e.g. 'paragraph', 'heading', 'text') */
  type: string;
  /** The starting line number (0-indexed) of this node in the source document */
  line_num?: number;
  /** The starting absolute character offset (0-indexed) of this node in the source document */
  char_num?: number;
}
```

There are two main categories of nodes extending `Node`:

### 1. Parent Nodes
Contain child nodes.
```typescript
export interface Parent extends Node {
  children: AnyNode[];
}
```

### 2. Literal Nodes
Contain string values directly.
```typescript
export interface Literal extends Node {
  value: string;
}
```

---

## AST Node Types Directory

### Block Nodes

| Type | Interface | Fields | Description |
| :--- | :--- | :--- | :--- |
| `document` | `Document` | `children: AnyNode[]` | The root node of the AST. |
| `paragraph` | `Paragraph` | `children: AnyNode[]` | A standard block paragraph. |
| `heading` | `Heading` | `children: AnyNode[]`<br>`depth: 1 \| 2 \| 3 \| 4 \| 5 \| 6` | Headings corresponding to `#` to `######`. |
| `thematicBreak`| `ThematicBreak` | *None* | A horizontal rule (`---` or `***`). |
| `yaml` | `Yaml` | `value: string` | Frontmatter metadata parsed from the very beginning of the file. |
| `blockquote` | `Blockquote` | `children: AnyNode[]` | Block quotes (nested elements started with `>`). |
| `list` | `List` | `children: AnyNode[]`<br>`ordered: boolean`<br>`start?: number`<br>`spread: boolean` | Ordered/unordered lists. `spread` indicates loose spacing. |
| `listItem` | `ListItem` | `children: AnyNode[]`<br>`spread: boolean` | A list item wrapping block/inline content. |
| `code` | `CodeBlock` | `value: string`<br>`lang?: string`<br>`meta?: string` | Fenced or indented code block. |
| `htmlBlock` | `HtmlBlock` | `value: string` | Standard HTML blocks. |
| `table` | `Table` | `children: TableRow[]`<br>`align?: ('left' \| 'right' \| 'center' \| null)[]` | GitHub Flavored Markdown (GFM) table structures. |
| `tableRow` | `TableRow` | `children: TableCell[]` | Row container inside a GFM Table. |
| `tableCell` | `TableCell` | `children: AnyNode[]` | Cell container inside a table row. |

### Inline Nodes

| Type | Interface | Fields | Description |
| :--- | :--- | :--- | :--- |
| `text` | `Text` | `value: string` | Plain text element. |
| `emphasis` | `Emphasis` | `children: AnyNode[]` | Italics representation (`*text*` or `_text_`). |
| `strong` | `Strong` | `children: AnyNode[]` | Bold text representation (`**text**` or `__text__`). |
| `delete` | `Delete` | `children: AnyNode[]` | Strikethrough text representation (`~~text~~`). |
| `inlineCode` | `InlineCode` | `value: string` | Inline monospace code blocks (`` `code` ``). |
| `link` | `Link` | `children: AnyNode[]`<br>`url: string`<br>`title?: string` | Inline or reference link wrapper. |
| `image` | `Image` | `url: string`<br>`title?: string`<br>`alt?: string` | Inline image node. |
| `htmlInline` | `HtmlInline` | `value: string` | Raw inline HTML tag string. |

---

## Positional Tracking (`line_num`, `char_num`)

Unlike traditional markdown parsers that define verbose `position` objects with start/end details (e.g. line, column, offset), `md2ast` keeps it **lightweight** and **computable** by storing only the start metrics:
* `line_num`: The 0-indexed line number where the node starts.
* `char_num`: The absolute, 0-indexed character offset from the very beginning of the document string.

### How to Calculate a Node's Exact Boundaries

Because Markdown elements in the AST are sequentially matched and contiguous in document flow, you can determine any node's boundaries **by comparing it with its subsequent sibling node** or the end of its parent node.

#### Math Formulation:
```
Node Start = node.char_num
Node End   = nextSibling.char_num (or parentNode.end_offset if it is the last child)
```

#### Code Example (Extracting Raw Source Substring for any Node):

```typescript
import { Document, AnyNode } from 'md2ast';

/**
 * Extracts the exact raw markdown string corresponding to an AST node.
 * 
 * @param node - The target node to extract text for.
 * @param parent - The parent node of the target node.
 * @param originalSource - The original raw markdown document string.
 */
export function getRawSourceForNode(
  node: AnyNode,
  parent: AnyNode & { children?: AnyNode[] },
  originalSource: string
): string {
  const startOffset = node.char_num;
  if (startOffset === undefined) {
    throw new Error('Node positional tracking is missing!');
  }

  let endOffset = originalSource.length;

  if (parent.children) {
    const nodeIndex = parent.children.indexOf(node);
    if (nodeIndex !== -1 && nodeIndex < parent.children.length - 1) {
      // The end offset is the start offset of the next sibling!
      const nextSibling = parent.children[nodeIndex + 1];
      if (nextSibling && nextSibling.char_num !== undefined) {
        endOffset = nextSibling.char_num;
      }
    } else {
      // If it is the last child, we can estimate its end boundary based on the parent's boundaries 
      // or simply fallback to the next block boundary or end-of-string.
    }
  }

  return originalSource.slice(startOffset, endOffset);
}
```

### Ideal for LLM-Based Cleaning
When using an LLM to clean up specific nodes (e.g., correcting grammar inside a paragraph or sanitizing HTML snippets):
1. Locate the erroneous node in the AST.
2. Use `char_num` to extract its raw text block from the document.
3. Feed that isolated block to the LLM.
4. Replace the old range in the raw document with the LLM's sanitized output, and perform a quick incremental offset adjust (or simple re-parse) for subsequent nodes.

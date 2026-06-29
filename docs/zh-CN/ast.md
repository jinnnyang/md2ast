# AST 节点规范与位置追踪

`md2ast` 生成一个干净的、强类型的、与 Unist/Mdast 接口大体一致的抽象语法树（AST），非常适合进行节点修改与重新渲染。

---

## 节点接口定义

所有的 AST 节点都实现了基础的 `Node` 接口：

```typescript
export interface Node {
  /** AST 节点的类型名称（例如 'paragraph', 'heading', 'text'） */
  type: string;
  /** 节点在源文档中起始位置的行号（从 0 开始计数，可选） */
  line_num?: number;
  /** 节点在源文档中起始位置的绝对字符偏移量（从 0 开始计数，可选） */
  char_num?: number;
}
```

继承自 `Node` 接口的两个主要派生接口是：

### 1. 父节点 Parent
包含子节点数组。
```typescript
export interface Parent extends Node {
  children: AnyNode[];
}
```

### 2. 字面量节点 Literal
直接包含文本值。
```typescript
export interface Literal extends Node {
  value: string;
}
```

---

## 节点类型一览表

### 块级节点 (Block Nodes)

| 类型名 (type) | 对应接口 | 核心字段 | 描述 |
| :--- | :--- | :--- | :--- |
| `document` | `Document` | `children: AnyNode[]` | AST 的根节点。 |
| `paragraph` | `Paragraph` | `children: AnyNode[]` | 标准的块级段落。 |
| `heading` | `Heading` | `children: AnyNode[]`<br>`depth: 1 \| 2 \| 3 \| 4 \| 5 \| 6` | 标题，对应 `#` 到 `######`。 |
| `thematicBreak`| `ThematicBreak` | *无* | 分割线（如 `---` 或 `***`）。 |
| `yaml` | `Yaml` | `value: string` | 解析自文件绝对顶部的 Frontmatter 元数据块。 |
| `blockquote` | `Blockquote` | `children: AnyNode[]` | 引用块（由 `>` 开头的行）。 |
| `list` | `List` | `children: AnyNode[]`<br>`ordered: boolean`<br>`start?: number`<br>`spread: boolean` | 有序或无序列表。`spread` 代表是否为松散列表。 |
| `listItem` | `ListItem` | `children: AnyNode[]`<br>`spread: boolean` | 列表项，内部可嵌套块级或行内级节点。 |
| `code` | `CodeBlock` | `value: string`<br>`lang?: string`<br>`meta?: string` | 围栏代码块或缩进代码块。 |
| `htmlBlock` | `HtmlBlock` | `value: string` | 标准 HTML 块。 |
| `table` | `Table` | `children: TableRow[]`<br>`align?: ('left' \| 'right' \| 'center' \| null)[]` | GFM 规范表格。 |
| `tableRow` | `TableRow` | `children: TableCell[]` | 表格行容器。 |
| `tableCell` | `TableCell` | `children: AnyNode[]` | 表格单元格容器。 |

### 行内节点 (Inline Nodes)

| 类型名 (type) | 对应接口 | 核心字段 | 描述 |
| :--- | :--- | :--- | :--- |
| `text` | `Text` | `value: string` | 纯文本节点。 |
| `emphasis` | `Emphasis` | `children: AnyNode[]` | 斜体文本（`*文本*` 或 `_文本_`）。 |
| `strong` | `Strong` | `children: AnyNode[]` | 粗体文本（`**文本**` 或 `__文本__`）。 |
| `delete` | `Delete` | `children: AnyNode[]` | 删除线文本（`~~文本~~`）。 |
| `inlineCode` | `InlineCode` | `value: string` | 行内代码（`` `代码` ``）。 |
| `link` | `Link` | `children: AnyNode[]`<br>`url: string`<br>`title?: string` | 链接包裹器。 |
| `image` | `Image` | `url: string`<br>`title?: string`<br>`alt?: string` | 行内图片节点。 |
| `htmlInline` | `HtmlInline` | `value: string` | 行内原始 HTML 标签字符串。 |

### 链接与图片解析特性

`md2ast` 采用了鲁棒的扫描器（`findMatchingBracket`）来确定链接和图片的匹配边界，而不是使用简单的正则表达式。这使得解析器支持以下高级特性：
* **URL 中的嵌套圆括号**: 能够正确解析 URL 中包含嵌套括号的链接，如 `[Wikipedia](https://en.wikipedia.org/wiki/Markdown_(markup_language))`。
* **链接文本中的嵌套中括号**: 能够正确处理链接文本区域内的嵌套中括号，如 `[text with [nested] brackets](https://example.com)`。
* **反斜杠转义**: 在寻找括号边界时能够正确识别并跳过反斜杠转义的括号（如 `\]` 或 `\[`），使得 `[link\]](url)` 能够成功解析为文本内容为 `link\]` 的链接。
* **引号感知型标题处理**: 在匹配外部圆括号时，自动忽略被单引号或双引号包围的链接标题中的未成对括号（例如 `[link](url "title (unmatched")`）。
* **空格限制**: 严格遵循 CommonMark 规范，不允许在中括号 `]` 和圆括号 `(` 之间存在空格（例如 `[link] (url)` 会被解析为纯文本，而不是链接）。

---

## 位置追踪与差值计算 (`line_num`, `char_num`)

传统的 Markdown 解析器通常会使用庞大的 `position` 对象记录开始和结束的行列、偏移量，而 `md2ast` 采用了更加**轻量化**且**可计算**的设计，只存储起点的两个指标：
* `line_num`: 节点起点的 0-indexed 行号。
* `char_num`: 节点起点在整个文档字符串中的 0-indexed 绝对字符偏移量。

### 如何计算节点的精确结束边界

因为 AST 节点在解析时是紧密相连且与文本顺序一致的，你可以**通过对比当前节点与下一个兄弟节点的起点**来推算当前节点的结束范围。

#### 边界计算公式：
```
当前节点起点偏移 = node.char_num
当前节点结束偏移 = nextSibling.char_num (如果当前节点是最后一个子节点，则可取父节点的结束范围或文档总长度)
```

#### 获取节点源码范围的代码示例：

```typescript
import { Document, AnyNode } from 'md2ast';

/**
 * 获取某个 AST 节点在原始 Markdown 文档中对应的精确子字符串。
 * 
 * @param node - 目标 AST 节点。
 * @param parent - 目标节点的父节点。
 * @param originalSource - 原始未解析的 Markdown 完整文本。
 */
export function getRawSourceForNode(
  node: AnyNode,
  parent: AnyNode & { children?: AnyNode[] },
  originalSource: string
): string {
  const startOffset = node.char_num;
  if (startOffset === undefined) {
    throw new Error('节点缺少位置跟踪属性！');
  }

  let endOffset = originalSource.length;

  if (parent.children) {
    const nodeIndex = parent.children.indexOf(node);
    if (nodeIndex !== -1 && nodeIndex < parent.children.length - 1) {
      // 结束位置即是下一个兄弟节点的起始位置！
      const nextSibling = parent.children[nodeIndex + 1];
      if (nextSibling && nextSibling.char_num !== undefined) {
        endOffset = nextSibling.char_num;
      }
    }
  }

  return originalSource.slice(startOffset, endOffset);
}
```

### LLM（大语言模型）清洗文本的黄金搭档
当需要用大模型清洗和重写文档的特定节点时：
1. 遍历 AST 定位到需要修复的节点（如某个格式混乱的段落 `paragraph` 或有错字的标题 `heading`）。
2. 根据 `char_num` 差值公式精确切片出该节点包含尾部换行/空行在内的完整原始字符串。
3. 将该部分独立文本发送给大语言模型进行清洗与重写。
4. 用清洗后的新字符串直接替换原文档对应范围。由于获取时连带了尾部空白，替换时不会留下任何多余的换行，实现极致干净的程序化文本清洗。

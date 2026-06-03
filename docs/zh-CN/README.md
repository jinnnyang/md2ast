# md2ast 中文文档

欢迎使用 **md2ast** 的官方文档。这是一个使用 TypeScript 编写的轻量级、高可扩展性、严格类型安全的 Markdown 解析器与渲染器。

`md2ast` 严格遵循 CommonMark 规范，同时提供了专门针对程序化分析、AST 操作和大语言模型（LLM）驱动的文档清洗与处理而设计的特性。

---

## 核心特性

1. **精准位置追踪**：每个 AST 节点都保留了相对于原始文档的轻量级 `line_num`（行号）和 `char_num`（字符绝对偏移）属性。通过对比相邻的兄弟节点，即可算出任何节点的精确子字符串边界，而不会让 AST 的内存占用变得臃肿。
2. **强大的插件系统**：通过 `.use(pluginFn)` 即可轻松扩展解析器，加入自定义的块级（Block-level）和行内级（Inline-level）语法规则。
3. **无损 / 双向闭环渲染**：使用 `MarkdownRender` 可以将修改后的 AST 重新序列化回符合 CommonMark 标准的 Markdown 字符串。
4. **详尽的警告系统**：在解析过程中遇到格式异常（如未闭合的代码块或不规范的 HTML 块）时，`md2ast` 不会直接崩溃或静默忽略，而是将其记录到 `warnings` 队列中供审计。
5. **无外部运行时依赖**：完全基于纯 TypeScript/JavaScript 构建，保持您的项目依赖树极其干净。

---

## 目录

- [AST 节点规范](ast.md) - 深入了解所有语法节点定义及位置追踪机制。
- [API 参考手册](api.md) - 详细拆解核心类（`MarkdownParser`, `MarkdownRender`, `BlockState`, `InlineState`, `Ruler`）及标准用法。
- [插件开发指南](plugins.md) - 学习如何编写自定义的块级和行内级规则以扩展 Markdown 语法。

---

## 快速上手

### 安装

```bash
npm install md2ast
```

### 基础解析与渲染

```typescript
import { MarkdownParser, MarkdownRender } from 'md2ast';

const source = `
# 欢迎使用 md2ast

这里有一些 **加粗文本** 以及一个 [链接](https://example.com)。
`;

// 初始化解析器
const parser = new MarkdownParser();

// 1. 将 Markdown 文本解析为 AST (抽象语法树)
const ast = parser.parse(source);
console.log(JSON.stringify(ast, null, 2));

// 2. 将 AST 重新渲染为 Markdown 文本
const renderer = new MarkdownRender();
const renderedMarkdown = renderer.render(ast);
console.log(renderedMarkdown);
```

### 检查解析警告

```typescript
const malformedMarkdown = `
\`\`\`typescript
console.log("忘记闭合此代码块了！");
`;

const parser = new MarkdownParser();
const ast = parser.parse(malformedMarkdown);

if (parser.warnings.length > 0) {
  console.warn('解析过程中遇到警告:', parser.warnings);
  // 输出: ["Unclosed fenced code block at line 1"]
}
```

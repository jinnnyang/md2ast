# md2ast

A lightweight, highly extensible, and strictly typed CommonMark-compliant Markdown parser and renderer written in TypeScript.

Designed specifically for programmatic document analysis, Abstract Syntax Tree (AST) manipulation, and LLM-driven text cleaning/processing.

---

## Key Features

* **Precision Positional Tracking**: Nodes contain lightweight `line_num` and `char_num` pointers (absolute character offset in O(1) computation) rather than heavy position objects.
* **Extensible Plugin System**: Customize block or inline rules using standard hooks like `.use(plugin)`.
* **Zero External Dependencies**: Pure TypeScript, clean, lightweight, and type-safe.
* **Lossless Rendering**: Convert the modified AST back into valid Markdown via `MarkdownRender`.
* **Warning System**: Collects document anomalies (e.g. unclosed fences or HTML blocks) for auditing.

---

## Documentation

For full guides and APIs, check out the `docs/` folder:

* **English Documentation**:
  * [README](docs/README.md) - Project overview & Quick Start.
  * [AST Specification](docs/ast.md) - Node types and positioning arithmetic.
  * [API Reference](docs/api.md) - Parser, Render, State, and Ruler API.
  * [Plugin Development Guide](docs/plugins.md) - How to write custom syntax rules.
* **Chinese Documentation (中文文档)**:
  * [README_zh-CN](docs/zh-CN/README.md) - 项目概述与快速上手。
  * [AST 节点规范](docs/zh-CN/ast.md) - AST 节点设计与字符偏移计算。
  * [API 参考手册](docs/zh-CN/api.md) - 解析器、渲染器与状态管理 API。
  * [插件开发指南](docs/zh-CN/plugins.md) - 编写自定义语法插件。

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
# Hello md2ast

This is **bold** text.
`;

const parser = new MarkdownParser();
const ast = parser.parse(source);

console.log(JSON.stringify(ast, null, 2));

const renderer = new MarkdownRender();
console.log(renderer.render(ast));
```

## License

ISC

# md2ast

一个基于 TypeScript 编写的轻量级、高可扩展性、严格遵循 CommonMark 规范的 Markdown 解析器与渲染器。

专门针对程序化文档分析、抽象语法树（AST）操作、以及大语言模型（LLM）驱动的文档清洗与处理而设计。

---

## 核心特性

* **精准位置追踪**：节点只记录轻量级的 `line_num` 行号与 `char_num` 绝对字符偏移量（O(1) 时间换算），摒弃了沉重的 position 对象。
* **高可扩展插件系统**：支持通过 `.use(plugin)` 灵活挂载自定义的 Block 级与 Inline 级匹配规则。
* **零运行时依赖**：纯 TypeScript 编写，无第三方库依赖，结构轻盈且类型安全。
* **双向无损渲染**：支持使用 `MarkdownRender` 将修改后的 AST 重新渲染回格式规范的 Markdown 字符串。
* **异常警告收集**：对未闭合的代码块或 HTML 块等文档异常提供 `warnings` 收集机制，避免静默失败，利于大模型重试审计。

---

## 文档指引

我们为您准备了详尽的文档库，请查阅 `docs/` 目录：

* **中文文档**：
  * [README](docs/zh-CN/README.md) - 项目概述与快速上手指南。
  * [AST 节点规范与差值定位](docs/zh-CN/ast.md) - AST 节点设计以及如何使用 `char_num` 差值公式截取原始文本供大模型清洗。
  * [API 参考手册](docs/zh-CN/api.md) - 核心类 `MarkdownParser`、`MarkdownRender` 等接口文档。
  * [插件开发指南](docs/zh-CN/plugins.md) - 手把手教您如何扩展自定义语法插件。
* **英文文档 (English Docs)**：
  * [README](docs/README.md) - Overview & Quick Start.
  * [AST Specification](docs/ast.md) - Node types and positioning arithmetic.
  * [API Reference](docs/api.md) - Parser, Render, State, and Ruler API.
  * [Plugin Development Guide](docs/plugins.md) - How to write custom syntax rules.

---

## 快速上手

### 安装

```bash
npm install md2ast
```

### 基础解析与还原

```typescript
import { MarkdownParser, MarkdownRender } from 'md2ast';

const source = `
# 欢迎使用 md2ast

这里是一段 **加粗** 的文字。
`;

const parser = new MarkdownParser();
const ast = parser.parse(source);

console.log(JSON.stringify(ast, null, 2));

const renderer = new MarkdownRender();
console.log(renderer.render(ast));
```

## 开源协议

ISC

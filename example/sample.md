---
title: 测试 Markdown
author: jinnn
date: 2026-04-03
---
# Markdown Parser 示例文档

这是一个用于测试 **md-parser** 的综合文档，涵盖所有已支持的 Markdown 语法。

## 行内格式

这段文字包含 **粗体**、*斜体*、~~删除线~~、以及 `行内代码`。
也支持 __下划线粗体__ 和 _下划线斜体_。

## 链接与图片

- 行内链接：[Google](https://www.google.com "Google")
- 自动链接：<https://github.com>
- 邮箱链接：<user@example.com>
- 引用链接：[点击这里][ref-link]
- 图片：![示例图片](https://via.placeholder.com/150 "示例图片")

[ref-link]: https://example.com "示例标题"

## 代码块

围栏代码块（带语言标注）：

```typescript
import { MarkdownParser } from 'md-parser';

const parser = new MarkdownParser();
const ast = parser.parse('# Hello World');
console.log(JSON.stringify(ast, null, 2));
```

缩进代码块：

    const x = 1;
    const y = 2;
    console.log(x + y);

## 引用

> 这是一段引用。
> 引用可以包含 **粗体** 和 [链接](https://example.com)。
>
> > 引用也可以嵌套。

## 列表

无序列表：

- 苹果
- 香蕉
- 橘子

有序列表：

1. 第一步：安装依赖
2. 第二步：编写代码
3. 第三步：运行测试

## 表格

| 功能 | 状态 | 说明 |
| :--- | :---: | ---: |
| ATX 标题 | ✅ | `# ` 到 `###### ` |
| Setext 标题 | ✅ | `===` 和 `---` 下划线 |
| 围栏代码 | ✅ | 支持语言标注 |
| 缩进代码 | ✅ | 4 空格缩进 |
| 引用块 | ✅ | 支持嵌套 |
| 列表 | ✅ | 有序和无序 |
| 表格 | ✅ | 支持对齐 |
| HTML | ✅ | 块级和行内 |

## 分隔线

---

***

___

## HTML 混排

<div class="custom-block">
  <p>这是一段原生 HTML，解析器会将它作为 <code>htmlBlock</code> 节点保留。</p>
</div>

行内 HTML 也可以：这里有一个 <strong>HTML 粗体</strong> 标签。

Setext 一级标题
===============

Setext 二级标题
---------------

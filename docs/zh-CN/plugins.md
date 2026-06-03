# 插件开发指南

`md2ast` 在设计之初就将“可扩展性”放在了第一位。您无需修改解析器的底层源码，只需通过简单的插件配置，就可以让解析器识别任何自定义的语法或块级组件。

---

## 规则流水线生命周期

解析流程包含三个独立的执行阶段，每个阶段都由一个 `Ruler` 调度器管理：
1. **`core`**：用于文本规范化、预处理以及全局提取链接引用定义。
2. **`block`**：逐行扫描并识别多行结构（如标题、段落、列表、代码块或自定义容器）。
3. **`inline`**：对已拆分的纯文本块进行逐字扫描，识别加粗、链接、图片或自定义文本高亮。

规则是按照链表顺序依次执行的。如果某条规则返回 `true`，代表它成功认领了当前位置的内容并推进了位置指针，解析器就会中断后续规则，重新开始下一轮匹配。

---

## 实战 1：编写行内插件——自定义文本高亮 (`==高亮内容==`)

我们的目标是实现一个插件，把被双等号包裹的文本（例如 `==extremely important==`）解析为类型为 `highlight` 的自定义 AST 节点。

### 1. 扩展 TypeScript 类型声明

如果您使用 TypeScript，请先声明高亮节点的数据结构：

```typescript
import { Parent } from 'md2ast';

export interface HighlightNode extends Parent {
  type: 'highlight';
}

// 扩展类型定义
declare module 'md2ast' {
  interface NodeMap {
    highlight: HighlightNode;
  }
}
```

### 2. 编写行内匹配规则

行内规则的作用是检查以 `state.pos` 为起点字符的后方文本。如果匹配成功，则将节点推入 `state.tokens` 并累加光标 `state.pos`。

```typescript
import { InlineState } from 'md2ast';

export function highlightRule(state: InlineState): boolean {
  // 获取当前光标往后的全部文本切片
  const tail = state.src.slice(state.pos);

  // 匹配双等号包裹的内容
  const match = tail.match(/^==(.+?)==/);
  if (!match) {
    return false; // 匹配失败，交由其它行内规则尝试
  }

  const highlightedText = match[1] || '';

  // 塞入我们的自定义 AST 节点
  state.tokens.push({
    type: 'highlight',
    children: [{ type: 'text', value: highlightedText }]
  });

  // 重要：把行内扫描指针向后移动已消耗的字符数
  state.pos += match[0].length;

  return true; // 拦截成功
}
```

### 3. 注册并加载插件

把规则绑定到 `MarkdownParser` 的 `inline` 管理器中。为了防止高亮符号被通用的星号强调规则截胡，我们可以通过 `before` 将其插到 `emphasisRegex` 规则前面：

```typescript
import { MarkdownParser } from 'md2ast';

function highlightPlugin(parser: MarkdownParser) {
  parser.inline.before('emphasisRegex', 'highlightText', highlightRule);
}

// 实例化解析器并注入插件
const parser = new MarkdownParser().use(highlightPlugin);
const ast = parser.parse("这是一个 ==极其重要== 的通知。");
```

---

## 实战 2：编写块级插件——自定义信息警告框 (`:::info`)

我们来开发一个类似于 Docusaurus 的信息提示块：
```markdown
:::warning
请注意安全！
:::
```

### 1. 编写块级匹配规则

块级规则需要从 `state.line` 行开始往下寻找到结束标志 `:::`，将中间的几行文本递归解析，然后整体作为一个 `callout` 节点塞入 `state.doc.children`，最后累加 `state.line` 指针。

```typescript
import { BlockState } from 'md2ast';

export function calloutBlockRule(state: BlockState): boolean {
  const startLine = state.line;
  const firstLineText = state.getLine(startLine);

  // 检查首行是否满足 :::类型 的格式
  const match = firstLineText.match(/^ {0,3}:::\s*([a-zA-Z0-9\-]+)\s*$/);
  if (!match) {
    return false; // 交给下一个块级规则处理
  }

  const kind = match[1] || 'info';
  let endLine = startLine + 1;
  let linesCollected: string[] = [];
  let closed = false;

  // 往下搜寻闭合标记 :::
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
    // 遇到未闭合边界时记录警告，防止直接崩溃
    state.md?.warnings.push(`未闭合的信息框位于第 ${startLine + 1} 行`);
  }

  // 递归调用解析器处理容器内部的多行内容
  const innerSource = linesCollected.join('\n');
  const innerAst = state.md.parse(innerSource);

  // 向文档中追加我们的自定义块级节点
  state.doc.children.push({
    type: 'callout',
    kind,
    children: innerAst.children,
    line_num: startLine,
    char_num: state.getCharNum(startLine)
  } as any);

  // 推进 state.line 游标
  state.line = closed ? endLine + 1 : endLine;

  return true;
}
```

### 2. 注册块级插件

我们可以使用 `before` 把它安插在标准引用 `blockquote` 之前：

```typescript
import { MarkdownParser } from 'md2ast';

function calloutPlugin(parser: MarkdownParser) {
  parser.block.before('blockquote', 'calloutBlock', calloutBlockRule);
}

const parser = new MarkdownParser().use(calloutPlugin);
const ast = parser.parse(`
:::info
这是一个高雅的自定义块级组件插件示例。
:::
`);
```

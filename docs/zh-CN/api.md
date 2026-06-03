# API 参考手册

本页面提供了 `md2ast` 库导出的核心类、接口和公共方法的详细参考。

---

## `MarkdownParser`

核心解析器类，负责将原始 Markdown 文本编译成结构化的 AST。

### 构造函数
```typescript
constructor()
```
创建一个新的解析器实例，并预先注册好符合 CommonMark 标准的核心（core）、块级（block）和行内（inline）解析规则。

### 公共方法

#### `parse(src: string): Document`
将原始 Markdown 字符串解析为 AST 抽象语法树。
* **参数**:
  * `src`: 原始 Markdown 文本。
* **返回值**: AST 根节点 `Document`。

#### `use(pluginFn: (parser: MarkdownParser, options?: any) => void, options?: any): this`
注册插件以扩展解析器的规则链。支持链式调用。
* **参数**:
  * `pluginFn`: 接收解析器实例和自定义配置的插件回调函数。
  * `options`: 传给插件的配置参数。
* **返回值**: 当前 `MarkdownParser` 实例。

### 属性
* `core`: `Ruler<BlockState>` - 管理第一阶段预处理的规则管理器。
* `block`: `Ruler<BlockState>` - 管理第二阶段块级语法识别的规则管理器。
* `inline`: `Ruler<InlineState>` - 管理第三阶段行内级修饰符解析的规则管理器。
* `warnings`: `string[]` - 存放解析异常警告的数组（如未闭合的代码块等）。
* `references`: `Map<string, { url: string; title?: string }>` - 收集全局提取出的链接引用字典。

---

## `MarkdownRender`

逆向生成器类。将 AST 重新还原序列化为 Markdown 字符串。

### 构造函数
```typescript
constructor()
```

### 公共方法

#### `render(node: AnyNode): string`
将任意 AST 节点（通常为根节点 `Document`）渲染为 Markdown 文本。
* **参数**:
  * `node`: 要渲染的 AST 节点。
* **返回值**: 格式化后的 Markdown 文本（以换行符结尾）。

---

## `Ruler<S>`

规则管理器类，负责管理解析规则的插入与顺序调度。

### 公共方法

#### `push(name: string, action: (state: S, ...args: any[]) => boolean): void`
将一个新规则追加至链表末尾。
* **参数**:
  * `name`: 规则的唯一名称。
  * `action`: 规则的具体匹配逻辑函数。返回 `true` 代表拦截并处理成功，返回 `false` 则交由下一个规则。

#### `before(beforeName: string, name: string, action: (state: S, ...args: any[]) => boolean): void`
在指定名称的已有规则之前插入新规则。
* **抛出**: 如果没找到名为 `beforeName` 的规则，将抛出异常。

#### `after(afterName: string, name: string, action: (state: S, ...args: any[]) => boolean): void`
在指定名称的已有规则之后插入新规则。
* **抛出**: 如果没找到名为 `afterName` 的规则，将抛出异常。

#### `getRules(): Rule<S>[]`
获取当前已注册的规则列表数组。

---

## `BlockState`

块级解析阶段的状态上下文管理器。

### 构造函数
```typescript
constructor(src: string, mdInstance?: MarkdownParser, baseOffset?: number)
```

### 属性与方法
* `src`: `string` - 当前正在解析的 Markdown 文本片段。
* `lines`: `string[]` - 文本切分后的行数组。
* `line`: `number` - 当前扫描指针所在的 0-indexed 行号。
* `lineMax`: `number` - 文本总行数。
* `doc`: `Document` - 正在构建的根节点 `Document`。
* `parent`: `AnyNode` - 当前正在向其追加子节点的父节点指针。
* `baseOffset`: `number` - 当前解析片区在原始全文档中的起始绝对字符偏移。
* `getLine(line: number): string` - 安全获取某一行文本，越界返回空字符串。
* `isEmpty(line: number): boolean` - 判断某行是否为空白行。
* `getCharNum(line: number): number` - 在 O(1) 时间内获取某一行首字母在原始全文档中的 0-indexed 绝对字符偏移。

---

## `InlineState`

行内解析阶段的状态上下文管理器。

### 构造函数
```typescript
constructor(src: string, baseOffset?: number)
```

### 属性与方法
* `src`: `string` - 待匹配的行内原始文本段。
* `pos`: `number` - 当前扫描指针在 `src` 段内的 0-indexed 字符位置。
* `posMax`: `number` - 该文本段的总长度。
* `tokens`: `AnyNode[]` - 当前已收集好的行内 AST 节点列表。
* `baseOffset`: `number` - 该行内文本段在原始全文档中的绝对字符偏移量。
* `getCharNum(): number` - 获取当前扫描指针 `pos` 处对应的全文档 0-indexed 绝对偏移。

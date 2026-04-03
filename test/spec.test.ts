import { expect, test, describe } from 'vitest';
import { MarkdownParser } from '../src/index.js';

const parser = new MarkdownParser();

// ============================================================
// Phase 4: CommonMark Spec Compliance Tests
// ============================================================

describe('Block: ATX Headings', () => {
  test('# through ###### produce correct depths', () => {
    for (let i = 1; i <= 6; i++) {
      const ast = parser.parse('#'.repeat(i) + ' Heading ' + i);
      // @ts-ignore
      expect(ast.children[0].type).toBe('heading');
      // @ts-ignore
      expect(ast.children[0].depth).toBe(i);
    }
  });

  test('####### (7 hashes) is NOT a heading', () => {
    const ast = parser.parse('####### Not a heading');
    expect(ast.children[0]!.type).toBe('paragraph');
  });

  test('heading with trailing hashes: ## foo ##', () => {
    const ast = parser.parse('## foo ##');
    expect(ast.children[0]!.type).toBe('heading');
    // @ts-ignore
    expect(ast.children[0].depth).toBe(2);
  });
});

describe('Block: Setext Headings', () => {
  test('underline with === produces h1', () => {
    const ast = parser.parse('Foo\n===');
    expect(ast.children[0]!.type).toBe('heading');
    // @ts-ignore
    expect(ast.children[0].depth).toBe(1);
  });

  test('underline with --- produces h2', () => {
    const ast = parser.parse('Bar\n---');
    expect(ast.children[0]!.type).toBe('heading');
    // @ts-ignore
    expect(ast.children[0].depth).toBe(2);
  });
});

describe('Block: Thematic Breaks', () => {
  test('*** is a thematic break', () => {
    const ast = parser.parse('***');
    expect(ast.children[0]!.type).toBe('thematicBreak');
  });

  test('--- is a thematic break', () => {
    const ast = parser.parse('---');
    // setext heading needs text above; standalone --- is thematic break
    expect(ast.children[0]!.type).toBe('thematicBreak');
  });

  test('___ is a thematic break', () => {
    const ast = parser.parse('___');
    expect(ast.children[0]!.type).toBe('thematicBreak');
  });

  test('spaces between markers: * * *', () => {
    const ast = parser.parse('* * *');
    expect(ast.children[0]!.type).toBe('thematicBreak');
  });
});

describe('Block: Fenced Code Blocks', () => {
  test('``` with info string', () => {
    const ast = parser.parse('```javascript\nconst x = 1;\n```');
    expect(ast.children[0]!.type).toBe('code');
    // @ts-ignore
    expect(ast.children[0].lang).toBe('javascript');
    // @ts-ignore
    expect(ast.children[0].value).toBe('const x = 1;');
  });

  test('~~~ fence style', () => {
    const ast = parser.parse('~~~\nhello\n~~~');
    expect(ast.children[0]!.type).toBe('code');
    // @ts-ignore
    expect(ast.children[0].value).toBe('hello');
  });
});

describe('Block: Indented Code Blocks', () => {
  test('4-space indent creates code block', () => {
    const ast = parser.parse('    code line 1\n    code line 2');
    expect(ast.children[0]!.type).toBe('code');
    // @ts-ignore
    expect(ast.children[0].value).toBe('code line 1\ncode line 2');
  });
});

describe('Block: HTML Blocks', () => {
  test('<div> is treated as raw HTML block', () => {
    const ast = parser.parse('<div class="x">\n  content\n</div>');
    expect(ast.children[0]!.type).toBe('htmlBlock');
    // @ts-ignore
    expect(ast.children[0].value).toContain('<div');
  });
});

describe('Block: Blockquotes', () => {
  test('simple blockquote', () => {
    const ast = parser.parse('> Hello\n> World');
    expect(ast.children[0]!.type).toBe('blockquote');
    // @ts-ignore
    expect(ast.children[0].children[0].type).toBe('paragraph');
  });

  test('nested blockquote', () => {
    const ast = parser.parse('> > nested');
    const bq = ast.children[0]!;
    expect(bq.type).toBe('blockquote');
    // @ts-ignore
    expect(bq.children[0].type).toBe('blockquote');
  });
});

describe('Block: Lists', () => {
  test('unordered list with - marker', () => {
    const ast = parser.parse('- alpha\n- beta\n- gamma');
    expect(ast.children[0]!.type).toBe('list');
    // @ts-ignore
    expect(ast.children[0].ordered).toBe(false);
    // @ts-ignore
    expect(ast.children[0].children.length).toBe(3);
  });

  test('ordered list with 1. marker', () => {
    const ast = parser.parse('1. first\n2. second');
    expect(ast.children[0]!.type).toBe('list');
    // @ts-ignore
    expect(ast.children[0].ordered).toBe(true);
    // @ts-ignore
    expect(ast.children[0].children.length).toBe(2);
  });
});

describe('Block: Tables (GFM)', () => {
  test('basic table with alignment', () => {
    const md = `| L | C | R |
| :--- | :---: | ---: |
| a | b | c |`;
    const ast = parser.parse(md);
    expect(ast.children[0]!.type).toBe('table');
    // @ts-ignore
    expect(ast.children[0].align).toEqual(['left', 'center', 'right']);
    // @ts-ignore  
    expect(ast.children[0].children.length).toBe(2); // header + 1 data row
  });
});

describe('Inline: Emphasis & Strong', () => {
  test('*italic* produces emphasis', () => {
    const ast = parser.parse('*hello*');
    // @ts-ignore
    const ch = ast.children[0].children;
    expect(ch[0].type).toBe('emphasis');
  });

  test('**bold** produces strong', () => {
    const ast = parser.parse('**bold**');
    // @ts-ignore
    const ch = ast.children[0].children;
    expect(ch[0].type).toBe('strong');
  });

  test('_underscore_ produces emphasis', () => {
    const ast = parser.parse('_hello_');
    // @ts-ignore
    const ch = ast.children[0].children;
    expect(ch[0].type).toBe('emphasis');
  });

  test('__double underscore__ produces strong', () => {
    const ast = parser.parse('__bold__');
    // @ts-ignore
    const ch = ast.children[0].children;
    expect(ch[0].type).toBe('strong');
  });
});

describe('Inline: Strikethrough (GFM)', () => {
  test('~~deleted~~ produces delete node', () => {
    const ast = parser.parse('~~gone~~');
    // @ts-ignore
    const ch = ast.children[0].children;
    expect(ch[0].type).toBe('delete');
    // @ts-ignore
    expect(ch[0].children[0].value).toBe('gone');
  });
});

describe('Inline: Code Spans', () => {
  test('`code` produces inlineCode', () => {
    const ast = parser.parse('Use `printf()` here');
    // @ts-ignore
    const ch = ast.children[0].children;
    expect(ch[0].type).toBe('text');
    expect(ch[1].type).toBe('inlineCode');
    // @ts-ignore
    expect(ch[1].value).toBe('printf()');
  });
});

describe('Inline: Links', () => {
  test('[text](url) produces link', () => {
    const ast = parser.parse('[click](https://example.com)');
    // @ts-ignore
    const ch = ast.children[0].children;
    expect(ch[0].type).toBe('link');
    // @ts-ignore
    expect(ch[0].url).toBe('https://example.com');
  });
});

describe('Inline: Images', () => {
  test('![alt](src) produces image', () => {
    const ast = parser.parse('![logo](img.png)');
    // @ts-ignore
    const ch = ast.children[0].children;
    expect(ch[0].type).toBe('image');
    // @ts-ignore
    expect(ch[0].url).toBe('img.png');
    // @ts-ignore
    expect(ch[0].alt).toBe('logo');
  });
});

describe('Inline: Autolinks', () => {
  test('<https://example.com> produces link', () => {
    const ast = parser.parse('<https://example.com>');
    // @ts-ignore
    const ch = ast.children[0].children;
    expect(ch[0].type).toBe('link');
    // @ts-ignore
    expect(ch[0].url).toBe('https://example.com');
  });

  test('<user@example.com> produces mailto link', () => {
    const ast = parser.parse('<user@example.com>');
    // @ts-ignore
    const ch = ast.children[0].children;
    expect(ch[0].type).toBe('link');
    // @ts-ignore
    expect(ch[0].url).toBe('mailto:user@example.com');
  });
});

describe('Inline: HTML Inline', () => {
  test('<span> tag preserved as htmlInline', () => {
    const ast = parser.parse('Before <span class="x">inner</span> after');
    // @ts-ignore
    const ch = ast.children[0].children;
    expect(ch[1].type).toBe('htmlInline');
    // @ts-ignore
    expect(ch[1].value).toBe('<span class="x">');
  });
});

describe('Core: Reference Links', () => {
  test('full reference [text][id]', () => {
    const md = `[click here][example]

[example]: https://example.com`;
    const ast = parser.parse(md);
    // @ts-ignore
    const ch = ast.children[0].children;
    expect(ch[0].type).toBe('link');
    // @ts-ignore
    expect(ch[0].url).toBe('https://example.com');
  });

  test('collapsed reference [text][]', () => {
    const md = `[Example][]

[example]: https://example.com`;
    const ast = parser.parse(md);
    // @ts-ignore
    const ch = ast.children[0].children;
    expect(ch[0].type).toBe('link');
    // @ts-ignore
    expect(ch[0].url).toBe('https://example.com');
  });

  test('shortcut reference [text]', () => {
    const md = `[Example]

[example]: https://example.com`;
    const ast = parser.parse(md);
    // @ts-ignore
    const ch = ast.children[0].children;
    expect(ch[0].type).toBe('link');
    // @ts-ignore
    expect(ch[0].url).toBe('https://example.com');
  });
});

describe('Integration: Complex Document', () => {
  test('mixed blocks and inlines', () => {
    const md = `# Title

A paragraph with **bold**, *italic*, and \`code\`.

> A blockquote with [a link](https://example.com).

- Item 1
- Item 2

| H1 | H2 |
| --- | --- |
| a  | b  |

---

\`\`\`ts
const x = 42;
\`\`\``;

    const ast = parser.parse(md);
    
    const types = ast.children.map(c => c.type);
    expect(types).toContain('heading');
    expect(types).toContain('paragraph');
    expect(types).toContain('blockquote');
    expect(types).toContain('list');
    expect(types).toContain('table');
    expect(types).toContain('thematicBreak');
    expect(types).toContain('code');
  });
});

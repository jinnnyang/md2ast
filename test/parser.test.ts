import { expect, test } from 'vitest';
import { MarkdownParser } from '../src/index.js';

test('Parse basic blocks and inline', () => {
  const parser = new MarkdownParser();
  const md = `
# Hello World

This is a **bold** and *italic* text.

\`\`\`typescript
const x = 1;
\`\`\`

<div class="custom">
  HTML Block
</div>

![Logo](https://img.com/logo.png)
`;

  const ast = parser.parse(md.trim());
  
  // Verify Root elements count
  expect(ast.children.length).toBe(5);
  
  // Verify Heading
  expect(ast.children[0].type).toBe('heading');
  // @ts-ignore
  expect(ast.children[0].depth).toBe(1);
  // @ts-ignore
  expect(ast.children[0].children[0].value).toBe('Hello World');

  // Verify Paragraph
  expect(ast.children[1].type).toBe('paragraph');
  // @ts-ignore
  const pChildren = ast.children[1].children;
  expect(pChildren.length).toBe(5); // "This is a ", "**bold**", " and ", "*italic*", " text."
  expect(pChildren[0].value).toBe('This is a ');
  expect(pChildren[1].type).toBe('strong');

  // Verify Fenced Code
  expect(ast.children[2].type).toBe('code');
  // @ts-ignore
  expect(ast.children[2].value).toBe('const x = 1;');
  // @ts-ignore
  expect(ast.children[2].lang).toBe('typescript');

  // Verify HTML Block
  expect(ast.children[3].type).toBe('htmlBlock');

  // Verify Image Paragraph
  expect(ast.children[4].type).toBe('paragraph');
  // @ts-ignore
  expect(ast.children[4].children[0].type).toBe('image');
  // @ts-ignore
  expect(ast.children[4].children[0].alt).toBe('Logo');
});

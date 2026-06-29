import { expect, test } from 'vitest';
import { MarkdownParser } from '../src/index.js';

test('Parse link with nested parentheses in URL', () => {
  const parser = new MarkdownParser();
  const md = `[Wikipedia](https://en.wikipedia.org/wiki/Markdown_(markup_language))`;
  const ast = parser.parse(md);
  
  // @ts-ignore
  expect(ast.children[0].children[0].type).toBe('link');
  // @ts-ignore
  expect(ast.children[0].children[0].url).toBe('https://en.wikipedia.org/wiki/Markdown_(markup_language)');
  // @ts-ignore
  expect(ast.children[0].children[0].children[0].value).toBe('Wikipedia');
});

test('Parse link with nested square brackets in text', () => {
  const parser = new MarkdownParser();
  const md = `[text with [nested] brackets](https://example.com)`;
  const ast = parser.parse(md);
  
  // @ts-ignore
  expect(ast.children[0].children[0].type).toBe('link');
  // @ts-ignore
  expect(ast.children[0].children[0].url).toBe('https://example.com');
  // @ts-ignore
  expect(ast.children[0].children[0].children[0].value).toBe('text with [nested] brackets');
});

test('Parse link with multiple nested parentheses in URL', () => {
  const parser = new MarkdownParser();
  const md = `[Example](https://example.com/page(id=123)/(path))`;
  const ast = parser.parse(md);
  
  // @ts-ignore
  expect(ast.children[0].children[0].type).toBe('link');
  // @ts-ignore
  expect(ast.children[0].children[0].url).toBe('https://example.com/page(id=123)/(path)');
});

test('Parse image with nested parentheses', () => {
  const parser = new MarkdownParser();
  const md = `![alt text](https://example.com/image(1).png "Title")`;
  const ast = parser.parse(md);
  
  // @ts-ignore
  expect(ast.children[0].children[0].type).toBe('image');
  // @ts-ignore
  expect(ast.children[0].children[0].alt).toBe('alt text');
  // @ts-ignore
  expect(ast.children[0].children[0].url).toBe('https://example.com/image(1).png');
  // @ts-ignore
  expect(ast.children[0].children[0].title).toBe('Title');
});

test('Parse full reference with nested brackets', () => {
  const parser = new MarkdownParser();
  const md = `[text [nested] here][ref-id]

[ref-id]: https://example.com`;
  const ast = parser.parse(md);
  
  // @ts-ignore
  expect(ast.children[0].children[0].type).toBe('link');
  // @ts-ignore
  expect(ast.children[0].children[0].url).toBe('https://example.com');
  // @ts-ignore
  expect(ast.children[0].children[0].children[0].value).toBe('text [nested] here');
});

test('Parse shortcut reference with nested brackets', () => {
  const parser = new MarkdownParser();
  const md = `[text [nested] here]

[text [nested] here]: https://example.com`;
  const ast = parser.parse(md);
  
  // @ts-ignore
  expect(ast.children[0].children[0].type).toBe('link');
  // @ts-ignore
  expect(ast.children[0].children[0].url).toBe('https://example.com');
});

test('Parse deeply nested brackets', () => {
  const parser = new MarkdownParser();
  const md = `[text [nested [deep [extra]] brackets]](https://example.com/page(id=(123))/test)`;
  const ast = parser.parse(md);
  
  // @ts-ignore
  expect(ast.children[0].children[0].type).toBe('link');
  // @ts-ignore
  expect(ast.children[0].children[0].url).toBe('https://example.com/page(id=(123))/test');
  // @ts-ignore
  expect(ast.children[0].children[0].children[0].value).toBe('text [nested [deep [extra]] brackets]');
});

test('Parse link with backslash-escaped brackets', () => {
  const parser = new MarkdownParser();
  const md = `[link\\]](https://example.com)`;
  const ast = parser.parse(md);

  // @ts-ignore
  expect(ast.children[0].children[0].type).toBe('link');
  // @ts-ignore
  expect(ast.children[0].children[0].url).toBe('https://example.com');
  // @ts-ignore
  expect(ast.children[0].children[0].children[0].value).toBe('link\\]');
});

test('Do not parse link with space between closing bracket and opening parenthesis', () => {
  const parser = new MarkdownParser();
  const md = `[link] (https://example.com)`;
  const ast = parser.parse(md);

  // Should be parsed as plain text (since there's no defined reference for 'link')
  // @ts-ignore
  expect(ast.children[0].children[0].type).toBe('text');
});

test('Parse link with unmatched parenthesis inside double-quoted title', () => {
  const parser = new MarkdownParser();
  const md = `[link](https://example.com "My (Title")`;
  const ast = parser.parse(md);

  // @ts-ignore
  expect(ast.children[0].children[0].type).toBe('link');
  // @ts-ignore
  expect(ast.children[0].children[0].url).toBe('https://example.com');
  // @ts-ignore
  expect(ast.children[0].children[0].title).toBe('My (Title');
});

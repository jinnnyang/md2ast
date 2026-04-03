import { expect, test } from 'vitest';
import { MarkdownParser } from '../src/index.js';

test('Parse blockquote and list natively', () => {
  const parser = new MarkdownParser();
  const md = `> This is a quote.
> Let's see some inner nodes:
> * Bullet 1
> * Bullet 2

1. First
2. Second
   Nested child paragraph or continuation
3. Third`;

  const ast = parser.parse(md);
  expect(ast.children.length).toBe(2);
  
  // 1. Blockquote
  const bq = ast.children[0];
  expect(bq.type).toBe('blockquote');
  // @ts-ignore
  expect(bq.children.length).toBe(2); // paragraph and list
  // @ts-ignore
  expect(bq.children[0].type).toBe('paragraph');
  // @ts-ignore
  expect(bq.children[1].type).toBe('list');
  // @ts-ignore
  expect(bq.children[1].ordered).toBe(false);

  // 2. List
  const list = ast.children[1];
  expect(list.type).toBe('list');
  // @ts-ignore
  expect(list.ordered).toBe(true);
  // @ts-ignore
  expect(list.children.length).toBe(3);
  // @ts-ignore
  expect(list.children[1].children[0].type).toBe('paragraph'); 
});

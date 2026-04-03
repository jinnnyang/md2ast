/**
 * md-parser 使用示例
 *
 * 运行方式：
 *   npx tsc && node example/demo.js
 *
 * 或者直接用 ts-node / tsx：
 *   npx tsx example/demo.ts
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { MarkdownParser, MarkdownRender } from '../src/index.js';

// ---------- 1. 基础用法 ----------

const parser = new MarkdownParser();

const simpleAst = parser.parse('# Hello World\n\nThis is **bold** and *italic*.');
console.log('=== 基础用法 ===');
console.log(JSON.stringify(simpleAst, null, 2));
console.log();

// ---------- 2. 解析文件 ----------

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const samplePath = join(__dirname, 'sample.md');
const markdown = readFileSync(samplePath, 'utf-8');

const fullAst = parser.parse(markdown);

console.log('=== 解析 sample.md ===');
console.log(`顶层节点数量: ${fullAst.children.length}`);
console.log('节点类型:');
fullAst.children.forEach((node, i) => {
  const label = 'depth' in node ? `${node.type} (h${(node as any).depth})` : node.type;
  console.log(`  [${i}] ${label}`);
});
console.log();

// ---------- 3. 遍历 AST ----------

function walk(node: any, depth = 0) {
  const indent = '  '.repeat(depth);
  const info = node.value ? `: "${node.value.slice(0, 40)}${node.value.length > 40 ? '...' : ''}"` : '';
  console.log(`${indent}${node.type}${info}`);
  if (node.children) {
    for (const child of node.children) {
      walk(child, depth + 1);
    }
  }
}

console.log('=== AST 树形结构 ===');
for (let i = 0; i < fullAst.children.length; i++) {
  walk(fullAst.children[i], 0);
}
console.log();

// ---------- 4. 查找特定节点 ----------

function findAll(node: any, type: string, results: any[] = []): any[] {
  if (node.type === type) results.push(node);
  if (node.children) {
    for (const child of node.children) {
      findAll(child, type, results);
    }
  }
  return results;
}

const links = findAll(fullAst, 'link');
console.log(`=== 文档中的所有链接 (${links.length} 个) ===`);
links.forEach(link => {
  const text = link.children?.[0]?.value || '(no text)';
  const titleStr = link.title ? ` title="${link.title}"` : '';
  console.log(`  "${text}" -> ${link.url}${titleStr}`);
});
console.log();

const images = findAll(fullAst, 'image');
console.log(`=== 文档中的所有图片 (${images.length} 个) ===`);
images.forEach((img: any) => {
  const titleStr = img.title ? ` title="${img.title}"` : '';
  console.log(`  alt="${img.alt}" src="${img.url}"${titleStr}`);
});
console.log();

const codeBlocks = findAll(fullAst, 'code');
console.log(`=== 文档中的所有代码块 (${codeBlocks.length} 个) ===`);
codeBlocks.forEach((code: any) => {
  const lang = code.lang || '(none)';
  const preview = code.value.split('\n')[0] || '';
  console.log(`  lang=${lang}  "${preview}..."`);
});
console.log();

// ---------- 5. 还原 AST 为 Markdown ----------

console.log('=== 将 AST 渲染回 Markdown ===');
const renderer = new MarkdownRender();
const outputMarkdown = renderer.render(fullAst);
console.log(outputMarkdown);

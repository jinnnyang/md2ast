import type { Document, AnyNode } from './ast.js';

export class BlockState {
  src: string;
  lines: string[];
  
  // Current scanning position
  line: number;
  lineMax: number;
  
  // Building the tree
  doc: Document;
  parent: AnyNode;
  
  // Reference to the main parser for recursive parsing
  md: any;
  
  constructor(src: string, mdInstance?: any) {
    this.src = src;
    this.lines = src.split(/\r?\n/);
    this.line = 0;
    this.lineMax = this.lines.length;
    this.doc = { type: 'document', children: [] };
    this.parent = this.doc;
    this.md = mdInstance;
  }
  
  getLine(line: number): string {
    return this.lines[line] || '';
  }
  
  isEmpty(line: number): boolean {
    return /^\s*$/.test(this.getLine(line));
  }
}

export class InlineState {
  src: string;
  pos: number;
  posMax: number;
  tokens: AnyNode[];
  
  constructor(src: string) {
    this.src = src;
    this.pos = 0;
    this.posMax = src.length;
    this.tokens = [];
  }
}

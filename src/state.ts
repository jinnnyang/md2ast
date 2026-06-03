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
  
  // Array of character offsets for each line
  private _lineOffsets: number[] = [];
  private _offsetsComputedForSrc = '';

  // Reference to the main parser for recursive parsing
  md: any;
  
  // The base offset of this BlockState if it is a recursive nested parsing (e.g., inside blockquote)
  baseOffset: number;

  constructor(src: string, mdInstance?: any, baseOffset: number = 0) {
    this.src = src;
    this.lines = src.split(/\r?\n/);
    this.line = 0;
    this.lineMax = this.lines.length;
    this.doc = { type: 'document', children: [], line_num: 0, char_num: baseOffset };
    this.parent = this.doc;
    this.md = mdInstance;
    this.baseOffset = baseOffset;
  }
  
  getLine(line: number): string {
    return this.lines[line] || '';
  }
  
  isEmpty(line: number): boolean {
    return /^\s*$/.test(this.getLine(line));
  }

  /**
   * Returns the absolute character offset for the start of the given line.
   */
  getCharNum(line: number): number {
    if (this._offsetsComputedForSrc !== this.src) {
      this._lineOffsets = [0];
      let offset = 0;
      for (let i = 0; i < this.lines.length; i++) {
        // +1 for the newline character (\n)
        offset += (this.lines[i] || '').length + 1;
        this._lineOffsets.push(offset);
      }
      this._offsetsComputedForSrc = this.src;
    }
    const localOffset = this._lineOffsets[line] || 0;
    return this.baseOffset + localOffset;
  }
}

export class InlineState {
  src: string;
  pos: number;
  posMax: number;
  tokens: AnyNode[];
  
  // The absolute starting char_num of this inline source within the whole document
  baseOffset: number;
  
  constructor(src: string, baseOffset: number = 0) {
    this.src = src;
    this.pos = 0;
    this.posMax = src.length;
    this.tokens = [];
    this.baseOffset = baseOffset;
  }

  /**
   * Returns the absolute character offset of the current cursor position.
   */
  getCharNum(): number {
    return this.baseOffset + this.pos;
  }
}

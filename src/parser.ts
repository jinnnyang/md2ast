import type { Document, AnyNode, Literal } from './ast.js';
import { BlockState, InlineState } from './state.js';
import { Ruler } from './ruler.js';
import { thematicBreak, heading, fencedCode, htmlBlock, indentedCode, setextHeading, table, yamlFrontmatter } from './rules/block.js';
import { blockquote, list } from './rules/block-extended.js';
import {
  htmlInline, image, link, inlineCode, emphasisRegex,
  emphasisUnderscore, strikethrough, autolink, hardBreak, softBreak
} from './rules/inline.js';

/**
 * The core Markdown Parser class. 
 * Orchestrates the execution of core, block, and inline rules
 * via dedicated Rulers. It maintains state and triggers recursive parsing.
 */
export class MarkdownParser {
  /** Ruler managing core phase transformations (normalization, ref extraction). */
  public core: Ruler<BlockState>;
  /** Ruler managing block-level syntax matching (lists, blockquotes, code fences). */
  public block: Ruler<BlockState>;
  /** Ruler managing inline-level syntax matching (emphasis, links, inline code). */
  public inline: Ruler<InlineState>;

  /** 
   * Reference link definitions: `[id]: url "title"`
   * Key mapping is always lowercased.
   */
  public references: Map<string, { url: string; title?: string }> = new Map();

  /**
   * Initializes the parser and registers all fundamental CommonMark rules.
   */
  constructor() {
    this.core = new Ruler<BlockState>();
    this.block = new Ruler<BlockState>();
    this.inline = new Ruler<InlineState>();

    this.initRules();
  }

  /**
   * Registers all standard and strictly ordered parsing rules.
   */
  private initRules() {
    // Core Rules
    this.core.push('normalize', this.normalize.bind(this));
    this.core.push('references', this.extractReferences.bind(this));
    this.core.push('block', this.parseBlocks.bind(this));
    this.core.push('inline', this.parseInline.bind(this));

    // Block Rules (Priority matters — more specific first)
    this.block.push('yamlFrontmatter', yamlFrontmatter);
    this.block.push('htmlBlock', htmlBlock);
    this.block.push('fencedCode', fencedCode);
    this.block.push('table', table);
    this.block.push('blockquote', blockquote);
    this.block.push('thematicBreak', thematicBreak);
    this.block.push('list', list);
    this.block.push('setextHeading', setextHeading);
    this.block.push('heading', heading);
    this.block.push('indentedCode', indentedCode);
    
    // Inline Rules (Priority matters — more specific first)
    this.inline.push('hardBreak', hardBreak);
    this.inline.push('autolink', autolink);
    this.inline.push('htmlInline', htmlInline);
    this.inline.push('inlineCode', inlineCode);
    this.inline.push('image', image);
    this.inline.push('referenceLink', this.referenceLink.bind(this));
    this.inline.push('link', link);
    this.inline.push('strikethrough', strikethrough);
    this.inline.push('emphasisRegex', emphasisRegex);
    this.inline.push('emphasisUnderscore', emphasisUnderscore);
    this.inline.push('softBreak', softBreak);
  }

  /**
   * Replaces carriage returns/null bytes and converts raw string to split lines.
   */
  private normalize(state: BlockState): boolean {
    let str = state.src.replace(/\r\n|\r/g, '\n');
    str = str.replace(/\0/g, '\uFFFD');
    state.src = str;
    state.lines = str.split('\n');
    state.lineMax = state.lines.length;
    return true;
  }

  /**
   * Core rule to extract and purge reference link definitions globally.
   * Scans lines for `[label]: url "optional title"` and caches them in `.references`.
   */
  private extractReferences(state: BlockState): boolean {
    const REF_RE = /^ {0,3}\[([^\]]+)\]:\s+<?([^\s>]+)>?(?:\s+(?:"([^"]*)"|\(([^)]*)\)|'([^']*)'))?$/;
    const newLines: string[] = [];

    for (let i = 0; i < state.lineMax; i++) {
      const line = state.getLine(i);
      const match = line.match(REF_RE);
      if (match) {
        const label = (match[1] || '').toLowerCase().trim();
        const url = match[2] || '';
        const title = match[3] || match[4] || match[5];
        if (label) {
          const ref: { url: string; title?: string } = { url };
          if (title) {
            ref.title = title;
          }
          this.references.set(label, ref);
        }
        // Don't add this line to output
      } else {
        newLines.push(line);
      }
    }

    state.lines = newLines;
    state.lineMax = newLines.length;
    state.src = newLines.join('\n');
    return true;
  }

  /**
   * Inline rule to replace reference tags `[text][id]` with actual links
   * using the parsed `this.references` mapping.
   */
  private referenceLink(state: InlineState): boolean {
    const tail = state.src.slice(state.pos);
    
    // Full reference: [text][id]
    const fullMatch = tail.match(/^\[([^\]]*)\]\[([^\]]*)\]/);
    if (fullMatch) {
      const text = fullMatch[1] || '';
      const label = (fullMatch[2] || text).toLowerCase().trim();
      const ref = this.references.get(label);
      if (ref) {
        const linkNode: any = {
          type: 'link',
          url: ref.url,
          children: [{ type: 'text', value: text }]
        };
        if (ref.title) linkNode.title = ref.title;
        state.tokens.push(linkNode);
        state.pos += fullMatch[0].length;
        return true;
      }
    }
    
    // Collapsed reference: [text][]
    const collapsedMatch = tail.match(/^\[([^\]]+)\]\[\]/);
    if (collapsedMatch) {
      const text = collapsedMatch[1] || '';
      const label = text.toLowerCase().trim();
      const ref = this.references.get(label);
      if (ref) {
        const linkNode: any = {
          type: 'link',
          url: ref.url,
          children: [{ type: 'text', value: text }]
        };
        if (ref.title) linkNode.title = ref.title;
        state.tokens.push(linkNode);
        state.pos += collapsedMatch[0].length;
        return true;
      }
    }

    // Shortcut reference: [text] (no second brackets)
    const shortcutMatch = tail.match(/^\[([^\]]+)\](?!\[|\()/);
    if (shortcutMatch) {
      const text = shortcutMatch[1] || '';
      const label = text.toLowerCase().trim();
      const ref = this.references.get(label);
      if (ref) {
        const linkNode: any = {
          type: 'link',
          url: ref.url,
          children: [{ type: 'text', value: text }]
        };
        if (ref.title) linkNode.title = ref.title;
        state.tokens.push(linkNode);
        state.pos += shortcutMatch[0].length;
        return true;
      }
    }

    return false;
  }

  /**
   * Core execution of block rules. Moves line-by-line using block tools.
   * Fallback continuously yields lines to `parseParagraph`.
   */
  private parseBlocks(state: BlockState): boolean {
    const rules = this.block.getRules();
    
    while (state.line < state.lineMax) {
      if (state.isEmpty(state.line)) {
        state.line++;
        continue;
      }
      
      let ok = false;
      for (const rule of rules) {
        if (rule.action(state)) {
          ok = true;
          break;
        }
      }
      
      if (!ok) {
        this.parseParagraph(state);
      }
    }
    return true;
  }

  /**
   * The ultimate fallback block-rule.
   * Gathers lines into a single `<p>` segment until an interrupting block structure is verified.
   */
  private parseParagraph(state: BlockState): boolean {
    const startLine = state.line;
    let endLine = startLine + 1;
    let content = state.getLine(startLine);

    while (endLine < state.lineMax && !state.isEmpty(endLine)) {
      const curLine = state.getLine(endLine);
      const isBreaking = 
        /^ {0,3}(?:#{1,6})(?:\s|$)/.test(curLine) || 
        /^ {0,3}(?:`{3,}|~{3,})/.test(curLine) || 
        /^ {0,3}>/.test(curLine) || 
        /^ {0,3}(?:(?:-[ \t]*){3,}|(?:_[ \t]*){3,}|(?:\*[ \t]*){3,})$/.test(curLine) || 
        /^ {0,3}<[A-Za-z][A-Za-z0-9\-]*(?:\s|>|\/>|$)/.test(curLine) || 
        /^ {0,3}(?:[*+-]|\d{1,9}[.)])(?:\s+|$)/.test(curLine) ||
        /^ {0,3}\|/.test(curLine);
        
      if (isBreaking) {
          break;
      }
      content += '\n' + curLine;
      endLine++;
    }

    state.doc.children.push({
      type: 'paragraph',
      children: [{
        type: 'text',
        value: content
      }]
    });
    
    state.line = endLine;
    return true;
  }

  /**
   * Triggers the final micro-level string replacements inside compatible inner AST nodes (paragraph/heading...).
   */
  private parseInline(state: BlockState): boolean {
    this.walkInline(state.doc);
    return true;
  }
  
  /**
   * Recursively locates valid literal parent nodes to process inline elements.
   * It purposefully skips fully parsed nested sub-structures natively yielding pre-generated outputs.
   */
  private walkInline(node: AnyNode) {
    if ('children' in node && node.children) {
      if (node.type === 'paragraph' || node.type === 'heading' || node.type === 'tableCell') {
        // Only process if children is a single raw text node (not yet inline-parsed).
        // Recursively parsed nodes (list items, blockquotes) already have inline content.
        if (node.children.length === 1) {
          const textNode = node.children[0] as Literal;
          if (textNode && textNode.type === 'text') {
             const inlineState = new InlineState(textNode.value);
             this.processInlineState(inlineState);
             node.children = inlineState.tokens;
          }
        }
      } else {
        for (const child of node.children) {
          this.walkInline(child as AnyNode);
        }
      }
    }
  }
  
  /**
   * The Inline Engine Loop mapping active Inline Rules via char-by-char stepping logic.
   */
  private processInlineState(state: InlineState) {
    const rules = this.inline.getRules();
    while (state.pos < state.posMax) {
      let ok = false;
      for (const rule of rules) {
        if (rule.action(state)) {
          ok = true;
          break;
        }
      }
      if (!ok) {
        const char = state.src[state.pos] || '';
        const lastToken = state.tokens[state.tokens.length - 1];
        if (lastToken && lastToken.type === 'text') {
          (lastToken as Literal).value += char;
        } else {
          state.tokens.push({ type: 'text', value: char });
        }
        state.pos++;
      }
    }
  }

  /**
   * Compiles source raw markdown string to Abstract Syntax Tree (AST).
   * 
   * @param src - Raw markdown string input.
   * @returns Unist/mdast standard Document object containing block schemas.
   */
  public parse(src: string): Document {
    this.references.clear();
    const state = new BlockState(src, this);
    for (const rule of this.core.getRules()) {
      rule.action(state);
    }
    return state.doc;
  }
}

import type { 
  AnyNode, Document, Parent, Literal, List, ListItem, 
  Heading, CodeBlock, Image, Link, Table, Yaml 
} from './ast.js';

/**
 * Renders an Abstract Syntax Tree (AST) back into a Markdown string.
 * This is the reverse operation of `MarkdownParser.parse()`.
 */
export class MarkdownRender {
  /**
   * Generates a Markdown string from an AST Document or Node.
   * @param node The root AST node to render.
   * @returns Raw Markdown text.
   */
  public render(node: AnyNode): string {
    return this.renderNode(node).trim() + '\n';
  }

  /**
   * Internal recursive routing method.
   */
  private renderNode(node: AnyNode): string {
    switch (node.type) {
      case 'document':
        return this.renderChildren(node as Parent, '\n\n');
        
      case 'paragraph':
        return this.renderChildren(node as Parent, '');

      case 'heading': {
        const h = node as Heading;
        const prefix = '#'.repeat(h.depth) + ' ';
        return prefix + this.renderChildren(h, '');
      }

      case 'yaml':
        return `---\n${(node as Yaml).value}\n---`;

      case 'thematicBreak':
        return '---';

      case 'blockquote': {
        const content = this.renderChildren(node as Parent, '\n\n');
        return content.split('\n').map(line => line === '' ? '>' : `> ${line}`).join('\n');
      }

      case 'list': {
        const list = node as List;
        const items = list.children || [];
        const result: string[] = [];
        
        for (let i = 0; i < items.length; i++) {
          const item = items[i] as ListItem;
          const prefix = list.ordered ? `${(list.start || 1) + i}. ` : '- ';
          
          // Render item content normally, it might contain paragraphs or nested lists
          const itemContent = this.renderNode(item);
          const lines = itemContent.split('\n');
          
          // Prefix the first line, indent subsequent lines
          const itemLines = lines.map((line, index) => {
            if (index === 0) return prefix + line;
            return ' '.repeat(prefix.length) + line;
          });
          
          result.push(itemLines.join('\n'));
        }
        
        // CommonMark treats 'spread' property for blank lines between list items
        const separator = list.spread ? '\n\n' : '\n';
        return result.join(separator);
      }

      case 'listItem':
        // A list item acts as a wrapper, we space its children like a document
        return this.renderChildren(node as Parent, '\n\n');

      case 'code': {
        const code = node as CodeBlock;
        return `\`\`\`${code.lang || ''}\n${code.value}\n\`\`\``;
      }

      case 'htmlBlock':
        return (node as Literal).value;

      case 'table': {
        const table = node as Table;
        const rows = table.children || [];
        if (rows.length === 0) return '';
        
        const renderedRows = rows.map(row => this.renderNode(row));
        const align = table.align || [];
        const colsCount = (rows[0] as Parent)?.children?.length || 0;
        
        const dividerStrs = [];
        for (let i = 0; i < colsCount; i++) {
          const a = align[i];
          if (a === 'center') dividerStrs.push(':---:');
          else if (a === 'right') dividerStrs.push('---:');
          else if (a === 'left') dividerStrs.push(':---');
          else dividerStrs.push('---');
        }
        const divider = `| ${dividerStrs.join(' | ')} |`;
        
        return [renderedRows[0], divider, ...renderedRows.slice(1)].join('\n');
      }

      case 'tableRow': {
        const tr = node as Parent;
        const cells = tr.children ? tr.children.map(cell => this.renderNode(cell)) : [];
        return `| ${cells.join(' | ')} |`;
      }

      case 'tableCell':
        return this.renderChildren(node as Parent, '');

      // ---------- Inline Types ----------
      
      case 'text':
        return (node as Literal).value || '';

      case 'emphasis':
        return `*${this.renderChildren(node as Parent, '')}*`;

      case 'strong':
        return `**${this.renderChildren(node as Parent, '')}**`;

      case 'delete':
        return `~~${this.renderChildren(node as Parent, '')}~~`;

      case 'inlineCode':
        return `\`${(node as Literal).value}\``;

      case 'htmlInline':
        return (node as Literal).value;

      case 'link': {
        const link = node as Link;
        const titleStr = link.title ? ` "${link.title}"` : '';
        return `[${this.renderChildren(link, '')}](${link.url}${titleStr})`;
      }

      case 'image': {
        const img = node as Image;
        const titleStr = img.title ? ` "${img.title}"` : '';
        return `![${img.alt || ''}](${img.url}${titleStr})`;
      }

      default:
        // Fallback for unknown elements
        if ('children' in node) {
          return this.renderChildren(node as Parent, '');
        } else if ('value' in node) {
          return (node as Literal).value;
        }
        return '';
    }
  }

  /**
   * Renders the children of a node and joins them with the specified separator.
   */
  private renderChildren(node: Parent, separator: string): string {
    if (!node.children || node.children.length === 0) return '';
    return node.children.map(child => this.renderNode(child)).join(separator);
  }
}

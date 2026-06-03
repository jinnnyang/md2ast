/**
 * Base Node Interface for AST
 */
export interface Node {
  /** The type of the AST node */
  type: string;
  /** The starting line number (0-indexed) of this node in the source document */
  line_num?: number;
  /** The starting absolute character offset (0-indexed) of this node in the source document */
  char_num?: number;
}

export interface Parent extends Node {
  children: AnyNode[];
}

export interface Literal extends Node {
  value: string;
}

export interface Document extends Parent {
  type: 'document';
}

export interface Paragraph extends Parent {
  type: 'paragraph';
}

export interface Heading extends Parent {
  type: 'heading';
  depth: 1 | 2 | 3 | 4 | 5 | 6;
}

export interface ThematicBreak extends Node {
  type: 'thematicBreak';
}

export interface Yaml extends Literal {
  type: 'yaml';
}

export interface Blockquote extends Parent {
  type: 'blockquote';
}

export interface List extends Parent {
  type: 'list';
  ordered: boolean;
  start?: number;
  spread: boolean;
}

export interface ListItem extends Parent {
  type: 'listItem';
  spread: boolean;
}

export interface CodeBlock extends Literal {
  type: 'code';
  lang?: string;
  meta?: string;
}

export interface HtmlBlock extends Literal {
  type: 'htmlBlock';
}

export interface Table extends Parent {
  type: 'table';
  align?: ('left' | 'right' | 'center' | null)[];
}

export interface TableRow extends Parent {
  type: 'tableRow';
}

export interface TableCell extends Parent {
  type: 'tableCell';
}

// Inline Nodes
export interface Text extends Literal {
  type: 'text';
}

export interface Emphasis extends Parent {
  type: 'emphasis';
}

export interface Strong extends Parent {
  type: 'strong';
}

export interface Delete extends Parent {
  type: 'delete';
}

export interface InlineCode extends Literal {
  type: 'inlineCode';
}

export interface Link extends Parent {
  type: 'link';
  url: string;
  title?: string;
}

export interface Image extends Node {
  type: 'image';
  url: string;
  title?: string;
  alt?: string;
}

export interface HtmlInline extends Literal {
  type: 'htmlInline';
}

export type BlockContent = Paragraph | Heading | ThematicBreak | Blockquote | List | CodeBlock | HtmlBlock | Table | Yaml;
export type InlineContent = Text | Emphasis | Strong | Delete | InlineCode | Link | Image | HtmlInline;
export type AnyNode = Document | BlockContent | ListItem | TableRow | TableCell | InlineContent;

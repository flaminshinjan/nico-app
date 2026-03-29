import {
  AlignmentType,
  BorderStyle,
  Document,
  ExternalHyperlink,
  HeadingLevel,
  LevelFormat,
  Packer,
  Paragraph,
  type ParagraphChild,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";
import { HTMLElement, parse, type Node as HtmlNode, TextNode } from "node-html-parser";

type BlockChild = Paragraph | Table;
type DocxAlignment = (typeof AlignmentType)[keyof typeof AlignmentType];
type DocxHeading = (typeof HeadingLevel)[keyof typeof HeadingLevel];
type DocxWidthType = (typeof WidthType)[keyof typeof WidthType];
type DocxBorderStyle = (typeof BorderStyle)[keyof typeof BorderStyle];

type TextStyle = {
  bold?: boolean;
  italics?: boolean;
  underline?: boolean;
  code?: boolean;
  color?: string;
  size?: number;
  font?: string;
};

function isElement(node: HtmlNode): node is HTMLElement {
  return node instanceof HTMLElement;
}

function isText(node: HtmlNode): node is TextNode {
  return node instanceof TextNode;
}

function nodeTag(node: HtmlNode): string {
  return isElement(node) ? node.tagName.toLowerCase() : "";
}

function normalizeText(text: string): string {
  return text.replace(/\s+/g, " ");
}

function getStyleDeclaration(style: string, property: string): string | undefined {
  const match = style.match(new RegExp(`${property}\\s*:\\s*([^;]+)`, "i"));
  return match?.[1]?.trim();
}

function toDocxHexColor(value: string): string | undefined {
  const trimmed = value.trim();

  const hexMatch = trimmed.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (hexMatch) {
    const hex = hexMatch[1];
    if (hex.length === 3) {
      return `${hex[0]}${hex[0]}${hex[1]}${hex[1]}${hex[2]}${hex[2]}`.toUpperCase();
    }
    return hex.toUpperCase();
  }

  const rgbMatch = trimmed.match(/^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})(?:\s*,\s*[\d.]+)?\s*\)$/i);
  if (rgbMatch) {
    const [r, g, b] = rgbMatch.slice(1, 4).map((part) => {
      const n = Number.parseInt(part, 10);
      return Math.min(255, Math.max(0, n));
    });
    return [r, g, b].map((n) => n.toString(16).padStart(2, "0")).join("").toUpperCase();
  }

  return undefined;
}

function toHalfPoints(sizeValue: string): number | undefined {
  const value = sizeValue.trim().toLowerCase();
  const numeric = Number.parseFloat(value);
  if (!Number.isFinite(numeric) || numeric <= 0) return undefined;

  if (value.endsWith("pt")) {
    return Math.round(numeric * 2);
  }
  if (value.endsWith("px")) {
    return Math.round(numeric * 1.5);
  }
  if (value.endsWith("rem") || value.endsWith("em")) {
    return Math.round(numeric * 24);
  }

  return Math.round(numeric * 2);
}

function parseRunStyles(node: HTMLElement): TextStyle {
  const style = node.getAttribute("style") ?? "";
  const classes = (node.getAttribute("class") ?? "").toLowerCase().split(/\s+/).filter(Boolean);

  const parsed: TextStyle = {};

  const weight = getStyleDeclaration(style, "font-weight")?.toLowerCase();
  if (weight === "bold" || (weight ? Number.parseInt(weight, 10) >= 600 : false)) {
    parsed.bold = true;
  }

  const fontStyle = getStyleDeclaration(style, "font-style")?.toLowerCase();
  if (fontStyle === "italic") {
    parsed.italics = true;
  }

  const textDecoration = getStyleDeclaration(style, "text-decoration")?.toLowerCase();
  if (textDecoration?.includes("underline")) {
    parsed.underline = true;
  }

  const color = getStyleDeclaration(style, "color");
  if (color) {
    const normalized = toDocxHexColor(color);
    if (normalized) parsed.color = normalized;
  }

  const size = getStyleDeclaration(style, "font-size");
  if (size) {
    const normalized = toHalfPoints(size);
    if (normalized) parsed.size = normalized;
  }

  const fontFamily = getStyleDeclaration(style, "font-family");
  if (fontFamily) {
    const primaryFont = fontFamily.split(",")[0]?.replace(/["']/g, "").trim();
    if (primaryFont) parsed.font = primaryFont;
  }

  if (classes.some((cls) => cls === "font-bold" || cls === "bold" || cls === "fw-bold")) {
    parsed.bold = true;
  }
  if (classes.some((cls) => cls === "italic" || cls === "fst-italic" || cls === "font-italic")) {
    parsed.italics = true;
  }
  if (classes.some((cls) => cls === "underline" || cls === "text-underline")) {
    parsed.underline = true;
  }
  if (classes.some((cls) => cls === "font-mono" || cls === "monospace" || cls === "code")) {
    parsed.code = true;
  }

  return parsed;
}

function mergeTextStyles(base: TextStyle, next: TextStyle): TextStyle {
  return {
    bold: next.bold ?? base.bold,
    italics: next.italics ?? base.italics,
    underline: next.underline ?? base.underline,
    code: next.code ?? base.code,
    color: next.color ?? base.color,
    size: next.size ?? base.size,
    font: next.font ?? base.font,
  };
}

function parseAlignment(node: HTMLElement): DocxAlignment | undefined {
  const alignAttr = (node.getAttribute("align") ?? "").toLowerCase().trim();
  const style = (node.getAttribute("style") ?? "").toLowerCase();
  const styleMatch = style.match(/text-align\s*:\s*(left|right|center|justify)/);
  const alignValue = (styleMatch?.[1] ?? alignAttr).trim();

  switch (alignValue) {
    case "center":
      return AlignmentType.CENTER;
    case "right":
      return AlignmentType.RIGHT;
    case "justify":
      return AlignmentType.JUSTIFIED;
    case "left":
      return AlignmentType.LEFT;
    default:
      return undefined;
  }
}

function parsePositiveInt(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

function parseCellWidth(cell: HTMLElement): { size: number; type: DocxWidthType } | undefined {
  const widthAttr = parsePositiveInt(cell.getAttribute("width") ?? "");
  if (widthAttr) {
    return { size: widthAttr, type: WidthType.DXA };
  }

  const style = (cell.getAttribute("style") ?? "").toLowerCase();
  const widthValue = getStyleDeclaration(style, "width");
  if (!widthValue) return undefined;

  if (widthValue.endsWith("%")) {
    const pct = Number.parseFloat(widthValue);
    if (Number.isFinite(pct) && pct > 0) {
      return { size: Math.round(pct), type: WidthType.PERCENTAGE };
    }
    return undefined;
  }

  if (widthValue.endsWith("px")) {
    const px = Number.parseFloat(widthValue);
    if (Number.isFinite(px) && px > 0) {
      return { size: Math.round(px * 15), type: WidthType.DXA };
    }
  }

  if (widthValue.endsWith("pt")) {
    const pt = Number.parseFloat(widthValue);
    if (Number.isFinite(pt) && pt > 0) {
      return { size: Math.round(pt * 20), type: WidthType.DXA };
    }
  }

  return undefined;
}

function parseCellBorderStyle(cell: HTMLElement): {
  top: { style: DocxBorderStyle; size: number; color: string };
  bottom: { style: DocxBorderStyle; size: number; color: string };
  left: { style: DocxBorderStyle; size: number; color: string };
  right: { style: DocxBorderStyle; size: number; color: string };
} {
  const defaultBorder = { style: BorderStyle.SINGLE, size: 1, color: "B8C0CC" };
  const noneBorder = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };

  const style = (cell.getAttribute("style") ?? "").toLowerCase();
  const borderAll = getStyleDeclaration(style, "border");
  const borderTop = getStyleDeclaration(style, "border-top");
  const borderRight = getStyleDeclaration(style, "border-right");
  const borderBottom = getStyleDeclaration(style, "border-bottom");
  const borderLeft = getStyleDeclaration(style, "border-left");

  const isNone = (value?: string): boolean => {
    if (!value) return false;
    const normalized = value.trim().toLowerCase();
    return normalized === "none" || normalized.includes(" none");
  };

  return {
    top: isNone(borderTop) || isNone(borderAll) ? noneBorder : defaultBorder,
    right: isNone(borderRight) || isNone(borderAll) ? noneBorder : defaultBorder,
    bottom: isNone(borderBottom) || isNone(borderAll) ? noneBorder : defaultBorder,
    left: isNone(borderLeft) || isNone(borderAll) ? noneBorder : defaultBorder,
  };
}

function parseInlineNodes(nodes: HtmlNode[], style: TextStyle = {}): ParagraphChild[] {
  const out: ParagraphChild[] = [];

  for (const node of nodes) {
    if (isText(node)) {
      const text = normalizeText(node.rawText);
      if (!text.trim()) continue;
      out.push(
        new TextRun({
          text,
          bold: style.bold,
          italics: style.italics,
          underline: style.underline ? {} : undefined,
          color: style.color,
          size: style.size,
          font: style.code ? "Courier New" : style.font,
        })
      );
      continue;
    }

    if (!isElement(node)) continue;
    const tag = node.tagName.toLowerCase();

    if (tag === "br") {
      out.push(new TextRun({ break: 1 }));
      continue;
    }

    if (tag === "a") {
      const href = node.getAttribute("href") ?? "";
      const linkChildren = parseInlineNodes(node.childNodes, {
        ...style,
        underline: true,
      }).filter((child): child is TextRun => child instanceof TextRun);
      if (href && linkChildren.length > 0) {
        out.push(new ExternalHyperlink({ link: href, children: linkChildren }));
      } else {
        out.push(...linkChildren);
      }
      continue;
    }

    let nextStyle: TextStyle = { ...style };
    if (tag === "strong" || tag === "b") nextStyle.bold = true;
    if (tag === "em" || tag === "i") nextStyle.italics = true;
    if (tag === "u") nextStyle.underline = true;
    if (tag === "code") nextStyle.code = true;
    nextStyle = mergeTextStyles(nextStyle, parseRunStyles(node));

    out.push(...parseInlineNodes(node.childNodes, nextStyle));
  }

  return out;
}

function paragraphFromNode(node: HTMLElement, options?: { heading?: DocxHeading; bulletLevel?: number; orderedLevel?: number; alignment?: DocxAlignment }): Paragraph {
  const runs = parseInlineNodes(node.childNodes);
  const children = runs.length > 0 ? runs : [new TextRun("")];
  const alignment = parseAlignment(node);

  return new Paragraph({
    children,
    heading: options?.heading,
    alignment: options?.alignment ?? alignment,
    bullet: options?.bulletLevel !== undefined ? { level: options.bulletLevel } : undefined,
    numbering: options?.orderedLevel !== undefined
      ? { reference: "nico-numbered", level: Math.min(options.orderedLevel, 2) }
      : undefined,
    spacing: { after: 200 },
  });
}

function listItemToParagraphs(li: HTMLElement, listTag: "ul" | "ol", level: number): Paragraph[] {
  const childBlocks = li.childNodes.filter((child) => {
    const tag = nodeTag(child);
    return tag !== "ul" && tag !== "ol";
  });

  const base = new Paragraph({
    children: parseInlineNodes(childBlocks),
    bullet: listTag === "ul" ? { level: Math.min(level, 2) } : undefined,
    numbering: listTag === "ol" ? { reference: "nico-numbered", level: Math.min(level, 2) } : undefined,
    spacing: { after: 120 },
  });

  const nested: Paragraph[] = [];
  for (const child of li.childNodes) {
    if (!isElement(child)) continue;
    const tag = child.tagName.toLowerCase();
    if (tag === "ul" || tag === "ol") {
      nested.push(...listToParagraphs(child, level + 1));
    }
  }

  return [base, ...nested];
}

function listToParagraphs(list: HTMLElement, level = 0): Paragraph[] {
  const listTag = list.tagName.toLowerCase() as "ul" | "ol";
  const paragraphs: Paragraph[] = [];

  for (const child of list.childNodes) {
    if (!isElement(child) || child.tagName.toLowerCase() !== "li") continue;
    paragraphs.push(...listItemToParagraphs(child, listTag, level));
  }

  return paragraphs;
}

function tableCellToParagraphs(cell: HTMLElement): Paragraph[] {
  const cellAlignment = parseAlignment(cell);
  const directBlocks = cell.childNodes.filter(
    (child): child is HTMLElement => isElement(child) && ["p", "div", "h1", "h2", "h3", "blockquote"].includes(nodeTag(child))
  );

  if (directBlocks.length > 0) {
    return directBlocks.map((block) => paragraphFromNode(block, { alignment: cellAlignment }));
  }

  const inlineChildren = parseInlineNodes(cell.childNodes);
  return [
    new Paragraph({
      children: inlineChildren.length > 0 ? inlineChildren : [new TextRun("")],
      alignment: cellAlignment,
    }),
  ];
}

function tableFromNode(tableNode: HTMLElement): Table {
  const rows = tableNode.querySelectorAll("tr").map((row) => {
    const cells = row.childNodes
      .filter((cell): cell is HTMLElement => isElement(cell) && ["td", "th"].includes(cell.tagName.toLowerCase()))
      .map((cell) => {
        const colSpan = parsePositiveInt(cell.getAttribute("colspan") ?? "");
        const rowSpan = parsePositiveInt(cell.getAttribute("rowspan") ?? "");
        const width = parseCellWidth(cell);
        const borders = parseCellBorderStyle(cell);
        const isHeaderCell = cell.tagName.toLowerCase() === "th";

        return new TableCell({
          children: tableCellToParagraphs(cell),
          columnSpan: colSpan,
          rowSpan,
          width,
          borders,
          shading: isHeaderCell ? { fill: "D9D9D9" } : undefined,
          margins: {
            top: 80,
            bottom: 80,
            left: 120,
            right: 120,
          },
        });
      });

    return new TableRow({ children: cells });
  });

  return new Table({
    rows,
    width: { size: 100, type: WidthType.PERCENTAGE },
  });
}

function blockChildrenFromNodes(nodes: HtmlNode[]): BlockChild[] {
  const children: BlockChild[] = [];

  for (const node of nodes) {
    if (isText(node)) {
      const text = normalizeText(node.rawText).trim();
      if (text) children.push(new Paragraph({ children: [new TextRun(text)] }));
      continue;
    }

    if (!isElement(node)) continue;
    const tag = node.tagName.toLowerCase();

    if (tag === "h1") {
      children.push(paragraphFromNode(node, { heading: HeadingLevel.HEADING_1 }));
      continue;
    }
    if (tag === "h2") {
      children.push(paragraphFromNode(node, { heading: HeadingLevel.HEADING_2 }));
      continue;
    }
    if (tag === "h3") {
      children.push(paragraphFromNode(node, { heading: HeadingLevel.HEADING_3 }));
      continue;
    }
    if (tag === "p") {
      children.push(paragraphFromNode(node));
      continue;
    }
    if (tag === "blockquote") {
      children.push(
        new Paragraph({
          children: parseInlineNodes(node.childNodes, { italics: true }),
          indent: { left: 480 },
          spacing: { after: 200 },
          border: {
            left: { style: BorderStyle.SINGLE, size: 2, color: "9CA3AF" },
          },
        })
      );
      continue;
    }
    if (tag === "ul" || tag === "ol") {
      children.push(...listToParagraphs(node));
      continue;
    }
    if (tag === "table") {
      children.push(tableFromNode(node));
      continue;
    }
    if (tag === "hr") {
      const className = node.getAttribute("class") ?? "";
      if (className.includes("page-break")) {
        children.push(new Paragraph({ children: [new TextRun("")], pageBreakBefore: true }));
      }
      continue;
    }
    if (tag === "div" || tag === "section" || tag === "article") {
      children.push(...blockChildrenFromNodes(node.childNodes));
      continue;
    }

    children.push(new Paragraph({ children: parseInlineNodes(node.childNodes) }));
  }

  return children;
}

export async function htmlToDocxBufferStructured(html: string): Promise<Buffer> {
  const root = parse(`<body>${html}</body>`);
  const body = root.querySelector("body");
  const blockChildren = blockChildrenFromNodes(body?.childNodes ?? root.childNodes);

  const doc = new Document({
    numbering: {
      config: [
        {
          reference: "nico-numbered",
          levels: [
            {
              level: 0,
              format: LevelFormat.DECIMAL,
              text: "%1.",
              alignment: AlignmentType.START,
              style: { paragraph: { indent: { left: 720, hanging: 260 } } },
            },
            {
              level: 1,
              format: LevelFormat.LOWER_LETTER,
              text: "%2.",
              alignment: AlignmentType.START,
              style: { paragraph: { indent: { left: 1440, hanging: 260 } } },
            },
            {
              level: 2,
              format: LevelFormat.LOWER_ROMAN,
              text: "%3.",
              alignment: AlignmentType.START,
              style: { paragraph: { indent: { left: 2160, hanging: 260 } } },
            },
          ],
        },
      ],
    },
    sections: [
      {
        children: blockChildren.length > 0 ? blockChildren : [new Paragraph(" ")],
      },
    ],
  });

  return Packer.toBuffer(doc);
}
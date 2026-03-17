import { getApiUrl } from "@/lib/api";

function nodeToMarkdown(node: Node, listIndex = 0): string {
  if (node.nodeType === Node.TEXT_NODE) return node.textContent ?? "";
  if (node.nodeType !== Node.ELEMENT_NODE) return "";

  const el = node as HTMLElement;
  const tag = el.tagName.toLowerCase();
  const children = Array.from(el.childNodes)
    .map((n, i) => nodeToMarkdown(n, tag === "ol" ? i + 1 : 0))
    .join("");

  switch (tag) {
    case "h1": return `# ${children.trim()}\n\n`;
    case "h2": return `## ${children.trim()}\n\n`;
    case "h3": return `### ${children.trim()}\n\n`;
    case "h4": return `#### ${children.trim()}\n\n`;
    case "p": return `${children.trim()}\n\n`;
    case "strong": case "b": return `**${children}**`;
    case "em": case "i": return `*${children}*`;
    case "a": return `[${children}](${el.getAttribute("href") ?? ""})`;
    case "ul": return `${children}\n`;
    case "ol": return `${children}\n`;
    case "li": {
      const prefix = el.parentElement?.tagName.toLowerCase() === "ol" ? `${listIndex}. ` : "- ";
      return `${prefix}${children.trim()}\n`;
    }
    case "blockquote": return `> ${children.trim()}\n\n`;
    case "code": return `\`${children}\``;
    case "pre": return `\`\`\`\n${el.textContent ?? ""}\n\`\`\`\n\n`;
    case "br": return "\n";
    case "hr": return "---\n\n";
    default: return children;
  }
}

export function htmlToMarkdown(html: string): string {
  const doc = new DOMParser().parseFromString(html, "text/html");
  return nodeToMarkdown(doc.body).replace(/\n{3,}/g, "\n\n").trim();
}

export async function exportAsDocx(html: string, title: string) {
  const res = await fetch(`${getApiUrl()}/api/documents/html-to-docx`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ html }),
  });
  if (!res.ok) throw new Error("DOCX export failed");
  const blob = await res.blob();
  downloadBlob(blob, `${sanitizeFilename(title)}.docx`);
}

export function exportAsPdf(html: string, title: string) {
  const win = window.open("", "_blank");
  if (!win) return;
  win.document.write(`<!DOCTYPE html>
<html><head>
<title>${escapeHtml(title)}</title>
<style>
  body { font-family: Georgia, serif; font-size: 14px; line-height: 1.8; color: #222; max-width: 700px; margin: 40px auto; padding: 0 20px; }
  h1 { font-size: 28px; margin: 1em 0 0.3em; }
  h2 { font-size: 22px; margin: 0.8em 0 0.3em; }
  h3 { font-size: 18px; margin: 0.6em 0 0.3em; }
  blockquote { border-left: 3px solid #6366f1; padding: 8px 16px; margin: 0.5em 0; background: #f7f8ff; }
  code { background: #f3f4f6; padding: 2px 6px; border-radius: 4px; font-size: 0.9em; }
  pre { background: #f3f4f6; padding: 16px; border-radius: 8px; overflow-x: auto; }
  @media print { body { margin: 0; } }
</style>
</head><body>${html}</body></html>`);
  win.document.close();
  setTimeout(() => { win.print(); }, 300);
}

export function exportAsMarkdown(html: string, title: string) {
  const md = htmlToMarkdown(html);
  const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
  downloadBlob(blob, `${sanitizeFilename(title)}.md`);
}

export function exportAsHtml(html: string, title: string) {
  const full = `<!DOCTYPE html>\n<html>\n<head><meta charset="UTF-8"><title>${escapeHtml(title)}</title></head>\n<body>\n${html}\n</body>\n</html>`;
  const blob = new Blob([full], { type: "text/html;charset=utf-8" });
  downloadBlob(blob, `${sanitizeFilename(title)}.html`);
}

export function copyHtmlToClipboard(html: string) {
  const md = htmlToMarkdown(html);
  navigator.clipboard.writeText(md);
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function sanitizeFilename(name: string): string {
  return (name.trim() || "Untitled Document").replace(/[\\/:*?"<>|]/g, "").trim() || "Untitled Document";
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

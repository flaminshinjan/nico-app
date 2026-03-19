import sanitizeHtml from "sanitize-html";
import { SANITIZE_HTML_OPTIONS } from "../config/constants.js";

export function sanitizeHtmlContent(value: string): string {
  return sanitizeHtml(value, SANITIZE_HTML_OPTIONS);
}

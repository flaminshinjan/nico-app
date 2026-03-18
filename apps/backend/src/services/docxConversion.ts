import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import HTMLtoDOCX from "html-to-docx";

const execFileAsync = promisify(execFile);

export type DocxConversionMode = "hybrid" | "uno-only" | "legacy-only";
export type DocxFidelity = "full" | "balanced" | "compatible";

export class DocxConversionError extends Error {
  status: number;
  hint?: string;

  constructor(message: string, status = 500, hint?: string) {
    super(message);
    this.name = "DocxConversionError";
    this.status = status;
    this.hint = hint;
  }
}

type ConversionConfig = {
  mode: DocxConversionMode;
  unoserverUrl: URL;
  unoconvertBin: string;
  timeoutMs: number;
  maxUploadBytes: number;
};

function parseMode(value: string | undefined): DocxConversionMode {
  if (value === "uno-only" || value === "legacy-only" || value === "hybrid") {
    return value;
  }
  return "hybrid";
}

export function getDocxConversionConfig(): ConversionConfig {
  const mode = parseMode(process.env.DOCX_CONVERSION_MODE);
  const urlRaw = process.env.UNOSERVER_URL || "http://127.0.0.1:2003";
  const unoconvertBin = (process.env.UNOCONVERT_BIN || "unoconvert").trim() || "unoconvert";
  const timeoutMs = Number(process.env.DOCX_CONVERSION_TIMEOUT_MS) || 30000;
  const maxUploadMb = Number(process.env.DOCX_MAX_UPLOAD_MB) || 25;
  const maxUploadBytes = Math.max(1, maxUploadMb) * 1024 * 1024;

  let unoserverUrl: URL;
  try {
    unoserverUrl = new URL(urlRaw);
  } catch {
    unoserverUrl = new URL("http://127.0.0.1:2003");
  }

  return {
    mode,
    unoserverUrl,
    unoconvertBin,
    timeoutMs,
    maxUploadBytes,
  };
}

async function isTcpReachable(host: string, port: number, timeoutMs: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host, port });
    let settled = false;

    const done = (ok: boolean) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      resolve(ok);
    };

    socket.setTimeout(timeoutMs);
    socket.on("connect", () => done(true));
    socket.on("timeout", () => done(false));
    socket.on("error", () => done(false));
  });
}

async function hasUnoconvertBinary(bin: string, timeoutMs: number): Promise<boolean> {
  try {
    await execFileAsync(bin, ["--version"], { timeout: timeoutMs });
    return true;
  } catch {
    return false;
  }
}

export async function getDocxConversionHealth(): Promise<{
  mode: DocxConversionMode;
  unoconvert: "ready" | "missing";
  unoserver: "ready" | "unreachable";
  fallback: "ready";
}> {
  const config = getDocxConversionConfig();
  const host = config.unoserverUrl.hostname;
  const port = Number(config.unoserverUrl.port || "2003");

  const [hasBin, isReachable] = await Promise.all([
    hasUnoconvertBinary(config.unoconvertBin, Math.min(config.timeoutMs, 3000)),
    isTcpReachable(host, port, 1500),
  ]);

  return {
    mode: config.mode,
    unoconvert: hasBin ? "ready" : "missing",
    unoserver: isReachable ? "ready" : "unreachable",
    fallback: "ready",
  };
}

function buildUnoArgs(config: ConversionConfig, inputPath: string, outputPath: string): string[] {
  const host = config.unoserverUrl.hostname;
  const port = config.unoserverUrl.port || "2003";
  return [
    "--host",
    host,
    "--port",
    port,
    inputPath,
    outputPath,
  ];
}

async function convertWithUno(
  config: ConversionConfig,
  inputPath: string,
  outputPath: string
): Promise<void> {
  try {
    await execFileAsync(config.unoconvertBin, buildUnoArgs(config, inputPath, outputPath), {
      timeout: config.timeoutMs,
      windowsHide: true,
    });
  } catch (err) {
    throw new DocxConversionError(
      "Unoserver conversion failed",
      503,
      "Ensure unoconvert is installed and unoserver is reachable"
    );
  }
}

async function htmlToDocxLegacy(html: string): Promise<Buffer> {
  const result = await HTMLtoDOCX(html, null, {
    table: { row: { cantSplit: true } },
    footer: true,
    pageNumber: true,
  });

  return Buffer.isBuffer(result)
    ? result
    : Buffer.from(await (result as Blob).arrayBuffer());
}

function shouldUseUno(mode: DocxConversionMode, fidelity: DocxFidelity): boolean {
  if (mode === "legacy-only") return false;
  if (mode === "uno-only") return true;
  // hybrid
  return fidelity !== "compatible";
}

export async function convertDocxBufferToHtml(fileBuffer: Buffer): Promise<{ html: string; engine: "uno" }> {
  const config = getDocxConversionConfig();
  if (config.mode === "legacy-only") {
    throw new DocxConversionError(
      "DOCX import requires Unoserver in current configuration",
      503,
      "Set DOCX_CONVERSION_MODE=hybrid or uno-only"
    );
  }

  const tempDir = await mkdtemp(path.join(os.tmpdir(), "nico-docx-import-"));
  const inputPath = path.join(tempDir, "input.docx");
  const outputPath = path.join(tempDir, "output.html");

  try {
    await writeFile(inputPath, fileBuffer);
    await convertWithUno(config, inputPath, outputPath);
    const html = await readFile(outputPath, "utf8");
    return { html: html || "<p></p>", engine: "uno" };
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

export async function convertHtmlToDocx(
  html: string,
  fidelity: DocxFidelity
): Promise<{ buffer: Buffer; engine: "uno" | "legacy" }> {
  const config = getDocxConversionConfig();
  const useUno = shouldUseUno(config.mode, fidelity);

  if (!useUno) {
    return { buffer: await htmlToDocxLegacy(html), engine: "legacy" };
  }

  const tempDir = await mkdtemp(path.join(os.tmpdir(), "nico-docx-export-"));
  const inputPath = path.join(tempDir, "input.html");
  const outputPath = path.join(tempDir, "output.docx");

  try {
    const wrappedHtml = `<!DOCTYPE html><html><head><meta charset=\"utf-8\"></head><body>${html}</body></html>`;
    await writeFile(inputPath, wrappedHtml, "utf8");
    await convertWithUno(config, inputPath, outputPath);
    const buffer = await readFile(outputPath);
    return { buffer, engine: "uno" };
  } catch (err) {
    if (config.mode === "uno-only") {
      throw err;
    }
    const buffer = await htmlToDocxLegacy(html);
    return { buffer, engine: "legacy" };
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

export function getUploadLimitBytes(): number {
  return getDocxConversionConfig().maxUploadBytes;
}

export function toConversionError(err: unknown): { status: number; error: string; hint?: string } {
  if (err instanceof DocxConversionError) {
    return {
      status: err.status,
      error: err.message,
      hint: err.hint,
    };
  }

  return {
    status: 500,
    error: "Internal server error",
  };
}

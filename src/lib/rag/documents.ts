import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";
import { normalizeText } from "./chunk";
import type { SourceDocument } from "./types";

const SUPPORTED_EXTENSIONS = new Set(["txt", "md", "markdown", "csv", "json", "pdf", "docx"]);
const MAX_FILE_BYTES = 8 * 1024 * 1024;

export type UploadFile = {
  name: string;
  size: number;
  arrayBuffer: () => Promise<ArrayBuffer>;
};

function extensionFor(file: UploadFile) {
  return file.name.split(".").pop()?.toLowerCase() ?? "";
}

function safeId(name: string, index: number) {
  return `${index}-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;
}

async function parsePdf(buffer: Buffer) {
  const parser = new PDFParse({ data: buffer });
  const result = await parser.getText();
  await parser.destroy();
  return result.text;
}

async function parseDocx(buffer: Buffer) {
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}

export async function parseUploadedFiles(files: UploadFile[]): Promise<SourceDocument[]> {
  const documents: SourceDocument[] = [];

  for (const [index, file] of files.entries()) {
    const extension = extensionFor(file);

    if (!SUPPORTED_EXTENSIONS.has(extension)) {
      throw new Error(`${file.name} is not supported. Use TXT, Markdown, CSV, JSON, PDF, or DOCX.`);
    }

    if (file.size > MAX_FILE_BYTES) {
      throw new Error(`${file.name} is too large. Keep files under 8 MB for this serverless demo.`);
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    let text = "";

    if (extension === "pdf") {
      text = await parsePdf(buffer);
    } else if (extension === "docx") {
      text = await parseDocx(buffer);
    } else {
      text = buffer.toString("utf8");
    }

    const normalized = normalizeText(text);

    if (normalized.length > 0) {
      documents.push({
        id: safeId(file.name, index),
        name: file.name,
        type: extension,
        text: normalized,
      });
    }
  }

  return documents;
}

export const supportedFileTypes = Array.from(SUPPORTED_EXTENSIONS).sort();

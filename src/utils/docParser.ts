import { GlobalWorkerOptions, getDocument } from "pdfjs-dist";
import mammoth from "mammoth";

// Configure pdf.js worker (use CDN for simplicity in Vite)
GlobalWorkerOptions.workerSrc =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.js";

export async function extractTextFromFile(file: File): Promise<string> {
  const ext = file.name.toLowerCase().split(".").pop();
  if (!ext) throw new Error("Unsupported file type");

  if (ext === "pdf") return extractPdfText(file);
  if (ext === "docx") return extractDocxText(file);
  if (ext === "txt") return readTxt(file);

  throw new Error("Only PDF, DOCX and TXT files are supported");
}

async function extractPdfText(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;

  const maxPages = Math.min(pdf.numPages, 50); // safety limit
  const pageTexts: string[] = [];
  for (let i = 1; i <= maxPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const strings = content.items.map((item: any) => item.str);
    pageTexts.push(strings.join(" "));
  }
  return pageTexts.join("\n\n");
}

async function extractDocxText(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const result = await (mammoth as any).extractRawText({ arrayBuffer });
  return result.value as string;
}

function readTxt(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = (e) => reject(e);
    reader.readAsText(file);
  });
}

export function truncateForPrompt(text: string, maxChars = 8000) {
  if (!text) return "";
  if (text.length <= maxChars) return text;
  return text.slice(0, maxChars) + "\n... [truncated]";
}

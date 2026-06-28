import { NextResponse } from "next/server";
import { parseUploadedFiles, supportedFileTypes } from "@/lib/rag/documents";

export const runtime = "nodejs";

function isUploadFile(value: FormDataEntryValue): value is File {
  return (
    typeof value === "object" &&
    value !== null &&
    "name" in value &&
    "size" in value &&
    "arrayBuffer" in value &&
    typeof value.arrayBuffer === "function"
  );
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const files = formData.getAll("files").filter(isUploadFile);

    if (files.length === 0) {
      return NextResponse.json({ error: "Upload at least one file." }, { status: 400 });
    }

    const documents = await parseUploadedFiles(files);

    if (documents.length === 0) {
      return NextResponse.json({ error: "No readable text was found in the uploaded files." }, { status: 400 });
    }

    return NextResponse.json({ documents, supportedFileTypes });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to ingest files." },
      { status: 400 },
    );
  }
}

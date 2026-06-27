"""
Solana Document Processor
Extracts clean text from PDFs, images, and text files.
"""

import base64
import io
import pdfplumber


async def extract_text(file_data: str, file_mime: str, file_name: str) -> str:
    """Extract text from any supported file type."""
    raw = base64.b64decode(file_data)

    if file_mime == "application/pdf" or file_name.lower().endswith(".pdf"):
        return _extract_pdf(raw)
    elif file_mime.startswith("image/"):
        return f"[Image file uploaded: {file_name}. Describe and generate content based on any educational context.]"
    else:
        return raw.decode("utf-8", errors="ignore")[:15000]


def _extract_pdf(data: bytes) -> str:
    """Extract structured text from PDF with page markers."""
    pages = []
    try:
        with pdfplumber.open(io.BytesIO(data)) as pdf:
            for i, page in enumerate(pdf.pages, 1):
                text = page.extract_text()
                if text and text.strip():
                    pages.append(f"[Page {i}]\n{text.strip()}")
    except Exception as e:
        return f"[PDF extraction error: {e}]"

    full_text = "\n\n".join(pages)
    return full_text[:15000]

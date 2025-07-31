import mammoth from 'mammoth'; // For .docx
import * as pdfjsLib from 'pdfjs-dist'; // For .pdf

// Set workerSrc for pdfjs-dist
// This might need to be hosted or served from a CDN in a production environment
// For local development, you might need to configure Vite to serve it
// For now, we'll use a direct URL from unpkg, but be aware of potential CORS/production issues.
pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`;

export async function parseFile(file: File): Promise<{ content: string; title: string; }> {
  const title = file.name;
  const fileType = file.type;

  if (fileType.startsWith('text/') || file.name.endsWith('.md') || file.name.endsWith('.txt')) {
    const content = await file.text();
    return { content, title };
  } else if (fileType === 'application/json') {
    const content = await file.text();
    try {
      // Pretty print JSON for better readability if it's valid JSON
      const parsedJson = JSON.parse(content);
      return { content: JSON.stringify(parsedJson, null, 2), title };
    } catch (e) {
      // If not valid JSON, return as plain text
      return { content, title };
    }
  } else if (fileType === 'application/pdf') {
    // Placeholder for PDF parsing
    // This requires pdfjs-dist, which is a large library.
    // Consider lazy loading or server-side processing for production.
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        fullText += textContent.items.map((item: any) => item.str).join(' ') + '\n';
      }
      return { content: fullText, title };
    } catch (e) {
      console.error('Error parsing PDF:', e);
      return { content: `Could not parse PDF: ${e instanceof Error ? e.message : String(e)}`, title };
    }
  } else if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    // Placeholder for DOCX parsing
    // This requires mammoth.js
    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer: arrayBuffer });
      return { content: result.value, title };
    } catch (e) {
      console.error('Error parsing DOCX:', e);
      return { content: `Could not parse DOCX: ${e instanceof Error ? e.message : String(e)}`, title };
    }
  } else {
    // Fallback for unsupported types: read as text if possible, otherwise return empty
    try {
      const content = await file.text();
      return { content, title };
    } catch (e) {
      console.warn(`Unsupported file type: ${fileType}. Returning empty content.`);
      return { content: '', title };
    }
  }
}
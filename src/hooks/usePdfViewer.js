import { useEffect, useRef, useState } from "react";
import pdfjsLib from "../lib/pdfjs";
import { clearDefinitionCache } from "../services/dictionaryService";
const DEFAULT_SCALE = 1.4,
  MIN_SCALE = 0.6,
  MAX_SCALE = 3;
export default function usePdfViewer({ hidePopover, showToast, onPdfUpload, onPdfClose }) {
  const [documentState, setDocumentState] = useState(null),
    [page, setPage] = useState(1),
    [pageInput, setPageInput] = useState("1"),
    [scale, setScale] = useState(DEFAULT_SCALE),
    [loading, setLoading] = useState(false);
  const canvasRef = useRef(null),
    textLayerRef = useRef(null),
    scrollRef = useRef(null);
  useEffect(() => setPageInput(String(page)), [page]);
  useEffect(() => {
    if (!documentState || !canvasRef.current || !textLayerRef.current) return;
    let cancelled = false;
    async function render() {
      setLoading(true);
      hidePopover();
      try {
        const pdfPage = await documentState.pdf.getPage(page),
          viewport = pdfPage.getViewport({ scale }),
          canvas = canvasRef.current,
          context = canvas.getContext("2d", { alpha: false }),
          outputScale = Math.min(Math.max(window.devicePixelRatio || 1, 2), 3);
        canvas.width = Math.floor(viewport.width * outputScale);
        canvas.height = Math.floor(viewport.height * outputScale);
        canvas.style.width = `${viewport.width}px`;
        canvas.style.height = `${viewport.height}px`;
        canvas.parentElement.style.width = `${viewport.width}px`;
        canvas.parentElement.style.height = `${viewport.height}px`;
        await pdfPage.render({
          canvasContext: context,
          viewport,
          transform: [outputScale, 0, 0, outputScale, 0, 0],
        }).promise;
        if (cancelled) return;
        const textLayer = textLayerRef.current;
        textLayer.style.setProperty("--scale-factor", String(viewport.scale));
        textLayer.replaceChildren();
        await new pdfjsLib.TextLayer({
          textContentSource: await pdfPage.getTextContent(),
          container: textLayer,
          viewport,
        }).render();
        scrollRef.current.scrollTop = 0;
      } catch (error) {
        console.error(error);
        showToast("This PDF could not be rendered. Try another text-based PDF.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    render();
    return () => {
      cancelled = true;
    };
  }, [documentState, page, scale]);
  async function loadPdf(file, name = file.name, savedPdfId = null, initialPage = 1) {
    try {
      setLoading(true);
      const pdf = await pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise;
      clearDefinitionCache();
      setPage(Math.min(Math.max(initialPage, 1), pdf.numPages));
      setScale(DEFAULT_SCALE);
      setDocumentState({ pdf, name, savedPdfId });
      return true;
    } catch (error) {
      console.error(error);
      setLoading(false);
      showToast("This file could not be opened as a PDF.");
      return false;
    }
  }
  async function openPdf(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".pdf")) return showToast("Please choose a PDF file.");
    if (await loadPdf(file)) {
      const savedPdf = await onPdfUpload?.(file);
      if (savedPdf) {
        setDocumentState((current) => (current ? { ...current, savedPdfId: savedPdf.id } : null));
      }
    }
  }
  async function closePdf() {
    if (documentState?.savedPdfId) await onPdfClose?.(documentState.savedPdfId, page);
    hidePopover();
    setDocumentState(null);
  }
  const jumpToPage = (value) => {
    const requested = Number.parseInt(value, 10),
      total = documentState.pdf.numPages,
      next = Number.isFinite(requested) ? Math.min(Math.max(requested, 1), total) : page;
    setPage(next);
    setPageInput(String(next));
  };
  return {
    documentState,
    page,
    pageInput,
    setPageInput,
    scale,
    loading,
    canvasRef,
    textLayerRef,
    scrollRef,
    openPdf,
    openStoredPdf: (record) => loadPdf(record.blob, record.name, record.id, record.lastPage || 1),
    closePdf,
    jumpToPage,
    zoomIn: () => setScale((value) => Math.min(MAX_SCALE, value + 0.2)),
    zoomOut: () => setScale((value) => Math.max(MIN_SCALE, value - 0.2)),
    previousPage: () => setPage((value) => value - 1),
    nextPage: () => setPage((value) => value + 1),
    setPage,
    minScale: MIN_SCALE,
    maxScale: MAX_SCALE,
  };
}

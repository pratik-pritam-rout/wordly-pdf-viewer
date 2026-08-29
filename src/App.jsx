import React, { useEffect, useRef, useState } from "react";
import AppHeader from "./components/layout/AppHeader";
import EmptyState from "./components/viewer/EmptyState";
import PdfReader from "./components/viewer/PdfReader";
import DefinitionPopover from "./components/dictionary/DefinitionPopover";
import Toast from "./components/ui/Toast";
import usePdfViewer from "./hooks/usePdfViewer";
import { lookupDefinitions } from "./services/dictionaryService";
import { cleanSelection, snapRangeToWordBoundaries } from "./utils/text";
import {
  deleteSavedPdf,
  getSavedPdf,
  listSavedPdfs,
  savePdf,
  updateSavedPdfProgress,
} from "./services/pdfLibraryService";

export default function App() {
  const [popover, setPopover] = useState(null),
    [toast, setToast] = useState(""),
    [savedPdfs, setSavedPdfs] = useState([]),
    [libraryLoading, setLibraryLoading] = useState(true),
    [highlightsByPage, setHighlightsByPage] = useState({}),
    [pendingHighlight, setPendingHighlight] = useState(null);
  const timerRef = useRef(null),
    lookupIdRef = useRef(0);
  const showToast = (message) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 4500);
  };
  const hidePopover = () => {
    window.clearTimeout(timerRef.current);
    setPopover(null);
  };
  const refreshLibrary = async () => {
    try {
      setSavedPdfs(await listSavedPdfs());
    } catch {
      showToast("Your local PDF library could not be loaded.");
    } finally {
      setLibraryLoading(false);
    }
  };
  useEffect(() => {
    refreshLibrary();
  }, []);
  const saveUploadedPdf = async (file) => {
    try {
      const savedPdf = await savePdf(file);
      await refreshLibrary();
      return savedPdf;
    } catch {
      showToast("The PDF opened, but your browser could not save it locally.");
    }
  };
  const saveClosedPdfPage = async (id, page, highlights) => {
    try {
      await updateSavedPdfProgress(id, page, highlights);
      setSavedPdfs((items) =>
        items.map((item) => (item.id === id ? { ...item, lastPage: page, highlights } : item))
      );
    } catch {
      showToast("The PDF closed, but its reading progress could not be saved.");
    }
  };
  const openSavedPdf = async (id) => {
    try {
      const record = await getSavedPdf(id);
      if (!record) return showToast("This saved PDF is no longer available.");
      await viewer.openStoredPdf(record);
    } catch {
      showToast("This saved PDF could not be opened.");
    }
  };
  const removeSavedPdf = async (id) => {
    try {
      await deleteSavedPdf(id);
      setSavedPdfs((items) => items.filter((item) => item.id !== id));
    } catch {
      showToast("This saved PDF could not be removed.");
    }
  };
  const viewer = usePdfViewer({
    hidePopover,
    showToast,
    onPdfUpload: saveUploadedPdf,
    onPdfClose: saveClosedPdfPage,
    highlightsByPage,
  });
  useEffect(() => {
    setHighlightsByPage(viewer.documentState?.highlights || {});
    setPendingHighlight(null);
  }, [viewer.documentState?.pdf, viewer.documentState?.highlights]);
  const addHighlight = () => {
    if (!pendingHighlight) return;
    const { page, rectangles } = pendingHighlight;
    setHighlightsByPage((pages) => ({
      ...pages,
      [page]: [
        ...(pages[page] || []),
        { id: window.crypto?.randomUUID?.() || Date.now(), rectangles },
      ],
    }));
    setPendingHighlight(null);
    showToast("Text highlighted.");
  };
  function handleSelection(textLayer) {
    window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(async () => {
      const selection = window.getSelection();
      if (!selection?.rangeCount || selection.isCollapsed) return hidePopover();
      const range = selection.getRangeAt(0);
      if (!textLayer.contains(range.commonAncestorContainer)) return;
      snapRangeToWordBoundaries(range);
      if (range.collapsed) return hidePopover();
      const word = cleanSelection(selection.toString()).toLowerCase(),
        rect = range.getBoundingClientRect();
      if (!word || (!rect.width && !rect.height)) return hidePopover();
      const pageRect = textLayer.parentElement.getBoundingClientRect();
      const lineRectangles = [...range.getClientRects()]
        .filter((selectionRect) => selectionRect.width && selectionRect.height)
        .map((selectionRect) => ({
          left: selectionRect.left - pageRect.left,
          top: selectionRect.top - pageRect.top,
          right: selectionRect.right - pageRect.left,
          bottom: selectionRect.bottom - pageRect.top,
        }))
        .sort((first, second) => first.top - second.top || first.left - second.left)
        .reduce((lines, rectangle) => {
          const line = lines.find((item) => Math.abs(item.top - rectangle.top) < 3);
          if (line) {
            line.left = Math.min(line.left, rectangle.left);
            line.right = Math.max(line.right, rectangle.right);
            line.top = Math.min(line.top, rectangle.top);
            line.bottom = Math.max(line.bottom, rectangle.bottom);
          } else {
            lines.push({ ...rectangle });
          }
          return lines;
        }, [])
        .map((rectangle) => ({
          left: `${(rectangle.left / pageRect.width) * 100}%`,
          top: `${(rectangle.top / pageRect.height) * 100}%`,
          width: `${((rectangle.right - rectangle.left) / pageRect.width) * 100}%`,
          height: `${((rectangle.bottom - rectangle.top) / pageRect.height) * 100}%`,
        }));
      if (!lineRectangles.length) return hidePopover();
      setPendingHighlight({ page: viewer.page, rectangles: lineRectangles });
      if (word.split(/\s+/).length > 1 || word.length > 80) {
        return setPopover({
          status: "highlight-only",
          left: rect.left,
          top: rect.bottom + 9,
          anchorTop: rect.top,
        });
      }
      const requestId = ++lookupIdRef.current;
      const show = (content) =>
        requestId === lookupIdRef.current &&
        setPopover({
          word,
          ...content,
          left: rect.left,
          top: rect.bottom + 9,
          anchorTop: rect.top,
        });
      show({ status: "loading" });
      try {
        show(await lookupDefinitions(word));
      } catch {
        show({ status: "error" });
      }
    }, 0);
  }
  return (
    <main className="app-shell">
      <AppHeader onFileOpen={viewer.openPdf} />
      <section className="viewer-panel" aria-label="PDF viewer">
        {!viewer.documentState ? (
          <EmptyState
            onFileOpen={viewer.openPdf}
            savedPdfs={savedPdfs}
            libraryLoading={libraryLoading}
            onOpenSaved={openSavedPdf}
            onRemoveSaved={removeSavedPdf}
          />
        ) : (
          <PdfReader
            {...viewer}
            highlightsByPage={highlightsByPage}
            onTextSelection={handleSelection}
            onDismissPopover={hidePopover}
          />
        )}
      </section>
      {popover && <DefinitionPopover {...popover} onHighlight={addHighlight} />}
      {toast && <Toast message={toast} />}
    </main>
  );
}

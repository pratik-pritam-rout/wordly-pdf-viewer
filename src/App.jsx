import React, { useEffect, useRef, useState } from "react";
import AppHeader from "./components/layout/AppHeader";
import EmptyState from "./components/viewer/EmptyState";
import PdfReader from "./components/viewer/PdfReader";
import DefinitionPopover from "./components/dictionary/DefinitionPopover";
import Toast from "./components/ui/Toast";
import usePdfViewer from "./hooks/usePdfViewer";
import { lookupDefinitions } from "./services/dictionaryService";
import { cleanSelection } from "./utils/text";
import {
  deleteSavedPdf,
  getSavedPdf,
  listSavedPdfs,
  savePdf,
  updateSavedPdfPage,
} from "./services/pdfLibraryService";

export default function App() {
  const [popover, setPopover] = useState(null),
    [toast, setToast] = useState(""),
    [savedPdfs, setSavedPdfs] = useState([]),
    [libraryLoading, setLibraryLoading] = useState(true);
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
  const saveClosedPdfPage = async (id, page) => {
    try {
      await updateSavedPdfPage(id, page);
      setSavedPdfs((items) =>
        items.map((item) => (item.id === id ? { ...item, lastPage: page } : item))
      );
    } catch {
      showToast("The PDF closed, but its page could not be saved.");
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
  });
  function handleSelection(textLayer) {
    window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(async () => {
      const selection = window.getSelection();
      if (!selection?.rangeCount || selection.isCollapsed) return hidePopover();
      const range = selection.getRangeAt(0);
      if (!textLayer.contains(range.commonAncestorContainer)) return;
      const word = cleanSelection(selection.toString()).toLowerCase(),
        rect = range.getBoundingClientRect();
      if (!word || word.length > 80 || (!rect.width && !rect.height)) return hidePopover();
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
          <PdfReader {...viewer} onTextSelection={handleSelection} onDismissPopover={hidePopover} />
        )}
      </section>
      {popover && <DefinitionPopover {...popover} />}
      {toast && <Toast message={toast} />}
    </main>
  );
}

import React, { useEffect, useState } from "react";
import PdfToolbar from "./PdfToolbar";
import PageSummary from "../summary/PageSummary";
export default function PdfReader(props) {
  const {
    documentState,
    page,
    loading,
    canvasRef,
    textLayerRef,
    scrollRef,
    onTextSelection,
    onDismissPopover,
    setPage,
    highlightsByPage,
    getPageText,
  } = props;
  const [summaryOpen, setSummaryOpen] = useState(true),
    [summaryWidth, setSummaryWidth] = useState(330);
  const resizeSummary = (event) => {
    const startX = event.clientX,
      startWidth = summaryWidth;
    const move = (next) =>
      setSummaryWidth(Math.min(520, Math.max(260, startWidth + startX - next.clientX)));
    const stop = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", stop);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", stop);
  };
  const onWheel = (event) => {
    onDismissPopover();
    const area = event.currentTarget,
      atTop = area.scrollTop <= 1,
      atBottom = area.scrollTop + area.clientHeight >= area.scrollHeight - 1;
    if (event.deltaY > 0 && atBottom && page < documentState.pdf.numPages) {
      event.preventDefault();
      setPage(page + 1);
    } else if (event.deltaY < 0 && atTop && page > 1) {
      event.preventDefault();
      setPage(page - 1);
    }
  };
  useEffect(() => {
    const onKeyDown = (event) => {
      const tagName = event.target.tagName;
      if (tagName === "INPUT" || tagName === "TEXTAREA" || tagName === "SELECT") return;
      if (event.key === "ArrowRight" && page < documentState.pdf.numPages) {
        event.preventDefault();
        setPage(page + 1);
      }
      if (event.key === "ArrowLeft" && page > 1) {
        event.preventDefault();
        setPage(page - 1);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [documentState.pdf.numPages, page, setPage]);
  return (
    <div className="reader">
      <PdfToolbar
        {...props}
        summaryOpen={summaryOpen}
        toggleSummary={() => setSummaryOpen((open) => !open)}
      />
      <div className="reader-content">
        <div className="page-scroll" ref={scrollRef} onScroll={onDismissPopover} onWheel={onWheel}>
          {loading && <div className="loading">Rendering PDF…</div>}
          <div className="page-container">
            <div className="pdf-page">
              <canvas ref={canvasRef} />
              <div className="highlight-layer" aria-hidden="true">
                {(highlightsByPage[page] || []).flatMap((highlight) =>
                  highlight.rectangles.map((rectangle, index) => (
                    <div
                      key={`${highlight.id}-${index}`}
                      className="text-highlight"
                      style={rectangle}
                    />
                  ))
                )}
              </div>
              <div
                ref={textLayerRef}
                className="textLayer"
                onPointerDown={onDismissPopover}
                onPointerUp={(event) => onTextSelection(event.currentTarget)}
                onKeyUp={(event) => onTextSelection(event.currentTarget)}
              />
            </div>
          </div>
        </div>
        {summaryOpen && (
          <div className="summary-drawer" style={{ width: summaryWidth, flexBasis: summaryWidth }}>
            <div className="summary-resize-handle" onPointerDown={resizeSummary} />
            <PageSummary documentName={documentState.name} page={page} getPageText={getPageText} />
          </div>
        )}
      </div>
    </div>
  );
}

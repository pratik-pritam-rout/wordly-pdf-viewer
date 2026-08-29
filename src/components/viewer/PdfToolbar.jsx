import React from "react";
export default function PdfToolbar({
  documentState,
  page,
  pageInput,
  setPageInput,
  jumpToPage,
  previousPage,
  nextPage,
  scale,
  minScale,
  maxScale,
  zoomIn,
  zoomOut,
  closePdf,
}) {
  const total = documentState.pdf.numPages;
  return (
    <div className="toolbar">
      <div className="document-title">
        <div className="document-name">{documentState.name}</div>
        <button className="close-document" onClick={closePdf} aria-label="Close PDF">
          Close
        </button>
      </div>
      <div className="controls">
        <button onClick={previousPage} disabled={page === 1} aria-label="Previous page">
          ‹
        </button>
        <label className="page-jump" aria-label="Go to page">
          <input
            type="number"
            min="1"
            max={total}
            value={pageInput}
            onChange={(event) => setPageInput(event.target.value)}
            onBlur={(event) => jumpToPage(event.target.value)}
            onKeyDown={(event) => event.key === "Enter" && jumpToPage(event.currentTarget.value)}
          />
          <span>/ {total}</span>
        </label>
        <button onClick={nextPage} disabled={page === total} aria-label="Next page">
          ›
        </button>
        <span className="toolbar-divider" />
        <button onClick={zoomOut} disabled={scale <= minScale} aria-label="Zoom out">
          −
        </button>
        <span>{Math.round(scale * 100)}%</span>
        <button onClick={zoomIn} disabled={scale >= maxScale} aria-label="Zoom in">
          +
        </button>
      </div>
    </div>
  );
}

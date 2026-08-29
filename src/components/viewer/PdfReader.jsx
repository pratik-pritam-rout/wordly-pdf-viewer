import React, { useEffect } from "react";
import PdfToolbar from "./PdfToolbar";
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
  } = props;
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
      <PdfToolbar {...props} />
      <div className="page-scroll" ref={scrollRef} onScroll={onDismissPopover} onWheel={onWheel}>
        {loading && <div className="loading">Rendering PDF…</div>}
        <div className="page-container">
          <div className="pdf-page">
            <canvas ref={canvasRef} />
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
    </div>
  );
}

import React from "react";
const formatFileSize = (size) =>
  `${(size / 1024 / 1024).toFixed(size < 10 * 1024 * 1024 ? 1 : 0)} MB`;

export default function EmptyState({
  onFileOpen,
  savedPdfs,
  libraryLoading,
  onOpenSaved,
  onRemoveSaved,
}) {
  return (
    <div className="empty-state">
      <div className="empty-icon" aria-hidden="true">
        ⌁
      </div>
      <h1>Read with definitions at hand.</h1>
      <p>Open a text-based PDF, then select a word or phrase to see its English meaning.</p>
      <label className="primary-button">
        Choose a PDF
        <input type="file" accept="application/pdf,.pdf" onChange={onFileOpen} />
      </label>
      <small>Your document stays on this device.</small>
      {(libraryLoading || savedPdfs.length > 0) && (
        <section className="saved-pdfs" aria-label="Saved PDFs">
          <h2>On this device</h2>
          {libraryLoading ? (
            <p className="library-status">Loading your saved PDFs…</p>
          ) : (
            <ul>
              {savedPdfs.map((pdf) => (
                <li key={pdf.id}>
                  <button className="saved-pdf-open" onClick={() => onOpenSaved(pdf.id)}>
                    <span>{pdf.name}</span>
                    <small>
                      {formatFileSize(pdf.size)} · Page {pdf.lastPage || 1}
                    </small>
                  </button>
                  <button
                    className="saved-pdf-remove"
                    onClick={() => onRemoveSaved(pdf.id)}
                    aria-label={`Remove ${pdf.name} from this device`}
                    title="Remove from this device"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}

import React, { useEffect, useState } from "react";

export default function PageSummary({ documentName, page, getPageText, onClose }) {
  const [status, setStatus] = useState("idle");
  const [summary, setSummary] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setStatus("idle");
    setSummary("");
    setError("");
  }, [documentName, page]);

  const summarizePage = async () => {
    setStatus("loading");
    setError("");
    try {
      const response = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: await getPageText(), page, documentName }),
      });
      const payload = await response.json();
      if (!response.ok) throw Error(payload.error || "The page could not be summarized.");
      setSummary(payload.summary);
      setStatus("ready");
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : "The page could not be summarized."
      );
      setStatus("error");
    }
  };

  return (
    <aside className="summary-panel" aria-label="Page summary">
      <div className="summary-heading">
        <div>
          <span>AI READING AID</span>
          <h2>Page summary</h2>
        </div>
        <span className="summary-page">{page}</span>
        <button className="summary-close" onClick={onClose} aria-label="Close summary">×</button>
      </div>
      {status === "ready" ? (
        <ul className="summary-text">
          {summary.split("\n").map((point) => point.replace(/^\s*[-*•]\s*/, "").trim()).filter(Boolean).map((point, index) => <li key={index}>{point}</li>)}
        </ul>
      ) : (
        <p className={status === "error" ? "summary-error" : "summary-placeholder"}>
          {status === "loading"
            ? "Reading this page…"
            : error || "Create a short, focused summary of the current page."}
        </p>
      )}
      <button className="summary-button" onClick={summarizePage} disabled={status === "loading"}>
        {status === "loading" ? "Summarizing…" : summary ? "Summarize again" : "Summarize page"}
      </button>
    </aside>
  );
}

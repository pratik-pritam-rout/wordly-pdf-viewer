import React, { useEffect, useRef, useState } from "react";
export default function DefinitionPopover({
  word,
  status,
  meta,
  definitions,
  left,
  top,
  anchorTop,
}) {
  const ref = useRef(null),
    [position, setPosition] = useState({ left, top, below: false });
  useEffect(() => {
    const height = ref.current?.offsetHeight || 0,
      width = ref.current?.offsetWidth || 300,
      margin = 12,
      below = top + height > window.innerHeight - margin;
    setPosition({
      left: Math.min(Math.max(margin, left), window.innerWidth - width - margin),
      top: below ? Math.max(margin, anchorTop - height - 9) : top,
      below,
    });
  }, [left, top, anchorTop, status, definitions]);
  const message =
    status === "loading"
      ? "Looking up definitions…"
      : "Couldn’t load definitions. Please try again.";
  return (
    <aside
      ref={ref}
      className={`definition-popover ${position.below ? "below" : ""}`}
      style={{ left: position.left, top: position.top }}
      role="status"
    >
      <strong className="popover-word">{word}</strong>
      {meta && <div className="popover-meta">{meta}</div>}
      {status === "ready" ? (
        <ol className="definition-list">
          {definitions.slice(0, 3).map((item, index) => (
            <li key={`${item.partOfSpeech}-${index}`}>
              <span className="definition-part">{item.partOfSpeech}</span>
              {item.text}
            </li>
          ))}
        </ol>
      ) : (
        <span className={status === "error" ? "popover-error" : ""}>{message}</span>
      )}
    </aside>
  );
}

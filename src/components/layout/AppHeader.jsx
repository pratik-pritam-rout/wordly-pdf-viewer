import React from "react";
export default function AppHeader({ onFileOpen }) {
  return (
    <header className="topbar">
      <a className="brand" href="." aria-label="Wordly home">
        Wordly
      </a>
      <label className="upload-button">
        Open PDF
        <input type="file" accept="application/pdf,.pdf" onChange={onFileOpen} />
      </label>
    </header>
  );
}

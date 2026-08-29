import React from "react";
export default function Toast({ message }) {
  return (
    <div className="toast" role="alert">
      {message}
    </div>
  );
}

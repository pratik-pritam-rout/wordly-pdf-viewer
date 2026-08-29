export const cleanSelection = (text) =>
  text
    .trim()
    .replace(/\s+/g, " ")
    .replace(/^[^A-Za-z]+|[^A-Za-z' -]+$/g, "")
    .replaceAll("’", "'");

export const cleanSelection = (text) =>
  text
    .trim()
    .replace(/\s+/g, " ")
    .replace(/^[^A-Za-z]+|[^A-Za-z' -]+$/g, "")
    .replaceAll("’", "'");

const isWordCharacter = (character) => /[A-Za-z']/u.test(character || "");

export function snapRangeToWordBoundaries(range) {
  const { startContainer, endContainer } = range;
  if (startContainer.nodeType === Node.TEXT_NODE) {
    let offset = range.startOffset;
    while (offset > 0 && isWordCharacter(startContainer.textContent[offset - 1])) offset -= 1;
    range.setStart(startContainer, offset);
  }
  if (endContainer.nodeType === Node.TEXT_NODE && isWordCharacter(endContainer.textContent[range.endOffset - 1]) && isWordCharacter(endContainer.textContent[range.endOffset])) {
    let offset = range.endOffset;
    while (offset > 0 && isWordCharacter(endContainer.textContent[offset - 1])) offset -= 1;
    range.setEnd(endContainer, offset);
  }
}

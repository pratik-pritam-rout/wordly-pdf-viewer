const cache = new Map();
const primary = async (word, signal) => {
  const response = await fetch(
    `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`,
    { signal }
  );
  if (!response.ok) throw Error();
  const entry = (await response.json())[0];
  const definitions = entry?.meanings
    ?.flatMap((meaning) =>
      (meaning.definitions || []).map((item) => ({
        partOfSpeech: meaning.partOfSpeech,
        text: item.definition,
      }))
    )
    .filter((item) => item.text);
  if (!definitions?.length) throw Error();
  return {
    status: "ready",
    meta: entry.phonetic || entry.phonetics?.find((item) => item.text)?.text || "",
    definitions,
  };
};
const fallback = async (word, signal) => {
  const response = await fetch(
    `https://api.datamuse.com/words?sp=${encodeURIComponent(word)}&md=d`,
    { signal }
  );
  if (!response.ok) throw Error();
  const definitions = (await response.json())
    .flatMap((entry) => entry.defs || [])
    .map((definition) => {
      const [partOfSpeech, ...parts] = definition.split("\t");
      return {
        partOfSpeech: partOfSpeech || "",
        text: parts.join(" ") || definition,
      };
    })
    .filter((definition) => definition.text);
  if (!definitions.length) throw Error();
  return {
    status: "ready",
    meta: "",
    definitions,
  };
};
export async function lookupDefinitions(word) {
  if (cache.has(word)) return cache.get(word);
  const controller = new AbortController(),
    timeout = window.setTimeout(() => controller.abort(), 8000);
  try {
    const value = await Promise.any([
      primary(word, controller.signal),
      fallback(word, controller.signal),
    ]);
    cache.set(word, value);
    return value;
  } finally {
    window.clearTimeout(timeout);
  }
}
export const clearDefinitionCache = () => cache.clear();

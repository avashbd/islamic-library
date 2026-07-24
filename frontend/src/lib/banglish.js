// Simple phonetic (Avro-style) Banglish -> Bangla transliteration engine.
// Not a full Avro implementation, but covers everyday typing well enough
// for book/author names. Capital letters for T, Th, D, Dh, N, R, S select
// the retroflex/alternate sound, matching common Avro conventions.
//
// Usage: banglishToBangla("ma ma ma ebong baba") -> "মা মা মা এবং বাবা"

const CONSONANTS = [
  ["ksh", "ক্ষ"],
  ["gg", "জ্ঞ"],
  ["kh", "খ"],
  ["gh", "ঘ"],
  ["ng", "ঙ"],
  ["chh", "ছ"],
  ["ch", "চ"],
  ["jh", "ঝ"],
  ["Th", "ঠ"],
  ["Dh", "ঢ"],
  ["th", "থ"],
  ["dh", "ধ"],
  ["ph", "ফ"],
  ["bh", "ভ"],
  ["Rh", "ঢ়"],
  ["sh", "শ"],
  ["Sh", "ষ"],
  ["T", "ট"],
  ["D", "ড"],
  ["N", "ণ"],
  ["R", "ড়"],
  ["S", "ষ"],
  ["Y", "য"],
  ["k", "ক"],
  ["g", "গ"],
  ["c", "চ"],
  ["j", "জ"],
  ["z", "জ"],
  ["t", "ত"],
  ["d", "দ"],
  ["n", "ন"],
  ["p", "প"],
  ["f", "ফ"],
  ["b", "ব"],
  ["v", "ভ"],
  ["m", "ম"],
  ["r", "র"],
  ["l", "ল"],
  ["s", "স"],
  ["h", "হ"],
  ["y", "য়"],
  ["w", "ও"],
  ["x", "ক্স"],
  ["q", "ক"],
];

const VOWELS_INDEPENDENT = [
  ["rri", "ঋ"],
  ["oi", "ঐ"],
  ["ou", "ঔ"],
  ["aa", "আ"],
  ["ii", "ঈ"],
  ["I", "ঈ"],
  ["uu", "ঊ"],
  ["U", "ঊ"],
  ["a", "অ"],
  ["i", "ই"],
  ["u", "উ"],
  ["e", "এ"],
  ["o", "ও"],
];

const VOWELS_KAR = [
  ["rri", "ৃ"],
  ["oi", "ৈ"],
  ["ou", "ৌ"],
  ["aa", "া"],
  ["ii", "ী"],
  ["I", "ী"],
  ["uu", "ূ"],
  ["U", "ূ"],
  ["a", ""], // inherent vowel, no visible kar
  ["i", "ি"],
  ["u", "ু"],
  ["e", "ে"],
  ["o", "ো"],
];

// Sort by length desc so longer matches (e.g. "chh") win over shorter ("ch","c")
const CONSONANT_KEYS = CONSONANTS.map((p) => p[0]).sort((a, b) => b.length - a.length);
const VOWEL_KEYS = VOWELS_INDEPENDENT.map((p) => p[0]).sort((a, b) => b.length - a.length);

const consonantMap = Object.fromEntries(CONSONANTS);
const vowelIndMap = Object.fromEntries(VOWELS_INDEPENDENT);
const vowelKarMap = Object.fromEntries(VOWELS_KAR);

function matchAt(str, i, keys) {
  for (const key of keys) {
    if (str.startsWith(key, i)) return key;
  }
  return null;
}

function transliterateWord(word) {
  let out = "";
  let i = 0;
  let lastWasConsonant = false;

  while (i < word.length) {
    const cKey = matchAt(word, i, CONSONANT_KEYS);
    const vKey = !cKey ? matchAt(word, i, VOWEL_KEYS) : null;

    if (cKey) {
      if (lastWasConsonant) out += "\u09CD"; // hasant to form conjunct
      out += consonantMap[cKey];
      i += cKey.length;

      // Look for an immediately following vowel to attach as a kar sign
      const vAfter = matchAt(word, i, VOWEL_KEYS);
      if (vAfter) {
        out += vowelKarMap[vAfter];
        i += vAfter.length;
        lastWasConsonant = false;
      } else {
        lastWasConsonant = true;
      }
      continue;
    }

    if (vKey) {
      out += vowelIndMap[vKey];
      i += vKey.length;
      lastWasConsonant = false;
      continue;
    }

    // Bengali digits for 0-9, anusvara for trailing "ng" already handled,
    // pass through anything unrecognized (spaces, punctuation, existing Bangla)
    const digitMap = "0123456789";
    const bnDigits = "০১২৩৪৫৬৭৮৯";
    const dIdx = digitMap.indexOf(word[i]);
    out += dIdx !== -1 ? bnDigits[dIdx] : word[i];
    i += 1;
    lastWasConsonant = false;
  }

  return out;
}

export function banglishToBangla(text) {
  if (!text) return "";
  // If it already contains Bangla characters, leave as-is
  if (/[\u0980-\u09FF]/.test(text)) return text;
  return text
    .split(/(\s+)/)
    .map((chunk) => (/\s+/.test(chunk) ? chunk : transliterateWord(chunk)))
    .join("");
}

export function looksLikeBanglish(text) {
  return !!text && /^[a-zA-Z0-9\s.,'-]+$/.test(text);
}

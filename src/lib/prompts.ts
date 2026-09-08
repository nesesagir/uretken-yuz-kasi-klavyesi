import type { Locale } from "@/types";

export const DEFINITION_TR =
  "Minimum kullanıcı etkileşimiyle güvenilir Türkçe cümle üreten, kişiselleştirilebilir kavram odaklı web-AAC sistemi.";

export const DEFINITION_EN =
  "A personalizable concept-focused web AAC system that produces reliable sentences with minimum user interaction.";

/**
 * Grammar and role-fitting only — never unselected objects, people, or time.
 */
export const TR_SYSTEM_PROMPT = `Sen bir web-AAC (destekleyici ve alternatif iletişim) cümle üreticisisin.

Görevin: seçilen anahtar kelimeleri, Türkçenin sondan eklemeli yapısına uygun, doğal ve dilbilgisi doğru TEK bir cümleye çevirmek.

Kelimeleri yan yana dizip sonuna "istiyorum" eklemek YASAKTIR. Her kelimenin dildeki rolüne göre çekimle:
- Durum: Ağrı → Ağrım var. Uyku → Uyumak istiyorum.
- İstek / nesne: Su, yemek, TV → … istiyorum. TV yazılırsa televizyon de.
- Sıfat+nesne: Soğuk + Su → Soğuk su istiyorum.
- Çağrı: Gel, Bekle, Yardım, Teşekkür kendi fiil/kalıbıyla.
- Karışık roller tek cümlede birleşir: "Ağrım var; yemek, su ve televizyon istiyorum."

Katı sadakat:
Seçilmeyen nesne, kişi, yer, duygu, zaman veya kibarlık ekleme (lütfen, bir bardak, şimdi, canım acıyor YASAK). Yalnızca verilen kelimeler + dilbilgisi.

Zorunlu biçim:
- Yalnızca JSON: {"sentence":"..."}
- Markdown, açıklama, emoji, ikinci cümle YASAKTIR.

Örnekler:
- Su, Soğuk → {"sentence":"Soğuk su istiyorum."}
- Ağrı → {"sentence":"Ağrım var."}
- Ağrı, Yemek, Su, TV → {"sentence":"Ağrım var; yemek, su ve televizyon istiyorum."}
- Temizlik → {"sentence":"Temizlik istiyorum."}
- Gel → {"sentence":"Gel."}
- Teşekkür → {"sentence":"Teşekkür ederim."}`;

export const EN_SYSTEM_PROMPT = `You are a web-AAC sentence generator.

Turn the keywords into ONE natural, grammatical sentence. Do not dump nouns in a list and append "I want".
Fit each word's role: pain → I am in pain; food/water/TV → I want …; TV may be written television; cold + water → I want cold water.
Mix roles in one sentence if needed: "I am in pain; I want food, water, and television."

Fidelity: do not invent objects, people, emotion, or time the user did not select (no please, a glass, now). Grammar only beyond the keywords.
Output only JSON: {"sentence":"..."}. No markdown, no second sentence, no commentary.`;

export function userPrompt(keywords: string[], locale: Locale): string {
  const joined = keywords.join(", ");
  if (locale === "tr") {
    return `Anahtar kelimeler (yalnızca bunlar): ${joined}\nTek JSON nesnesi döndür. Kelimeleri ham halde yan yana dizme.`;
  }
  return `Keywords (only these): ${joined}\nReturn a single JSON object. Do not concatenate the words as a raw list.`;
}

const WANT_TR: Record<string, string> = {
  TV: "televizyon",
  Tv: "televizyon",
};

const STATE_TR: Record<string, string> = {
  Ağrı: "ağrım var",
};

const PHRASE_TR: Record<string, string> = {
  Evet: "Evet.",
  Hayır: "Hayır.",
  Teşekkür: "Teşekkür ederim.",
  Gel: "Gel.",
  Bekle: "Bekle.",
  Yardım: "Yardım istiyorum.",
  Tuvalet: "Tuvalete gitmek istiyorum.",
  Temizlik: "Temizlik istiyorum.",
  Uyku: "Uyumak istiyorum.",
};

const PHRASE_EN: Record<string, string> = {
  Yes: "Yes.",
  No: "No.",
  Thanks: "Thank you.",
  Come: "Come here.",
  Wait: "Wait.",
  Help: "I need help.",
  Toilet: "I need the toilet.",
  Hygiene: "I need to wash.",
  Sleep: "I want to sleep.",
  Pain: "I am in pain.",
};

function joinTrList(items: string[]): string {
  if (items.length === 1) return items[0] ?? "";
  const head = items.slice(0, -1).join(", ");
  const tail = items[items.length - 1];
  return `${head} ve ${tail}`;
}

function joinEnList(items: string[]): string {
  if (items.length === 1) return items[0] ?? "";
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

export function localFallback(keywords: string[], locale: Locale): string {
  const compact = keywords.map((word) => word.trim()).filter(Boolean);
  if (compact.length === 0) {
    return locale === "tr" ? "Yardım istiyorum." : "I want help.";
  }

  if (locale === "tr") {
    if (compact.length === 1 && PHRASE_TR[compact[0] ?? ""]) {
      return PHRASE_TR[compact[0] ?? ""] ?? "";
    }
    if (compact.length === 2) {
      const pair = new Set(compact);
      if (pair.has("Su") && pair.has("Soğuk")) return "Soğuk su istiyorum.";
      if (pair.has("Su") && pair.has("Sıcak")) return "Sıcak su istiyorum.";
    }

    const states: string[] = [];
    const wants: string[] = [];
    const standalone: string[] = [];

    for (const word of compact) {
      if (STATE_TR[word]) {
        states.push(STATE_TR[word] ?? word);
      } else if (word === "Yardım" || word === "Tuvalet" || word === "Uyku" || word === "Temizlik") {
        wants.push(
          word === "Yardım"
            ? "yardım"
            : word === "Tuvalet"
              ? "tuvalet"
              : word === "Uyku"
                ? "uyumak"
                : "temizlik",
        );
      } else if (PHRASE_TR[word]) {
        standalone.push(PHRASE_TR[word] ?? word);
      } else {
        wants.push((WANT_TR[word] ?? word).toLocaleLowerCase("tr-TR"));
      }
    }

    if (!states.length && !wants.length && standalone.length) {
      return standalone.map((item) => (item.endsWith(".") ? item : `${item}.`)).join(" ");
    }

    const parts: string[] = [];
    if (states.length) parts.push(states.join(" ve "));
    if (wants.length) {
      const sleep = wants.includes("uyumak");
      const rest = wants.filter((item) => item !== "uyumak");
      if (sleep && !rest.length) parts.push("uyumak istiyorum");
      else if (sleep) parts.push(`${joinTrList(rest)} ve uyumak istiyorum`);
      else parts.push(`${joinTrList(wants)} istiyorum`);
    }
    if (standalone.length) {
      parts.push(
        standalone
          .map((item) => item.replace(/\.$/, ""))
          .join(" ve "),
      );
    }
    if (!parts.length) return `${joinTrList(compact)} istiyorum.`;
    const sentence = parts.join("; ");
    return sentence.endsWith(".") ? sentence : `${sentence}.`;
  }

  if (compact.length === 1 && PHRASE_EN[compact[0] ?? ""]) {
    return PHRASE_EN[compact[0] ?? ""] ?? "";
  }

  const states: string[] = [];
  const wants: string[] = [];
  for (const word of compact) {
    if (word === "Pain") {
      states.push("I am in pain");
      continue;
    }
    if (word === "Help") {
      wants.push("help");
      continue;
    }
    if (word === "Hygiene") {
      wants.push("to wash");
      continue;
    }
    if (PHRASE_EN[word] && word !== "Toilet" && word !== "Sleep") {
      continue;
    }
    wants.push(word === "TV" ? "television" : word.toLowerCase());
  }
  if (compact.length === 2) {
    const lower = compact.map((word) => word.toLowerCase());
    if (lower.includes("cold") && lower.includes("water")) return "I want cold water.";
    if (lower.includes("hot") && lower.includes("water")) return "I want hot water.";
  }
  if (states.length && wants.length) {
    return `${states[0]}; I want ${joinEnList(wants)}.`;
  }
  if (states.length) return `${states[0]}.`;
  if (wants.length === 1) return `I want ${wants[0]}.`;
  if (wants.length) return `I want ${joinEnList(wants)}.`;
  return `I want ${compact.map((word) => word.toLowerCase()).join(" and ")}.`;
}

export const SENTENCE_JSON_SCHEMA = {
  name: "aac_sentence",
  strict: true as const,
  schema: {
    type: "object",
    properties: {
      sentence: { type: "string" },
    },
    required: ["sentence"],
    additionalProperties: false,
  },
};

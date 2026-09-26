import type { Locale } from "../../src/lib/receptionist/protocol.js";

const PT_WORDS = new Set(
  (
    "olá ola obrigado obrigada bom dia boa tarde noite dente dentes dor consulta marcar marcação quero gostaria " +
    "preciso tenho não nao sim você voce vocês qual quanto quanta custa custam horário horario clínica clinica " +
    "branqueamento implante implantes aparelho urgência urgencia amanhã amanha segunda terça terca quarta quinta " +
    "sexta sábado sabado manhã manha meu minha nome está esta estou para com uma por favor pode podem como onde " +
    "quando também tambem ajuda falar receção rececao recepção inchaço inchado gengiva sangue dói doi muito"
  ).split(" "),
);

const EN_WORDS = new Set(
  (
    "hello hi hey thanks thank the i my me is are am want would like need have tooth teeth pain appointment book " +
    "booking how what when where much do does you your can could please yes morning afternoon evening tomorrow " +
    "monday tuesday wednesday thursday friday saturday name it this that with for and help talk speak whitening " +
    "implants braces swelling bleeding hurts"
  ).split(" "),
);

/**
 * Best-effort English/Portuguese detection for a single message. Returns `fallback`
 * (the conversation's current language) when the message gives no clear signal, e.g. "ok" or a phone number.
 */
export function detectLocale(text: string, fallback: Locale = "en"): Locale {
  const words = text.toLowerCase().match(/[\p{L}']+/gu) ?? [];
  let pt = /[ãõçâêô]/i.test(text) ? 2 : 0;
  let en = 0;
  for (const word of words) {
    if (PT_WORDS.has(word)) pt += 1;
    if (EN_WORDS.has(word)) en += 1;
  }
  if (pt > en) return "pt";
  if (en > pt) return "en";
  return fallback;
}

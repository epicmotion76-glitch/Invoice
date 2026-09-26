import { describe, expect, it } from "vitest";
import { assessSafety, emergencyGuidance } from "../../server/receptionist/safety";

const SCREENING_QUESTION =
  "I'm sorry you're dealing with that. Is the pain accompanied by significant facial swelling, heavy bleeding, or difficulty breathing or swallowing?";

describe("assessSafety", () => {
  it.each([
    "My face is swelling and I'm having trouble swallowing.",
    "I can't breathe properly since my tooth was pulled",
    "The swelling is spreading to my eye",
    "my gums are bleeding heavily and it won't stop",
    "Bleeding won't stop after extraction",
    "I fainted after the pain got worse",
    "I was in a car accident and my jaw is broken",
    "Swollen face and a high fever",
    "My face is swollen and getting bigger",
    "not sure but I can't breathe well",
  ])("flags an emergency: %s", (message) => {
    expect(assessSafety(message).level).toBe("emergency");
  });

  it.each([
    "Tenho a cara inchada e dificuldade em engolir",
    "Não consigo respirar bem",
    "O inchaço está a aumentar muito rápido",
    "Estou a sangrar muito e o sangue não pára",
    "Desmaiei com a dor",
  ])("flags a Portuguese emergency: %s", (message) => {
    expect(assessSafety(message).level).toBe("emergency");
  });

  it.each(["My tooth hurts", "I have a toothache when I drink cold water", "Tenho dor de dentes", "I want whiter teeth"])(
    "does not treat ordinary messages as emergencies: %s",
    (message) => {
      expect(assessSafety(message).level).not.toBe("emergency");
    },
  );

  it("marks urgent dental problems as urgent, not emergency", () => {
    expect(assessSafety("I have severe pain and a broken tooth").level).toBe("urgent");
    expect(assessSafety("There's some swelling around the tooth").level).toBe("urgent");
    expect(assessSafety("Tenho uma dor muito forte").level).toBe("urgent");
  });

  it("ignores negated red flags", () => {
    expect(assessSafety("No, there's no swelling or difficulty breathing, just pain").level).not.toBe("emergency");
    expect(assessSafety("Não tenho dificuldade em respirar").level).not.toBe("emergency");
  });

  it("treats a plain yes to the red-flag screening question as an emergency", () => {
    expect(assessSafety("Yes", SCREENING_QUESTION).level).toBe("emergency");
    expect(assessSafety("sim", SCREENING_QUESTION).level).toBe("emergency");
    expect(assessSafety("No, none of those", SCREENING_QUESTION).level).toBe("none");
    expect(assessSafety("Yes please", "Would you like to book an appointment?").level).toBe("none");
  });

  it("gives emergency-services guidance in the visitor's language", () => {
    expect(emergencyGuidance("en")).toMatch(/call 112/);
    expect(emergencyGuidance("en")).not.toMatch(/\bbook|request an appointment/i);
    expect(emergencyGuidance("pt")).toMatch(/ligue já para o 112/);
  });
});

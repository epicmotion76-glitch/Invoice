import { useLayoutEffect, useState, type FormEvent, type KeyboardEvent, type RefObject } from "react";
import { SendHorizontal, ShieldCheck } from "lucide-react";
import { CHAT_LIMITS, type Locale } from "../../lib/receptionist/protocol";
import { uiStrings } from "./i18n";

type ChatInputProps = {
  locale: Locale;
  sending: boolean;
  onSend: (text: string) => boolean;
  inputRef: RefObject<HTMLTextAreaElement | null>;
};

const MAX_HEIGHT = 128;

export function ChatInput({ locale, sending, onSend, inputRef }: ChatInputProps) {
  const t = uiStrings[locale];
  const [value, setValue] = useState("");
  const remaining = CHAT_LIMITS.messageLength - value.length;
  const canSend = value.trim().length > 0 && !sending;

  // Grow with the text, up to about five lines.
  useLayoutEffect(() => {
    const input = inputRef.current;
    if (!input) return;
    input.style.height = "auto";
    input.style.height = `${Math.min(input.scrollHeight, MAX_HEIGHT)}px`;
  }, [value, inputRef]);

  const submit = () => {
    if (canSend && onSend(value)) setValue("");
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    submit();
  };

  // Enter sends, Shift+Enter adds a new line. Ignore Enter while an IME is composing text.
  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      submit();
    }
  };

  return (
    <form className="ai-chat__composer" onSubmit={onSubmit}>
      <div className="ai-input">
        <label htmlFor="ai-chat-input" className="sr-only">
          {t.inputLabel}
        </label>
        <textarea
          ref={inputRef}
          id="ai-chat-input"
          className="ai-input__field"
          rows={1}
          maxLength={CHAT_LIMITS.messageLength}
          placeholder={t.placeholder}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={onKeyDown}
          aria-describedby="ai-chat-privacy"
          autoComplete="off"
          enterKeyHint="send"
        />
        <button type="submit" className="ai-input__send" disabled={!canSend} aria-label={t.send} title={t.send}>
          <SendHorizontal aria-hidden="true" />
        </button>
      </div>
      {remaining < 150 && (
        <p className="ai-input__counter" aria-live="polite">
          {t.charactersLeft(remaining)}
        </p>
      )}
      <p id="ai-chat-privacy" className="ai-chat__privacy">
        <ShieldCheck aria-hidden="true" />
        {t.privacy}
      </p>
    </form>
  );
}

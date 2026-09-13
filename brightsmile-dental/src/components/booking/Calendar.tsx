import { useEffect, useRef, useState, useSyncExternalStore, type KeyboardEvent, type Ref } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { bookingWindow, isClosedDay, parseISODate, toISODate } from "../appointment/validation";
import "./Calendar.css";

type CalendarProps = {
  /** Selected date as YYYY-MM-DD, or "" for none. */
  value: string;
  onChange: (isoDate: string) => void;
  labelledBy: string;
  describedBy?: string;
  invalid?: boolean;
  /** Receives the day button that currently takes keyboard focus. */
  focusRef?: Ref<HTMLButtonElement>;
};

const WEEKDAYS = [
  ["Mon", "Monday"],
  ["Tue", "Tuesday"],
  ["Wed", "Wednesday"],
  ["Thu", "Thursday"],
  ["Fri", "Friday"],
  ["Sat", "Saturday"],
  ["Sun", "Sunday"],
] as const;

const monthFormat = new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric" });
const dayFormat = new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

const startOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1);
const addDays = (date: Date, days: number) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
const sameMonth = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
const mondayIndex = (date: Date) => (date.getDay() + 6) % 7;

function addMonths(date: Date, months: number) {
  const target = new Date(date.getFullYear(), date.getMonth() + months, 1);
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  return new Date(target.getFullYear(), target.getMonth(), Math.min(date.getDate(), lastDay));
}

function weeksOf(month: Date) {
  const cells: (Date | null)[] = Array.from({ length: mondayIndex(month) }, () => null);
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  for (let day = 1; day <= daysInMonth; day++) cells.push(new Date(month.getFullYear(), month.getMonth(), day));
  while (cells.length % 7) cells.push(null);
  return Array.from({ length: cells.length / 7 }, (_, week) => cells.slice(week * 7, week * 7 + 7));
}

const noopSubscribe = () => () => {};

/**
 * Month-view date picker for appointment requests. Past days, Sundays and dates
 * beyond the booking window can't be chosen. Arrow keys move by day/week,
 * Home/End to the week's start/end, PageUp/PageDown by month.
 */
export function Calendar(props: CalendarProps) {
  // "Today" comes from the visitor's clock, so the grid renders only in the browser.
  const isClient = useSyncExternalStore(noopSubscribe, () => true, () => false);
  if (!isClient) return <div className="calendar calendar--placeholder" aria-hidden="true" />;
  return <CalendarGrid {...props} />;
}

function CalendarGrid({ value, onChange, labelledBy, describedBy, invalid, focusRef }: CalendarProps) {
  const [{ start: today, end }] = useState(() => bookingWindow());
  const isUnavailable = (date: Date) => date < today || date > end || isClosedDay(date);
  const clamp = (date: Date) => (date < today ? today : date > end ? end : date);

  const [initialDate] = useState(() => {
    const selected = parseISODate(value);
    if (selected) return selected;
    let date = today;
    while (isUnavailable(date) && date < end) date = addDays(date, 1);
    return date;
  });
  const [active, setActive] = useState(initialDate);
  const [view, setView] = useState(() => startOfMonth(initialDate));
  const gridRef = useRef<HTMLTableElement>(null);
  const shouldFocus = useRef(false);
  const monthId = `${labelledBy}-month`;

  // Follow the selected date if it changes from outside.
  useEffect(() => {
    const selected = parseISODate(value);
    if (selected) {
      setActive(selected);
      setView(startOfMonth(selected));
    }
  }, [value]);

  useEffect(() => {
    if (!shouldFocus.current) return;
    shouldFocus.current = false;
    gridRef.current?.querySelector<HTMLButtonElement>(`[data-date="${toISODate(active)}"]`)?.focus();
  }, [active, view]);

  const weeks = weeksOf(view);
  const days = weeks.flat().filter((day): day is Date => day !== null);
  const tabbable =
    (sameMonth(active, view) && active) ||
    days.find((day) => !isUnavailable(day)) ||
    days.find((day) => day >= today && day <= end) ||
    days[0];
  const tabbableIso = toISODate(tabbable);

  const moveTo = (target: Date, from: Date) => {
    const next = clamp(target);
    if (toISODate(next) === toISODate(from)) return;
    shouldFocus.current = true;
    setActive(next);
    if (!sameMonth(next, view)) setView(startOfMonth(next));
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTableElement>) => {
    const current = parseISODate((event.target as HTMLElement).dataset.date ?? "");
    if (!current) return;

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      select(current);
      return;
    }

    const targets: Record<string, () => Date> = {
      ArrowLeft: () => addDays(current, -1),
      ArrowRight: () => addDays(current, 1),
      ArrowUp: () => addDays(current, -7),
      ArrowDown: () => addDays(current, 7),
      Home: () => addDays(current, -mondayIndex(current)),
      End: () => addDays(current, 6 - mondayIndex(current)),
      PageUp: () => addMonths(current, event.shiftKey ? -12 : -1),
      PageDown: () => addMonths(current, event.shiftKey ? 12 : 1),
    };
    if (!(event.key in targets)) return;

    event.preventDefault();
    event.stopPropagation();
    moveTo(targets[event.key](), current);
  };

  const select = (date: Date) => {
    if (isUnavailable(date)) return;
    setActive(date);
    onChange(toISODate(date));
  };

  const canGoBack = view > startOfMonth(today);
  const canGoForward = view < startOfMonth(end);

  return (
    <div
      className={`calendar${invalid ? " is-invalid" : ""}`}
      role="group"
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
    >
      <div className="calendar__header">
        <button
          type="button"
          className="calendar__nav"
          onClick={() => setView((month) => addMonths(month, -1))}
          disabled={!canGoBack}
          aria-label="Previous month"
        >
          <ChevronLeft aria-hidden="true" />
        </button>
        <p id={monthId} className="calendar__month" aria-live="polite">
          {monthFormat.format(view)}
        </p>
        <button
          type="button"
          className="calendar__nav"
          onClick={() => setView((month) => addMonths(month, 1))}
          disabled={!canGoForward}
          aria-label="Next month"
        >
          <ChevronRight aria-hidden="true" />
        </button>
      </div>

      <table ref={gridRef} className="calendar__grid" role="grid" aria-labelledby={monthId} onKeyDown={onKeyDown}>
        <thead>
          <tr>
            {WEEKDAYS.map(([short, long]) => (
              <th key={short} scope="col" abbr={long}>
                {short}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {weeks.map((week, weekIndex) => (
            <tr key={weekIndex}>
              {week.map((day, dayIndex) => {
                if (!day) return <td key={`empty-${dayIndex}`} role="gridcell" />;

                const iso = toISODate(day);
                const selected = iso === value;
                const closed = isClosedDay(day);
                const unavailable = isUnavailable(day);
                const isToday = iso === toISODate(today);
                const className = [
                  "calendar__day",
                  selected && "is-selected",
                  isToday && "is-today",
                  closed && "is-closed",
                ]
                  .filter(Boolean)
                  .join(" ");

                return (
                  <td key={iso} role="gridcell" aria-selected={selected}>
                    <button
                      ref={iso === tabbableIso ? focusRef : undefined}
                      type="button"
                      className={className}
                      data-date={iso}
                      tabIndex={iso === tabbableIso ? 0 : -1}
                      aria-disabled={unavailable || undefined}
                      aria-current={isToday ? "date" : undefined}
                      aria-label={`${dayFormat.format(day)}${closed ? ", closed" : unavailable ? ", unavailable" : ""}`}
                      onClick={() => select(day)}
                    >
                      {day.getDate()}
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      <p className="calendar__legend">
        <span className="calendar__legend-dot" aria-hidden="true" />
        Today
        <span aria-hidden="true">·</span>
        Closed on Sundays
      </p>
    </div>
  );
}

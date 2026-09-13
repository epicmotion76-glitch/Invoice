import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import type { TreatmentValue } from "../../content/site";

type TreatmentRequest = { value: TreatmentValue; id: number };

type AppointmentContextValue = {
  /** The most recent treatment a visitor picked elsewhere on the page (e.g. a service card). */
  requestedTreatment: TreatmentRequest | null;
  requestTreatment: (value: TreatmentValue) => void;
  /** Whether the "Book Your Visit" booking dialog is open. */
  bookingOpen: boolean;
  openBooking: () => void;
  closeBooking: () => void;
};

const AppointmentContext = createContext<AppointmentContextValue | null>(null);

export function AppointmentProvider({ children }: { children: ReactNode }) {
  const [requestedTreatment, setRequestedTreatment] = useState<TreatmentRequest | null>(null);
  const [bookingOpen, setBookingOpen] = useState(false);

  const requestTreatment = useCallback((value: TreatmentValue) => {
    setRequestedTreatment((previous) => ({ value, id: (previous?.id ?? 0) + 1 }));
  }, []);
  const openBooking = useCallback(() => setBookingOpen(true), []);
  const closeBooking = useCallback(() => setBookingOpen(false), []);

  const value = useMemo(
    () => ({ requestedTreatment, requestTreatment, bookingOpen, openBooking, closeBooking }),
    [requestedTreatment, requestTreatment, bookingOpen, openBooking, closeBooking],
  );

  return <AppointmentContext.Provider value={value}>{children}</AppointmentContext.Provider>;
}

export function useAppointment() {
  const context = useContext(AppointmentContext);
  if (!context) throw new Error("useAppointment must be used inside <AppointmentProvider>");
  return context;
}

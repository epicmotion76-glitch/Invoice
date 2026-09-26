import { LazyMotion, MotionConfig } from "motion/react";
import { AiReceptionist } from "./components/ai-receptionist/AiReceptionist";
import { AppointmentProvider } from "./components/appointment/AppointmentContext";
import { Appointment } from "./components/appointment/Appointment";
import { BookingDialog } from "./components/booking/BookingDialog";
import { FinalCta } from "./components/sections/FinalCta";
import { Footer } from "./components/layout/Footer";
import { Header } from "./components/layout/Header";
import { MobileCtaBar } from "./components/layout/MobileCtaBar";
import { Hero } from "./components/sections/Hero";
import { Services } from "./components/sections/Services";
import { SmileGallery } from "./components/gallery/SmileGallery";
import { Testimonials } from "./components/sections/Testimonials";
import { TrustStrip } from "./components/sections/TrustStrip";
import { WhyUs } from "./components/sections/WhyUs";

const loadMotionFeatures = () => import("./lib/motionFeatures").then((module) => module.default);

export default function App() {
  return (
    <LazyMotion features={loadMotionFeatures} strict>
      <MotionConfig reducedMotion="user">
        <AppointmentProvider>
          <a className="skip-link" href="#main">
            Skip to main content
          </a>
          <Header />
          <main id="main" tabIndex={-1}>
            <Hero />
            <TrustStrip />
            <Services />
            <WhyUs />
            <SmileGallery />
            <Testimonials />
            <Appointment />
            <FinalCta />
          </main>
          <Footer />
          <MobileCtaBar />
          <BookingDialog />
          <AiReceptionist />
        </AppointmentProvider>
      </MotionConfig>
    </LazyMotion>
  );
}

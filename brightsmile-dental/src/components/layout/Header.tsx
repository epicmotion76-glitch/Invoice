import { useEffect, useRef, useState, type FocusEvent } from "react";
import { ArrowRight, Menu, Phone, X } from "lucide-react";
import { clinic, navLinks } from "../../content/site";
import { useScrollSpy } from "../../hooks/useScrollSpy";
import { BookVisitLink } from "../ui/BookVisitLink";
import { Logo } from "../ui/Logo";
import "./Header.css";

const sectionIds = navLinks.map((link) => link.id);

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const activeId = useScrollSpy(sectionIds);
  const toggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;

    const root = document.documentElement;
    const desktop = window.matchMedia("(min-width: 1080px)");
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        toggleRef.current?.focus();
      }
    };
    const onBreakpointChange = () => {
      if (desktop.matches) setMenuOpen(false);
    };

    root.classList.add("menu-open");
    document.addEventListener("keydown", onKeyDown);
    desktop.addEventListener("change", onBreakpointChange);
    return () => {
      root.classList.remove("menu-open");
      document.removeEventListener("keydown", onKeyDown);
      desktop.removeEventListener("change", onBreakpointChange);
    };
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);

  // Close the mobile menu when keyboard focus moves past it.
  const onHeaderBlur = (event: FocusEvent<HTMLElement>) => {
    if (menuOpen && !event.currentTarget.contains(event.relatedTarget as Node | null)) {
      setMenuOpen(false);
    }
  };

  return (
    <header
      className={`site-header${scrolled ? " is-scrolled" : ""}${menuOpen ? " is-open" : ""}`}
      onBlur={onHeaderBlur}
    >
      <div className="container site-header__inner">
        <Logo />

        <nav className="site-nav" aria-label="Primary">
          <ul className="site-nav__list">
            {navLinks.map((link) => (
              <li key={link.id}>
                <a
                  className="site-nav__link"
                  href={`#${link.id}`}
                  aria-current={activeId === link.id ? "location" : undefined}
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="site-header__actions">
          <BookVisitLink className="btn btn--primary btn--sm site-header__cta">
            <span className="site-header__cta-full">Book Your Visit</span>
            <span className="site-header__cta-short">Book</span>
          </BookVisitLink>
          <button
            ref={toggleRef}
            type="button"
            className="menu-toggle"
            aria-label="Menu"
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
          </button>
        </div>
      </div>

      <div id="mobile-menu" className="mobile-menu" hidden={!menuOpen}>
        <div className="mobile-menu__backdrop" aria-hidden="true" onClick={closeMenu} />
        <nav className="mobile-menu__panel container" aria-label="Mobile">
          <div className="mobile-menu__sheet">
            <ul className="mobile-menu__list">
              {navLinks.map((link) => (
                <li key={link.id}>
                  <a
                    href={`#${link.id}`}
                    onClick={closeMenu}
                    aria-current={activeId === link.id ? "location" : undefined}
                  >
                    {link.label}
                    <ArrowRight aria-hidden="true" />
                  </a>
                </li>
              ))}
            </ul>
            <div className="mobile-menu__actions">
              <BookVisitLink className="btn btn--primary btn--lg btn--block" onClick={closeMenu} />
              <a className="btn btn--secondary btn--lg btn--block" href={clinic.phone.href}>
                <Phone aria-hidden="true" />
                Call {clinic.phone.display}
              </a>
            </div>
          </div>
        </nav>
      </div>
    </header>
  );
}

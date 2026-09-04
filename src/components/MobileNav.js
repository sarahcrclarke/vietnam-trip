"use client";

import { useEffect, useRef } from "react";
import { CloseIcon } from "./icons";

// `tab` is the value passed to onTabChange for the two wired items;
// `null` means the item stays inert, same as before.
const NAV_ITEMS = [
  { label: "ITINERARY", tab: "itinerary" },
  { label: "VOTES", tab: "votes" },
  { label: "MAP", tab: "map" },
  { label: "PHOTOS", tab: null },
  { label: "INFO", tab: null },
];

export default function MobileNav({ open, onClose, activeTab, onTabChange }) {
  const panelRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) onClose();
    };
    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  return (
    <>
      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/20"
          aria-hidden="true"
          onClick={onClose}
        />
      )}

      {/* Navigation panel */}
      {open && (
        <div
          ref={panelRef}
          className="fixed right-0 top-0 z-40 h-screen max-w-xs w-full bg-background border-l border-border overflow-y-auto"
        >
          <div className="flex items-center justify-between gap-4 border-b border-border px-4 py-4">
            <span className="font-sans text-xs font-semibold uppercase tracking-widest text-muted">
              Menu
            </span>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close menu"
              className="text-stone/50 transition-colors hover:text-forest"
            >
              <CloseIcon className="h-5 w-5" />
            </button>
          </div>

          <nav className="space-y-0">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.label}
                onClick={() => {
                  if (item.tab) onTabChange(item.tab);
                  onClose();
                }}
                className={`block w-full text-left px-4 py-3 font-sans text-sm text-forest border-b border-border/40 transition-colors hover:bg-stone/[0.03] ${
                  item.tab && activeTab === item.tab ? "font-semibold" : ""
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </div>
      )}
    </>
  );
}

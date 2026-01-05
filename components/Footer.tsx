// components/Footer.tsx
"use client";

/**
 * Footer component
 * Displays copyright information, credits, and links.
 */
export default function Footer() {
  return (
    <footer className="bg-gov-gray border-t-4 border-gov-blueLight mt-auto pt-6 pb-6">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-row justify-between items-end flex-wrap gap-4">
          {/* Left Section */}
          <div>
            <p className="text-gray-600 text-sm">
              © Copyright 2026 - Υλοποίηση από{" "}
              <a
                href="https://gioiliop.eu"
                target="_blank"
                rel="noreferrer noopener"
                aria-label="Giorgos Iliopoulos (ανοίγει σε καινούρια καρτέλα)"
                className="govgr-link"
              >
                Giorgos Iliopoulos
              </a>
              <br />
              <span className="text-sm text-gray-500 mt-2 block">
                Δεδομένα από το Σύστημα Διαχείρισης Ανθρώπινου Δυναμικού
                (ΣΔΑΔ)
              </span>
            </p>
            <p className="italic text-xs text-gray-500 mt-2">
              *Η σελίδα αποτελεί προσωπικό project και δεν είναι επίσημη
              πλατφόρμα του gov.gr
            </p>
            <p className="italic text-xs text-gray-500 mt-2">
              **Τα αγαπημένα δεν αποθηκεύονται σε κάποια βάση δεδομένων,
              παρα μόνο μόνο τοπικά στον υπολογστή σας μέσω του localStorage
            </p>
          </div>

          {/* Right Section */}
          <div>
            <p>Inspired by gov.gr look and feel</p>
            <a
              href="https://guide.services.gov.gr/"
              target="_blank"
              rel="noreferrer noopener"
              className="govgr-link"
              aria-label="Οδηγός Σχεδίασης Υπηρεσιών (ανοίγει σε καινούρια καρτέλα)"
            >
              Δείτε περισσότερα εδώ
            </a>
          </div>

        </div>
      </div>
    </footer>
  );
}   


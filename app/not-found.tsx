// app/not-found.tsx
"use client";

/**
 * NotFound component
 * Displays a user-friendly 404 error message.
 */
export default function NotFound() {
  return (
    <div className="flex flex-col items-center py-24">
      <h1 className="text-4xl font-bold text-gov-blue mb-2">404</h1>
      <p className="text-lg text-gray-700 mb-4">
        Η σελίδα δεν βρέθηκε ή δεν υπάρχει.
      </p>
      <a
        href="/"
        className="px-4 py-2 bg-gov-blue text-white rounded-lg hover:bg-gov-cyan transition-colors"
      >
        Επιστροφή στην αρχική
      </a>
    </div>
  );
}
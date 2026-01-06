// app/not-found.tsx
"use client";

import Link from "next/link";
import { Home} from "lucide-react";

/**
 * NotFound component
 * Displays a user-friendly 404 error message with navigation options.
 */
export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="max-w-2xl w-full text-center">
        {/* Error Code */}
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-gov-blue/20 mb-2">404</h1>
          <div className="h-1 w-24 bg-gov-blue mx-auto rounded-full"></div>
        </div>

        {/* Error Message */}
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Η σελίδα δεν βρέθηκε
        </h2>
        <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto">
          Η σελίδα που αναζητάτε δεν υπάρχει, έχει μετακινηθεί ή δεν είναι πλέον
          διαθέσιμη.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link
            href="/"
            className="flex items-center gap-2 px-6 py-3 bg-gov-blue text-white rounded-lg hover:bg-gov-cyan transition-all duration-200 shadow-md hover:shadow-lg font-medium"
          >
            <Home size={20} />
            Επιστροφή στην αρχική
          </Link>
        </div>
      </div>
    </div>
  );
}

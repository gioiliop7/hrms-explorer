import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import "./globals.css";

// Configure Roboto font with Greek subset support
const roboto = Roboto({
  weight: ["300", "400", "500", "700"],
  subsets: ["latin", "greek"],
  variable: "--font-roboto",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    template: "%s | Gov.gr",
    default: "ΣΔΑΔ Explorer | Gov.gr", // SDAD Explorer
  },
  description:
    "Εξερευνητής Οργανογραμμάτων & Θέσεων του Συστήματος Διαχείρισης Ανθρώπινου Δυναμικού (ΣΔΑΔ).",
  keywords: [
    "ΣΔΑΔ",
    "Gov.gr",
    "Δημόσιο",
    "Οργανόγραμμα",
    "Θέσεις Εργασίας",
    "Υπουργείο Ψηφιακής Διακυβέρνησης",
    "APOGRAFI",
    "HRMS",
  ],
  authors: [
    { name: "Υπουργείο Ψηφιακής Διακυβέρνησης", url: "https://mindigital.gr" },
  ],
  creator: "Ministry of Digital Governance",
  publisher: "Hellenic Republic",
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    // Standard gov.gr favicon pattern usually involves the blue cross or shield
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    type: "website",
    locale: "el_GR",
    url: "https://hrmsgov.gioiliop.eur",
    title: "ΣΔΑΔ Explorer",
    description:
      "Διαδραστική απεικόνιση της οργανωτικής δομής και των θέσεων του Δημοσίου Τομέα.",
    siteName: "Gov.gr Services",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="el">
      <body
        className={`${roboto.variable} font-sans antialiased bg-gray-50 text-[#1a1a1a]`}
      >
        {children}
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import { FavoritesProvider } from "@/lib/FavoritesContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
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
    template: "%s",
    default: "ΣΔΑΔ Explorer", // SDAD Explorer
  },
  description:
    "Εξερευνητής Οργανογραμμάτων & Θέσεων του Συστήματος Διαχείρισης Ανθρώπινου Δυναμικού (ΣΔΑΔ).",
  keywords: [
    "ΣΔΑΔ",
    "Δημόσιο",
    "Οργανόγραμμα",
    "Θέσεις Εργασίας",
    "Υπουργείο Ψηφιακής Διακυβέρνησης",
    "APOGRAFI",
    "HRMS",
  ],
  authors: [
    { name: "Giorgos Iliopoulos", url: "https://gioiliop.eu" },
  ],
  creator: "Giorgos Iliopoulos",
  publisher: "Giorgos Iliopoulos",
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
    url: "https://hrmsgov.gioiliop.eu",
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
        className={`
          min-h-screen flex flex-col
          ${roboto.variable} font-sans antialiased`}
      >
        <FavoritesProvider>
          <Header />
          {children}
          <Footer />
        </FavoritesProvider>
      </body>
    </html>
  );
}

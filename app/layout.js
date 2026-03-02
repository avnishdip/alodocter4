import { Inter } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ui/Toast";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata = {
  metadataBase: new URL("https://alodoctor.mu"),
  title: "Alo Doctor — Healthcare for Mauritius",
  description: "Digital medical platform for chronic disease management and appointment booking in Mauritius.",
  openGraph: {
    title: "Alo Doctor — Healthcare for Mauritius",
    description: "Find top doctors, book appointments, and manage your health seamlessly.",
    url: "https://alodoctor.mu",
    siteName: "Alo Doctor",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Alo Doctor Platform",
      },
    ],
    locale: "en_MU",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Alo Doctor — Healthcare for Mauritius",
    description: "Find top doctors and book appointments seamlessly.",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}

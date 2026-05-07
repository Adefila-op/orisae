import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "@/styles.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://autopilot.popup.dev"),
  title: {
    default: "Autopilot | Recover Lost Sales for Digital Creators",
    template: "%s | Autopilot",
  },
  description:
    "Autopilot helps digital creators recover missed revenue with smart links, intent scoring, and automated follow-up offers.",
  openGraph: {
    title: "Autopilot | Recover Lost Sales for Digital Creators",
    description:
      "Track intent, trigger the right follow-up, and monitor recovered revenue from one creator dashboard.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Autopilot | Recover Lost Sales for Digital Creators",
    description:
      "Track intent, trigger the right follow-up, and monitor recovered revenue from one creator dashboard.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <body>{children}</body>
    </html>
  );
}

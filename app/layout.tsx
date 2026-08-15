import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Editable Lab Website",
  description: "A file-driven research lab website built for simple GitHub updates.",
  other: { "codex-preview": "development" },
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}

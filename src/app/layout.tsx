import type { ReactNode } from "react";
import "./globals.css";

export const metadata = {
  title: "Dimagi - Whereis",
  description: "Dimagi - Whereis",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

import type { Metadata } from "next";
import { Inter, Lora } from "next/font/google"; // Import Lora
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const lora = Lora({ subsets: ["latin"], variable: "--font-serif" }); // Configure Lora

export const metadata: Metadata = {
  title: "Warm Journal",
  description: "A cozy place for your thoughts",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${lora.variable} antialiased paper-texture`}>
        {children}
      </body>
    </html>
  );
}
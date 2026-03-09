import type { Metadata } from "next";
import { Urbanist } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { Navbar } from "@/components/navbar";
import { Toaster } from "@/components/ui/sonner";

const urbanist = Urbanist({
  variable: "--font-urbanist",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "RelieFlow - Disaster Relief & Recovery",
  description: "Request aid, volunteer your time, or donate to help communities rebuild after disasters",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${urbanist.variable} font-sans antialiased`}>
        <AuthProvider>
          <div className="min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-1 px-4 md:px-6 lg:px-8">{children}</main>
          </div>
          <Toaster richColors position="top-right" />
        </AuthProvider>
      </body>
    </html>
  );
}

// app/layout.tsx
import type { Metadata, Viewport } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";
import { baseMetadata, baseViewport } from "@/data/metadata";
import { AlertProvider } from "@/context/AlertContext";
import { UnsavedChangesProvider } from "@/context/UnsavedChangesContext";
import { AuthProvider } from "@/context/AuthContext";
import { AdminStatusProvider } from "@/context/AdminStatusContext"; // <-- Nuevo
import AdminShell from "@/components/admin/AdminShell";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-admin",
  display: "swap",
});

export const dynamic = "force-dynamic";
export const viewport: Viewport = baseViewport;
export const metadata: Metadata = baseMetadata;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={`h-full antialiased ${dmSans.variable}`}
      data-scroll-behavior="smooth"
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
        try {
          const t = localStorage.getItem('theme');
          const isSystem = !t || t === 'system';
          const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          const isDark = t === 'dark' || (isSystem && systemDark);

          document.documentElement.classList.remove('light', 'dark');
          document.documentElement.classList.add(isDark ? 'dark' : 'light');
        } catch (_) {}
      `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <div className="admin-root">
          <AlertProvider>
            <UnsavedChangesProvider>
              <AuthProvider>
                <AdminStatusProvider>
                  <AdminShell>{children}</AdminShell>
                </AdminStatusProvider>
              </AuthProvider>
            </UnsavedChangesProvider>
          </AlertProvider>
        </div>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Catatan Hajatan",
  description: "Aplikasi pencatatan sumbangan tamu hajatan",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className="batik-bg">
        {/* Header */}
        <header className="bg-batik-600 text-white shadow-lg">
          <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
            <span className="text-3xl">🏡</span>
            <div>
              <h1 className="text-xl font-bold leading-tight">Catatan Hajatan</h1>
              <p className="text-batik-100 text-sm">Catat sumbangan tamu dengan mudah</p>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="max-w-2xl mx-auto px-4 py-6 pb-20">
          {children}
        </main>

        {/* Footer */}
        <footer className="text-center text-batik-400 text-sm py-6 border-t border-batik-100">
          Semoga acaranya berjalan lancar 🤲
        </footer>
      </body>
    </html>
  );
}

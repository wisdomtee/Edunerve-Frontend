import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "EduNerve",
  description: "Smart School Management System powered by TechNerve",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50 flex flex-col min-h-screen`}
      >
        {/* MAIN CONTENT */}
        <main className="flex-1">{children}</main>

        {/* FOOTER */}
        <footer className="border-t border-gray-200 bg-white px-4 py-4 text-center text-xs text-gray-500">
          <div className="flex flex-col items-center justify-center gap-2">
            
            {/* LOGO + BRAND */}
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white text-[10px] font-bold">
                TN
              </div>
              <span className="text-sm font-semibold text-gray-700">
                TechNerve
              </span>
            </div>

            {/* TEXT */}
            <p>
              © {new Date().getFullYear()} EduNerve • Powered by{" "}
              <span className="font-semibold text-blue-600">TechNerve</span>
            </p>

          </div>
        </footer>
      </body>
    </html>
  )
}
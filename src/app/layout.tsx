import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { CartProvider } from "@/store/cartStore";
import "./globals.css";
import ClientWrapper from "@/components/ClientWrapper";
import { Providers } from "@/components/Providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "brcrint – Sua impressão 3D",
  description: "Com a brcprint sua impressão 3D fica mais fácil e rápida",
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon.png', type: 'image/png' },
    ],
    apple: '/brcprint.png',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={inter.className} style={{ display: "flex", minHeight: "100vh" }} suppressHydrationWarning>
        <Providers>
          <CartProvider>
            <ClientWrapper>
              {children}
            </ClientWrapper>
          </CartProvider>
        </Providers>

      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { M_PLUS_1 } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "@/components/SessionProvider";

const mPlus1 = M_PLUS_1({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "勤怠メッセージ生成",
  description: "業務開始・終了メッセージを簡単に生成",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={`${mPlus1.variable} antialiased`}>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}

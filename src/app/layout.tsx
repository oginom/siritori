import { AppBar, Typography } from "@mui/material";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

const TITLE = "しり撮り";

export const metadata: Metadata = {
  title: TITLE,
  description: `${TITLE} - 写真でしりとり`,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={inter.className}>
        <AppBar position="static">
          <Typography variant="h1" fontSize={20} align="center" m={1}>
            {TITLE}
          </Typography>
        </AppBar>
        <div id="main">
          {children}
        </div>
      </body>
    </html>
  );
}

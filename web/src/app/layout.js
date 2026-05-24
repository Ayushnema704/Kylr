import "./globals.css";
import { AuthProvider } from "../context/AuthContext";
import { DataProvider } from "../context/DataContext";
import AppLayout from "./AppLayout";

export const metadata = {
  title: "KYLR — AI-Powered GenZ Finance Layer",
  description: "Control your money intelligently. Real-time 50-30-20 budget tracker synced dynamically with Google Sheets.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#050508",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body>
        <AuthProvider>
          <DataProvider>
            <AppLayout>
              {children}
            </AppLayout>
          </DataProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

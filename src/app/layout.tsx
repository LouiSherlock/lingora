import type { Metadata } from "next";
import "./globals.css";
import { Theme } from "@astryxdesign/core/theme";
import { lingoraTheme } from "@/themes/lingora/lingora";

export const metadata: Metadata = {
  title: "Lingora",
  description: "Your English practice space",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" data-theme="dark" data-astryx-theme="lingora">
      <body>
        <Theme theme={lingoraTheme} mode="dark"><main>{children}</main></Theme>
      </body>
    </html>
  );
}

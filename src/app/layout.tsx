import type { Metadata } from "next";
import "./globals.css";
import { Theme } from "@astryxdesign/core/theme";
import { defaultThemeSlug, themes } from "../astryx-themes";

export const metadata: Metadata = {
  title: "Lingora",
  description: "Your English practice space",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" data-theme="dark">
      <body>
        <Theme theme={themes[defaultThemeSlug]} mode="dark"><main>{children}</main></Theme>
      </body>
    </html>
  );
}

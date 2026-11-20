import type { Metadata } from "next";
import { Suspense } from "react";
import "@/app/globals.css";
import { Theme } from "@astryxdesign/core/theme";
import { lingoraTheme } from "@/themes/lingora/lingora";
import { AuthOverlay } from "@/components/AuthOverlay";
import { AuthGuard } from "@/components/AuthGuard";

export const metadata: Metadata = {
  title: "Lingora",
  description: "Your English practice space",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" data-theme="dark" data-astryx-theme="lingora">
      <body>
        <Theme theme={lingoraTheme} mode="dark">
          <AuthOverlay />
          <Suspense fallback={null}>
            <AuthGuard>
              <main>{children}</main>
            </AuthGuard>
          </Suspense>
        </Theme>
      </body>
    </html>
  );
}

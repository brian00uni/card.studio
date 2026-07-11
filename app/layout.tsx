import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Card Studio · 가성비 크루",
  description: "여행 위급정보 릴스 카드 제작과 검수를 위한 운영 스튜디오",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ko"><body>{children}</body></html>;
}

import { Metadata } from "next";

export const metadata: Metadata = {
  title: "NFL Football Scores - Minnesota Vikings",
  description: "Live NFL football scores and game schedule for Minnesota Vikings",
};

export default function NFLLayout({ children }: { children: React.ReactNode }) {
  return children;
}

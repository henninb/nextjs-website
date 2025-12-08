import { Metadata } from "next";

export const metadata: Metadata = {
  title: "NHL Hockey Scores - Minnesota Wild",
  description: "Live NHL hockey scores and game schedule for Minnesota Wild",
};

export default function NHLLayout({ children }: { children: React.ReactNode }) {
  return children;
}

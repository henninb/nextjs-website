import { Metadata } from "next";

export const metadata: Metadata = {
  title: "MLB Baseball Scores - Minnesota Twins",
  description: "Live MLB baseball scores and game schedule for Minnesota Twins",
};

export default function MLBLayout({ children }: { children: React.ReactNode }) {
  return children;
}

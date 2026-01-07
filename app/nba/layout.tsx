import { Metadata } from "next";

export const metadata: Metadata = {
  title: "NBA Basketball Scores - Minnesota Timberwolves",
  description:
    "Live NBA basketball scores and game schedule for Minnesota Timberwolves",
};

export default function NBALayout({ children }: { children: React.ReactNode }) {
  return children;
}

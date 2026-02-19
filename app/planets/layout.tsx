import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Planet Rise & Set | bhenning.com",
  description:
    "View rise, transit, and set times for all 7 planets from any location on Earth. Includes 24-hour visibility timelines, nighttime viewing windows, and current altitude/azimuth data.",
  keywords:
    "planet rise set, astronomy, planet visibility, skygazing, Mercury Venus Mars Jupiter Saturn Uranus Neptune",
};

export default function PlanetsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

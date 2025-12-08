import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Temperature Converter - Fahrenheit & Celsius",
  description:
    "Convert temperatures between Fahrenheit and Celsius, plus current Minneapolis weather data with live updates",
  openGraph: {
    title: "Temperature Converter - Fahrenheit & Celsius",
    description:
      "Convert temperatures between Fahrenheit and Celsius, plus current Minneapolis weather data with live updates",
  },
};

export default function TemperatureLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

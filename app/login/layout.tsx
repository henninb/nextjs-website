import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login | Finance App",
  description: "Login to your account to access the finance management application.",
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Register | Finance App",
  description: "Create a new account to access the finance management application.",
};

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

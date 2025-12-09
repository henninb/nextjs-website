import React from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Backup & Restore",
  description: "Backup and restore your financial data securely. Download, upload, and manage database backups.",
};

export default function BackupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

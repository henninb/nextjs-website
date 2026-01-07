import React from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Spotify Authentication",
  description:
    "Connect your Spotify account to access your playlists and music data.",
};

export default function SpotifyAuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

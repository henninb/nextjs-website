"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const SpotifyAuth = () => {
  const authorize_endpoint = "https://accounts.spotify.com/authorize";
  const exchange_token_endpoint = "https://accounts.spotify.com/api/token";
  // const client_id = '3eea97dee61f4fbbaa9add653fdff523'; //henninb@gmail.com
  const client_id = "2679872f57204f0683315b72a9b9a62e";
  const redirect_uri = "https://vercel.bhenning.com/spotifyauth";
  // const redirect_uri = `${window.location.origin}/spotifyauth`;  // Dynamically set the redirect URI
  const scope = "playlist-read-private";

  const [accessToken, setAccessToken] = useState(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = searchParams.get("code");

  useEffect(() => {
    if (code) {
      exchangeToken(code);
    } else {
      const storedAccessToken = sessionStorage.getItem("access_token");
      if (storedAccessToken) {
        setAccessToken(storedAccessToken);
      }
    }
  }, [code]);

  const generateRandomString = (length) => {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    return Array.from(array, (byte) => chars[byte % chars.length]).join("");
  };

  const generateCodeChallenge = async (codeVerifier) => {
    const digest = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(codeVerifier),
    );
    return btoa(String.fromCharCode(...new Uint8Array(digest)))
      .replace(/=/g, "")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");
  };

  const redirectToAuthorizeEndpoint = () => {
    const codeVerifier = generateRandomString(64);
    generateCodeChallenge(codeVerifier).then((code_challenge) => {
      window.sessionStorage.setItem("code_verifier", codeVerifier);
      window.location = `${authorize_endpoint}?${new URLSearchParams({
        response_type: "code",
        client_id,
        scope,
        code_challenge_method: "S256",
        code_challenge,
        redirect_uri,
      }).toString()}`;
    });
  };

  const exchangeToken = (code) => {
    const code_verifier = sessionStorage.getItem("code_verifier");
    fetch(exchange_token_endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
      },
      body: new URLSearchParams({
        client_id,
        grant_type: "authorization_code",
        code,
        redirect_uri,
        code_verifier,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        setAccessToken(data.access_token);
        sessionStorage.setItem("access_token", data.access_token);
        sessionStorage.setItem(
          "expires_at",
          new Date().getTime() + data.expires_in * 1000,
        );
        router.replace("/spotifyauth"); // Remove query parameters
      })
      .catch((error) => console.error("Error exchanging token:", error));
  };

  const handleLogout = () => {
    sessionStorage.removeItem("access_token");
    sessionStorage.removeItem("expires_at");
    sessionStorage.removeItem("code_verifier");
    setAccessToken(null);
  };

  return (
    <div>
      {!accessToken ? (
        <>
          <button id="login-button" onClick={redirectToAuthorizeEndpoint}>
            Login to Spotify
          </button>
          <br />
          https://developer.spotify.com
        </>
      ) : (
        <div>
          <button id="logout-button" onClick={handleLogout}>
            Logout
          </button>
          <div id="content">
            <button id="getCurrent" onClick={getPlayLists}>
              Playlists
            </button>
            <input
              type="text"
              id="playlistId"
              defaultValue="1234"
              placeholder="Enter playlist ID"
            />
            <button id="getPlayListTracks" onClick={getPlaylistTracks}>
              Get Playlist Tracks
            </button>
            <div id="current-track"></div>
          </div>
        </div>
      )}
    </div>
  );
};

function safeText(str) {
  const node = document.createTextNode(String(str ?? ""));
  return node;
}

function makeElement(tag, children) {
  const el = document.createElement(tag);
  children.forEach((child) =>
    el.appendChild(typeof child === "string" ? safeText(child) : child),
  );
  return el;
}

const getPlayLists = () => {
  const access_token = sessionStorage.getItem("access_token");
  fetch("https://api.spotify.com/v1/me/playlists", {
    headers: {
      Authorization: `Bearer ${access_token}`,
    },
  })
    .then((response) => response.json())
    .then((data) => {
      const trackDiv = document.getElementById("current-track");
      trackDiv.replaceChildren();
      if (data.items && data.items.length > 0) {
        data.items.forEach((playlist) => {
          const div = makeElement("div", [
            makeElement("h1", [`Playlist ID: ${playlist.id}`]),
            makeElement("h2", [
              `Owner Display Name: ${playlist.owner.display_name}`,
            ]),
          ]);
          trackDiv.appendChild(div);
        });
      } else {
        trackDiv.appendChild(makeElement("p", ["No playlists found"]));
      }
    })
    .catch((error) => {
      console.error("Error fetching playlists:", error);
      const trackDiv = document.getElementById("current-track");
      trackDiv.replaceChildren(makeElement("p", ["Could not fetch playlists"]));
    });
};

const getPlaylistTracks = () => {
  const access_token = sessionStorage.getItem("access_token");
  const playlist_id = "1IdWEGOcOIvIQNf664qSvL";

  fetch(`https://api.spotify.com/v1/playlists/${playlist_id}/tracks`, {
    headers: {
      Authorization: `Bearer ${access_token}`,
    },
  })
    .then((response) => response.json())
    .then((data) => {
      const trackDiv = document.getElementById("current-track");
      trackDiv.replaceChildren();
      if (data.items && data.items.length > 0) {
        data.items.forEach((item) => {
          const track = item.track;
          const artists = track.artists.map((a) => a.name).join(", ");
          const div = makeElement("div", [
            makeElement("h1", [`Song: ${track.name}`]),
            makeElement("h2", [`Artists: ${artists}`]),
          ]);
          trackDiv.appendChild(div);
        });
      } else {
        trackDiv.appendChild(
          makeElement("p", ["No tracks found in this playlist"]),
        );
      }
    })
    .catch((error) => {
      console.error("Error fetching playlist tracks:", error);
      const trackDiv = document.getElementById("current-track");
      trackDiv.replaceChildren(
        makeElement("p", ["Could not fetch playlist tracks"]),
      );
    });
};

export default SpotifyAuth;

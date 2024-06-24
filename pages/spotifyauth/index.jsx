import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

const SpotifyAuth = () => {
  const authorize_endpoint = 'https://accounts.spotify.com/authorize';
  const exchange_token_endpoint = 'https://accounts.spotify.com/api/token';
  const client_id = '3eea97dee61f4fbbaa9add653fdff523';
  const redirect_uri = 'https://vercel.bhenning.com/spotifyauth';
  const scope = 'playlist-read-private';

  const [accessToken, setAccessToken] = useState(null);
  const router = useRouter();
  const { code } = router.query;

  useEffect(() => {
    if (code) {
      exchangeToken(code);
    } else {
      const storedAccessToken = localStorage.getItem('access_token');
      if (storedAccessToken) {
        setAccessToken(storedAccessToken);
      }
    }
  }, [code]);

  const generateRandomString = (length) => {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < length; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  };

  const generateCodeChallenge = async (codeVerifier) => {
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(codeVerifier));
    return btoa(String.fromCharCode(...new Uint8Array(digest)))
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
  };

  const redirectToAuthorizeEndpoint = () => {
    const codeVerifier = generateRandomString(64);
    generateCodeChallenge(codeVerifier).then((code_challenge) => {
      window.localStorage.setItem('code_verifier', codeVerifier);
      window.location = `${authorize_endpoint}?${new URLSearchParams({
        response_type: 'code',
        client_id,
        scope,
        code_challenge_method: 'S256',
        code_challenge,
        redirect_uri,
      }).toString()}`;
    });
  };

  const exchangeToken = (code) => {
    const code_verifier = localStorage.getItem('code_verifier');
    fetch(exchange_token_endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
      },
      body: new URLSearchParams({
        client_id,
        grant_type: 'authorization_code',
        code,
        redirect_uri,
        code_verifier,
      }),
    })
      .then(response => response.json())
      .then(data => {
        setAccessToken(data.access_token);
        localStorage.setItem('access_token', data.access_token);
        localStorage.setItem('expires_at', new Date().getTime() + data.expires_in * 1000);
        router.replace('/spotifyauth'); // Remove query parameters
      })
      .catch(error => console.error('Error exchanging token:', error));
  };

  const handleLogout = () => {
    localStorage.clear();
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
            <button id="getCurrent" onClick={getCurrentTrack}>
              Get Current Track
            </button>
            <div id="current-track"></div>
          </div>
        </div>
      )}
    </div>
  );
};

const getCurrentTrack = () => {
  const access_token = localStorage.getItem('access_token');
  console.log(access_token);
  fetch(`https://api.spotify.com/v1/me/playlists`, {
    headers: {
      Authorization: `Bearer ${access_token}`,
    },
  })
    .then(response => response.json())
    .then(data => {
      const trackDiv = document.getElementById('current-track');
      console.log(JSON.stringify(data));
      trackDiv.innerHTML = `
        <h1>${data.item.id}</h1>
        <h2>${data.items.map(artist => artist.id).join(', ')}</h2>
        <img src="${data.item.album.images[1].url}" alt="Album Art" />
      `;
    })
    .catch(error => {
      console.error('Error fetching current track:', error);
      const trackDiv = document.getElementById('current-track');
      trackDiv.innerHTML = '<p>Could not fetch current track</p>';
    });
};

export default SpotifyAuth;

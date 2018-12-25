const clientId = 'fac28d00297d45aab1adb3b8b0f2ecd7';
const redirectURI = 'http://localhost:3000/';
let accessToken = null;

const Spotify = {
  getAccessToken() {
    if (accessToken) {
      return accessToken;
    }

    // implicit Grant Flow
    const matchAccessToken = window.location.href.match(/access_token=([^&]*)/)
    const matchExpiresIn = window.location.href.match(/expires_in=([^&]*)/)

    if (matchAccessToken && matchExpiresIn) {
      accessToken = matchAccessToken[1];
      const expiresIn = Number(matchExpiresIn[1]);
      window.setTimeout(() => accessToken = '', expiresIn * 1000);
      window.history.pushState('Access Token', null, '/');
      return accessToken;
    } else {
      const spotifyAuthURI = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=token&scope=playlist-modify-public&redirect_uri=${redirectURI}`
      window.location = spotifyAuthURI;
    }
  },

  // Handles search functionality
  search(term) {
    const accessToken = Spotify.getAccessToken();
    return fetch(`https://api.spotify.com/v1/search?type=track&q=${term}`, {
      headers: {Authorization: `Bearer ${accessToken}`}
    }).then(response => {
      return response.json();
    }).then(jsonResponse => {
      if (!jsonResponse.tracks) {
        return [];
      }
      return jsonResponse.tracks.items.map(track => ({
        id: track.id,
        name: track.name,
        artist: track.artists[0].name,
        album: track.album.name,
        uri: track.uri
      }));
    });
  },

  //Creates Playlists
  savePlaylist(playlistName, trackURIs) {
    if (!playlistName || !trackURIs.length) {
      return;
    }
    const accessToken = Spotify.getAccessToken();
    const headers = {Authorization: `Bearer ${accessToken}`}
    let userId;
    //Request returns user's Spotify username
    return fetch('https://api.spotify.com/v1/me', {headers: headers}).then(response => {
      return response.json();
    }).then(jsonResponse => {
      userId = jsonResponse.id;
      //POST request that creates new playlist in user's account
      return fetch(`https://api.spotify.com/v1/users/${userId}/playlists`, {
        hearders: headers,
        method: 'POST',
        body: JSON.stringify({name: playlistName})
      }).then(response => {
        return response.json();
      }).then(jsonResponse => {
        const playlistId = jsonResponse.id;
        //POST Request that adds tracks to playlist
        return fetch(`https://api.spotify.com/v1/users/${userId}/playlists/${playlistId}/tracks`, {
          hearders: headers,
          method: 'POST',
          body: JSON.stringify({uris: trackURIs})
        });
      });
    });
  }

}

export default Spotify;

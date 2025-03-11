class JamendoAPI {
    constructor(clientId) {
        this.clientId = clientId;
        this.baseUrl = CONFIG.API_BASE_URL;
    }

    // Tracks API Methods
    async getPopularTracks(limit = 20) {
        try {
            const response = await fetch(
                `${this.baseUrl}/tracks/?client_id=${this.clientId}&format=json&limit=${limit}&orderby=popularity_total`
            );
            const data = await response.json();
            return this.transformTracks(data.results || []);
        } catch (error) {
            console.error('Error fetching popular tracks:', error);
            return [];
        }
    }

    async searchTracks(query) {
    try {
        const response = await fetch(
            `${this.baseUrl}/tracks/?client_id=${this.clientId}&format=json&limit=20&search=${encodeURIComponent(query)}`
        );
        const data = await response.json();
        return this.transformTracks(data.results || []);
    } catch (error) {
        console.error('Error searching tracks:', error);
        return [];
    }
}

    async getTrackById(trackId) {
        try {
            const response = await fetch(
                `${this.baseUrl}/tracks/?client_id=${this.clientId}&format=json&id=${trackId}`
            );
            const data = await response.json();
            const tracks = this.transformTracks(data.results || []);
            return tracks[0] || null;
        } catch (error) {
            console.error('Error getting track:', error);
            return null;
        }
    }

    // Artists API Methods
    async getFeaturedArtists(limit = 6) {
        try {
            const response = await fetch(
                `${this.baseUrl}/artists/?client_id=${this.clientId}&format=json&limit=${limit}&order=popularity_week`
            );
            const data = await response.json();
            return this.transformArtists(data.results || []);
        } catch (error) {
            console.error('Error fetching featured artists:', error);
            return [];
        }
    }

    async searchArtists(query) {
    try {
        const response = await fetch(
            `${this.baseUrl}/artists/?client_id=${this.clientId}&format=json&limit=20&namesearch=${encodeURIComponent(query)}`
        );
        const data = await response.json();
        return this.transformArtists(data.results || []);
    } catch (error) {
        console.error('Error searching artists:', error);
        return [];
    }
}

    async getArtistTracks(artistId, limit = 20) {
        try {
            const response = await fetch(
                `${this.baseUrl}/artists/${artistId}/tracks/?client_id=${this.clientId}&format=json&limit=${limit}`
            );
            const data = await response.json();
            return this.transformTracks(data.results || []);
        } catch (error) {
            console.error('Error fetching artist tracks:', error);
            return [];
        }
    }

    // Albums API Methods
    async getPopularAlbums(limit = 10) {
        try {
            const response = await fetch(
                `${this.baseUrl}/albums/?client_id=${this.clientId}&format=json&limit=${limit}&orderby=popularity_week`
            );
            const data = await response.json();
            return this.transformAlbums(data.results || []);
        } catch (error) {
            console.error('Error fetching popular albums:', error);
            return [];
        }
    }

    async searchAlbums(query) {
    try {
        const response = await fetch(
            `${this.baseUrl}/albums/?client_id=${this.clientId}&format=json&limit=20&namesearch=${encodeURIComponent(query)}`
        );
        const data = await response.json();
        return this.transformAlbums(data.results || []);
    } catch (error) {
        console.error('Error searching albums:', error);
        return [];
    }
}

    async getAlbumTracks(albumId) {
        try {
            const response = await fetch(
                `${this.baseUrl}/albums/${albumId}/tracks/?client_id=${this.clientId}&format=json`
            );
            const data = await response.json();
            return this.transformTracks(data.results || []);
        } catch (error) {
            console.error('Error fetching album tracks:', error);
            return [];
        }
    }

    // Genre-based Methods
    async getTracksByGenre(genre, limit = 20) {
        try {
            const response = await fetch(
                `${this.baseUrl}/tracks/?client_id=${this.clientId}&format=json&limit=${limit}&tags=${encodeURIComponent(genre)}&orderby=popularity_total`
            );
            const data = await response.json();
            return this.transformTracks(data.results || []);
        } catch (error) {
            console.error('Error fetching tracks by genre:', error);
            return [];
        }
    }

    // Data Transformation Methods
    transformTracks(tracks = []) {
        return tracks.map(track => ({
            id: track.id,
            title: track.name,
            artist: track.artist_name,
            album: track.album_name,
            duration: track.duration,
            posterUrl: track.image,
            musicPath: track.audio,
            waveformUrl: track.waveform || '',
            releaseDate: track.releasedate,
            lyrics: track.lyrics || '',
            genre: Array.isArray(track.tags) ? track.tags.join(', ') : '',
            likes: track.sharecount || 0,
            plays: track.listens || 0,
            license: track.license_ccurl || '',
            artistId: track.artist_id,
            albumId: track.album_id
        }));
    }

    transformArtists(artists = []) {
        return artists.map(artist => ({
            id: artist.id,
            name: artist.name,
            image: artist.image || CONFIG.DEFAULT_IMAGES.ARTIST,
            website: artist.website || '',
            joinDate: artist.joindate || '',
            location: artist.location || '',
            trackCount: artist.trackcount || 0,
            albumCount: artist.albumcount || 0,
            biography: artist.bio || '',
            followers: artist.sharecount || 0,
            facebook: artist.facebook || '',
            twitter: artist.twitter || '',
            instagram: artist.instagram || ''
        }));
    }

    transformAlbums(albums = []) {
        return albums.map(album => ({
            id: album.id,
            name: album.name,
            artistName: album.artist_name,
            artistId: album.artist_id,
            releaseDate: album.releasedate || '',
            image: album.image || CONFIG.DEFAULT_IMAGES.ALBUM,
            trackCount: album.trackcount || 0,
            genre: Array.isArray(album.tags) ? album.tags.join(', ') : '',
            zip: album.zip || '',
            description: album.description || '',
            duration: album.duration || 0,
            popularity: album.popularity || 0
        }));
    }

    // Advanced Search Methods
    async advancedSearch(params = {}) {
        const {
            query = '',
            type = 'tracks',
            limit = 20,
            orderBy = 'popularity_total',
            order = 'desc',
            genre = '',
            duration = '',
            dateFrom = '',
            dateTo = ''
        } = params;

        const baseParams = new URLSearchParams({
            client_id: this.clientId,
            format: 'json',
            limit: limit.toString()
        });

        if (query) baseParams.append('search', query);
        if (genre) baseParams.append('tags', genre);
        if (orderBy) baseParams.append('orderby', orderBy);
        if (order) baseParams.append('order', order);
        if (duration) baseParams.append('duration', duration);
        if (dateFrom) baseParams.append('datebetween', `${dateFrom}_${dateTo || new Date().toISOString()}`);

        try {
            const response = await fetch(
                `${this.baseUrl}/${type}/?${baseParams.toString()}`
            );
            const data = await response.json();
            
            switch (type) {
                case 'tracks':
                    return this.transformTracks(data.results || []);
                case 'artists':
                    return this.transformArtists(data.results || []);
                case 'albums':
                    return this.transformAlbums(data.results || []);
                default:
                    return [];
            }
        } catch (error) {
            console.error('Error performing advanced search:', error);
            return [];
        }
    }

    // Error Handling
    handleApiError(error) {
        console.error('API Error:', error);
        if (error.response) {
            switch (error.response.status) {
                case 401:
                    throw new Error('Invalid API client ID');
                case 404:
                    throw new Error('Resource not found');
                case 429:
                    throw new Error('Rate limit exceeded');
                default:
                    throw new Error('An error occurred while fetching data');
            }
        }
        throw error;
    }
}
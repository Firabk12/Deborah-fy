const CONFIG = {
    JAMENDO_CLIENT_ID: 'd174123a', // Replace with actual client ID
    API_BASE_URL: 'https://api.jamendo.com/v3.0',
    
    // Default images
    DEFAULT_IMAGES: {
        ARTIST: './assets/images/poster-4.jpg',
        ALBUM: './assets/images/poster-4.jpg',
        TRACK: './assets/images/poster-4.jpg'
    },
    
    // Predefined genres with their icons and colors
    GENRES: [
        { name: 'Rock', icon: 'electric_guitar', color: '#FF6B6B' },
        { name: 'Pop', icon: 'music_note', color: '#4ECDC4' },
        { name: 'Jazz', icon: 'piano', color: '#45B7D1' },
        { name: 'Classical', icon: 'piano', color: '#96CEB4' },
        { name: 'Electronic', icon: 'graphic_eq', color: '#FFEEAD' },
        { name: 'Hip Hop', color: '#ba68c8', icon: 'mic' }
    ],
        
    STORAGE_KEYS: {
        // Existing keys
        RECENTLY_PLAYED: 'recently_played',
        FEATURED_CACHE: 'featured_cache',
        FEATURED_CACHE_TIME: 'featured_cache_time',
        FOR_YOU_CACHE: 'for_you_cache',
        FOR_YOU_CACHE_TIME: 'for_you_cache_time',

        // New keys for playlist functionality
        PLAYLISTS: 'music_app_playlists',
        LIKED_TRACKS: 'music_app_liked_tracks',
        CURRENT_TRACK: 'current_track',
        AUTH_TOKEN: 'auth_token',
        RECENT_SEARCHES: 'recent_searches'
    },

    // Cache durations in milliseconds
    CACHE_DURATION: {
        FEATURED: 3600000, // 1 hour
        FOR_YOU: 7200000   // 2 hours
    }
};
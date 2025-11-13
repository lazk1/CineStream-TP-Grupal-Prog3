const API_KEY = 'e244d185b8426b12f4268b7e6acdc2ee';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

export const tmdb = {
    // Películas populares
    async getPopularMovies() {
        const response = await fetch(`${BASE_URL}/movie/popular?api_key=${API_KEY}&language=es-ES`);
        return await response.json();
    },

    // Series populares
    async getPopularSeries() {
        const response = await fetch(`${BASE_URL}/tv/popular?api_key=${API_KEY}&language=es-ES`);
        return await response.json();
    },

    // Próximos estrenos
    async getUpcomingMovies() {
        const response = await fetch(`${BASE_URL}/movie/upcoming?api_key=${API_KEY}&language=es-ES`);
        return await response.json();
    },

    // Búsqueda
    async searchMulti(query) {
        const response = await fetch(`${BASE_URL}/search/multi?api_key=${API_KEY}&language=es-ES&query=${encodeURIComponent(query)}`);
        return await response.json();
    },

    // Detalle de película
    async getMovieDetails(movieId) {
        const response = await fetch(`${BASE_URL}/movie/${movieId}?api_key=${API_KEY}&language=es-ES`);
        return await response.json();
    },

    // Detalle de serie
    async getTvDetails(tvId) {
        const response = await fetch(`${BASE_URL}/tv/${tvId}?api_key=${API_KEY}&language=es-ES`);
        return await response.json();
    }
};

export { IMAGE_BASE_URL };

import { IMAGE_BASE_URL } from '../api/tmdb.js';
import { storage } from './storage.js';

export const domUtils = {
    // Crear tarjeta de película/serie
    createMovieCard(item, type = 'movie') {
        const card = document.createElement('div');
        card.className = 'movie-card';
        card.dataset.id = item.id;
        card.dataset.type = type;

        const title = type === 'movie' ? item.title : item.name;
        const releaseDate = type === 'movie' ? item.release_date : item.first_air_date;
        const year = releaseDate ? new Date(releaseDate).getFullYear() : 'N/A';
        const isFavorite = storage.isFavorite(item.id, type);

        card.innerHTML = `
            <div class="movie-poster">
                <img src="${item.poster_path ? IMAGE_BASE_URL + item.poster_path : 'https://via.placeholder.com/300x450/2c2c2c/ffffff?text=No+Image'}" 
                     alt="${title}" 
                     loading="lazy">
                <div class="movie-overlay">
                    <button class="play-btn" data-id="${item.id}" data-type="${type}">
                        <i class="fas fa-play"></i>
                    </button>
                    <button class="info-btn" data-id="${item.id}" data-type="${type}">
                        <i class="fas fa-info-circle"></i>
                    </button>
                    <button class="favorite-btn" data-id="${item.id}" data-type="${type}">
                        <i class="${isFavorite ? 'fas' : 'far'} fa-heart"></i>
                    </button>
                </div>
            </div>
            <div class="movie-info">
                <h3 class="movie-title">${title}</h3>
                <div class="movie-meta">
                    <span class="movie-year">${year}</span>
                    <span class="movie-rating">
                        <i class="fas fa-star"></i>
                        ${item.vote_average ? item.vote_average.toFixed(1) : 'N/A'}
                    </span>
                </div>
            </div>
        `;

        return card;
    },

    // Mostrar loading
    showLoading(container) {
        container.innerHTML = '<div class="loading">Cargando...</div>';
    },

    // Mostrar error
    showError(container, message) {
        container.innerHTML = `<div class="error">${message}</div>`;
    }
};

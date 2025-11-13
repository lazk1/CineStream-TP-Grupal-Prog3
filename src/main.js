import "./style.css";
import { tmdb } from "./api/tmdb.js";
import { storage } from "./utils/storage.js";
import { domUtils } from "./utils/dom.js";

class CineStreamApp {
  constructor() {
    this.currentPage = window.location.pathname;
    this.init();
  }

  async init() {
    // Determinar qué página estamos y cargar el contenido apropiado
    if (this.currentPage.includes("index.html") || this.currentPage === "/") {
      await this.loadHomePage();
    } else if (this.currentPage.includes("busqueda.html")) {
      this.setupSearchPage();
    } else if (this.currentPage.includes("favoritos.html")) {
      this.loadFavoritesPage();
    }

    this.setupEventListeners();
    this.setupNavbarScroll();
  }

  async loadHomePage() {
    try {
      // Mostrar loading en las secciones
      this.showSectionLoading();

      // Cargar datos de la API
      const [popularMovies, popularSeries, upcomingMovies] = await Promise.all([
        tmdb.getPopularMovies(),
        tmdb.getPopularSeries(),
        tmdb.getUpcomingMovies(),
      ]);

      console.log("Datos cargados:", {
        movies: popularMovies.results?.length,
        series: popularSeries.results?.length,
        upcoming: upcomingMovies.results?.length,
      });

      // Renderizar secciones
      this.renderSection("popular-movies", popularMovies.results, "movie");
      this.renderSection("popular-series", popularSeries.results, "tv");
      this.renderSection("upcoming-movies", upcomingMovies.results, "movie");

      // Configurar hero con una película aleatoria
      this.setupHero(popularMovies.results);
    } catch (error) {
      console.error("Error loading home page:", error);
      this.showSectionError();
    }
  }

  showSectionLoading() {
    const sections = ["popular-movies", "popular-series", "upcoming-movies"];
    sections.forEach((sectionId) => {
      const container = document.getElementById(sectionId);
      if (container) domUtils.showLoading(container);
    });
  }

  showSectionError() {
    const sections = ["popular-movies", "popular-series", "upcoming-movies"];
    sections.forEach((sectionId) => {
      const container = document.getElementById(sectionId);
      if (container) domUtils.showError(container, "Error al cargar los datos");
    });
  }

  renderSection(containerId, items, type) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = "";
    if (items && items.length > 0) {
      items.slice(0, 12).forEach((item) => {
        const card = domUtils.createMovieCard(item, type);
        container.appendChild(card);
      });
    } else {
      container.innerHTML = "<p>No hay contenido disponible</p>";
    }
  }

  setupHero(movies) {
    if (!movies || movies.length === 0) return;

    const randomMovie = movies[Math.floor(Math.random() * movies.length)];
    const hero = document.getElementById("hero");

    if (randomMovie && hero) {
      if (randomMovie.backdrop_path) {
        hero.style.backgroundImage = `url(https://image.tmdb.org/t/p/original${randomMovie.backdrop_path})`;
      }

      const title = document.querySelector(".hero-title");
      const description = document.querySelector(".hero-description");
      const infoBtn = document.querySelector(".btn-secondary");

      if (title) title.textContent = randomMovie.title;
      if (description) {
        let desc = randomMovie.overview || "Descripción no disponible";
        if (desc.length > 200) {
          desc = desc.substring(0, 200) + "...";
        }
        description.textContent = desc;
      }
      if (infoBtn) {
        infoBtn.dataset.id = randomMovie.id;
        infoBtn.dataset.type = "movie";
      }
    }
  }

  setupSearchPage() {
    const searchInput = document.querySelector(".search-input");
    const searchResults = document.querySelector(".search-results");

    if (searchInput && searchResults) {
      searchInput.addEventListener(
        "input",
        this.debounce(async (e) => {
          const query = e.target.value.trim();

          if (query.length < 3) {
            searchResults.innerHTML =
              '<p class="search-placeholder">Ingresa al menos 3 caracteres para buscar</p>';
            return;
          }

          try {
            searchResults.innerHTML = '<div class="loading">Buscando...</div>';
            const results = await tmdb.searchMulti(query);
            this.displaySearchResults(results.results);
          } catch (error) {
            console.error("Search error:", error);
            searchResults.innerHTML =
              '<div class="error">Error en la búsqueda</div>';
          }
        }, 500)
      );
    }
  }

  displaySearchResults(results) {
    const container = document.querySelector(".search-results");
    if (!container) return;

    container.innerHTML = "";

    if (!results || results.length === 0) {
      container.innerHTML =
        '<p class="no-results">No se encontraron resultados</p>';
      return;
    }

    const filteredResults = results.filter(
      (item) => item.media_type === "movie" || item.media_type === "tv"
    );

    if (filteredResults.length === 0) {
      container.innerHTML =
        '<p class="no-results">No se encontraron películas o series</p>';
      return;
    }

    filteredResults.forEach((item) => {
      const type = item.media_type;
      const card = domUtils.createMovieCard(item, type);
      container.appendChild(card);
    });
  }

  loadFavoritesPage() {
    const favorites = storage.getFavorites();
    const container = document.querySelector(".favorites-grid");

    if (container) {
      container.innerHTML = "";

      if (favorites.length === 0) {
        container.innerHTML =
          '<p class="no-favorites">No tienes favoritos aún</p>';
        return;
      }

      favorites.forEach((fav) => {
        const card = domUtils.createMovieCard(fav, fav.type);
        container.appendChild(card);
      });
    }
  }

  setupEventListeners() {
    // Delegación de eventos para los botones de las tarjetas
    document.addEventListener("click", (e) => {
      // Botón de información
      if (e.target.closest(".info-btn") || e.target.closest(".btn-secondary")) {
        const button =
          e.target.closest(".info-btn") || e.target.closest(".btn-secondary");
        const id = button.dataset.id;
        const type = button.dataset.type;
        if (id && type) this.showDetailsModal(id, type);
      }

      // Botón de favoritos
      if (e.target.closest(".favorite-btn")) {
        const button = e.target.closest(".favorite-btn");
        const id = button.dataset.id;
        const type = button.dataset.type;
        const card = button.closest(".movie-card");
        this.toggleFavorite(card, id, type);
      }

      // Botón de búsqueda en navbar
      if (e.target.closest(".search-btn")) {
        e.preventDefault();

        // Obtener la página actual
        const currentPage = window.location.pathname;

        // Determinar la ruta correcta según la página actual
        let searchPagePath;

        if (
          currentPage.includes("index.html") ||
          currentPage === "/" ||
          currentPage === "/cine-stream/"
        ) {
          // Si estamos en la página principal (raíz)
          searchPagePath = "./pages/busqueda.html";
        } else if (currentPage.includes("/pages/")) {
          // Si estamos dentro de la carpeta pages
          searchPagePath = "./busqueda.html";
        } else {
          // Por defecto
          searchPagePath = "./pages/busqueda.html";
        }

        console.log("Navegando desde:", currentPage, "a:", searchPagePath);
        window.location.href = searchPagePath;
      }

      // BOTÓN REPRODUCIR PRINCIPAL - AQUÍ AGREGA EL CÓDIGO
      if (e.target.closest(".btn-primary")) {
        e.preventDefault();
        alert("Reproducción no implementada aún.");
      }
    });
  }

  setupNavbarScroll() {
    const navbar = document.querySelector(".navbar");
    if (navbar) {
      window.addEventListener("scroll", () => {
        if (window.scrollY > 100) {
          navbar.classList.add("scrolled");
        } else {
          navbar.classList.remove("scrolled");
        }
      });
    }
  }

  async showDetailsModal(id, type) {
    try {
      let details;
      if (type === "movie") {
        details = await tmdb.getMovieDetails(id);
      } else {
        details = await tmdb.getTvDetails(id);
      }

      this.createModal(details, type);
    } catch (error) {
      console.error("Error loading details:", error);
      alert("Error al cargar los detalles");
    }
  }

  createModal(details, type) {
    // Crear modal básico por ahora
    const title = type === "movie" ? details.title : details.name;
    const overview = details.overview || "Descripción no disponible.";
    const rating = details.vote_average
      ? details.vote_average.toFixed(1)
      : "N/A";
    const releaseDate =
      type === "movie" ? details.release_date : details.first_air_date;
    const year = releaseDate ? new Date(releaseDate).getFullYear() : "N/A";

    const modalHTML = `
            <div class="modal" style="display: block;">
                <div class="modal-content" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background: var(--background-color); padding: 2rem; border-radius: 8px; max-width: 500px; width: 90%;">
                    <span class="close-btn" style="position: absolute; top: 1rem; right: 1rem; cursor: pointer; font-size: 1.5rem;">&times;</span>
                    <h2>${title} (${year})</h2>
                    <div class="movie-rating" style="margin: 1rem 0;">
                        <i class="fas fa-star" style="color: gold;"></i>
                        <span>${rating}/10</span>
                    </div>
                    <p class="overview">${overview}</p>
                    <div class="modal-actions">
                        <button class="btn btn-primary">
                            <i class="fas fa-play"></i> Reproducir
                        </button>
                        <button class="btn btn-secondary close-modal">
                            <i class="fas fa-times"></i> Cerrar
                        </button>
                    </div>
                </div>
            </div>
        `;

    // Remover modal existente si hay uno
    const existingModal = document.querySelector(".modal");
    if (existingModal) existingModal.remove();

    // Agregar nuevo modal
    document.body.insertAdjacentHTML("beforeend", modalHTML);

    // Configurar eventos del modal
    this.setupModalEvents();
  }

  setupModalEvents() {
    const modal = document.querySelector(".modal");
    const closeBtn = document.querySelector(".close-btn");
    const closeModalBtn = document.querySelector(".close-modal");

    const closeModal = () => {
      if (modal) modal.remove();
    };

    if (closeBtn) closeBtn.addEventListener("click", closeModal);
    if (closeModalBtn) closeModalBtn.addEventListener("click", closeModal);

    // Cerrar modal al hacer clic fuera
    if (modal) {
      modal.addEventListener("click", (e) => {
        if (e.target === modal) closeModal();
      });
    }
  }

  toggleFavorite(card, id, type) {
    const favoriteBtn = card.querySelector(".favorite-btn i");
    const isCurrentlyFavorite = favoriteBtn.classList.contains("fas");

    if (isCurrentlyFavorite) {
      storage.removeFromFavorites(parseInt(id), type);
      favoriteBtn.classList.replace("fas", "far");
    } else {
      // Para agregar a favoritos necesitamos los datos básicos
      const title = card.querySelector(".movie-title").textContent;
      const posterPath = card.querySelector(".movie-poster img").src;
      const item = {
        id: parseInt(id),
        type,
        title,
        poster_path: posterPath.includes("image.tmdb.org")
          ? posterPath.replace("https://image.tmdb.org/t/p/w500", "")
          : null,
      };
      storage.addToFavorites(item);
      favoriteBtn.classList.replace("far", "fas");
    }
  }

  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
}

// Inicializar la aplicación cuando el DOM esté listo
document.addEventListener("DOMContentLoaded", () => {
  new CineStreamApp();
});

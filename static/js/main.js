/**
 * Anime Zone - Main JavaScript File
 * 
 * This file handles the core functionality of the Anime Zone website,
 * including navigation, search, and UI interactions.
 */

// Wait until the DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize the mobile menu toggle
    initMobileMenu();
    
    // Initialize search functionality
    initSearch();
    
    // Initialize anime cards
    initAnimeCards();
    
    // Initialize modals
    initModals();
    
    // Initialize toast notifications
    initToasts();
});

/**
 * Initialize the mobile menu toggle functionality
 */
function initMobileMenu() {
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.navbar-nav');
    
    if (hamburger && navMenu) {
        hamburger.addEventListener('click', function() {
            navMenu.classList.toggle('active');
        });
        
        // Close menu when clicking outside
        document.addEventListener('click', function(event) {
            if (!event.target.closest('.navbar-container')) {
                navMenu.classList.remove('active');
            }
        });
    }
}

/**
 * Initialize search functionality
 */
function initSearch() {
    const searchInput = document.querySelector('.search-input');
    const animeGrid = document.querySelector('.anime-grid');
    
    if (searchInput && animeGrid) {
        // Debounce function to limit API calls
        let debounceTimer;
        
        searchInput.addEventListener('input', function() {
            clearTimeout(debounceTimer);
            
            const query = this.value.trim();
            
            // Show loader
            if (animeGrid.querySelector('.loader') === null) {
                const loader = document.createElement('div');
                loader.className = 'loader';
                loader.innerHTML = '<div class="loader-spinner"></div>';
                animeGrid.innerHTML = '';
                animeGrid.appendChild(loader);
            }
            
            debounceTimer = setTimeout(() => {
                if (query.length > 0) {
                    fetchAnime(query);
                } else {
                    fetchAnime(); // Fetch all anime when search is empty
                }
            }, 500);
        });
    }
}

/**
 * Fetch anime data from the API
 * @param {string} query - Search query (optional)
 */
function fetchAnime(query = '') {
    const animeGrid = document.querySelector('.anime-grid');
    
    if (!animeGrid) return;
    
    let url = '/api/anime';
    if (query) {
        url += `?q=${encodeURIComponent(query)}`;
    }
    
    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            animeGrid.innerHTML = '';
            
            if (data.anime && data.anime.length > 0) {
                data.anime.forEach(anime => {
                    animeGrid.appendChild(createAnimeCard(anime));
                });
            } else {
                // No results found
                const noResults = document.createElement('div');
                noResults.className = 'no-results';
                noResults.textContent = 'No anime found for your search.';
                animeGrid.appendChild(noResults);
            }
        })
        .catch(error => {
            console.error('Error fetching anime:', error);
            showToast('Error fetching anime data. Please try again.', 'error');
            
            // Show error message in grid
            animeGrid.innerHTML = '<div class="no-results">Failed to load anime. Please try again later.</div>';
        });
}

/**
 * Create an anime card element
 * @param {Object} anime - Anime data object
 * @returns {HTMLElement} The created anime card element
 */
function createAnimeCard(anime) {
    const card = document.createElement('div');
    card.className = 'anime-card';
    
    // Use a placeholder image if the anime doesn't have an image URL
    const imageUrl = anime.image_url || 'https://via.placeholder.com/350x500?text=No+Image';
    
    card.innerHTML = `
        <div class="anime-card-image" style="background-image: url('${imageUrl}'); background-size: cover; background-position: center;"></div>
        <div class="anime-card-body">
            <h3 class="anime-card-title">${anime.title}</h3>
            <p class="anime-card-text">${anime.description || 'No description available.'}</p>
            <div class="anime-card-categories">
                ${anime.genres ? anime.genres.map(genre => `<span class="anime-card-category">${genre}</span>`).join('') : ''}
            </div>
        </div>
    `;
    
    // Add event listener to navigate to anime details
    card.addEventListener('click', function() {
        if (anime.id) {
            const firstSeason = anime.seasons && anime.seasons.length > 0 ? anime.seasons[0] : null;
            const firstEpisode = firstSeason && firstSeason.episodes && firstSeason.episodes.length > 0 ? 
                firstSeason.episodes[0] : null;
                
            if (firstSeason && firstEpisode) {
                window.location.href = `/video/${anime.id}/${firstSeason.number}/${firstEpisode.number}`;
            } else {
                showToast('This anime has no episodes available.', 'info');
            }
        }
    });
    
    return card;
}

/**
 * Initialize anime cards in the grid
 */
function initAnimeCards() {
    const animeGrid = document.querySelector('.anime-grid');
    
    if (animeGrid) {
        // Only fetch if the grid is empty (except for loaders)
        if (!animeGrid.querySelector('.anime-card')) {
            fetchAnime();
        }
    }
}

/**
 * Initialize modal functionality
 */
function initModals() {
    // Get all elements that open modals
    const modalTriggers = document.querySelectorAll('[data-toggle="modal"]');
    
    modalTriggers.forEach(trigger => {
        trigger.addEventListener('click', function(event) {
            event.preventDefault();
            
            const targetModal = document.querySelector(this.getAttribute('data-target'));
            
            if (targetModal) {
                openModal(targetModal);
            }
        });
    });
    
    // Get all modal close buttons
    const closeButtons = document.querySelectorAll('.modal-close, [data-dismiss="modal"]');
    
    closeButtons.forEach(button => {
        button.addEventListener('click', function() {
            const modal = this.closest('.modal');
            
            if (modal) {
                closeModal(modal);
            }
        });
    });
    
    // Close modal when clicking outside the content
    document.addEventListener('click', function(event) {
        if (event.target.classList.contains('modal')) {
            closeModal(event.target);
        }
    });
    
    // Close modal with ESC key
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            const openModal = document.querySelector('.modal.show');
            
            if (openModal) {
                closeModal(openModal);
            }
        }
    });
}

/**
 * Open a modal
 * @param {HTMLElement} modal - The modal element to open
 */
function openModal(modal) {
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
}

/**
 * Close a modal
 * @param {HTMLElement} modal - The modal element to close
 */
function closeModal(modal) {
    modal.classList.remove('show');
    document.body.style.overflow = '';
}

/**
 * Initialize toast notifications
 */
function initToasts() {
    // Create toast container if it doesn't exist
    if (!document.querySelector('.toast-container')) {
        const toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container';
        document.body.appendChild(toastContainer);
    }
}

/**
 * Show a toast notification
 * @param {string} message - The message to display
 * @param {string} type - The type of toast (success, error, info)
 * @param {number} duration - Duration in milliseconds before the toast disappears
 */
function showToast(message, type = 'info', duration = 3000) {
    const toastContainer = document.querySelector('.toast-container');
    
    if (!toastContainer) return;
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <div class="toast-message">${message}</div>
    `;
    
    toastContainer.appendChild(toast);
    
    // Remove toast after duration
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        
        setTimeout(() => {
            toastContainer.removeChild(toast);
        }, 300);
    }, duration);
}

/**
 * Helper function to format a timestamp to a friendly format
 * @param {string} timestamp - ISO timestamp string
 * @returns {string} Formatted date string
 */
function formatDate(timestamp) {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    
    // Check if the date is valid
    if (isNaN(date.getTime())) {
        return '';
    }
    
    return date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

/**
 * Helper function to format a duration in minutes to a friendly format
 * @param {number} minutes - Duration in minutes
 * @returns {string} Formatted duration string
 */
function formatDuration(minutes) {
    if (!minutes || isNaN(minutes)) return '';
    
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours > 0) {
        return `${hours}h ${mins}m`;
    } else {
        return `${mins}m`;
    }
}

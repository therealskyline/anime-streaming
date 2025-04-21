/**
 * Anime Zone - Search JavaScript
 * 
 * This file handles the intelligent search functionality for the Anime Zone website.
 * It provides search suggestions, autocomplete, and fuzzy matching.
 */

// Wait until the DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize the intelligent search
    initIntelligentSearch();
});

/**
 * Initialize the intelligent search functionality
 */
function initIntelligentSearch() {
    const searchInput = document.querySelector('.search-input');
    
    if (!searchInput) return;
    
    // Create a suggestions container
    const suggestionsContainer = document.createElement('div');
    suggestionsContainer.className = 'search-suggestions';
    suggestionsContainer.style.display = 'none';
    searchInput.parentNode.appendChild(suggestionsContainer);
    
    // Cache for anime titles
    let animeCache = [];
    
    // Fetch all anime titles for quick searching
    fetch('/api/anime')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            if (data.anime && Array.isArray(data.anime)) {
                animeCache = data.anime.map(anime => ({
                    id: anime.id,
                    title: anime.title,
                    image: anime.image_url || '',
                    seasons: anime.seasons || []
                }));
            }
        })
        .catch(error => {
            console.error('Error fetching anime for search:', error);
        });
    
    // Debounce function for search
    let debounceTimer;
    
    // Handle input events for search
    searchInput.addEventListener('input', function() {
        clearTimeout(debounceTimer);
        
        const query = this.value.trim();
        
        if (query.length > 1) {
            debounceTimer = setTimeout(() => {
                const suggestions = searchAnime(query, animeCache);
                displaySuggestions(suggestions, suggestionsContainer);
            }, 300);
        } else {
            suggestionsContainer.style.display = 'none';
        }
    });
    
    // Handle focus events
    searchInput.addEventListener('focus', function() {
        const query = this.value.trim();
        
        if (query.length > 1) {
            const suggestions = searchAnime(query, animeCache);
            displaySuggestions(suggestions, suggestionsContainer);
        }
    });
    
    // Close suggestions when clicking outside
    document.addEventListener('click', function(event) {
        if (!event.target.closest('.search-container')) {
            suggestionsContainer.style.display = 'none';
        }
    });
    
    // Handle keyboard navigation
    searchInput.addEventListener('keydown', function(event) {
        const suggestions = suggestionsContainer.querySelectorAll('.suggestion-item');
        
        if (suggestions.length === 0) return;
        
        // Find the currently selected suggestion
        const currentSelected = suggestionsContainer.querySelector('.suggestion-item.selected');
        let currentIndex = -1;
        
        if (currentSelected) {
            currentIndex = Array.from(suggestions).indexOf(currentSelected);
        }
        
        // Navigate based on key pressed
        switch (event.key) {
            case 'ArrowDown':
                event.preventDefault();
                if (currentIndex < suggestions.length - 1) {
                    // Select next
                    if (currentSelected) {
                        currentSelected.classList.remove('selected');
                    }
                    suggestions[currentIndex + 1].classList.add('selected');
                }
                break;
                
            case 'ArrowUp':
                event.preventDefault();
                if (currentIndex > 0) {
                    // Select previous
                    if (currentSelected) {
                        currentSelected.classList.remove('selected');
                    }
                    suggestions[currentIndex - 1].classList.add('selected');
                }
                break;
                
            case 'Enter':
                if (currentSelected) {
                    event.preventDefault();
                    const animeId = currentSelected.getAttribute('data-id');
                    const seasonNumber = currentSelected.getAttribute('data-season');
                    const episodeNumber = currentSelected.getAttribute('data-episode');
                    
                    if (animeId && seasonNumber && episodeNumber) {
                        window.location.href = `/video/${animeId}/${seasonNumber}/${episodeNumber}`;
                    }
                }
                break;
                
            case 'Escape':
                suggestionsContainer.style.display = 'none';
                break;
        }
    });
}

/**
 * Search anime based on a query
 * @param {string} query - The search query
 * @param {Array} animeCache - The cached anime data
 * @returns {Array} Matched anime suggestions
 */
function searchAnime(query, animeCache) {
    if (!query || query.length < 2 || !animeCache || !Array.isArray(animeCache)) {
        return [];
    }
    
    query = query.toLowerCase();
    
    // Find matches using fuzzy search
    const matches = animeCache.filter(anime => {
        // Check for exact match
        if (anime.title.toLowerCase().includes(query)) {
            return true;
        }
        
        // Check for approximate match (fuzzy)
        return calculateLevenshteinDistance(query, anime.title.toLowerCase()) <= Math.max(2, Math.floor(query.length / 3));
    });
    
    // Sort matches by relevance
    return matches.sort((a, b) => {
        // Exact matches first
        const aExact = a.title.toLowerCase().includes(query);
        const bExact = b.title.toLowerCase().includes(query);
        
        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;
        
        // Then by Levenshtein distance
        const aDistance = calculateLevenshteinDistance(query, a.title.toLowerCase());
        const bDistance = calculateLevenshteinDistance(query, b.title.toLowerCase());
        
        if (aDistance !== bDistance) {
            return aDistance - bDistance;
        }
        
        // Then by title length (shorter titles first)
        return a.title.length - b.title.length;
    }).slice(0, 5); // Limit to 5 suggestions
}

/**
 * Calculate the Levenshtein distance between two strings
 * @param {string} a - First string
 * @param {string} b - Second string
 * @returns {number} The Levenshtein distance
 */
function calculateLevenshteinDistance(a, b) {
    // Create a matrix
    const matrix = Array(b.length + 1).fill().map(() => Array(a.length + 1).fill(0));
    
    // Initialize the matrix
    for (let i = 0; i <= a.length; i++) {
        matrix[0][i] = i;
    }
    
    for (let j = 0; j <= b.length; j++) {
        matrix[j][0] = j;
    }
    
    // Fill the matrix
    for (let j = 1; j <= b.length; j++) {
        for (let i = 1; i <= a.length; i++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            matrix[j][i] = Math.min(
                matrix[j][i - 1] + 1, // deletion
                matrix[j - 1][i] + 1, // insertion
                matrix[j - 1][i - 1] + cost // substitution
            );
        }
    }
    
    return matrix[b.length][a.length];
}

/**
 * Display search suggestions
 * @param {Array} suggestions - The search suggestions
 * @param {HTMLElement} container - The container to display suggestions in
 */
function displaySuggestions(suggestions, container) {
    if (!container) return;
    
    // Clear previous suggestions
    container.innerHTML = '';
    
    if (suggestions.length === 0) {
        container.style.display = 'none';
        return;
    }
    
    // Add each suggestion
    suggestions.forEach(anime => {
        // Get the first season and episode for navigation
        const firstSeason = anime.seasons && anime.seasons.length > 0 ? anime.seasons[0] : null;
        const firstEpisode = firstSeason && firstSeason.episodes && firstSeason.episodes.length > 0 ? 
            firstSeason.episodes[0] : null;
            
        if (firstSeason && firstEpisode) {
            const suggestionItem = document.createElement('div');
            suggestionItem.className = 'suggestion-item';
            suggestionItem.setAttribute('data-id', anime.id);
            suggestionItem.setAttribute('data-season', firstSeason.number);
            suggestionItem.setAttribute('data-episode', firstEpisode.number);
            
            suggestionItem.innerHTML = `
                <div class="suggestion-image" style="background-image: url('${anime.image || ''}')"></div>
                <div class="suggestion-details">
                    <div class="suggestion-title">${anime.title}</div>
                </div>
            `;
            
            // Add click event
            suggestionItem.addEventListener('click', function() {
                window.location.href = `/video/${anime.id}/${firstSeason.number}/${firstEpisode.number}`;
            });
            
            container.appendChild(suggestionItem);
        }
    });
    
    // Display the suggestions container
    container.style.display = 'block';
    
    // Add styles for suggestions container if not already added
    if (!document.getElementById('search-suggestions-style')) {
        const style = document.createElement('style');
        style.id = 'search-suggestions-style';
        style.textContent = `
            .search-suggestions {
                position: absolute;
                top: 100%;
                left: 0;
                width: 100%;
                background-color: var(--background-card);
                border-radius: 4px;
                box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
                z-index: 1000;
                max-height: 300px;
                overflow-y: auto;
                margin-top: 5px;
            }
            
            .suggestion-item {
                display: flex;
                align-items: center;
                padding: 0.75rem;
                border-bottom: 1px solid var(--border-color);
                cursor: pointer;
                transition: background-color 0.2s ease;
            }
            
            .suggestion-item:last-child {
                border-bottom: none;
            }
            
            .suggestion-item:hover, .suggestion-item.selected {
                background-color: rgba(255, 255, 255, 0.05);
            }
            
            .suggestion-image {
                width: 40px;
                height: 40px;
                border-radius: 4px;
                background-color: #333;
                background-size: cover;
                background-position: center;
                margin-right: 0.75rem;
            }
            
            .suggestion-title {
                font-weight: 600;
            }
        `;
        document.head.appendChild(style);
    }
}

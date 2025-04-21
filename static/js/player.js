/**
 * Anime Zone - Video Player JavaScript
 * 
 * This file handles the functionality specific to the video player page,
 * including episode navigation, download functionality, and season selection.
 */

// Wait until the DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize the video player
    initVideoPlayer();
    
    // Initialize episode navigation
    initEpisodeNavigation();
    
    // Initialize download buttons
    initDownloadButtons();
    
    // Initialize season dropdown
    initSeasonDropdown();
    
    // Initialize episode cards
    initEpisodeCards();
    
    // Initialize season download modal
    initSeasonDownloadModal();
});

/**
 * Initialize the video player
 */
function initVideoPlayer() {
    const videoPlayer = document.querySelector('.video-player');
    const loadingIndicator = document.getElementById('player-loading');
    const fullscreenBtn = document.getElementById('fullscreen-btn');
    const directDownloadBtn = document.getElementById('direct-download-btn');
    const videoPlayerWrapper = document.querySelector('.video-player-wrapper');
    
    if (videoPlayer) {
        // Show loading indicator initially
        if (loadingIndicator) {
            loadingIndicator.style.display = 'flex';
        }
        
        // Log when the iframe loads
        videoPlayer.addEventListener('load', function() {
            console.log('Video player iframe loaded');
            
            // Hide the loading indicator
            if (loadingIndicator) {
                loadingIndicator.style.display = 'none';
            }
            
            // Verify if the iframe loaded properly by checking if we can access contentWindow
            try {
                if (videoPlayer.contentWindow) {
                    // Successfully loaded
                    showToast('Video loaded successfully', 'success');
                    
                    // Try to hide the external window button in Google Drive iframe
                    setTimeout(() => {
                        try {
                            const iframeDoc = videoPlayer.contentDocument || videoPlayer.contentWindow.document;
                            if (iframeDoc) {
                                const style = iframeDoc.createElement('style');
                                style.textContent = '.ndfHFb-c4YZDc-Wrql6b { display: none !important; }';
                                iframeDoc.head.appendChild(style);
                            }
                        } catch (e) {
                            console.log("Couldn't access iframe content due to cross-origin policy");
                        }
                    }, 2000);
                }
            } catch (error) {
                console.error('Error accessing iframe content:', error);
                handleVideoError();
            }
        });
        
        // Add error handling
        videoPlayer.addEventListener('error', function(e) {
            console.error('Video player error:', e);
            handleVideoError();
        });
        
        // Force iframe reload if it doesn't load properly after 5 seconds
        setTimeout(function() {
            try {
                // Check if iframe is accessible
                if (loadingIndicator && loadingIndicator.style.display !== 'none') {
                    console.log('Video taking too long to load, attempting reload');
                    // Try to reload with a different approach
                    const currentSrc = videoPlayer.src;
                    videoPlayer.src = 'about:blank';
                    setTimeout(() => {
                        videoPlayer.src = currentSrc;
                    }, 100);
                }
            } catch (error) {
                console.error('Error checking iframe load status:', error);
            }
        }, 8000);
        
        // Create a message listener for possible iframe messages
        window.addEventListener('message', function(event) {
            // Check if message is from our iframe
            if (event.source === videoPlayer.contentWindow) {
                console.log('Received message from iframe:', event.data);
                
                // Handle specific messages if needed
                if (event.data && event.data.status === 'error') {
                    handleVideoError();
                }
            }
        });
        
        // Handle fullscreen button
        if (fullscreenBtn) {
            fullscreenBtn.addEventListener('click', function() {
                if (videoPlayerWrapper.requestFullscreen) {
                    videoPlayerWrapper.requestFullscreen();
                } else if (videoPlayerWrapper.webkitRequestFullscreen) { /* Safari */
                    videoPlayerWrapper.webkitRequestFullscreen();
                } else if (videoPlayerWrapper.msRequestFullscreen) { /* IE11 */
                    videoPlayerWrapper.msRequestFullscreen();
                }
            });
        }
        
        // Handle direct download button
        if (directDownloadBtn) {
            directDownloadBtn.addEventListener('click', function() {
                // Get the original video URL from the iframe src
                let videoUrl = videoPlayer.src;
                // Convert from /preview to /view for direct download
                videoUrl = videoUrl.replace('/preview', '/view');
                
                // For direct download, we need to open in a new tab first
                // then the browser will handle the download automatically
                const downloadWindow = window.open(videoUrl, '_blank');
                
                // Show success message
                showToast('Téléchargement démarré', 'success');
            });
        }
    }
}

/**
 * Handle video loading errors
 */
function handleVideoError() {
    const loadingIndicator = document.getElementById('player-loading');
    if (loadingIndicator) {
        loadingIndicator.style.display = 'none';
    }
    
    showToast('Video failed to load. The video might be unavailable or restricted.', 'error', 5000);
    
    // Provide visual indicator in the player
    const videoWrapper = document.querySelector('.video-player-wrapper');
    if (videoWrapper) {
        const errorMessage = document.createElement('div');
        errorMessage.className = 'video-error-message';
        errorMessage.innerHTML = `
            <i class="fas fa-exclamation-triangle"></i>
            <h3>Video Unavailable</h3>
            <p>This video cannot be loaded. It might be restricted or no longer available.</p>
            <button class="btn retry-button">Retry</button>
        `;
        
        // Remove loading indicator and player
        if (loadingIndicator) {
            loadingIndicator.style.display = 'none';
        }
        
        // Add error message to DOM
        videoWrapper.appendChild(errorMessage);
        
        // Add retry functionality
        const retryButton = errorMessage.querySelector('.retry-button');
        if (retryButton) {
            retryButton.addEventListener('click', function() {
                // Remove error message
                errorMessage.remove();
                
                // Show loading indicator
                if (loadingIndicator) {
                    loadingIndicator.style.display = 'flex';
                }
                
                // Reload iframe with a fresh request
                const videoPlayer = document.querySelector('.video-player');
                if (videoPlayer) {
                    const currentSrc = videoPlayer.src;
                    videoPlayer.src = 'about:blank';
                    setTimeout(() => {
                        videoPlayer.src = currentSrc + (currentSrc.includes('?') ? '&' : '?') + '_t=' + new Date().getTime();
                    }, 500);
                }
            });
        }
    }
}

/**
 * Initialize episode navigation
 */
function initEpisodeNavigation() {
    const prevButton = document.querySelector('.video-nav-prev');
    const nextButton = document.querySelector('.video-nav-next');
    
    if (prevButton) {
        prevButton.addEventListener('click', function() {
            if (!this.classList.contains('disabled')) {
                const prevUrl = this.getAttribute('data-href');
                if (prevUrl) {
                    window.location.href = prevUrl;
                }
            }
        });
    }
    
    if (nextButton) {
        nextButton.addEventListener('click', function() {
            if (!this.classList.contains('disabled')) {
                const nextUrl = this.getAttribute('data-href');
                if (nextUrl) {
                    window.location.href = nextUrl;
                }
            }
        });
    }
}

/**
 * Initialize download buttons
 */
function initDownloadButtons() {
    const downloadButton = document.querySelector('.video-action-btn.download');
    
    if (downloadButton) {
        downloadButton.addEventListener('click', function() {
            const downloadUrl = this.getAttribute('data-url');
            
            if (downloadUrl) {
                // Use direct download URL formatted as https://drive.google.com/uc?export=download&id=FILE_ID
                try {
                    // Create a standard anchor element for more reliable download
                    const downloadLink = document.createElement('a');
                    downloadLink.href = downloadUrl;
                    downloadLink.setAttribute('download', ''); // Force download attribute
                    downloadLink.target = '_blank';
                    
                    // Add to the DOM and trigger click
                    document.body.appendChild(downloadLink);
                    downloadLink.click();
                    
                    // Clean up
                    setTimeout(() => {
                        document.body.removeChild(downloadLink);
                    }, 100);
                    
                    // Show success toast
                    showToast('Téléchargement démarré!', 'success');
                } catch (e) {
                    console.error('Download error:', e);
                    // Fallback to window.open if iframe method fails
                    window.open(downloadUrl, '_blank');
                    showToast('Téléchargement ouvert dans un nouvel onglet', 'info');
                }
            } else {
                showToast('URL de téléchargement non disponible', 'error');
            }
        });
    }
    
    // Season download button
    const seasonDownloadButton = document.querySelector('.video-action-btn.season-download');
    
    if (seasonDownloadButton) {
        seasonDownloadButton.addEventListener('click', function() {
            const modalId = this.getAttribute('data-target');
            const modal = document.querySelector(modalId);
            
            if (modal) {
                openModal(modal);
            }
        });
    }
}

/**
 * Initialize season dropdown
 */
function initSeasonDropdown() {
    const seasonDropdownBtn = document.querySelector('.season-dropdown-btn');
    const seasonDropdownContent = document.querySelector('.season-dropdown-content');
    
    if (seasonDropdownBtn && seasonDropdownContent) {
        // Toggle dropdown on click
        seasonDropdownBtn.addEventListener('click', function(event) {
            event.preventDefault();
            event.stopPropagation();
            seasonDropdownContent.style.display = seasonDropdownContent.style.display === 'block' ? 'none' : 'block';
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', function(event) {
            if (!event.target.closest('.season-dropdown')) {
                seasonDropdownContent.style.display = 'none';
            }
        });
    }
}

/**
 * Initialize episode cards
 */
function initEpisodeCards() {
    const episodeCards = document.querySelectorAll('.episode-card');
    
    episodeCards.forEach(card => {
        card.addEventListener('click', function() {
            const episodeUrl = this.getAttribute('data-href');
            
            if (episodeUrl) {
                window.location.href = episodeUrl;
            }
        });
    });
}

/**
 * Initialize the season download modal
 */
function initSeasonDownloadModal() {
    const downloadAllBtn = document.querySelector('.download-all-btn');
    const individualDownloadBtns = document.querySelectorAll('.download-item-btn');
    
    if (downloadAllBtn) {
        downloadAllBtn.addEventListener('click', function() {
            // Get all download links
            const downloadLinks = Array.from(document.querySelectorAll('.download-item-btn')).map(btn => btn.getAttribute('data-url'));
            
            // Check if we have any download links
            if (downloadLinks.length > 0) {
                // Create a delay between each download to avoid browser blocking
                downloadLinks.forEach((url, index) => {
                    setTimeout(() => {
                        startDownload(url);
                    }, index * 1000); // 1 second delay between each download
                });
                
                showToast(`Started downloading ${downloadLinks.length} episodes`, 'success');
                
                // Close the modal after starting downloads
                const modal = document.querySelector('.season-download-modal');
                if (modal) {
                    closeModal(modal);
                }
            } else {
                showToast('No episodes available for download', 'error');
            }
        });
    }
    
    if (individualDownloadBtns) {
        individualDownloadBtns.forEach(btn => {
            btn.addEventListener('click', function(event) {
                event.preventDefault();
                event.stopPropagation();
                
                const downloadUrl = this.getAttribute('data-url');
                
                if (downloadUrl) {
                    startDownload(downloadUrl);
                    showToast('Download started!', 'success');
                } else {
                    showToast('Download URL not available', 'error');
                }
            });
        });
    }
}

/**
 * Start a download with the given URL
 * @param {string} url - The URL to download
 */
function startDownload(url) {
    if (!url) return;
    
    try {
        // For all URLs, use the anchor element approach first (most reliable)
        const downloadLink = document.createElement('a');
        downloadLink.href = url;
        downloadLink.setAttribute('download', ''); // Force download attribute
        downloadLink.target = '_blank';
        
        // Add to DOM and click
        document.body.appendChild(downloadLink);
        downloadLink.click();
        
        // Clean up
        setTimeout(() => {
            document.body.removeChild(downloadLink);
        }, 100);
    } catch (e) {
        console.error('Download error:', e);
        
        // Fallback methods based on URL type
        if (url.includes('drive.google.com/uc?export=download')) {
            // Fallback for Google Drive direct export URLs
            window.location.href = url;
        } else {
            // For other URLs, just convert /preview to /view and open in new tab
            const directDownloadUrl = url.includes('/preview') ? 
                                    url.replace('/preview', '/view') : 
                                    url;
            
            // Open in a new tab
            window.open(directDownloadUrl, '_blank');
        }
    }
}

/**
 * Helper function to extract video ID from Google Drive URL
 * @param {string} url - Google Drive URL
 * @returns {string|null} Video ID or null if not found
 */
function extractGoogleDriveId(url) {
    if (!url) return null;
    
    // Try to match the file ID pattern in Google Drive URLs
    const fileIdMatch = url.match(/\/file\/d\/([^\/]+)/);
    if (fileIdMatch && fileIdMatch[1]) {
        return fileIdMatch[1];
    }
    
    // Try to match the ID parameter
    const idParamMatch = url.match(/[?&]id=([^&]+)/);
    if (idParamMatch && idParamMatch[1]) {
        return idParamMatch[1];
    }
    
    return null;
}

/**
 * Show a toast notification
 * @param {string} message - The message to display
 * @param {string} type - The type of toast (success, error, info)
 * @param {number} duration - Duration in milliseconds before the toast disappears
 */
function showToast(message, type = 'info', duration = 3000) {
    // Check if the toast container exists, if not create it
    let toastContainer = document.querySelector('.toast-container');
    
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container';
        document.body.appendChild(toastContainer);
    }
    
    // Create the toast element
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <div class="toast-message">${message}</div>
    `;
    
    // Add the toast to the container
    toastContainer.appendChild(toast);
    
    // Remove the toast after the specified duration
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        
        setTimeout(() => {
            toastContainer.removeChild(toast);
        }, 300);
    }, duration);
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

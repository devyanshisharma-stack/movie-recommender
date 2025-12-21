document.addEventListener('DOMContentLoaded', function() {
    // Tab switching functionality
    const tabButtons = document.querySelectorAll('.tab-button');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove active class from all buttons and panes
            document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
            document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
            
            // Add active class to clicked button
            this.classList.add('active');
            
            // Show corresponding tab content
            const tabId = this.getAttribute('data-tab');
            document.getElementById(tabId).classList.add('active');
        });
    });

    const ratingButtons = document.querySelectorAll(".rating-type");
    ratingButtons.forEach(button => {
        button.addEventListener('click', function() {
            document.querySelectorAll(".rating-type").forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
        });
    });
    setupSearch();
    setupExport();
});

function clearPreferences() {
    userRatings = {};
    displayRatedMovies();
    localStorage.removeItem('userRatings')
}

// Movie card rendering function
function createMovieCard(movie, initialRating = 0) {
    const card = document.createElement('div');
    card.className = 'movie-card';
    card.dataset.movieId = movie.movieId;
    
    card.innerHTML = `
        <img src="${movie.poster}" alt="${movie.title}" class="movie-poster">
        <div class="movie-info">
            <div class="movie-title">${movie.title}</div>
            <div class="movie-year">${movie.year}</div>
            <div class="movie-genres">${movie.genres.join(', ')}</div>
            <div class="star-rating" data-movie-id="${movie.movieId}">
                ${generateStars(initialRating)}
            </div>
        </div>
    `;
    
    // Add star rating functionality
    const stars = card.querySelectorAll('.star');
    stars.forEach((star, index) => {
        star.addEventListener('click', () => {
            // Update visual stars
            updateStars(card, index + 1);
            // Save rating
            saveRating(movie.movieId, index + 1);
            // Update export button
            updateExportButton();
        });
    });
    
    return card;
}

// Generate star HTML
function generateStars(rating = 0) {
    let starsHtml = '';
    for (let i = 1; i <= 5; i++) {
        const starClass = i <= rating ? 'star filled' : 'star';
        starsHtml += `<i class="fas fa-star ${starClass}" data-rating="${i}"></i>`;
    }
    return starsHtml;
}

// Update stars visual state
function updateStars(cardElement, rating) {
    const stars = cardElement.querySelectorAll('.star');
    stars.forEach((star, index) => {
        if (index < rating) {
            star.classList.add('filled');
        } else {
            star.classList.remove('filled');
        }
    });
}

// Global variables
let popularMovies = [];
let allMovies = [];
let userRatings = {};

// Load movie data
async function loadMovieData() {
    try {
        const response = await fetch('popular.json');
        const data = await response.json();
        popularMovies = data;

        const allResponse = await fetch('all.json');
        const allData = await allResponse.json();
        allMovies = allData;
        allMovies.sort((a, b) => b.count - a.count)
        
        // Load any existing ratings from localStorage
        const savedRatings = localStorage.getItem('movieRatings');
        if (savedRatings) {
            userRatings = JSON.parse(savedRatings);
            displayRatedMovies();
        }
        
        // Populate curated selection
        populateCuratedMovies();
    } catch (error) {
        console.error('Error loading movie data:', error);
    }
}

// Populate curated movies section
function populateCuratedMovies() {
    const curatedContainer = document.getElementById('curated-movies');
    curatedContainer.innerHTML = '';
    
    // Select 12 diverse movies (we would implement genre balancing logic here)
    const curatedSelection = selectDiverseMovies(10);
    
    curatedSelection.forEach(movie => {
        const existingRating = userRatings[movie.movieId] || 0;
        const card = createMovieCard(movie, existingRating);
        curatedContainer.appendChild(card);
    });
}

// Simple diverse movie selection (placeholder for more sophisticated logic)
function selectDiverseMovies(count) {
    // This would be more sophisticated in the final version
    popularMovies.sort(() => 0.5 - Math.random())
    return popularMovies.slice(0, count);
}

// Call loadMovieData when the page loads
document.addEventListener('DOMContentLoaded', function() {
    // Tab code we added earlier
    
    // Load movie data
    loadMovieData();
});

// Set up search functionality
function setupSearch() {
    const searchInput = document.getElementById('movie-search');
    const searchResults = document.getElementById('search-results');
    const addButton = document.getElementById('add-movie');
    
    // Search input handler
    searchInput.addEventListener('input', debounce(function() {
        const query = this.value.trim().toLowerCase();
        if (query.length < 2) {
            searchResults.style.display = 'none';
            return;
        }
        
        // Filter movies based on search
        const matches = allMovies.filter(movie => 
            movie.title.toLowerCase().includes(query)
        ).slice(0, 5); // Show top 5 matches
        
        displaySearchResults(matches);
    }, 300));
    
    // Add movie button handler
    addButton.addEventListener('click', function() {
        const selectedMovie = document.querySelector('.search-result.selected');
        if (!selectedMovie) return;
        
        const movieId = selectedMovie.dataset.movieId;
        const movie = allMovies.find(m => m.movieId == movieId);
        
        // Get current selected rating type (love/hate)
        const ratingType = document.querySelector('.rating-type.active');
        const rating = parseInt(ratingType.dataset.rating);
        
        // Save rating
        saveRating(movieId, rating);
        
        // Clear search
        searchInput.value = '';
        searchResults.style.display = 'none';
        
        // Update display
        displayRatedMovies();
    });
}

// Display search results
function displaySearchResults(movies) {
    console.log("Time to display something!")
    const searchResults = document.getElementById('search-results');
    searchResults.innerHTML = '';
    searchResults.style.display = movies.length ? 'block' : 'none';
    
    movies.forEach(movie => {
        const item = document.createElement('div');
        item.className = 'search-result';
        item.dataset.movieId = movie.movieId;
        item.innerHTML = `
            <div class="search-result-title">${movie.title} (${movie.year})</div>
        `;
        
        item.addEventListener('click', function() {
            // Remove selection from all results
            document.querySelectorAll('.search-result').forEach(r => 
                r.classList.remove('selected'));
            // Add selection to this result
            this.classList.add('selected');
        });
        
        searchResults.appendChild(item);
    });
}

// Debounce function to prevent excessive search requests
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}


// Save a movie rating
function saveRating(movieId, rating) {
    userRatings[movieId] = rating;
    localStorage.setItem('movieRatings', JSON.stringify(userRatings));
}

// Display already rated movies
function displayRatedMovies() {
    const container = document.getElementById('rated-movies-list');
    container.innerHTML = '';
    
    // Get all rated movies
    const ratedMovieIds = Object.keys(userRatings);
    const ratedMovies = ratedMovieIds.map(id => {
        const movie = allMovies.find(m => m.movieId == id);
        return { ...movie, userRating: userRatings[id] };
    });
    
    // Display them
    ratedMovies.forEach(movie => {
        const card = createMovieCard(movie, movie.userRating);
        container.appendChild(card);
    });
    
    // Update export button state
    updateExportButton();
}

// Update export button state
function updateExportButton() {
    const exportButton = document.getElementById('export-button');
    const ratedMoviesCount = Object.keys(userRatings).length;
    
    exportButton.disabled = ratedMoviesCount < 5;
    
    // Update the export note
    const exportNote = document.querySelector('.export-note');
    if (ratedMoviesCount < 5) {
        exportNote.textContent = `Rate ${5 - ratedMoviesCount} more movie(s) to enable export`;
    } else {
        exportNote.textContent = `${ratedMoviesCount} movies rated - ready to export!`;
    }
}

// Set up export functionality
function setupExport() {
    const exportButton = document.getElementById('export-button');
    
    exportButton.addEventListener('click', function() {
        // Format data for the recommender system
        const formattedRatings = formatRatingsForExport();
        
        // Create and download file
        downloadObjectAsJson(formattedRatings, 'my_movie_ratings');
    });
}

// Format ratings for export
function formatRatingsForExport() {
    // Format ratings as a simple dictionary mapping movie IDs to ratings
    return {
        [generateUserId()]: userRatings
    };
}

// Generate a random user ID
function generateUserId() {
    return 123456789;
}

// Download object as JSON file
function downloadObjectAsJson(exportObj, exportName) {
    const dataStr = "data:text/json;charset=utf-8," + 
                    encodeURIComponent(JSON.stringify(exportObj));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", exportName + ".json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}


// Add to your JavaScript
async function loadRecommendations() {

    try {
        const response = await fetch('out/recommendations.json');
        const recommendations = await response.json();
        displayRecommendations(recommendations);
    } catch (error) {
        console.error('Error loading movie data:', error);
    }
}

function displayRecommendations(recommendations) {
    const container = document.getElementById('recommendations-display');
    container.innerHTML = '';
    
    // Create section for similar user
    const similarUserSection = document.createElement('div');
    similarUserSection.className = 'similar-user-section';
    similarUserSection.innerHTML = `
        <h3>Most Similar User</h3>
        <p>User #${recommendations.similar_user} has similar movie preferences!</p>
    `;

    const comparisonTable = displayPreferenceComparison(
        recommendations.your_prefs,
        recommendations.similar_user_prefs
    );
    similarUserSection.appendChild(comparisonTable);
    
    // Create recommendations section
    const recommendationsSection = document.createElement('div');
    recommendationsSection.className = 'recommendations-section';
    recommendationsSection.innerHTML = '<h3>Recommended Movies</h3>';
    
    // Create grid for recommended movies
    const movieGrid = document.createElement('div');
    movieGrid.className = 'movie-grid';
    
    // Find full movie info for each recommended title
    const recommendedMovies = recommendations.recommended_movies.map(title => 
        (allMovies.find(movie => movie.title === title)) ?? {
            title: title,
            poster: "",
            year: "????",
            genres: [],
            tagline: "????"
        }
    ).filter(movie => movie); // Filter out any undefined results
    
    // Populate the grid with movie cards
    recommendedMovies.forEach(movie => {
        const movieCard = document.createElement('div');
        movieCard.className = 'movie-card';
        movieCard.innerHTML = `
            <img src="${movie.poster}" alt="${movie.title}" class="movie-poster">
            <div class="movie-info">
                <div class="movie-title">${movie.title}</div>
                <div class="movie-year">${movie.year}</div>
                <div class="movie-genres">${movie.genres.join(', ')}</div>
                <div class="movie-tagline">${movie.tagline}</div>
            </div>
        `;
        movieGrid.appendChild(movieCard);
    });
    
    recommendationsSection.appendChild(movieGrid);
    
    // Add sections to container
    container.appendChild(similarUserSection);
    container.appendChild(recommendationsSection);
    
    // Add explanation section
    const explanationSection = document.createElement('div');
    explanationSection.className = 'explanation-section';
    explanationSection.innerHTML = `
        <h3>How These Recommendations Work</h3>
        <p>Your recommendation algorithm found a user with similar genre preferences 
        and suggested their highest-rated movies that you haven't seen yet.</p>
    `;
    
    container.appendChild(explanationSection);
}

function displayPreferenceComparison(userPrefs, similarUserPrefs) {
    // Create table container
    const container = document.createElement('div');
    container.className = 'preference-comparison';
    container.innerHTML = '<h3>Genre Preference Comparison</h3>';
    
    // Create table
    const table = document.createElement('table');
    table.className = 'preference-table';
    
    // Add table header
    const thead = document.createElement('thead');
    thead.innerHTML = `
        <tr>
            <th>Genre</th>
            <th>Your Rating</th>
            <th>Similar User</th>
        </tr>
    `;
    table.appendChild(thead);
    
    // Get all genres from both users
    const allGenres = [...new Set([
        ...Object.keys(userPrefs),
        ...Object.keys(similarUserPrefs)
    ])].sort();
    
    // Create table body
    const tbody = document.createElement('tbody');
    
    allGenres.forEach(genre => {
        const userRating = userPrefs[genre] || 0;
        const similarRating = similarUserPrefs[genre] || 0;
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${genre}</td>
            <td>${userRating.toFixed(1)}</td>
            <td>${similarRating.toFixed(1)}</td>
        `;
        
        // Highlight stronger matches
        if (Math.abs(userRating - similarRating) < 0.5) {
            row.classList.add('strong-match');
        }
        
        tbody.appendChild(row);
    });
    
    table.appendChild(tbody);
    container.appendChild(table);
    
    return container;
}

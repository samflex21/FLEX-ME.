// Slider functionality
function initializeSlider() {
    const slides = document.querySelectorAll('.slide');
    const dots = document.querySelectorAll('.dot');
    let currentSlide = 0;
    const slideInterval = 8000; // Change slide every 8 seconds
    let intervalId;

    function showSlide(index) {
        slides.forEach(slide => {
            slide.classList.remove('active');
            slide.style.opacity = '0';
        });
        dots.forEach(dot => dot.classList.remove('active'));

        slides[index].classList.add('active');
        slides[index].style.opacity = '1';
        dots[index].classList.add('active');
    }

    function nextSlide() {
        currentSlide = (currentSlide + 1) % slides.length;
        showSlide(currentSlide);
    }

    // Add click event to dots
    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            currentSlide = index;
            showSlide(currentSlide);
            clearInterval(intervalId);
            intervalId = setInterval(nextSlide, slideInterval);
        });
    });

    // Start automatic sliding
    showSlide(currentSlide);
    intervalId = setInterval(nextSlide, slideInterval);

    // Pause on hover
    const sliderContainer = document.querySelector('.slider-container');
    sliderContainer.addEventListener('mouseenter', () => clearInterval(intervalId));
    sliderContainer.addEventListener('mouseleave', () => {
        intervalId = setInterval(nextSlide, slideInterval);
    });
}

// Particle effect for buttons
function createParticle(e) {
    const particle = $('<div class="particle"></div>');
    const size = Math.random() * 10 + 5;
    const x = e.pageX;
    const y = e.pageY;

    particle.css({
        width: size,
        height: size,
        left: x,
        top: y,
        opacity: 1,
        position: 'absolute',
        borderRadius: '50%',
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        pointerEvents: 'none'
    });

    $('body').append(particle);

    particle.animate({
        top: '-=100',
        opacity: 0
    }, 1000, function() {
        $(this).remove();
    });
}

// Initialize home page functionality
document.addEventListener('DOMContentLoaded', function() {
    // Initialize slider
    initializeSlider();

    // Add particle effect to buttons
    $('#loginButton, #signupButton, #getStartedButton').on('click', function(e) {
        createParticle(e);
    });

    // Check authentication status
    checkAuthStatus();

    // Update featured campaigns if they exist
    const featuredCampaigns = document.querySelector('.featured-campaigns');
    if (featuredCampaigns) {
        const campaigns = getCampaigns('active').slice(0, 3); // Get top 3 active campaigns
        displayFeaturedCampaigns(campaigns);
    }
});

// Display featured campaigns
function displayFeaturedCampaigns(campaigns) {
    const container = document.querySelector('.featured-campaigns');
    if (!container || !campaigns.length) return;

    const campaignsHTML = campaigns.map(campaign => `
        <div class="campaign-card">
            <div class="campaign-image">
                <img src="${campaign.image || 'images/default-campaign.jpg'}" alt="${campaign.title}">
            </div>
            <div class="campaign-content">
                <h3>${campaign.title}</h3>
                <p>${campaign.description.substring(0, 100)}...</p>
                <div class="campaign-progress">
                    <div class="progress-bar" style="width: ${(campaign.currentAmount / campaign.targetAmount) * 100}%"></div>
                </div>
                <div class="campaign-stats">
                    <span>€${campaign.currentAmount} raised</span>
                    <span>of €${campaign.targetAmount}</span>
                </div>
                <a href="campaign-details.html?id=${campaign.id}" class="btn btn-primary">Learn More</a>
            </div>
        </div>
    `).join('');

    container.innerHTML = campaignsHTML;
}

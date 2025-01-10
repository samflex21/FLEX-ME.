// Initialize animations for about page
function initializeAnimations() {
    // Animate statistics on scroll
    const stats = document.querySelectorAll('.stat-number');
    const animationDuration = 2000; // 2 seconds

    function animateStats() {
        stats.forEach(stat => {
            const target = parseInt(stat.getAttribute('data-target'));
            const increment = target / (animationDuration / 16); // 60fps
            let current = 0;

            const updateCount = () => {
                if (current < target) {
                    current += increment;
                    stat.textContent = Math.round(current).toLocaleString();
                    requestAnimationFrame(updateCount);
                } else {
                    stat.textContent = target.toLocaleString();
                }
            };

            updateCount();
        });
    }

    // Animate team members on scroll
    function animateTeamMembers() {
        const teamMembers = document.querySelectorAll('.team-member');
        teamMembers.forEach((member, index) => {
            setTimeout(() => {
                member.classList.add('visible');
            }, index * 200);
        });
    }

    // Intersection Observer for animations
    const observerOptions = {
        threshold: 0.2
    };

    const statsObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateStats();
                statsObserver.unobserve(entry.target);
            }
        });
    }, observerOptions);

    const teamObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateTeamMembers();
                teamObserver.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Observe elements
    const statsSection = document.querySelector('.statistics');
    const teamSection = document.querySelector('.team-section');

    if (statsSection) statsObserver.observe(statsSection);
    if (teamSection) teamObserver.observe(teamSection);
}

// Handle FAQ accordion
function initializeFAQ() {
    const faqItems = document.querySelectorAll('.faq-item');
    
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        const answer = item.querySelector('.faq-answer');
        
        question.addEventListener('click', () => {
            // Close other open items
            faqItems.forEach(otherItem => {
                if (otherItem !== item) {
                    otherItem.classList.remove('active');
                    otherItem.querySelector('.faq-answer').style.maxHeight = null;
                }
            });

            // Toggle current item
            item.classList.toggle('active');
            if (item.classList.contains('active')) {
                answer.style.maxHeight = answer.scrollHeight + 'px';
            } else {
                answer.style.maxHeight = null;
            }
        });
    });
}

// Handle testimonial slider
function initializeTestimonials() {
    const testimonials = document.querySelectorAll('.testimonial');
    const dots = document.querySelectorAll('.testimonial-dot');
    let currentTestimonial = 0;
    const interval = 5000; // Change testimonial every 5 seconds

    function showTestimonial(index) {
        testimonials.forEach(testimonial => testimonial.classList.remove('active'));
        dots.forEach(dot => dot.classList.remove('active'));

        testimonials[index].classList.add('active');
        dots[index].classList.add('active');
    }

    // Add click events to dots
    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            currentTestimonial = index;
            showTestimonial(currentTestimonial);
        });
    });

    // Auto-advance testimonials
    setInterval(() => {
        currentTestimonial = (currentTestimonial + 1) % testimonials.length;
        showTestimonial(currentTestimonial);
    }, interval);
}

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    initializeAnimations();
    initializeFAQ();
    initializeTestimonials();
    checkAuthStatus();

    // Add smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
});

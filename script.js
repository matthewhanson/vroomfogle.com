// Vroomfogle Landing Page - Interactive Enhancements

// Smooth scroll enhancement for better UX
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
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

// Intersection Observer for fade-in animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

// Apply fade-in to feature cards
document.addEventListener('DOMContentLoaded', () => {
    // Animate feature cards on scroll
    const featureCards = document.querySelectorAll('.feature-card');
    featureCards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = `all 0.6s ease ${index * 0.1}s`;
        observer.observe(card);
    });
    
    // Animate about content
    const aboutContent = document.querySelector('.about-content');
    if (aboutContent) {
        aboutContent.style.opacity = '0';
        aboutContent.style.transform = 'translateY(30px)';
        aboutContent.style.transition = 'all 0.8s ease';
        observer.observe(aboutContent);
    }
    
    // Hide scroll indicator when scrolled
    const scrollIndicator = document.querySelector('.scroll-indicator');
    if (scrollIndicator) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 100) {
                scrollIndicator.style.opacity = '0';
                scrollIndicator.style.pointerEvents = 'none';
            } else {
                scrollIndicator.style.opacity = '1';
                scrollIndicator.style.pointerEvents = 'auto';
            }
        });
    }
});

// Add parallax effect to hero section
window.addEventListener('scroll', () => {
    const scrolled = window.scrollY;
    const hero = document.querySelector('.hero');
    if (hero && scrolled < window.innerHeight) {
        hero.style.transform = `translateY(${scrolled * 0.5}px)`;
    }
    
    // Parallax effect for library section
    const libraryParallax = document.querySelector('.library-parallax');
    if (libraryParallax) {
        const rect = libraryParallax.getBoundingClientRect();
        const scrollPercent = (window.innerHeight - rect.top) / (window.innerHeight + rect.height);
        if (scrollPercent >= 0 && scrollPercent <= 1) {
            libraryParallax.style.backgroundPositionY = `${50 - (scrollPercent * 20)}%`;
        }
    }
    
    // Parallax effect for company section
    const companyParallax = document.querySelector('.company-parallax');
    if (companyParallax) {
        const rect = companyParallax.getBoundingClientRect();
        const scrollPercent = (window.innerHeight - rect.top) / (window.innerHeight + rect.height);
        if (scrollPercent >= 0 && scrollPercent <= 1) {
            companyParallax.style.backgroundPositionY = `${50 - (scrollPercent * 20)}%`;
        }
    }
    
    // Parallax effect for andraax section
    const andraaxParallax = document.querySelector('.andraax-parallax');
    if (andraaxParallax) {
        const rect = andraaxParallax.getBoundingClientRect();
        const scrollPercent = (window.innerHeight - rect.top) / (window.innerHeight + rect.height);
        if (scrollPercent >= 0 && scrollPercent <= 1) {
            andraaxParallax.style.backgroundPositionY = `${50 - (scrollPercent * 20)}%`;
        }
    }
});

// Easter egg: Console message for curious developers
console.log('%c🔮 Welcome to Vroomfogle & Company! 🔮', 'font-size: 20px; color: #8B5CF6; font-weight: bold;');
console.log('%cInterested in the Shadow World? Visit Nomikos at https://nomikos.vroomfogle.com', 'font-size: 14px; color: #FBBF24;');
console.log('%c⚔️ May your adventures be legendary! ⚔️', 'font-size: 14px; color: #8B5CF6; font-style: italic;');

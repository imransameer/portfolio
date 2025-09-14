// Modern Portfolio Script - Enhanced Performance & UX

// Optimize DOM queries with modern caching and error handling
const elements = {
    _cache: new Map(),
    get nav() { 
        if (!this._cache.has('nav')) {
            this._cache.set('nav', document.querySelector('nav'));
        }
        return this._cache.get('nav');
    },
    get navItems() { 
        if (!this._cache.has('navItems')) {
            this._cache.set('navItems', document.querySelectorAll('.nav-item'));
        }
        return this._cache.get('navItems');
    },
    get fadeInElements() { 
        if (!this._cache.has('fadeInElements')) {
            this._cache.set('fadeInElements', document.querySelectorAll('.fade-in'));
        }
        return this._cache.get('fadeInElements');
    },
    get sections() { 
        if (!this._cache.has('sections')) {
            this._cache.set('sections', document.querySelectorAll('section[id]'));
        }
        return this._cache.get('sections');
    },
    get currentSectionIndicator() { 
        if (!this._cache.has('currentSectionIndicator')) {
            this._cache.set('currentSectionIndicator', document.getElementById('current-section-indicator'));
        }
        return this._cache.get('currentSectionIndicator');
    },
    get currentSectionText() { 
        if (!this._cache.has('currentSectionText')) {
            this._cache.set('currentSectionText', document.getElementById('current-section-text'));
        }
        return this._cache.get('currentSectionText');
    }
};

// Enhanced smooth scrolling with better performance
function smoothScrollTo(target, offset = 100) {
    try {
        const element = document.querySelector(target);
        if (!element) {
            console.warn(`Element not found: ${target}`);
            return;
        }
        
        const targetPosition = element.offsetTop - offset;
        const startPosition = window.pageYOffset;
        const distance = targetPosition - startPosition;
        const duration = Math.min(Math.abs(distance) / 2, 800); // Reduced max duration
        
        let start = null;
        
        function animation(currentTime) {
            if (start === null) start = currentTime;
            const timeElapsed = currentTime - start;
            const progress = Math.min(timeElapsed / duration, 1);
            
            // Optimized easing function
            const ease = progress < 0.5 
                ? 2 * progress * progress 
                : 1 - Math.pow(-2 * progress + 2, 2) / 2;
            
            window.scrollTo(0, startPosition + distance * ease);
            
            if (timeElapsed < duration) {
                requestAnimationFrame(animation);
            }
        }
        
        requestAnimationFrame(animation);
    } catch (error) {
        console.error('Smooth scroll error:', error);
        // Fallback to native scroll
        document.querySelector(target)?.scrollIntoView({ behavior: 'smooth' });
    }
}

// Modern scroll handler with improved performance
class ScrollManager {
    constructor() {
        this.ticking = false;
        this.lastScrollY = 0;
        this.navShadowActive = false;
        this.sectionCache = new Map();
        
        this.init();
    }
    
    init() {
        this.cacheSectionPositions();
        this.bindEvents();
    }
    
    bindEvents() {
        window.addEventListener('scroll', this.requestTick.bind(this), { passive: true });
        window.addEventListener('resize', this.debounce(this.cacheSectionPositions.bind(this), 150), { passive: true });
    }
    
    cacheSectionPositions() {
        elements.sections.forEach(section => {
            const id = section.id;
            if (id) {
                const rect = section.getBoundingClientRect();
                const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
                
                this.sectionCache.set(id, {
                    element: section,
                    top: rect.top + scrollTop - 200, // More forgiving top boundary
                    bottom: rect.bottom + scrollTop - 50, // More forgiving bottom boundary
                    middle: rect.top + scrollTop + rect.height / 2
                });
            }
        });
    }
    
    requestTick() {
        if (!this.ticking) {
            this.ticking = true;
            requestAnimationFrame(this.updateOnScroll.bind(this));
        }
    }
    
    updateOnScroll() {
        const scrollY = window.pageYOffset;
        
        try {
            // Update navigation shadow
            this.updateNavShadow(scrollY);
            
            // Update active navigation item (optimized threshold)
            if (Math.abs(scrollY - this.lastScrollY) > 10) {
                this.updateActiveNavOnScroll(scrollY);
                this.lastScrollY = scrollY;
            }
        } catch (error) {
            console.error('Scroll update error:', error);
        }
        
        this.ticking = false;
    }
    
    updateNavShadow(scrollY) {
        const nav = elements.nav;
        if (!nav) return;
        
        if (scrollY > 50 && !this.navShadowActive) {
            nav.style.boxShadow = '0 16px 64px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(139, 92, 246, 0.1)';
            this.navShadowActive = true;
        } else if (scrollY <= 50 && this.navShadowActive) {
            nav.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.4)';
            this.navShadowActive = false;
        }
    }
    
    updateActiveNavOnScroll(scrollY) {
        let currentSection = '';
        let closestSection = '';
        let closestDistance = Infinity;
        
        // Find the section that's currently most visible in the viewport
        for (const [id, data] of this.sectionCache) {
            const sectionTop = data.top;
            const sectionBottom = data.bottom;
            const sectionMiddle = sectionTop + (sectionBottom - sectionTop) / 2;
            
            // Check if section is in viewport
            if (scrollY >= sectionTop - 100 && scrollY < sectionBottom + 100) {
                // Calculate distance from viewport center to section middle
                const viewportCenter = scrollY + window.innerHeight / 2;
                const distanceFromCenter = Math.abs(viewportCenter - sectionMiddle);
                
                // Use the section closest to viewport center
                if (distanceFromCenter < closestDistance) {
                    closestDistance = distanceFromCenter;
                    closestSection = id;
                }
            }
        }
        
        // If no section found using viewport center method, use traditional method
        if (!closestSection) {
            for (const [id, data] of this.sectionCache) {
                if (scrollY >= data.top && scrollY < data.bottom) {
                    closestSection = id;
                    break;
                }
            }
        }
        
        // Fallback to first section if still no match
        if (!closestSection && this.sectionCache.size > 0) {
            closestSection = Array.from(this.sectionCache.keys())[0];
        }
        
        if (closestSection) {
            this.updateActiveNavItem(`#${closestSection}`);
            this.updateCurrentSectionIndicator(closestSection);
        }
    }
    
    updateActiveNavItem(targetId) {
        elements.navItems.forEach(item => {
            item.classList.toggle('active', item.getAttribute('href') === targetId);
        });
    }
    
    updateCurrentSectionIndicator(sectionId) {
        const indicator = elements.currentSectionIndicator;
        const text = elements.currentSectionText;
        
        if (!indicator || !text) return;
        
        // Capitalize first letter and make it readable
        const sectionName = sectionId.charAt(0).toUpperCase() + sectionId.slice(1);
        const currentText = text.textContent;
        
        // Only update if the section has changed
        if (currentText !== sectionName) {
            // Add changing animation
            indicator.classList.add('changing');
            
            setTimeout(() => {
                text.textContent = sectionName;
                indicator.classList.remove('changing');
                indicator.classList.add('active');
                
                // Remove active class after animation
                setTimeout(() => {
                    indicator.classList.remove('active');
                }, 500);
            }, 150);
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

// Enhanced Intersection Observer for animations
class AnimationManager {
    constructor() {
        this.observer = null;
        this.init();
    }
    
    init() {
        if (!window.IntersectionObserver) return;
        
        const options = {
            threshold: [0.1, 0.25],
            rootMargin: '0px 0px -5% 0px'
        };
        
        this.observer = new IntersectionObserver(this.handleIntersection.bind(this), options);
        
        // Observe all fade-in elements
        elements.fadeInElements.forEach(element => {
            this.observer.observe(element);
        });
    }
    
    handleIntersection(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                // Unobserve to improve performance
                this.observer.unobserve(entry.target);
            }
        });
    }
    
    // Method to re-observe elements if needed
    observeElement(element) {
        if (this.observer && !element.classList.contains('visible')) {
            this.observer.observe(element);
        }
    }
}

// Initialize everything with error handling
document.addEventListener('DOMContentLoaded', () => {
    try {
        // Performance monitoring
        if ('performance' in window) {
            // Monitor Core Web Vitals
            new PerformanceObserver((entryList) => {
                for (const entry of entryList.getEntries()) {
                    console.log(`${entry.name}: ${entry.value}`);
                }
            }).observe({entryTypes: ['measure', 'mark']});
        }

        // Initialize scroll manager
        const scrollManager = new ScrollManager();
        
        // Initialize animation manager
        new AnimationManager();
        
        // Initialize current section indicator
        initializeCurrentSectionIndicator();
        
        // Setup navigation click handlers with error handling
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                try {
                    e.preventDefault();
                    const targetId = this.getAttribute('href');
                    
                    // Smooth scroll to target
                    smoothScrollTo(targetId);
                } catch (error) {
                    console.error('Navigation click error:', error);
                }
            });
        });
        
        // Initialize current section on page load with delay
        setTimeout(() => {
            scrollManager.updateOnScroll();
        }, 300); // Reduced timeout for better responsiveness
        
        // Preload critical resources
        preloadResources();
        
        // Add staggered animation delays
        setTimeout(() => {
            elements.fadeInElements.forEach((element, index) => {
                element.style.transitionDelay = `${index * 0.05}s`; // Reduced delay
            });
        }, 50); // Reduced timeout

    } catch (error) {
        console.error('Initialization error:', error);
    }
});

// Initialize current section indicator
function initializeCurrentSectionIndicator() {
    const indicator = elements.currentSectionIndicator;
    if (!indicator) return;
    
    // Set initial section based on current scroll position
    const currentScrollY = window.pageYOffset;
    let initialSection = 'about'; // default
    let closestSection = '';
    let closestDistance = Infinity;
    
    // Find which section we're currently in using the same logic as scroll detection
    elements.sections.forEach(section => {
        const rect = section.getBoundingClientRect();
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const sectionTop = rect.top + scrollTop - 200;
        const sectionBottom = rect.bottom + scrollTop - 50;
        const sectionMiddle = sectionTop + (sectionBottom - sectionTop) / 2;
        
        // Check if section is in viewport
        if (currentScrollY >= sectionTop - 100 && currentScrollY < sectionBottom + 100) {
            // Calculate distance from viewport center to section middle
            const viewportCenter = currentScrollY + window.innerHeight / 2;
            const distanceFromCenter = Math.abs(viewportCenter - sectionMiddle);
            
            // Use the section closest to viewport center
            if (distanceFromCenter < closestDistance) {
                closestDistance = distanceFromCenter;
                closestSection = section.id;
            }
        }
    });
    
    // Fallback to traditional detection if no section found
    if (!closestSection) {
        elements.sections.forEach(section => {
            const rect = section.getBoundingClientRect();
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const sectionTop = rect.top + scrollTop - 200;
            const sectionBottom = rect.bottom + scrollTop - 50;
            
            if (currentScrollY >= sectionTop && currentScrollY < sectionBottom) {
                closestSection = section.id;
            }
        });
    }
    
    // Use the found section or fallback to default
    if (closestSection) {
        initialSection = closestSection;
    }
    
    // Set initial text
    const text = elements.currentSectionText;
    if (text) {
        text.textContent = initialSection.charAt(0).toUpperCase() + initialSection.slice(1);
    }
}

// Resource preloading for performance
function preloadResources() {
    // Preload video with better optimization
    const video = document.querySelector('video');
    if (video) {
        video.preload = 'metadata';
        video.setAttribute('playsinline', '');
        
        // Optimize video loading
        if (video.readyState < 2) {
            video.addEventListener('loadeddata', () => {
                video.style.opacity = '0.3';
            }, { once: true });
        }
    }
    
    // Preload critical images
    const criticalImages = document.querySelectorAll('img[src*="assets"]');
    criticalImages.forEach(img => {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'image';
        link.href = img.src;
        document.head.appendChild(link);
    });
}

// Handle page visibility for performance and add contact functionality
document.addEventListener('visibilitychange', () => {
    const video = document.querySelector('video');
    
    if (document.hidden) {
        // Pause video when page is hidden
        if (video) video.pause();
    } else {
        // Resume video when page becomes visible
        if (video) video.play().catch(() => {});
    }
});

// Email obfuscation and contact handling
function initializeContactHandling() {
    // Email obfuscation
    const emailLinks = document.querySelectorAll('a[href="#contact"]');
    emailLinks.forEach(link => {
        if (link.getAttribute('aria-label') === 'Email') {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                // Simple email obfuscation
                const user = 'mohammadsameer';
                const domain = 'example.com';
                window.location.href = `mailto:${user}@${domain}`;
            });
        }
    });
}

// Initialize contact handling
document.addEventListener('DOMContentLoaded', initializeContactHandling);

// Export for potential external use
window.PortfolioJS = {
    smoothScrollTo,
    ScrollManager,
    AnimationManager,
    elements
};

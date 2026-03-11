// Lightweight animation utilities for the portfolio

// Mark page as loaded for hero entrance effects
window.addEventListener('load', function () {
    document.body.classList.add('page-loaded');
});

// Scroll reveal animation using IntersectionObserver when available
function initRevealOnScroll() {
    var reveals = document.querySelectorAll('.reveal');
    if (!reveals.length) return;

    if ('IntersectionObserver' in window) {
        var observer = new IntersectionObserver(function (entries, obs) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('active');
                    obs.unobserve(entry.target);
                }
            });
        }, {
            root: null,
            rootMargin: '0px 0px -15% 0px',
            threshold: 0.1
        });

        reveals.forEach(function (el) {
            observer.observe(el);
        });
    } else {
        // Fallback for older browsers
        function revealFallback() {
            var windowHeight = window.innerHeight;
            var elementVisible = 150;

            for (var i = 0; i < reveals.length; i++) {
                var elementTop = reveals[i].getBoundingClientRect().top;

                if (elementTop < windowHeight - elementVisible) {
                    reveals[i].classList.add('active');
                }
            }
        }

        window.addEventListener('scroll', revealFallback);
        revealFallback();
    }
}

document.addEventListener('DOMContentLoaded', initRevealOnScroll);
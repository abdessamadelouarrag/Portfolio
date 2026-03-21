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

// Reveal Animation Script
function reveal() {
    var reveals = document.querySelectorAll('.reveal');

    for (var i = 0; i < reveals.length; i++) {
        var windowHeight = window.innerHeight;
        var elementTop = reveals[i].getBoundingClientRect().top;
        var elementVisible = 150;

        if (elementTop < windowHeight - elementVisible) {
            reveals[i].classList.add('active');
        }
    }
}

window.addEventListener('scroll', reveal);
window.addEventListener('load', reveal);

// Contact form handling via backend /api/contact
document.addEventListener('DOMContentLoaded', function () {
    var form = document.getElementById('contact-form');
    if (!form) return;

    var submitButton = document.getElementById('contact-submit');
    var statusEl = document.getElementById('contact-status');

    function setStatus(message, type) {
        if (!statusEl) return;

        statusEl.textContent = message || '';
        statusEl.className = 'mt-3 text-sm min-h-[1.25rem] text-left';

        if (type === 'success') {
            statusEl.classList.add('text-emerald-400');
        } else if (type === 'error') {
            statusEl.classList.add('text-red-400');
        } else {
            statusEl.classList.add('text-gray-400');
        }
    }

    function setLoading(isLoading) {
        if (!submitButton) return;

        submitButton.disabled = isLoading;

        var label = submitButton.querySelector('.submit-label');
        var icon = submitButton.querySelector('.submit-icon');

        if (label) {
            label.textContent = isLoading ? 'Sending...' : 'Send Message';
        }

        if (icon) {
            icon.classList.toggle('opacity-0', isLoading);
        }
    }

    form.addEventListener('submit', function (event) {
        event.preventDefault();
        setStatus('', '');

        var formData = new FormData(form);

        var company = (formData.get('company') || '').trim();
        var name = (formData.get('name') || '').trim();
        var email = (formData.get('email') || '').trim();
        var subject = (formData.get('subject') || '').trim();
        var message = (formData.get('message') || '').trim();

        if (company) {
            setStatus('Thank you for your message.', 'success');
            form.reset();
            return;
        }

        if (!name || !email || !subject || !message) {
            setStatus('Please fill in all required fields.', 'error');
            return;
        }

        var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(email)) {
            setStatus('Please enter a valid email address.', 'error');
            return;
        }

        setLoading(true);
        setStatus('Sending your message...', 'info');

        fetch('/api/contact', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: name,
                email: email,
                subject: subject,
                message: message,
                company: company
            })
        })
            .then(async function (response) {
                var text = await response.text();
                var data = {};

                try {
                    data = text ? JSON.parse(text) : {};
                } catch (error) {
                    throw new Error('Server returned an invalid response.');
                }

                if (!response.ok) {
                    throw new Error(data.error || 'Something went wrong.');
                }

                return data;
            })
            .then(function (data) {
                if (data && data.success) {
                    setStatus('Thank you—your message has been sent successfully.', 'success');
                    form.reset();
                } else {
                    setStatus((data && data.error) || 'Something went wrong. Please try again.', 'error');
                }
            })
            .catch(function (error) {
                console.error('Contact form error:', error);
                setStatus(error.message || 'Unable to send your message right now. Please try again later.', 'error');
            })
            .finally(function () {
                setLoading(false);
            });
    });
});
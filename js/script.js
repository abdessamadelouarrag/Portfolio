// Lightweight animation and interaction utilities for the portfolio

window.addEventListener('load', function () {
    document.body.classList.add('page-loaded');
});

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

        reveals.forEach(function (element) {
            observer.observe(element);
        });

        return;
    }

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

function initTiltCards() {
    var cards = document.querySelectorAll('[data-tilt]');
    if (!cards.length) return;

    cards.forEach(function (card) {
        card.addEventListener('mousemove', function (event) {
            if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

            var rect = card.getBoundingClientRect();
            var x = event.clientX - rect.left;
            var y = event.clientY - rect.top;
            var rotateY = ((x / rect.width) - 0.5) * 10;
            var rotateX = (0.5 - (y / rect.height)) * 10;

            card.style.transform = 'perspective(1000px) rotateX(' + rotateX + 'deg) rotateY(' + rotateY + 'deg)';
        });

        card.addEventListener('mouseleave', function () {
            card.style.transform = '';
        });
    });
}

function initContactForm() {
    var form = document.getElementById('contact-form');
    if (!form) return;

    var submitButton = document.getElementById('contact-submit');
    var statusEl = document.getElementById('contact-status');
    var apiBase = '';

    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        if (window.location.port && window.location.port !== '3000') {
            apiBase = window.location.protocol + '//' + window.location.hostname + ':3000';
        }
    }

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

    function getFriendlySubmitError(error) {
        var message = error && error.message ? String(error.message) : '';

        if (window.location.protocol === 'file:') {
            return 'The contact form will not work from a file preview. Start the Node server and open http://localhost:3000.';
        }

        if (message === 'Failed to fetch' || message.indexOf('NetworkError') !== -1) {
            return 'The contact service is not reachable. Start the site with `npm.cmd start` and open it on http://localhost:3000.';
        }

        if (message === 'Something went wrong.') {
            return 'The contact service returned an unexpected error. Make sure the site is running through the backend server on http://localhost:3000.';
        }

        return message || 'Unable to send your message right now. Please try again later.';
    }

    form.addEventListener('submit', function (event) {
        event.preventDefault();
        setStatus('', '');

        var formData = new FormData(form);
        var company = String(formData.get('company') || '').trim();
        var name = String(formData.get('name') || '').trim();
        var email = String(formData.get('email') || '').trim();
        var subject = String(formData.get('subject') || '').trim();
        var message = String(formData.get('message') || '').trim();

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

        fetch(apiBase + '/api/contact', {
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
                    throw new Error(data.error || ('Contact request failed with status ' + response.status + '.'));
                }

                return data;
            })
            .then(function (data) {
                if (data && data.success) {
                    setStatus('Thank you, your message has been sent successfully.', 'success');
                    form.reset();
                } else {
                    setStatus((data && data.error) || 'Something went wrong. Please try again.', 'error');
                }
            })
            .catch(function (error) {
                console.error('Contact form error:', error);
                setStatus(getFriendlySubmitError(error), 'error');
            })
            .finally(function () {
                setLoading(false);
            });
    });
}

document.addEventListener('DOMContentLoaded', function () {
    initRevealOnScroll();
    initTiltCards();
    initContactForm();
});

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
    var loadingOverlay = document.getElementById('contact-loading-overlay');
    var contactEndpoints = buildContactEndpoints();

    function buildContactEndpoints() {
        var endpoints = [];
        var currentUrl = new URL(window.location.href);
        var pathSegments = currentUrl.pathname.split('/').filter(Boolean);
        var bases = [''];

        if (pathSegments.length > 1) {
            bases.push('/' + pathSegments.slice(0, -1).join('/'));
        }

        if (pathSegments.length > 2) {
            bases.push('/' + pathSegments.slice(0, -2).join('/'));
        }

        bases.forEach(function (base) {
            var normalizedBase = base.replace(/\/+$/, '');
            endpoints.push(normalizedBase + '/api/contact');
            endpoints.push(normalizedBase + '/api/contact.php');
        });

        return endpoints.filter(function (endpoint, index, list) {
            return endpoint && list.indexOf(endpoint) === index;
        });
    }

    function getTranslation(key, fallback) {
        if (typeof portfolioTranslations === 'undefined') {
            return fallback;
        }

        var lang = localStorage.getItem('portfolioLanguage') || 'en';
        var bundle = portfolioTranslations[lang] || portfolioTranslations.en || {};

        return bundle[key] || fallback;
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
        form.classList.toggle('is-submitting', isLoading);

        if (loadingOverlay) {
            loadingOverlay.classList.toggle('is-active', isLoading);
            loadingOverlay.setAttribute('aria-hidden', isLoading ? 'false' : 'true');
        }

        document.body.classList.toggle('loading-active', isLoading);

        var label = submitButton.querySelector('.submit-label');
        var icon = submitButton.querySelector('.submit-icon');

        if (label) {
            label.textContent = isLoading
                ? getTranslation('contact.sending', 'Sending...')
                : getTranslation('contact.send', 'Send Message');
        }

        if (icon) {
            icon.classList.toggle('opacity-0', isLoading);
        }
    }

    async function submitContact(payload) {
        var lastError = null;

        if (window.location.protocol === 'file:') {
            throw new Error(getTranslation(
                'contact.server_required',
                'Open this project through Laragon, Apache, or a local PHP/Node server. The form cannot send from a local file.'
            ));
        }

        for (var i = 0; i < contactEndpoints.length; i++) {
            try {
                var response = await fetch(contactEndpoints[i], {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(payload)
                });

                var contentType = response.headers.get('content-type') || '';
                var result = {};

                if (contentType.indexOf('application/json') !== -1) {
                    result = await response.json();
                } else {
                    throw new Error(getTranslation(
                        'contact.server_required',
                        'Open this project through Laragon, Apache, or a local PHP/Node server. The form cannot send from a static HTML preview.'
                    ));
                }

                if (!response.ok || !result.success) {
                    throw new Error(result.error || getTranslation('contact.error', 'Unable to send your message right now.'));
                }

                return result;
            } catch (error) {
                lastError = error;
            }
        }

        throw lastError || new Error(getTranslation('contact.error', 'Unable to send your message right now.'));
    }

    form.addEventListener('submit', async function (event) {
        event.preventDefault();
        setStatus('', '');

        var formData = new FormData(form);
        var company = String(formData.get('company') || '').trim();
        var name = String(formData.get('name') || '').trim();
        var email = String(formData.get('email') || '').trim();
        var subject = String(formData.get('subject') || '').trim();
        var message = String(formData.get('message') || '').trim();

        if (company) {
            setStatus(getTranslation('contact.success', 'Thank you for your message.'), 'success');
            form.reset();
            return;
        }

        if (!name || !email || !subject || !message) {
            setStatus(getTranslation('contact.required', 'Please fill in all required fields.'), 'error');
            return;
        }

        var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(email)) {
            setStatus(getTranslation('contact.invalid_email', 'Please enter a valid email address.'), 'error');
            return;
        }

        setLoading(true);
        setStatus(getTranslation('contact.sending_status', 'Sending your message...'), 'info');

        try {
            var result = await submitContact({
                company: company,
                name: name,
                email: email,
                subject: subject,
                message: message
            });

            form.reset();
            setStatus(result.message || getTranslation('contact.success', 'Your message was sent successfully.'), 'success');
        } catch (error) {
            setStatus(error.message || getTranslation('contact.error', 'Unable to send your message right now.'), 'error');
        } finally {
            setLoading(false);
        }
    });
}

document.addEventListener('DOMContentLoaded', function () {
    initRevealOnScroll();
    initTiltCards();
    initContactForm();
});

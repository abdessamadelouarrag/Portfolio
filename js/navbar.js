async function loadNavbar() {
    const placeholder = document.getElementById('navbar-placeholder');
    if (!placeholder) return;

    try {
        const response = await fetch('/navbar.html');
        if (!response.ok) {
            throw new Error('Failed to load navbar.html');
        }

        placeholder.innerHTML = await response.text();
        initializeMenuLogic();
        document.dispatchEvent(new CustomEvent('navbar:loaded'));
    } catch (error) {
        console.error(error);
        placeholder.innerHTML = '<p style="text-align:center; padding: 24px;">Navigation failed to load.</p>';
    }
}

function initializeMenuLogic() {
    const siteNav = document.querySelector('.site-nav');
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const navContent = document.getElementById('nav-content');
    const mobileMenu = document.getElementById('mobile-menu');
    let lastScrollY = window.scrollY;

    function syncNavOnScroll() {
        if (!siteNav) return;

        const currentScrollY = window.scrollY;
        const isScrolled = currentScrollY > 24;
        const scrollingDown = currentScrollY > lastScrollY && currentScrollY > 120;

        siteNav.classList.toggle('nav-scrolled', isScrolled);

        if (!isScrolled) {
            siteNav.classList.remove('nav-hidden');
        } else if (navContent && navContent.classList.contains('is-open')) {
            siteNav.classList.remove('nav-hidden');
        } else {
            siteNav.classList.toggle('nav-hidden', scrollingDown);
        }

        lastScrollY = currentScrollY;
    }

    if (mobileMenuButton && navContent && mobileMenu) {
        mobileMenuButton.onclick = function () {
            const isOpen = navContent.classList.toggle('is-open');
            mobileMenu.classList.toggle('is-active', isOpen);
            mobileMenuButton.setAttribute('aria-expanded', String(isOpen));
            document.body.classList.toggle('overflow-hidden', isOpen);
            if (siteNav) {
                siteNav.classList.remove('nav-hidden');
            }
        };

        document.querySelectorAll('#nav-content a').forEach(function (link) {
            link.addEventListener('click', function () {
                navContent.classList.remove('is-open');
                mobileMenu.classList.remove('is-active');
                mobileMenuButton.setAttribute('aria-expanded', 'false');
                document.body.classList.remove('overflow-hidden');
            });
        });
    }

    const currentPath = window.location.pathname === '/' ? '/index.html' : window.location.pathname;

    document.querySelectorAll('.nav-link-desktop, .nav-link-mobile').forEach(function (link) {
        if (link.getAttribute('href') === currentPath) {
            link.classList.add('is-active');
        }
    });

    window.addEventListener('scroll', syncNavOnScroll, { passive: true });
    syncNavOnScroll();
}

window.addEventListener('load', loadNavbar);

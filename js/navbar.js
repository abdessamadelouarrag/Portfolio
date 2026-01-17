
async function loadNavbar() {
    const placeholder = document.getElementById('navbar-placeholder');

    try {
        const response = await fetch('/navbar.html');
        if (!response.ok) {
            throw new Error('Failed to load navbar.html');
        }
        const html = await response.text();
        placeholder.innerHTML = html;

        // Wait for the HTML to be inserted before running the menu logic
        initializeMenuLogic();

    } catch (error) {
        console.error(error);
        placeholder.innerHTML = '<p style="color:red; text-align:center;">Navigation failed to load.</p>';
    }
}

//Function to Initialize Burger Menu and Active State
function initializeMenuLogic() {
    // --- Burger Menu Toggle Logic ---
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const navContent = document.getElementById('nav-content');
    const mobileMenu = document.getElementById('mobile-menu');

    if (mobileMenuButton && navContent && mobileMenu) {
        mobileMenuButton.onclick = function () {
            navContent.classList.toggle('-translate-x-full');
            mobileMenu.classList.toggle('is-active');
            document.body.classList.toggle('overflow-hidden');
        };

        document.querySelectorAll('#nav-content a').forEach(link => {
            link.addEventListener('click', () => {
                navContent.classList.add('-translate-x-full');
                mobileMenu.classList.remove('is-active');
                document.body.classList.remove('overflow-hidden');
            });
        });
    }

    // --- Active Link Highlight Logic ---
    const currentPage = window.location.pathname.split('/').pop();

    // Desktop Links
    const desktopLinks = document.querySelectorAll('.nav-link-desktop');
    desktopLinks.forEach(link => {
        link.classList.add('hover:text-white', 'transition-colors'); // Base classes
        if (link.getAttribute('href') === currentPage) {
            link.classList.add('text-white');
            link.classList.remove('text-gray-400'); // Ensure it overrides base color
        } else {
            link.classList.add('text-gray-400');
        }
    });

    // Mobile Links
    const mobileLinks = document.querySelectorAll('.nav-link-mobile');
    mobileLinks.forEach(link => {
        link.classList.add('text-gray-400', 'hover:text-primary', 'transition-colors', 'py-2'); // Base classes
        if (link.getAttribute('href') === currentPage) {
            link.classList.add('text-primary');
            link.classList.remove('text-gray-400'); // Ensure it overrides base color
        }
    });
}

// Start loading the navbar when the main page is ready
window.addEventListener('load', loadNavbar);
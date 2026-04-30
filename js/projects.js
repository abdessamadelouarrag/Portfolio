function filterProjects(category) {
    const buttons = document.querySelectorAll('.filter-btn');
    const items = document.querySelectorAll('.project-item');

    buttons.forEach(function (button) {
        const isMatch = button.textContent.toLowerCase().indexOf(category) !== -1 ||
            (category === 'all' && button.textContent.trim().toLowerCase() === 'all');
        button.classList.toggle('is-active', isMatch);
    });

    items.forEach(function (item) {
        const matches = category === 'all' || item.getAttribute('data-category') === category;
        item.classList.toggle('is-hidden', !matches);
        item.style.display = matches ? 'block' : 'none';
    });
}

// Filter Logic
function filterProjects(category) {
    // Update Buttons
    const buttons = document.querySelectorAll('.filter-btn');
    buttons.forEach(btn => {
        btn.classList.remove('bg-white', 'text-black', 'border-white/20'); // Remove active style
        btn.classList.add('text-gray-400', 'border-white/10'); // Add inactive style

        // Add click handler style logic
        if (btn.innerText.toLowerCase().includes(category) || (category === 'all' && btn.innerText === 'All')) {
            btn.classList.remove('text-gray-400', 'border-white/10');
            btn.classList.add('bg-white', 'text-black', 'border-white/20');
        }
    });

    // Filter Items
    const items = document.querySelectorAll('.project-item');
    items.forEach(item => {
        const itemCategory = item.getAttribute('data-category');

        if (category === 'all' || itemCategory === category) {
            item.style.display = 'block';
            setTimeout(() => {
                item.style.opacity = '1';
                item.style.transform = 'scale(1)';
            }, 50);
        } else {
            item.style.opacity = '0';
            item.style.transform = 'scale(0.95)';
            setTimeout(() => {
                item.style.display = 'none';
            }, 400); // Wait for transition
        }
    });
}
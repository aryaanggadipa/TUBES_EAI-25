document.addEventListener('DOMContentLoaded', () => {
    const navLinksContainer = document.getElementById('nav-links');
    const navLinksMobileContainer = document.getElementById('nav-links-mobile');
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');

    if (!navLinksContainer) {
        return; 
    }

    const userEmail = localStorage.getItem('userEmail');
    const authToken = localStorage.getItem('authToken');
    const currentPagePath = window.location.pathname;
    const pageBasename = currentPagePath.substring(currentPagePath.lastIndexOf('/') + 1) || 'index.html';

    const createNavLink = (href, text, pageName, isMobile = false) => {
        const link = document.createElement('a');
        link.href = href;
        link.textContent = text;
        let isActive = (pageBasename === pageName) || (pageBasename === '' && pageName === 'index.html');
        
        const activeClasses = isMobile ? 'block px-3 py-2 rounded-md text-base font-medium text-white bg-blue-600' : 'text-blue-600 font-semibold px-3 py-2 text-sm';
        const inactiveClasses = isMobile ? 'block px-3 py-2 rounded-md text-base font-medium text-gray-500 hover:bg-gray-100' : 'text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium';

        link.className = isActive ? activeClasses : inactiveClasses;
        return link;
    };

    const createCartIconLink = (isMobile = false) => {
        const cartLink = createNavLink('keranjang.html', '', 'keranjang.html', isMobile);
        cartLink.setAttribute('aria-label', 'Keranjang Belanja');
        cartLink.innerHTML = `
            <i class="fas fa-shopping-cart" aria-hidden="true"></i>
            <span id="cart-icon-count" class="ml-1 bg-red-600 text-white text-xs font-semibold rounded-full px-1.5 py-0.5" style="display: none;">0</span>
        `;
        return cartLink;
    };

    const populateNav = (container, isMobile) => {
        container.innerHTML = ''; // Clear existing links
        container.appendChild(createNavLink('index.html', 'Katalog', 'index.html', isMobile));

        if (authToken && userEmail) {
            container.appendChild(createNavLink('orders.html', 'Pesanan Saya', 'orders.html', isMobile));
            const logoutLink = document.createElement('a');
            logoutLink.href = '#';
            logoutLink.textContent = 'Logout';
            logoutLink.className = isMobile ? 'block px-3 py-2 rounded-md text-base font-medium text-gray-500 hover:bg-gray-100' : 'text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium';
            logoutLink.onclick = (e) => {
                e.preventDefault();
                localStorage.removeItem('authToken');
                localStorage.removeItem('userEmail');
                window.location.href = 'login.html';
            };
            container.appendChild(logoutLink);
        } else {
            container.appendChild(createNavLink('login.html', 'Login', 'login.html', isMobile));
            container.appendChild(createNavLink('register.html', 'Register', 'register.html', isMobile));
        }
        // Add cart icon to the right side
        const cartIconContainer = isMobile ? container : navLinksContainer;
        cartIconContainer.appendChild(createCartIconLink(isMobile));
    };

    // Populate both navbars
    populateNav(navLinksContainer, false);
    if (navLinksMobileContainer) {
        populateNav(navLinksMobileContainer, true);
    }

    // Mobile menu toggle
    if (mobileMenuButton && mobileMenu) {
        mobileMenuButton.addEventListener('click', () => {
            const isExpanded = mobileMenu.style.display === 'block';
            mobileMenu.style.display = isExpanded ? 'none' : 'block';
            mobileMenuButton.setAttribute('aria-expanded', !isExpanded);
        });
    }

    // Redirect if trying to access protected pages without auth
    if (!authToken && (pageBasename === 'orders.html' || pageBasename === 'keranjang.html')) {
        window.location.href = 'login.html';
    }

    // Update cart icon on load
    if (typeof updateCartIcon === 'function') {
        updateCartIcon();
    }
});

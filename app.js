/* ==========================================
   MS BAR AND LOUNGE - INTERACTIVE WEB LOGIC
   ========================================== */

document.addEventListener('DOMContentLoaded', () => {
    
    // ==========================================
    // 1. SCROLL DETECTOR (Header & Sticky Action Bar)
    // ==========================================
    const header = document.querySelector('.main-header');
    const stickyActionBar = document.querySelector('.sticky-action-bar');
    const activeThreshold = 50;
    const stickyThreshold = 200;

    window.addEventListener('scroll', () => {
        // Sticky Header scrolling classes
        if (window.scrollY > activeThreshold) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }

        // Mobile Sticky CTAs bar visibility
        if (window.scrollY > stickyThreshold && window.innerWidth <= 768) {
            stickyActionBar.classList.add('visible');
        } else {
            stickyActionBar.classList.remove('visible');
        }
        
        // Highlight active nav links on scroll
        highlightNavOnScroll();
    });

    // ==========================================
    // 2. MOBILE SIDE MENU NAVIGATION
    // ==========================================
    const menuToggle = document.querySelector('.mobile-nav-toggle');
    const menuOverlay = document.querySelector('.mobile-menu-overlay');
    const mobileLinks = document.querySelectorAll('.mobile-link');

    function toggleMenu() {
        menuToggle.classList.toggle('open');
        menuOverlay.classList.toggle('open');
        // Prevent body scrolling when menu is active
        document.body.style.overflow = menuOverlay.classList.contains('open') ? 'hidden' : 'visible';
    }

    menuToggle.addEventListener('click', toggleMenu);

    mobileLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (menuOverlay.classList.contains('open')) {
                toggleMenu();
            }
        });
    });

    // Close menu when resizing back to desktop sizes
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768 && menuOverlay.classList.contains('open')) {
            toggleMenu();
        }
    });

    // ==========================================
    // 3. MENU DYNAMIC RENDERING & FILTERING
    // ==========================================
    const menuGrid = document.getElementById('dynamic-menu-grid');
    const categoryButtons = document.querySelectorAll('.category-btn');
    const menuSearch = document.getElementById('menu-search');

    function renderMenu(filter = 'all', searchQuery = '') {
        if (!menuGrid) return;
        
        menuGrid.innerHTML = ''; // Clear existing
        
        let itemsToRender = [];
        
        // Use localStorage data if available, otherwise use default MENU_DATA
        const currentMenuData = JSON.parse(localStorage.getItem('ms_menu_data') || JSON.stringify(MENU_DATA));
        
        // Collect items based on category filter
        if (filter === 'all') {
            Object.keys(currentMenuData).forEach(cat => {
                currentMenuData[cat].forEach(item => {
                    itemsToRender.push({ ...item, category: cat });
                });
            });
        } else if (currentMenuData[filter]) {
            currentMenuData[filter].forEach(item => {
                itemsToRender.push({ ...item, category: filter });
            });
        }

        // Apply Search Filter if exists
        if (searchQuery.trim() !== '') {
            const query = searchQuery.toLowerCase().trim();
            itemsToRender = itemsToRender.filter(item => 
                item.name.toLowerCase().includes(query) || 
                (item.desc && item.desc.toLowerCase().includes(query)) ||
                item.category.toLowerCase().includes(query)
            );
        }

        if (itemsToRender.length === 0) {
            menuGrid.innerHTML = `
                <div class="no-results-msg">
                    <h3>No items found</h3>
                    <p>Try searching for something else or browse another category.</p>
                </div>
            `;
            return;
        }

        itemsToRender.forEach((item, index) => {
            const card = document.createElement('div');
            card.className = 'menu-card';
            card.setAttribute('data-category', item.category);
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            
            card.innerHTML = `
                <div class="dish-info">
                    <div class="dish-title-price">
                        <h3 class="dish-name" style="color: white; font-weight: 600;">${item.name}</h3>
                        <span class="dish-price" style="color: var(--color-gold); font-weight: 700;">₹${item.price}</span>
                    </div>
                    <p class="dish-desc" style="color: #e0e0e0; font-size: 0.95rem;">${item.desc || 'Exquisite preparation using fresh ingredients and master techniques.'}</p>
                    <div class="dish-meta">
                        <span class="tag" style="color: var(--color-gold); border: 1px solid rgba(212, 175, 55, 0.3); background: rgba(212, 175, 55, 0.1);">${item.category.charAt(0).toUpperCase() + item.category.slice(1)}</span>
                    </div>
                </div>
            `;
            
            menuGrid.appendChild(card);
            
            // Staggered entrance animation
            setTimeout(() => {
                card.style.transition = 'all 0.5s ease';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, index * 20); // Faster stagger for search
        });
    }

    // Initialize Menu
    renderMenu('all');

    // Listen for menu updates from admin panel
    window.addEventListener('storage', () => {
        const activeFilter = document.querySelector('.category-btn.active').getAttribute('data-filter');
        const currentSearch = menuSearch ? menuSearch.value : '';
        renderMenu(activeFilter, currentSearch);
    });

    // Search Input Event
    if (menuSearch) {
        menuSearch.addEventListener('input', (e) => {
            const activeFilter = document.querySelector('.category-btn.active').getAttribute('data-filter');
            renderMenu(activeFilter, e.target.value);
        });
    }

    categoryButtons.forEach(button => {
        button.addEventListener('click', () => {
            categoryButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            const filterValue = button.getAttribute('data-filter');
            const currentSearch = menuSearch ? menuSearch.value : '';
            renderMenu(filterValue, currentSearch);
        });
    });

    // ==========================================
    // 4. TESTIMONIALS SLIDER CAROUSEL
    // ==========================================
    const slides = document.querySelectorAll('.carousel-slide');
    const dots = document.querySelectorAll('.carousel-dots .dot');
    const prevBtn = document.querySelector('.carousel-control.prev');
    const nextBtn = document.querySelector('.carousel-control.next');
    let currentSlide = 0;
    let autoSlideInterval;

    function updateCarousel(index) {
        slides.forEach(slide => slide.classList.remove('active'));
        dots.forEach(dot => dot.classList.remove('active'));
        
        // Circular index wrapping
        if (index >= slides.length) currentSlide = 0;
        else if (index < 0) currentSlide = slides.length - 1;
        else currentSlide = index;

        slides[currentSlide].classList.add('active');
        dots[currentSlide].classList.add('active');

        // Translate track
        const track = document.querySelector('.carousel-track');
        track.style.transform = `translateX(-${currentSlide * 100}%)`;
    }

    function startAutoSlide() {
        stopAutoSlide();
        autoSlideInterval = setInterval(() => {
            updateCarousel(currentSlide + 1);
        }, 6000);
    }

    function stopAutoSlide() {
        if (autoSlideInterval) clearInterval(autoSlideInterval);
    }

    // Manual Event Triggers
    prevBtn.addEventListener('click', () => {
        updateCarousel(currentSlide - 1);
        startAutoSlide();
    });

    nextBtn.addEventListener('click', () => {
        updateCarousel(currentSlide + 1);
        startAutoSlide();
    });

    dots.forEach(dot => {
        dot.addEventListener('click', () => {
            const index = parseInt(dot.getAttribute('data-index'));
            updateCarousel(index);
            startAutoSlide();
        });
    });

    // Initialize Auto Slider
    startAutoSlide();

    // ==========================================
    // 5. SCROLL REVEAL TRIGGERS (IntersectionObserver)
    // ==========================================
    const revealElements = document.querySelectorAll('.fade-up');
    
    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('in-view');
                observer.unobserve(entry.target); // Stop tracking once animated
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });

    revealElements.forEach(el => revealObserver.observe(el));

    // Highlight Navigation on Scroll based on actual sections in viewport
    const sections = document.querySelectorAll('section');
    const navLinks = document.querySelectorAll('.desktop-nav .nav-link, .mobile-nav .mobile-link');

    function highlightNavOnScroll() {
        let currentSectionId = '';
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop - 150;
            const sectionHeight = section.clientHeight;
            if (window.scrollY >= sectionTop && window.scrollY < sectionTop + sectionHeight) {
                currentSectionId = section.getAttribute('id');
            }
        });

        if (currentSectionId) {
            navLinks.forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href') === `#${currentSectionId}`) {
                    link.classList.add('active');
                }
            });
        }
    }

    // ==========================================
    // 6. BOOKING CONVERTING FORM & MODAL LOGIC
    // ==========================================
    const heroQuickForm = document.getElementById('hero-quick-form');
    const mainForm = document.getElementById('main-reservation-form');
    
    const successModal = document.getElementById('success-modal');
    const closeModalBtns = document.querySelectorAll('.close-modal-btn, .modal-close-secondary');
    
    // Set default date to today or tomorrow
    const dateInputs = document.querySelectorAll('input[type="date"]');
    const today = new Date().toISOString().split('T')[0];
    dateInputs.forEach(input => {
        input.min = today;
        input.value = today;
    });

    // Hero Quick Reservation bridge
    if (heroQuickForm) {
        heroQuickForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Collect quick data
            const quickGuests = document.getElementById('quick-guests').value;
            const quickDate = document.getElementById('quick-date').value;
            const quickTime = document.getElementById('quick-time').value;

            // Inject into main form
            document.getElementById('res-guests').value = quickGuests;
            document.getElementById('res-date').value = quickDate;
            document.getElementById('res-time').value = quickTime;

            // Smooth Scroll to Main Reservations Block
            document.getElementById('reservations').scrollIntoView({ behavior: 'smooth' });
            
            // Flash highlight main form inputs for visual response
            const formInputs = document.querySelectorAll('.main-form input, .main-form select');
            formInputs.forEach(input => {
                input.style.borderColor = '#D4AF37';
                input.style.boxShadow = '0 0 10px rgba(212, 175, 55, 0.4)';
                setTimeout(() => {
                    input.style.borderColor = '';
                    input.style.boxShadow = '';
                }, 1500);
            });
        });
    }

    // Main Reservation Submission
    if (mainForm) {
        mainForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Gather values
            const name = document.getElementById('res-name').value;
            const phone = document.getElementById('res-phone').value;
            const guests = document.getElementById('res-guests').value;
            const rawDate = document.getElementById('res-date').value;
            const time = document.getElementById('res-time').value;
            const seating = document.getElementById('res-seating').value;
            const notes = document.getElementById('res-notes').value;

            // Form date presentation
            const dateObj = new Date(rawDate);
            const formattedDate = dateObj.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

            // Display in modal
            document.getElementById('summary-name').innerText = name;
            document.getElementById('summary-guests').innerText = guests;
            document.getElementById('summary-date').innerText = formattedDate;
            document.getElementById('summary-time').innerText = document.querySelector(`#res-time option[value="${time}"]`).innerText;

            // Save to LocalStorage for Admin Page
            const newBooking = {
                id: Date.now(),
                name,
                phone,
                guests,
                date: rawDate,
                formattedDate,
                time: document.querySelector(`#res-time option[value="${time}"]`).innerText,
                seating: document.querySelector(`#res-seating option[value="${seating}"]`).innerText,
                notes,
                status: 'Pending',
                createdAt: new Date().toISOString()
            };

            const existingBookings = JSON.parse(localStorage.getItem('ms_bookings') || '[]');
            existingBookings.unshift(newBooking);
            localStorage.setItem('ms_bookings', JSON.stringify(existingBookings));

            // Compile WhatsApp pre-filled text
            const seatingLabel = document.querySelector(`#res-seating option[value="${seating}"]`).innerText;
            const whatsappText = encodeURIComponent(
                `Hello MS Bar and Lounge!\n\nI would like to confirm my dining reservation:\n` +
                `• *Name*: ${name}\n` +
                `• *Phone*: ${phone}\n` +
                `• *Guests*: ${guests} diners\n` +
                `• *Date*: ${formattedDate}\n` +
                `• *Time*: ${time}\n` +
                `• *Seating Preference*: ${seatingLabel}\n` +
                (notes ? `• *Special Notes*: ${notes}\n` : '') +
                `\nPlease confirm availability for my booking. Thank you!`
            );
            
            // Update WhatsApp CTA URL
            const waUrl = `https://wa.me/919230996055?text=${whatsappText}`;
            document.getElementById('modal-wa-btn').setAttribute('href', waUrl);

            // Trigger Modal Open
            successModal.classList.add('open');
            document.body.style.overflow = 'hidden'; // Lock scrolling
        });
    }

    // Close Modals
    closeModalBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            successModal.classList.remove('open');
            document.body.style.overflow = 'visible';
            
            // Clear forms
            if (mainForm) mainForm.reset();
            dateInputs.forEach(input => input.value = today);
        });
    });

    // Close modal clicking background overlay
    successModal.addEventListener('click', (e) => {
        if (e.target === successModal) {
            successModal.classList.remove('open');
            document.body.style.overflow = 'visible';
            if (mainForm) mainForm.reset();
            dateInputs.forEach(input => input.value = today);
        }
    });

    // ==========================================
    // 7. NEWSLETTER SUBSCRIPTION FORM
    // ==========================================
    const newsletterForm = document.getElementById('newsletter-form');
    const newsSuccessMsg = document.getElementById('newsletter-msg');

    if (newsletterForm) {
        newsletterForm.addEventListener('submit', (e) => {
            e.preventDefault();
            newsletterForm.style.opacity = '0.3';
            newsletterForm.querySelector('button').disabled = true;

            setTimeout(() => {
                newsletterForm.style.display = 'none';
                newsSuccessMsg.style.display = 'block';
                
                // Reset standard triggers
                setTimeout(() => {
                    newsletterForm.style.display = 'flex';
                    newsletterForm.style.opacity = '1';
                    newsletterForm.querySelector('button').disabled = false;
                    newsletterForm.reset();
                    newsSuccessMsg.style.display = 'none';
                }, 6000);
            }, 1000);
        });
    }

    // ==========================================
    // 8. INTERACTIVE MAP TOOLTIPS FOR METRO/PINS
    // ==========================================
    const pins = document.querySelectorAll('.map-pin');
    pins.forEach(pin => {
        pin.addEventListener('click', () => {
            const tooltip = pin.querySelector('.pin-tooltip');
            if (tooltip) {
                // Toggle visible elements on click for small screens
                tooltip.style.opacity = tooltip.style.opacity === '1' ? '0' : '1';
                tooltip.style.pointerEvents = tooltip.style.opacity === '1' ? 'all' : 'none';
            }
        });
    });
});

/**
 * CertFIRE Landing Page JavaScript
 * Implements Scroll Animations, Micro-Interactions, 3D Tilt Card Effects, and Form Submissions
 */

document.addEventListener('DOMContentLoaded', () => {

    // Predefined Events Detailed Database
    const PREDEFINED_EVENTS = {
        'card-cyber-summit': {
            title: 'Cyber Summit 2024',
            category: 'TECH',
            categoryClass: 'tech',
            dateMonth: 'OCT',
            dateDay: '25',
            location: 'San Francisco, CA - Hybrid Event',
            image: 'assets/cyber_summit.png',
            description: 'Join the ultimate gathering of cybersecurity professionals, developers, and tech enthusiasts. Deep dive into interactive secure coding environments, live red-team vs. blue-team simulation setups, emerging cloud security methodologies, and networking assemblies with elite security professionals.\n\nLearn modern defensive techniques directly from industry veterans and walk away with verifiable digital credentials shareable on your career profiles.',
            timeRange: '09:00 AM - 05:00 PM',
            deadline: 'Oct 20, 2024',
            seats: '1,000 Seats',
            fee: 'Free Entry',
            eligibility: 'Open to all students and tech professionals',
            organizer: 'CertFIRE Tech Network'
        },
        'card-neon-rhythms': {
            title: 'Neon Rhythms',
            category: 'MUSIC',
            categoryClass: 'music',
            dateMonth: 'NOV',
            dateDay: '05',
            location: 'Austin, TX - On-site',
            image: 'assets/neon_rhythms.png',
            description: 'Get ready for an electric night of rock, indie alternative, and synth-wave frequencies. Featuring live modular-synth stage setups, glowing laser projection tracks, and Austin\'s best food assemblies.\n\nRegister to secure your exclusive concert pass and collect a high-octane verified event certificate to record your festival presence.',
            timeRange: '06:00 PM - 11:30 PM',
            deadline: 'Nov 01, 2024',
            seats: '2,500 Seats',
            fee: '₹2,000 INR',
            eligibility: 'All music lovers welcome (18+)',
            organizer: 'Austin Beats Group'
        },
        'card-digital-motion': {
            title: 'Digital Motion',
            category: 'ART',
            categoryClass: 'art',
            dateMonth: 'DEC',
            dateDay: '12',
            location: 'Tokyo, JP - Virtual',
            image: 'assets/digital_motion.png',
            description: 'Step into the virtual portal of contemporary dance fused with interactive graphic light projection mappings and 3D environment captures. This experimental showcase coordinates physical movement with real-time digital rendering systems.\n\nEnjoy panels with motion graphic designers and dancers detailing the integration of digital media in performative choreography.',
            timeRange: '04:00 PM - 07:30 PM',
            deadline: 'Dec 10, 2024',
            seats: '5,000 Virtual Seats',
            fee: '₹800 INR',
            eligibility: 'Open globally to all art/tech fans',
            organizer: 'Tokyo Motion Lab'
        }
    };

    // -----------------------------------------
    // 1. Header Scroll Dynamics
    // -----------------------------------------
    const header = document.querySelector('.main-header');
    
    const checkHeaderScroll = () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    };
    
    window.addEventListener('scroll', checkHeaderScroll);
    checkHeaderScroll(); // Init on load in case page was refreshed halfway down

    // -----------------------------------------
    // 2. Mobile Menu Toggle
    // -----------------------------------------
    const mobileToggle = document.getElementById('mobile-toggle');
    const navLinks = document.querySelector('.nav-links');
    
    if (mobileToggle && navLinks) {
        mobileToggle.addEventListener('click', () => {
            mobileToggle.classList.toggle('open');
            navLinks.classList.toggle('mobile-active');
        });

        // Close menu when clicking a link
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                mobileToggle.classList.remove('open');
                navLinks.classList.remove('mobile-active');
            });
        });
    }

    // -----------------------------------------
    // 3. Scroll Reveal System (Intersection Observer)
    // -----------------------------------------
    const revealOptions = {
        threshold: 0.15,
        rootMargin: '0px 0px -50px 0px'
    };

    const revealCallback = (entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                // Unobserve once animation has triggered to keep layout static after reveal
                observer.unobserve(entry.target);
            }
        });
    };

    const revealObserver = new IntersectionObserver(revealCallback, revealOptions);

    // Track scroll-reveal elements
    const elementsToReveal = document.querySelectorAll('.scroll-reveal, .animate-on-scroll');
    elementsToReveal.forEach(el => revealObserver.observe(el));

    // -----------------------------------------
    // 4. Premium Click Ripple Animation
    // -----------------------------------------
    const rippleButtons = document.querySelectorAll('.ripple');
    
    rippleButtons.forEach(btn => {
        btn.addEventListener('click', function(e) {
            const rect = this.getBoundingClientRect();
            
            // Calculate coordinates relative to the button
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const rippleSpan = document.createElement('span');
            rippleSpan.classList.add('ripple-span');
            rippleSpan.style.left = `${x}px`;
            rippleSpan.style.top = `${y}px`;
            
            this.appendChild(rippleSpan);
            
            // Remove after animation finishes
            setTimeout(() => {
                rippleSpan.remove();
            }, 600);
        });
    });

    // -----------------------------------------
    // 5. 3D Tilt Card Hover Effect
    // -----------------------------------------
    const handleCardMouseMove = (e) => {
        const card = e.currentTarget;
        const rect = card.getBoundingClientRect();
        
        // Mouse position relative to the card dimensions
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Calculate normalized values (-0.5 to 0.5)
        const xVal = (x / rect.width) - 0.5;
        const yVal = (y / rect.height) - 0.5;
        
        // Calculate rotation degrees (max 8 degrees tilt)
        const rotX = -(yVal * 8).toFixed(2);
        const rotY = (xVal * 8).toFixed(2);
        
        card.style.transform = `perspective(800px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateY(-8px)`;
    };

    const handleCardMouseLeave = (e) => {
        const card = e.currentTarget;
        card.style.transform = 'perspective(800px) rotateX(0deg) rotateY(0deg) translateY(0)';
        card.style.transition = 'transform 0.5s ease';
    };

    const handleCardMouseEnter = (e) => {
        const card = e.currentTarget;
        card.style.transition = 'transform 0.1s ease';
    };

    const initTiltCards = () => {
        const tiltCards = document.querySelectorAll('.fest-card, .audience-card');
        tiltCards.forEach(card => {
            card.addEventListener('mousemove', handleCardMouseMove);
            card.addEventListener('mouseleave', handleCardMouseLeave);
            card.addEventListener('mouseenter', handleCardMouseEnter);
        });
    };

    initTiltCards();

    // -----------------------------------------
    // 6. Newsletter Subscription Form Handling
    // -----------------------------------------
    const subscribeForm = document.getElementById('form-subscribe');
    const subscribeInput = document.getElementById('input-email');
    const subscribeStatus = document.getElementById('subscribe-status');
    const subscribeBtn = document.getElementById('btn-subscribe');

    if (subscribeForm && subscribeStatus) {
        subscribeForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const email = subscribeInput.value.trim();
            if (!email) return;

            // Simple validation UI
            subscribeBtn.disabled = true;
            subscribeBtn.textContent = 'Subscribing...';
            
            // Simulate API request timeout
            setTimeout(() => {
                subscribeStatus.textContent = 'Awesome! Check your inbox for exclusive updates.';
                subscribeStatus.className = 'subscribe-message success';
                
                // Clear input
                subscribeInput.value = '';
                
                // Reset button
                subscribeBtn.disabled = false;
                subscribeBtn.textContent = 'Subscribe';
                
                // Clear message after 5 seconds
                setTimeout(() => {
                    subscribeStatus.textContent = '';
                    subscribeStatus.className = 'subscribe-message';
                }, 5000);
            }, 1200);
        });
    }

    // -----------------------------------------
    // 7. Parallax Scroll Effect for Hero Background
    // -----------------------------------------
    const heroSection = document.querySelector('.hero-section');
    if (heroSection) {
        window.addEventListener('scroll', () => {
            const scrollPos = window.scrollY;
            // Shift background position slightly slower than scroll speed
            if (scrollPos < window.innerHeight) {
                heroSection.style.backgroundPositionY = `calc(30% + ${scrollPos * 0.4}px)`;
            }
        });
    }

    // -----------------------------------------
    // 8. Create Fest Page Form Logic
    // -----------------------------------------
    const createForm = document.getElementById('form-create-fest');
    const toastContainer = document.getElementById('alert-container');

    if (createForm && toastContainer) {
        const dropzone = document.getElementById('banner-dropzone');
        const fileInput = document.getElementById('banner-file-input');
        const previewContainer = document.getElementById('upload-preview-container');
        const previewImg = document.getElementById('upload-preview-img');
        const btnRemovePreview = document.getElementById('btn-remove-preview');
        const btnSaveDraft = document.getElementById('btn-save-draft');

        // Toast Helper
        const showToast = (message, type = 'info') => {
            const toast = document.createElement('div');
            toast.className = `alert-toast ${type}`;
            
            // Set dynamic icon based on type
            let iconSvg = '';
            if (type === 'success') {
                iconSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4ade80" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`;
            } else if (type === 'error') {
                iconSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`;
            } else {
                iconSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-cyan)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`;
            }

            toast.innerHTML = `
                <span class="toast-icon">${iconSvg}</span>
                <span class="toast-message">${message}</span>
            `;
            
            toastContainer.appendChild(toast);
            
            // Auto fadeout after 4 seconds
            setTimeout(() => {
                toast.style.animation = 'fadeInUp 0.3s cubic-bezier(0.25, 1, 0.5, 1) reverse forwards';
                setTimeout(() => toast.remove(), 300);
            }, 4000);
        };

        // File drag and drop / click logic
        dropzone.addEventListener('click', (e) => {
            // Prevent triggering multiple times if click propagates
            if (e.target === fileInput) return;
            if (e.target !== btnRemovePreview && !btnRemovePreview.contains(e.target)) {
                fileInput.click();
            }
        });

        // Drag events
        ['dragenter', 'dragover'].forEach(eventName => {
            dropzone.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
                dropzone.style.borderColor = 'var(--color-cyan)';
                dropzone.style.boxShadow = '0 0 20px var(--color-cyan-glow)';
            }, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropzone.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
                dropzone.style.borderColor = '';
                dropzone.style.boxShadow = '';
            }, false);
        });

        // Drop file
        dropzone.addEventListener('drop', (e) => {
            const dt = e.dataTransfer;
            const files = dt.files;
            if (files.length) {
                handleFiles(files);
            }
        });

        // File Select Input
        fileInput.addEventListener('change', function() {
            if (this.files.length) {
                handleFiles(this.files);
            }
        });

        // Process file helper
        function handleFiles(files) {
            const file = files[0];
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onloadend = () => {
                    previewImg.src = reader.result;
                    previewContainer.classList.add('active');
                    showToast('Banner image uploaded successfully.', 'info');
                };
            } else {
                showToast('Please upload an image file.', 'error');
            }
        }

        // Remove Preview
        btnRemovePreview.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            fileInput.value = '';
            previewImg.src = '';
            previewContainer.classList.remove('active');
            showToast('Banner image removed.', 'info');
        });

        // Save Draft Action
        btnSaveDraft.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Authentication check
            if (sessionStorage.getItem('isLoggedIn') !== 'true') {
                showToast('Authentication required to save draft. Redirecting to login...', 'error');
                setTimeout(() => {
                    window.location.href = 'login.html?redirect=create-fest.html';
                }, 1500);
                return;
            }
            
            // Check title is filled for saving draft
            const eventTitleVal = document.getElementById('event-title').value.trim();
            if (!eventTitleVal) {
                showToast('Please enter an Event Title to save as draft.', 'error');
                document.getElementById('event-title').focus();
                return;
            }

            showToast('Draft successfully saved locally!', 'success');
        });

        // Publish Event Action
        createForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Authentication check
            if (sessionStorage.getItem('isLoggedIn') !== 'true') {
                showToast('Authentication required to publish event. Redirecting to login...', 'error');
                setTimeout(() => {
                    window.location.href = 'login.html?redirect=create-fest.html';
                }, 1500);
                return;
            }
            
            // Perform simulated verification
            const eventTitle = document.getElementById('event-title').value.trim();
            const date = document.getElementById('event-date').value;
            const venue = document.getElementById('event-venue').value.trim();
            const category = document.getElementById('event-category').value;
            
            if (!eventTitle || !date || !venue) {
                showToast('Please fill out all required fields.', 'error');
                return;
            }

            // Parse date to Month & Day (timezone-safe parse)
            const dateParts = date.split('-');
            const monthIndex = parseInt(dateParts[1], 10) - 1;
            const dayVal = dateParts[2];
            const monthsFull = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
            const monthStr = monthsFull[monthIndex] || 'OCT';
            const dayStr = String(parseInt(dayVal, 10)).padStart(2, '0');

            // Time formatter helper
            const formatTime = (timeString) => {
                if (!timeString) return '--:--';
                const parts = timeString.split(':');
                let hours = parseInt(parts[0], 10);
                const minutes = parts[1];
                const ampm = hours >= 12 ? 'PM' : 'AM';
                hours = hours % 12;
                hours = hours ? hours : 12;
                return `${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;
            };
            const startFormatted = formatTime(document.getElementById('event-start-time').value);
            const endFormatted = formatTime(document.getElementById('event-end-time').value);
            const timeRangeStr = `${startFormatted} - ${endFormatted}`;

            // Date string formatter helper
            const formatDateString = (dateString) => {
                if (!dateString) return 'N/A';
                const parts = dateString.split('-');
                const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                return `${monthNames[parseInt(parts[1], 10)-1]} ${parseInt(parts[2], 10)}, ${parts[0]}`;
            };
            const deadlineFormatted = formatDateString(document.getElementById('event-deadline').value);

            // Category mapping
            const categoryMap = {
                'hackathon': 'TECH',
                'music-fest': 'MUSIC',
                'art-expo': 'ART',
                'conference': 'TECH',
                'webinar': 'TECH'
            };

            const mappedCategory = categoryMap[category] || 'TECH';

            // Create new fest card object with all details
            const newFest = {
                id: 'custom-' + Date.now(),
                title: eventTitle,
                category: mappedCategory,
                categoryClass: category, 
                dateMonth: monthStr,
                dateDay: dayStr,
                location: venue,
                image: previewContainer.classList.contains('active') ? previewImg.src : 'assets/hero_bg.png',
                description: document.getElementById('event-description').value.trim(),
                timeRange: timeRangeStr,
                deadline: deadlineFormatted,
                seats: (document.getElementById('event-max-participants').value || '500') + ' Seats',
                fee: (document.getElementById('event-fee').value || 'Free Entry') === 'Free Entry' ? 'Free Entry' : '₹' + document.getElementById('event-fee').value + ' INR',
                eligibility: document.getElementById('event-eligibility').value.trim() || 'Open to all participants',
                organizer: document.getElementById('organizer-name').value.trim() + ' (' + document.getElementById('organizer-email').value.trim() + ')'
            };

            // Retrieve current custom fests list
            const customFests = JSON.parse(localStorage.getItem('customFests') || '[]');
            customFests.unshift(newFest); // add new fest to the front
            localStorage.setItem('customFests', JSON.stringify(customFests));

            showToast('Festival successfully published into the ecosystem!', 'success');

            // Redirect back to home after success
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 2000);
        });
    }

    // -----------------------------------------
    // 9. Load and Render Custom Fests on Homepage
    // -----------------------------------------
    const festsGrid = document.querySelector('.fests-grid');
    if (festsGrid) {
        const customFests = JSON.parse(localStorage.getItem('customFests') || '[]');
        customFests.forEach(fest => {
            const card = document.createElement('div');
            card.className = 'fest-card scroll-reveal active'; // immediately visible and animated
            card.id = `card-${fest.id}`;
            
            // Map category names to classes
            let categoryClass = 'tech';
            let tagText = 'TECH';
            let btnClass = 'btn-tech';
            let dateClass = 'date-tech';
            
            if (fest.categoryClass === 'music-fest') {
                categoryClass = 'music';
                tagText = 'MUSIC';
                btnClass = 'btn-music';
                dateClass = 'date-music';
            } else if (fest.categoryClass === 'art-expo') {
                categoryClass = 'art';
                tagText = 'ART';
                btnClass = 'btn-art';
                dateClass = 'date-art';
            }
            
            card.innerHTML = `
                <div class="fest-image-wrapper">
                    <img src="${fest.image}" alt="${fest.title}" class="fest-img">
                    <span class="fest-tag tag-${categoryClass}">${tagText}</span>
                    <span class="fest-countdown">NEW EVENT</span>
                </div>
                <div class="fest-card-content">
                    <div class="fest-card-header">
                        <h3 class="fest-title">${fest.title}</h3>
                        <div class="fest-date ${dateClass}">
                            <span class="month">${fest.dateMonth}</span>
                            <span class="day">${fest.dateDay}</span>
                        </div>
                    </div>
                    <p class="fest-location">${fest.location}</p>
                    <a href="#" class="view-details-btn ${btnClass}">View Details</a>
                </div>
            `;
            
            // Setup custom hover neon shadow
            card.addEventListener('mouseenter', () => {
                if (categoryClass === 'tech') {
                    card.style.boxShadow = '0 16px 36px rgba(0, 0, 0, 0.4), 0 0 20px rgba(0, 210, 255, 0.15)';
                    card.style.borderColor = 'rgba(0, 210, 255, 0.3)';
                } else if (categoryClass === 'music') {
                    card.style.boxShadow = '0 16px 36px rgba(0, 0, 0, 0.4), 0 0 20px rgba(192, 132, 252, 0.15)';
                    card.style.borderColor = 'rgba(192, 132, 252, 0.3)';
                } else {
                    card.style.boxShadow = '0 16px 36px rgba(0, 0, 0, 0.4), 0 0 20px rgba(251, 191, 36, 0.15)';
                    card.style.borderColor = 'rgba(251, 191, 36, 0.3)';
                }
            });
            
            card.addEventListener('mouseleave', () => {
                card.style.boxShadow = '';
                card.style.borderColor = '';
            });

            // Prepend new card to upcoming fests grid so it shows up first
            festsGrid.prepend(card);
        });
        
        // Re-initialize tilt effect on all cards (including the custom ones!)
        initTiltCards();
    }

    // -----------------------------------------
    // 10. Event Details Modal Drawer Trigger
    // -----------------------------------------
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('.view-details-btn');
        if (!btn) return;
        
        e.preventDefault();
        
        // Find card parent
        const card = btn.closest('.fest-card');
        if (!card) return;
        
        const cardId = card.id;
        let eventDetails = null;
        
        // Check if predefined
        if (PREDEFINED_EVENTS[cardId]) {
            eventDetails = PREDEFINED_EVENTS[cardId];
        } else {
            // Find in localStorage custom fests
            const customFests = JSON.parse(localStorage.getItem('customFests') || '[]');
            const searchId = cardId.replace('card-', '');
            eventDetails = customFests.find(f => f.id === searchId);
        }
        
        if (eventDetails) {
            // Populate Modal details
            const modal = document.getElementById('event-modal');
            const modalBanner = document.getElementById('modal-banner');
            const modalTag = document.getElementById('modal-tag');
            const modalTitle = document.getElementById('modal-title');
            const modalMonth = document.getElementById('modal-month');
            const modalDay = document.getElementById('modal-day');
            const modalLocation = document.getElementById('modal-location');
            const modalDescription = document.getElementById('modal-description');
            const modalTimeRange = document.getElementById('modal-time-range');
            const modalDeadline = document.getElementById('modal-deadline');
            const modalSeats = document.getElementById('modal-seats');
            const modalFee = document.getElementById('modal-fee');
            const modalEligibility = document.getElementById('modal-eligibility');
            const modalOrganizer = document.getElementById('modal-organizer');
            const dateBadge = document.getElementById('modal-date');
            
            modalBanner.src = eventDetails.image;
            modalBanner.alt = eventDetails.title;
            
            // Map tag text and class colors
            modalTag.textContent = eventDetails.category;
            modalTag.className = 'fest-tag';
            
            let catClass = eventDetails.categoryClass;
            if (catClass === 'hackathon' || catClass === 'conference' || catClass === 'webinar') {
                modalTag.classList.add('tag-tech');
                dateBadge.className = 'fest-date date-tech';
            } else if (catClass === 'music-fest' || catClass === 'music') {
                modalTag.classList.add('tag-music');
                dateBadge.className = 'fest-date date-music';
            } else if (catClass === 'art-expo' || catClass === 'art') {
                modalTag.classList.add('tag-art');
                dateBadge.className = 'fest-date date-art';
            } else {
                modalTag.classList.add('tag-tech');
                dateBadge.className = 'fest-date date-tech';
            }
            
            modalTitle.textContent = eventDetails.title;
            modalMonth.textContent = eventDetails.dateMonth;
            modalDay.textContent = eventDetails.dateDay;
            modalLocation.textContent = eventDetails.location;
            modalDescription.textContent = eventDetails.description;
            
            modalTimeRange.textContent = eventDetails.timeRange || 'All Day';
            modalDeadline.textContent = eventDetails.deadline || 'N/A';
            modalSeats.textContent = eventDetails.seats || 'Unlimited';
            modalFee.textContent = eventDetails.fee || 'Free';
            modalEligibility.textContent = eventDetails.eligibility || 'Open to all';
            modalOrganizer.textContent = eventDetails.organizer || 'CertFIRE Organizers Team';
            
            // Show modal
            modal.classList.add('active');
        }
    });

    // Close Modal Listeners
    const modal = document.getElementById('event-modal');
    const btnCloseModal = document.getElementById('btn-close-modal');
    
    if (modal && btnCloseModal) {
        const closeModal = () => {
            modal.classList.remove('active');
        };
        
        btnCloseModal.addEventListener('click', closeModal);
        
        // Close clicking outside the card
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
        
        // Close with escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.classList.contains('active')) {
                closeModal();
            }
        });
    }
});

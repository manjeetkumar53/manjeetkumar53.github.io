// Content Management System for Portfolio
class PortfolioManager {
    constructor() {
        this.content = null;
        this.init();
    }

    async init() {
        await this.loadContent();
        this.setupNavigation();
        this.setupTypingEffect();
        this.renderContent();
        // Setup animations after content is rendered
        setTimeout(() => {
            this.setupScrollAnimations();
        }, 100);
        this.hideLoader();
    }

    async loadContent() {
        try {
            const response = await fetch('data/content.json');
            this.content = await response.json();
        } catch (error) {
            console.error('Error loading content:', error);
            // Fallback to default content if JSON fails
            this.content = this.getDefaultContent();
        }
    }

    hideLoader() {
        setTimeout(() => {
            document.getElementById('loader').classList.add('hidden');
        }, 500);
    }

    setupNavigation() {
        const navbar = document.getElementById('navbar');
        const mobileToggle = document.getElementById('mobileToggle');
        const navMenu = document.getElementById('navMenu');
        const navLinks = document.querySelectorAll('.nav-link');

        // Scroll effect
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }

            // Update active nav link based on scroll position
            this.updateActiveNavLink();
        });

        // Mobile menu toggle
        mobileToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            const icon = mobileToggle.querySelector('i');
            icon.classList.toggle('fa-bars');
            icon.classList.toggle('fa-times');
        });

        // Close mobile menu on link click
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('active');
                const icon = mobileToggle.querySelector('i');
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            });
        });
    }

    updateActiveNavLink() {
        const sections = document.querySelectorAll('section[id]');
        const navLinks = document.querySelectorAll('.nav-link');

        let current = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            if (window.scrollY >= sectionTop - 200) {
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${current}`) {
                link.classList.add('active');
            }
        });
    }

    setupScrollAnimations() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        }, observerOptions);

        document.querySelectorAll('.fade-in').forEach(el => {
            observer.observe(el);
        });
    }

    setupTypingEffect() {
        if (!this.content) return;

        const typedOutput = document.getElementById('typedOutput');
        const texts = this.content.personal.subtitle;
        let textIndex = 0;
        let charIndex = 0;
        let isDeleting = false;
        let typingSpeed = 100;

        const type = () => {
            const currentText = texts[textIndex];

            if (!isDeleting) {
                typedOutput.textContent = `I am a ${currentText.substring(0, charIndex)}`;
                charIndex++;

                if (charIndex > currentText.length) {
                    isDeleting = true;
                    typingSpeed = 2000; // Pause before deleting
                }
            } else {
                typedOutput.textContent = `I am a ${currentText.substring(0, charIndex)}`;
                charIndex--;

                if (charIndex === 0) {
                    isDeleting = false;
                    textIndex = (textIndex + 1) % texts.length;
                    typingSpeed = 500; // Pause before typing next
                }
                typingSpeed = 50;
            }

            setTimeout(type, typingSpeed);
        };

        type();
    }

    renderContent() {
        if (!this.content) {
            console.error('No content loaded!');
            return;
        }

        console.log('Rendering content...', this.content);
        this.renderPersonalInfo();
        this.renderSocialLinks();
        this.renderSkills();
        this.renderExperience();
        this.renderHighlights();
        this.renderCertifications();
        this.renderFunFacts();
        this.renderContact();
        console.log('Content rendering complete');
    }

    renderPersonalInfo() {
        const { personal } = this.content;

        document.getElementById('heroName').textContent = personal.name;
        document.getElementById('heroDescription').innerHTML = personal.bio;
        document.getElementById('profileImage').src = personal.profileImage;

        // Download CV button is optional
        const downloadBtn = document.getElementById('downloadCV');
        if (downloadBtn && personal.resumeUrl) {
            downloadBtn.href = personal.resumeUrl;
        }

        document.getElementById('lastUpdated').textContent = new Date(this.content.lastUpdated).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    renderSocialLinks() {
        const { social } = this.content;
        const socialLinksContainer = document.getElementById('socialLinks');
        const contactSocialContainer = document.getElementById('contactSocial');

        const socialIcons = {
            github: 'fab fa-github',
            linkedin: 'fab fa-linkedin',
            stackoverflow: 'fab fa-stack-overflow',
            facebook: 'fab fa-facebook',
            blog: 'fas fa-blog'
        };

        const socialHTML = Object.entries(social).map(([platform, url]) => `
            <a href="${url}" target="_blank" rel="noopener noreferrer" title="${platform}">
                <i class="${socialIcons[platform]}"></i>
            </a>
        `).join('');

        socialLinksContainer.innerHTML = socialHTML;
        contactSocialContainer.innerHTML = socialHTML;
    }

    renderSkills() {
        const { skills } = this.content;
        const skillsGrid = document.getElementById('skillsGrid');

        if (!skillsGrid) {
            console.error('skillsGrid element not found');
            return;
        }

        console.log('Rendering skills:', skills.length);

        skillsGrid.innerHTML = skills.map(skill => `
            <div class="skill-card fade-in">
                <div class="skill-header">
                    <div class="skill-icon">
                        <i class="fas ${skill.icon || 'fa-code'}"></i>
                    </div>
                    <div class="skill-info">
                        <div class="skill-name">${skill.name}</div>
                        <div class="skill-category">${skill.category}</div>
                    </div>
                </div>
                <p class="skill-description">${skill.description}</p>
                ${skill.tags ? `
                    <div class="skill-tags">
                        ${skill.tags.slice(0, 4).map(tag => `<span class="skill-tag">${tag}</span>`).join('')}
                    </div>
                ` : ''}
                <div class="skill-progress">
                    <div class="skill-progress-bar" data-level="${skill.level}" style="width: 0%"></div>
                </div>
            </div>
        `).join('');

        // Animate progress bars when visible
        const progressBars = document.querySelectorAll('.skill-progress-bar');
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const bar = entry.target;
                    const level = bar.getAttribute('data-level');
                    setTimeout(() => {
                        bar.style.width = `${level}%`;
                    }, 100);
                    observer.unobserve(bar);
                }
            });
        }, { threshold: 0.5 });

        progressBars.forEach(bar => observer.observe(bar));
    }

    renderExperience() {
        const { experience } = this.content;
        const timeline = document.getElementById('experienceTimeline');

        timeline.innerHTML = experience.map((job, index) => `
            <div class="timeline-item fade-in" style="animation-delay: ${index * 0.1}s">
                <div class="timeline-content">
                    <div class="timeline-header">
                        <h3 class="timeline-position">${job.position}</h3>
                        <div class="timeline-company">${job.company}</div>
                        <div class="timeline-period">
                            <i class="fas fa-calendar-alt"></i> ${job.period} | 
                            <i class="fas fa-map-marker-alt"></i> ${job.location}
                        </div>
                    </div>
                    <ul class="timeline-responsibilities">
                        ${job.responsibilities.slice(0, 3).map(resp => `
                            <li>${resp}</li>
                        `).join('')}
                    </ul>
                    ${job.achievements && job.achievements.length > 0 ? `
                        <div class="timeline-achievements">
                            ${job.achievements.map(achievement => `
                                <span class="achievement-badge">
                                    <i class="fas fa-trophy"></i> ${achievement}
                                </span>
                            `).join('')}
                        </div>
                    ` : ''}
                </div>
            </div>
        `).join('');
    }

    renderHighlights() {
        const { highlights } = this.content;
        const highlightsGrid = document.getElementById('highlightsGrid');

        highlightsGrid.innerHTML = highlights.map((highlight, index) => `
            <div class="highlight-card fade-in" style="animation-delay: ${index * 0.05}s">
                <i class="fas fa-star"></i>
                <div class="highlight-title">${highlight.title}</div>
                ${highlight.link ? `
                    <a href="${highlight.link}" target="_blank" rel="noopener noreferrer" class="highlight-link">
                        <i class="fas fa-external-link-alt"></i> View
                    </a>
                ` : ''}
            </div>
        `).join('');
    }

    renderCertifications() {
        const { certifications } = this.content;
        const certificationsGrid = document.getElementById('certificationsGrid');

        if (!certificationsGrid || !certifications) return;

        certificationsGrid.innerHTML = certifications.map((cert, index) => {
            const hasImage = cert.image && cert.image.trim() !== '';
            // Using a high-quality Google Cloud logo as default/fallback
            const logoUrl = hasImage ? cert.image : 'https://www.gstatic.com/images/branding/product/2x/google_cloud_64dp.png';

            return `
                <a href="${cert.link || '#'}" target="_blank" rel="noopener noreferrer" class="badge-card fade-in" style="animation-delay: ${index * 0.1}s">
                    <div class="badge-image-container">
                        <img src="${logoUrl}" alt="${cert.title}" class="badge-image" onerror="this.src='https://cloud.google.com/_static/cloud/images/social-icon-google-cloud-1200-630.png'">
                    </div>
                    <div class="badge-issuer">${cert.issuer}</div>
                    <h3 class="badge-title">${cert.title}</h3>
                    <div class="badge-footer">
                        <div class="badge-date">Earned ${cert.date}</div>
                        <div class="badge-status">Completion Badge</div>
                    </div>
                </a>
            `;
        }).join('');
    }

    renderFunFacts() {
        const { funFacts } = this.content;
        const funFactsGrid = document.getElementById('funFactsGrid');

        funFactsGrid.innerHTML = funFacts.map((fact, index) => `
            <div class="fun-fact fade-in" style="animation-delay: ${index * 0.1}s">
                <i class="las la-${fact.icon.replace('la-', '')}"></i>
                <div class="fun-fact-value" data-target="${fact.value}">${fact.value}</div>
                <div class="fun-fact-label">${fact.label}</div>
            </div>
        `).join('');
    }



    renderContact() {
        const { personal } = this.content;

        document.getElementById('contactLocation').textContent = personal.location;
        document.getElementById('contactEmail').textContent = personal.email;

        // Handle contact form submission
        const contactForm = document.getElementById('contactForm');
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const formData = new FormData(contactForm);
            const data = Object.fromEntries(formData);

            // Create mailto link
            const subject = encodeURIComponent(`Portfolio Contact from ${data.name}`);
            const body = encodeURIComponent(`Name: ${data.name}\nEmail: ${data.email}\n\nMessage:\n${data.message}`);
            window.location.href = `mailto:${personal.email}?subject=${subject}&body=${body}`;

            contactForm.reset();
        });
    }

    getDefaultContent() {
        // Fallback content if JSON loading fails
        return {
            personal: {
                name: "Manjeet Kumar",
                title: "Engineering Manager",
                subtitle: ["Engineering Manager", "Technical Architect"],
                location: "Berlin, Germany",
                email: "manjeetkumar53@gmail.com",
                bio: "Engineering Manager with 10+ years of experience",
                resumeUrl: "Manjeet Kumar CV 2025.pdf",
                profileImage: "images/profile.jpg"
            },
            social: {
                github: "https://github.com/manjeetkumar53",
                linkedin: "https://www.linkedin.com/in/manjeet-kumar-31963020/"
            },
            skills: [],
            experience: [],
            education: [],
            highlights: [],
            funFacts: [],
            blogPosts: [],
            lastUpdated: new Date().toISOString()
        };
    }
}

// Initialize the portfolio when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new PortfolioManager();
});

// Add smooth scroll behavior
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            const offset = 80;
            const targetPosition = target.offsetTop - offset;
            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        }
    });
});

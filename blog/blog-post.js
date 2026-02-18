// Blog Post Renderer
// Loads markdown blog posts and renders them with full features

class BlogPostRenderer {
    constructor() {
        this.post = null;
        this.init();
    }

    async init() {
        // Get post slug from URL
        const urlParams = new URLSearchParams(window.location.search);
        const slug = urlParams.get('post');

        if (!slug) {
            this.showError('No blog post specified');
            return;
        }

        await this.loadPost(slug);
        this.setupSmartHeader();
        this.setupReadingProgress();
        this.setupSocialShare();
        this.setupTableOfContents();
    }

    async loadPost(slug) {
        try {
            // Load the markdown file
            const response = await fetch(`/blog/posts/${slug}.md`);

            if (!response.ok) {
                throw new Error('Post not found');
            }

            const markdown = await response.text();
            this.post = this.parseMarkdown(markdown);

            this.renderPost();
            this.loadRelatedPosts();

            document.getElementById('loading').style.display = 'none';
            document.getElementById('articleContainer').style.display = 'grid';

        } catch (error) {
            console.error('Error loading post:', error);
            this.showError('Failed to load blog post');
        }
    }

    parseMarkdown(markdown) {
        // More robust frontmatter extraction
        const fmMatch = markdown.match(/^---\r?\n([\s\S]+?)\r?\n---\r?\n([\s\S]*)$/);

        if (!fmMatch) {
            return {
                frontmatter: {},
                content: markdown
            };
        }

        const fmText = fmMatch[1];
        const content = fmMatch[2];

        // Robust YAML-ish parser
        const frontmatter = {};
        fmText.split(/\r?\n/).forEach(line => {
            const colonIndex = line.indexOf(':');
            if (colonIndex > 0) {
                const key = line.substring(0, colonIndex).trim();
                let value = line.substring(colonIndex + 1).trim();

                // Strip quotes
                value = value.replace(/^["']|["']$/g, '');

                // Parse arrays [a, b, c]
                if (value.startsWith('[') && value.endsWith(']')) {
                    value = value.slice(1, -1).split(',').map(v => v.trim().replace(/["']/g, ''));
                }
                // Parse booleans
                else if (value.toLowerCase() === 'true') value = true;
                else if (value.toLowerCase() === 'false') value = false;

                frontmatter[key] = value;
            }
        });

        return { frontmatter, content };
    }

    renderPost() {
        const { frontmatter, content } = this.post;

        // Set meta information
        document.title = frontmatter.seoTitle || frontmatter.title || 'Blog Post';
        const description = frontmatter.seoDescription || frontmatter.excerpt || '';

        // Update meta tags
        document.getElementById('page-title').content = document.title;
        document.getElementById('page-description').content = description;
        document.getElementById('page-keywords').content = Array.isArray(frontmatter.tags) ? frontmatter.tags.join(', ') : '';

        // Open Graph
        const currentUrl = window.location.href;
        document.getElementById('og-url').content = currentUrl;
        document.getElementById('og-title').content = frontmatter.title;
        document.getElementById('og-description').content = description;
        document.getElementById('og-image').content = frontmatter.image || '/images/blog/default-og.jpg';

        // Twitter
        document.getElementById('twitter-url').content = currentUrl;
        document.getElementById('twitter-title').content = frontmatter.title;
        document.getElementById('twitter-description').content = description;
        document.getElementById('twitter-image').content = frontmatter.image || '/images/blog/default-og.jpg';

        // Render article elements
        if (frontmatter.image) {
            document.getElementById('articleCover').src = frontmatter.image;
            document.getElementById('articleCover').alt = frontmatter.title;
        } else {
            document.getElementById('articleCover').style.display = 'none';
        }

        // Meta information
        const readingTime = this.calculateReadingTime(content);
        const articleMeta = document.getElementById('articleMeta');
        articleMeta.innerHTML = `
            <span class="article-category">${frontmatter.category || 'Blog'}</span>
            <span><i class="fas fa-calendar-alt"></i> ${this.formatDate(frontmatter.date)}</span>
            <span><i class="fas fa-clock"></i> ${readingTime} min read</span>
            <span><i class="fas fa-user"></i> ${frontmatter.author || 'Manjeet Kumar'}</span>
        `;

        document.getElementById('articleTitle').textContent = frontmatter.title || 'Untitled';
        document.getElementById('articleExcerpt').textContent = frontmatter.excerpt || '';

        // Convert markdown to HTML with custom alert rendering
        let htmlContent = marked.parse(content);

        // Handle GitHub-style alerts [!NOTE], [!TIP], etc.
        htmlContent = this.renderAlerts(htmlContent);

        document.getElementById('articleContent').innerHTML = htmlContent;

        // Render tags
        if (frontmatter.tags && Array.isArray(frontmatter.tags)) {
            const tagsHtml = frontmatter.tags.map(tag =>
                `<span class="tag">#${tag}</span>`
            ).join('');
            document.getElementById('articleTags').innerHTML = tagsHtml;
        }

        // Syntax highlighting
        Prism.highlightAll();

        // Reader Utilities
        this.setupCodeBlocks();
        this.setupHeadingAnchors();
        this.setupLightbox();
    }

    renderAlerts(html) {
        const alerts = {
            'NOTE': { icon: 'fa-info-circle', class: 'note' },
            'TIP': { icon: 'fa-lightbulb', class: 'tip' },
            'IMPORTANT': { icon: 'fa-exclamation-circle', class: 'important' },
            'WARNING': { icon: 'fa-exclamation-triangle', class: 'warning' },
            'CAUTION': { icon: 'fa-fire', class: 'caution' }
        };

        return html.replace(/>\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*([\s\S]+?)<\/blockquote>/g, (match, type, content) => {
            const config = alerts[type];
            return `
                <div class="article-alert ${config.class}">
                    <div class="alert-title">
                        <i class="fas ${config.icon}"></i>
                        ${type}
                    </div>
                    <div class="alert-content">${content}</div>
                </div>
            `;
        });
    }

    setupCodeBlocks() {
        const blocks = document.querySelectorAll('pre');
        blocks.forEach(block => {
            const code = block.querySelector('code');
            const langClass = Array.from(code.classList).find(c => c.startsWith('language-'));
            const lang = langClass ? langClass.replace('language-', '') : 'text';

            // Create wrapper
            const wrapper = document.createElement('div');
            wrapper.className = 'code-wrapper';
            block.parentNode.insertBefore(wrapper, block);

            // Create header
            const header = document.createElement('div');
            header.className = 'code-header';
            header.innerHTML = `
                <div class="code-controls">
                    <span class="control-red"></span>
                    <span class="control-yellow"></span>
                    <span class="control-green"></span>
                </div>
                <div class="code-lang">
                    <i class="fas fa-code"></i>
                    ${lang === 'bash' ? 'Terminal' : lang.charAt(0).toUpperCase() + lang.slice(1)}
                </div>
                <button class="copy-btn">
                    <i class="far fa-copy"></i> Copy
                </button>
            `;

            wrapper.appendChild(header);
            wrapper.appendChild(block);

            // Add copy functionality
            const btn = header.querySelector('.copy-btn');
            btn.addEventListener('click', async () => {
                const text = code ? code.innerText : block.innerText;
                try {
                    await navigator.clipboard.writeText(text);
                    btn.innerHTML = '<i class="fas fa-check"></i> Copied!';
                    setTimeout(() => {
                        btn.innerHTML = '<i class="far fa-copy"></i> Copy';
                    }, 2000);
                } catch (err) {
                    console.error('Failed to copy!', err);
                }
            });
        });
    }

    setupLightbox() {
        const images = document.querySelectorAll('.article-content img');

        // Create lightbox if not exists
        let overlay = document.querySelector('.lightbox-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.className = 'lightbox-overlay';
            overlay.innerHTML = `
                <div class="lightbox-close">&times;</div>
                <img src="" alt="Full size image">
            `;
            document.body.appendChild(overlay);

            overlay.addEventListener('click', () => {
                overlay.style.display = 'none';
                document.body.style.overflow = '';
            });
        }

        images.forEach(img => {
            img.style.cursor = 'zoom-in';
            img.addEventListener('click', () => {
                const fullImg = overlay.querySelector('img');
                fullImg.src = img.src;
                overlay.style.display = 'flex';
                document.body.style.overflow = 'hidden';
            });
        });
    }


    setupHeadingAnchors() {
        const container = document.getElementById('articleContent');
        const headings = container.querySelectorAll('h2, h3');

        headings.forEach(heading => {
            const id = heading.id || heading.innerText.toLowerCase().replace(/[^a-z0-9]+/g, '-');
            heading.id = id;

            const anchor = document.createElement('a');
            anchor.className = 'heading-anchor';
            anchor.href = `#${id}`;
            anchor.innerHTML = '<i class="fas fa-link"></i>';
            heading.insertBefore(anchor, heading.firstChild);
        });
    }

    calculateReadingTime(text) {
        const wordsPerMinute = 200;
        const wordCount = text.trim().split(/\s+/).length;
        return Math.ceil(wordCount / wordsPerMinute);
    }

    formatDate(dateString) {
        if (!dateString) return 'Unknown date';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    setupSmartHeader() {
        const nav = document.querySelector('nav');
        let lastScroll = 0;

        window.addEventListener('scroll', () => {
            const currentScroll = window.pageYOffset;
            if (currentScroll <= 0) {
                nav.classList.remove('nav-hidden');
                return;
            }

            if (currentScroll > lastScroll && !nav.classList.contains('nav-hidden') && currentScroll > 200) {
                // Scroll down
                nav.classList.add('nav-hidden');
            } else if (currentScroll < lastScroll && nav.classList.contains('nav-hidden')) {
                // Scroll up
                nav.classList.remove('nav-hidden');
            }
            lastScroll = currentScroll;
        });
    }

    setupReadingProgress() {
        const progressBar = document.getElementById('readingProgress');

        window.addEventListener('scroll', () => {
            const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
            const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
            const scrolled = (winScroll / height) * 100;
            progressBar.style.width = scrolled + '%';
        });
    }

    setupTableOfContents() {
        const content = document.getElementById('articleContent');
        const headings = content.querySelectorAll('h2, h3');
        const tocList = document.getElementById('tocList');

        if (headings.length === 0) {
            document.querySelector('.toc-sidebar').style.display = 'none';
            return;
        }

        const tocItems = Array.from(headings).map((heading, index) => {
            const id = `heading-${index}`;
            heading.id = id;

            const level = parseInt(heading.tagName.substring(1));
            const indent = level === 3 ? 'style="padding-left: 1.5rem;"' : '';

            return `<li><a href="#${id}" ${indent}>${heading.textContent}</a></li>`;
        }).join('');

        tocList.innerHTML = tocItems;

        // Highlight active section
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const id = entry.target.id;
                    tocList.querySelectorAll('a').forEach(a => a.classList.remove('active'));
                    tocList.querySelector(`a[href="#${id}"]`)?.classList.add('active');
                }
            });
        }, {
            rootMargin: '-100px 0px -80% 0px'
        });

        headings.forEach(heading => observer.observe(heading));
    }

    setupSocialShare() {
        const url = encodeURIComponent(window.location.href);
        const title = encodeURIComponent(this.post.frontmatter.title || '');

        // LinkedIn
        document.getElementById('shareLinkedIn').href =
            `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;

        // Twitter
        document.getElementById('shareTwitter').href =
            `https://twitter.com/intent/tweet?url=${url}&text=${title}`;

        // Email
        document.getElementById('shareEmail').href =
            `mailto:?subject=${title}&body=Check out this article: ${url}`;

        // Copy link
        document.getElementById('copyLink').addEventListener('click', async () => {
            try {
                await navigator.clipboard.writeText(window.location.href);
                const btn = document.getElementById('copyLink');
                const icon = btn.querySelector('i');
                icon.className = 'fas fa-check';
                setTimeout(() => {
                    icon.className = 'fas fa-link';
                }, 2000);
            } catch (err) {
                console.error('Failed to copy:', err);
            }
        });
    }

    async loadRelatedPosts() {
        try {
            const response = await fetch('/data/blog-posts.json');
            if (!response.ok) return;

            const posts = await response.json();
            const currentCategory = this.post.frontmatter.category;

            // Find related posts (same category, excluding current post)
            const currentUrl = new URLSearchParams(window.location.search).get('post');
            const related = posts
                .filter(p => p.category === currentCategory && p.slug !== currentUrl)
                .slice(0, 3);

            if (related.length === 0) return;

            const relatedHtml = related.map(post => `
                <a href="/blog/post.html?post=${post.slug}" class="related-card">
                    <img src="${post.image || '/images/blog/default.jpg'}" alt="${post.title}">
                    <div class="related-card-content">
                        <div class="related-card-category">${post.category}</div>
                        <h3 class="related-card-title">${post.title}</h3>
                        <div class="related-card-date">
                            <i class="fas fa-calendar-alt"></i> ${this.formatDate(post.date)}
                        </div>
                    </div>
                </a>
            `).join('');

            document.getElementById('relatedPosts').innerHTML = relatedHtml;

        } catch (error) {
            console.error('Error loading related posts:', error);
        }
    }

    showError(message) {
        document.getElementById('loading').innerHTML = `
            <div style="text-align: center; padding: 4rem 2rem;">
                <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: var(--primary); margin-bottom: 1rem;"></i>
                <h2 style="margin-bottom: 1rem;">Oops!</h2>
                <p style="color: var(--text-secondary); margin-bottom: 2rem;">${message}</p>
                <a href="/blog/" style="color: var(--primary); text-decoration: none; font-weight: 600;">
                    <i class="fas fa-arrow-left"></i> Back to Blog
                </a>
            </div>
        `;
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new BlogPostRenderer();
});

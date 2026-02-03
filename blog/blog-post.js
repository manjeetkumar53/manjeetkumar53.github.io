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
        // Extract frontmatter
        const frontmatterRegex = /^---\n([\s\S]+?)\n---\n([\s\S]*)$/;
        const match = markdown.match(frontmatterRegex);

        if (!match) {
            return {
                frontmatter: {},
                content: markdown
            };
        }

        const frontmatterText = match[1];
        const content = match[2];

        // Parse YAML frontmatter (simple parser)
        const frontmatter = {};
        frontmatterText.split('\n').forEach(line => {
            const colonIndex = line.indexOf(':');
            if (colonIndex > 0) {
                const key = line.substring(0, colonIndex).trim();
                let value = line.substring(colonIndex + 1).trim();
                
                // Remove quotes
                value = value.replace(/^["']|["']$/g, '');
                
                // Handle arrays (tags)
                if (value.startsWith('[') && value.endsWith(']')) {
                    value = value.slice(1, -1).split(',').map(v => v.trim().replace(/["']/g, ''));
                }
                
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

        // Convert markdown to HTML
        const htmlContent = marked.parse(content);
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

#!/usr/bin/env python3
import os
import json
import re
from datetime import datetime

# Configuration
POSTS_DIR = 'blog/posts'
BLOG_POSTS_JSON = 'data/blog-posts.json'
CONTENT_JSON = 'data/content.json'
BLOG_CONFIG_JSON = 'data/blog-config.json'

def parse_frontmatter(content):
    """Simple parser for YAML frontmatter."""
    fm_match = re.match(r'^---\n(.*?)\n---\n(.*)', content, re.DOTALL)
    if not fm_match:
        return {}, content
    
    fm_text = fm_match.group(1)
    body = fm_match.group(2)
    
    metadata = {}
    for line in fm_text.split('\n'):
        if ':' in line:
            key, val = line.split(':', 1)
            key = key.strip()
            val = val.strip().strip('"').strip("'")
            
            # Handle arrays [a, b, c]
            if val.startswith('[') and val.endswith(']'):
                val = [v.strip().strip('"').strip("'") for v in val[1:-1].split(',')]
            # Handle booleans
            elif val.lower() == 'true':
                val = True
            elif val.lower() == 'false':
                val = False
            
            metadata[key] = val
    
    return metadata, body

def calculate_reading_time(text):
    words = len(re.findall(r'\w+', text))
    return max(1, round(words / 200))

def index_posts():
    print("🚀 Indexing blog posts...")
    posts = []
    
    if not os.path.exists(POSTS_DIR):
        print(f"Error: {POSTS_DIR} not found.")
        return

    for filename in os.listdir(POSTS_DIR):
        if filename.endswith('.md'):
            slug = filename[:-3]
            with open(os.path.join(POSTS_DIR, filename), 'r', encoding='utf-8') as f:
                content = f.read()
                metadata, body = parse_frontmatter(content)
                
                # Required metadata with defaults
                post_data = {
                    "slug": slug,
                    "title": metadata.get('title', 'Untitled'),
                    "date": metadata.get('date', datetime.now().isoformat()),
                    "author": metadata.get('author', 'Manjeet Kumar'),
                    "category": metadata.get('category', 'General'),
                    "tags": metadata.get('tags', []),
                    "image": metadata.get('image', ''),
                    "excerpt": metadata.get('excerpt', body[:150].strip() + '...'),
                    "featured": metadata.get('featured', False),
                    "draft": metadata.get('draft', False),
                    "readingTime": calculate_reading_time(body)
                }
                
                if not post_data["draft"]:
                    posts.append(post_data)

    # Sort by date descending
    posts.sort(key=lambda x: x['date'], reverse=True)

    # 1. Update blog-posts.json
    with open(BLOG_POSTS_JSON, 'w', encoding='utf-8') as f:
        json.dump(posts, f, indent=2)
    print(f"✅ Updated {BLOG_POSTS_JSON}")

    # 2. Update content.json (Portfolio featured posts)
    if os.path.exists(CONTENT_JSON):
        with open(CONTENT_JSON, 'r', encoding='utf-8') as f:
            content_data = json.load(f)
        
        # Take top 3 non-draft posts for the portfolio
        content_data['blogPosts'] = posts[:3]
        
        with open(CONTENT_JSON, 'w', encoding='utf-8') as f:
            json.dump(content_data, f, indent=2)
        print(f"✅ Updated {CONTENT_JSON} with latest posts")

def create_post(title):
    print(f"📝 Creating new post: {title}")
    slug = re.sub(r'[^a-z0-9]+', '-', title.lower()).strip('-')
    date_str = datetime.now().strftime('%Y-%m-%d')
    filename = f"{date_str}-{slug}.md"
    filepath = os.path.join(POSTS_DIR, filename)
    
    if os.path.exists(filepath):
        print(f"Error: Post already exists at {filepath}")
        return

    template = f"""---
title: "{title}"
date: "{datetime.now().isoformat()}"
author: "Manjeet Kumar"
category: "GenAI"
tags: ["AI", "Tech"]
excerpt: "A brief summary of your high-performance blog post..."
image: ""
featured: false
draft: true
---

## Introduction

Write your amazing content here...

## Key Takeaways

- Point 1
- Point 2
"""
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(template)
    print(f"✅ Post created: {filepath}")

def list_posts():
    if os.path.exists(BLOG_POSTS_JSON):
        with open(BLOG_POSTS_JSON, 'r', encoding='utf-8') as f:
            posts = json.load(f)
        print("\n📚 Current Published Posts:")
        for p in posts:
            status = "[FEATURED]" if p.get('featured') else ""
            print(f"- {p['date'][:10]} | {p['title']} {status}")
    else:
        print("No index found. Run 'index' first.")

if __name__ == "__main__":
    import sys
    if len(sys.argv) < 2:
        print("Usage: python3 manage_blog.py [index | new <title> | list]")
    else:
        cmd = sys.argv[1]
        if cmd == 'index':
            index_posts()
        elif cmd == 'new' and len(sys.argv) > 2:
            create_post(" ".join(sys.argv[2:]))
        elif cmd == 'list':
            list_posts()
        else:
            print("Unknown command or missing arguments.")

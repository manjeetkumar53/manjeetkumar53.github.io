# 📝 Portfolio Website - Quick Update Guide

## 🚀 Daily Updates Made Easy!

Your website is now **data-driven** - all content is stored in a single JSON file. You never need to touch HTML/CSS again!

## 📍 Where to Update Content

All your content lives in:
```
data/content.json
```

This single file controls **everything** on your website!

## 📝 Quick Update Checklist

### ✅ Adding New Experience
Edit `data/content.json` → `experience` section:
```json
{
  "company": "New Company Name",
  "location": "City, Country",
  "position": "Your Title",
  "period": "Jan 2026 - Present",
  "responsibilities": [
    "What you do...",
    "Another responsibility..."
  ],
  "achievements": [
    "Key achievement 1",
    "Key achievement 2"
  ]
}
```

### ✅ Adding New Skills
Edit `data/content.json` → `skills` section:
```json
{
  "category": "Technology Type",
  "name": "Skill Name",
  "description": "Brief description of your expertise",
  "level": 95
}
```

### ✅ Adding Blog Posts
Edit `data/content.json` → `blogPosts` section:
```json
{
  "title": "Blog Post Title",
  "category": "Category Name",
  "image": "images/blog/image.jpg",
  "url": "https://your-blog-url.com",
  "date": "2026-02-02"
}
```

### ✅ Adding Highlights
Edit `data/content.json` → `highlights` section:
```json
{
  "title": "Achievement description",
  "link": "https://link-if-any.com" // Optional
}
```

### ✅ Updating Fun Facts
Edit `data/content.json` → `funFacts` section:
```json
{
  "icon": "la-trophy",
  "value": "100",
  "label": "Label Text"
}
```

### ✅ Updating Personal Info
Edit `data/content.json` → `personal` section:
```json
{
  "name": "Your Name",
  "title": "Your Title",
  "location": "Your Location",
  "email": "your@email.com",
  "bio": "Your bio...",
  "resumeUrl": "path/to/resume.pdf"
}
```

### ✅ Updating Social Links
Edit `data/content.json` → `social` section:
```json
{
  "github": "https://github.com/yourusername",
  "linkedin": "https://linkedin.com/in/yourprofile",
  "stackoverflow": "https://stackoverflow.com/users/...",
  "blog": "https://yourblog.com"
}
```

## 🎨 Switching to New Design

### Option 1: Preview New Design
1. Open your browser
2. Navigate to: `http://localhost:8000/index-new.html`

### Option 2: Make New Design Live
```bash
# Backup old design
mv index.html index-old.html

# Make new design live
mv index-new.html index.html
```

## 🔄 Workflow

### Daily Updates (2 minutes):
1. Open `data/content.json` in any text editor
2. Update the relevant section
3. Save the file
4. Refresh your browser - changes appear instantly!

### Local Preview:
```bash
# Start local server
python3 -m http.server

# Open browser to:
http://localhost:8000
```

### Deploy to GitHub Pages:
```bash
git add .
git commit -m "Update: [describe your changes]"
git push origin master
```

Changes go live at: `https://manjeetkumar53.github.io`

## 🎯 Common Updates

### Weekly:
- [ ] Update fun facts numbers
- [ ] Add new blog posts
- [ ] Update `lastUpdated` date in JSON

### Monthly:
- [ ] Review experience descriptions
- [ ] Update skills proficiency levels
- [ ] Add new highlights/achievements

### On Change:
- [ ] New job → Update experience section
- [ ] New project → Add to highlights
- [ ] New skill → Add to skills section

## 📂 File Structure
```
manjeetkumar53.github.io/
├── index.html              # Your website (NEW modern design)
├── index-old.html          # Backup of old design
├── data/
│   └── content.json       # ← EDIT THIS FILE FOR ALL UPDATES
├── js/
│   └── app.js             # Handles loading content from JSON
├── images/                # Your images
│   ├── profile.jpg
│   └── blog/
└── Manjeet Kumar CV 2025.pdf
```

## 🚨 Important Tips

### ✅ DO:
- Always validate JSON syntax (use jsonlint.com if needed)
- Keep backup of content.json before major edits
- Test locally before deploying
- Update `lastUpdated` field when you make changes

### ❌ DON'T:
- Don't edit index.html (all content comes from JSON)
- Don't forget commas in JSON arrays
- Don't use special quotes (" ") - use regular quotes (" ")

## 🛠 Helper Commands

### Quick JSON Validation:
```bash
# Check if JSON is valid
python3 -c "import json; json.load(open('data/content.json'))" && echo "✓ JSON is valid" || echo "✗ JSON has errors"
```

### Quick Backup:
```bash
# Create dated backup
cp data/content.json data/content-backup-$(date +%Y%m%d).json
```

### Quick Deploy:
```bash
# One command to deploy
git add . && git commit -m "Update content" && git push
```

## 📞 Need Help?

If something doesn't work:
1. Check browser console (F12) for errors
2. Validate your JSON at jsonlint.com
3. Make sure all image paths are correct
4. Clear browser cache and refresh

## 🎉 You're All Set!

Your website is now:
- ✅ Easy to update (just edit one JSON file)
- ✅ Modern and beautiful
- ✅ Mobile responsive
- ✅ Fast and lightweight
- ✅ Professional looking

**Happy updating! 🚀**

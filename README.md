# 🚀 Portfolio Website - Manjeet Kumar

[![Live](https://img.shields.io/badge/Live-manjeetkumar53.github.io-success)](https://manjeetkumar53.github.io)
[![Made with](https://img.shields.io/badge/Made%20with-JavaScript-yellow)](https://github.com/manjeetkumar53/manjeetkumar53.github.io)

Modern, responsive portfolio website with easy content management system.

## ✨ Features

- 🎨 **Modern UI/UX** - Clean, professional design with smooth animations
- 📱 **Fully Responsive** - Works perfectly on all devices
- 🔄 **Easy Updates** - Edit one JSON file to update everything
- ⚡ **Fast & Lightweight** - No heavy frameworks, pure performance
- 🎯 **Data-Driven** - All content managed through JSON
- 🌙 **Dark Theme** - Easy on the eyes, professional look

## 🚀 Quick Start

### 1. Update Content Daily
```bash
# Edit this file to update your website:
data/content.json
```

### 2. Preview Changes
```bash
# Start local server
python3 -m http.server

# Open browser to:
http://localhost:8000
```

### 3. Deploy to GitHub Pages
```bash
# Quick deploy
git add .
git commit -m "Update content"
git push origin master
```

Or use the helper script:
```bash
./update.sh
```

## 📝 Content Management

All website content is in **one file**: `data/content.json`

### What You Can Update:
- ✅ Personal information (name, title, bio)
- ✅ Work experience
- ✅ Skills and expertise
- ✅ Achievements and highlights
- ✅ Blog posts
- ✅ Fun facts
- ✅ Social media links
- ✅ Contact information

### Example: Adding New Experience
```json
{
  "company": "New Company",
  "location": "Berlin, Germany",
  "position": "Engineering Manager",
  "period": "Jan 2026 - Present",
  "responsibilities": [
    "Lead engineering teams",
    "Architect solutions"
  ],
  "achievements": [
    "Key achievement"
  ]
}
```

See [UPDATE-GUIDE.md](UPDATE-GUIDE.md) for detailed instructions.

## 🛠 Tech Stack

- **Frontend**: Pure HTML5, CSS3, JavaScript (ES6+)
- **Styling**: Custom CSS with modern features
- **Icons**: Font Awesome 6
- **Fonts**: Inter, Space Grotesk
- **Hosting**: GitHub Pages

## 📂 Project Structure

```
manjeetkumar53.github.io/
├── index.html              # Main website
├── data/
│   └── content.json       # All website content
├── js/
│   └── app.js             # Content loader & interactions
├── images/                # Images and assets
├── css/                   # Legacy styles
├── UPDATE-GUIDE.md        # Quick update guide
├── update.sh              # Helper script
└── README.md              # This file
```

## 🎯 Usage

### Daily Updates (2 minutes)
1. Open `data/content.json`
2. Update relevant section
3. Save and refresh browser

### Weekly Maintenance
- Update fun facts numbers
- Add new blog posts
- Review and update skills

### On Major Changes
- Backup content.json
- Validate JSON syntax
- Test locally before deploying

## 🔧 Helper Scripts

### Update Script
```bash
./update.sh
```

Options:
1. Validate JSON
2. Create backup
3. Preview locally
4. Deploy to GitHub
5. Switch to new design
6. Edit content

### Validate JSON
```bash
python3 -c "import json; json.load(open('data/content.json'))" && echo "✓ Valid"
```

### Create Backup
```bash
cp data/content.json data/content-backup-$(date +%Y%m%d).json
```

## 📱 Responsive Breakpoints

- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

## 🎨 Customization

### Colors (Edit CSS variables in index.html)
```css
:root {
    --primary: #10b981;      /* Main accent color */
    --dark: #0f172a;         /* Background */
    --text: #f1f5f9;         /* Text color */
}
```

### Fonts
- Headings: Space Grotesk
- Body: Inter

## 🚀 Deployment

The site is automatically deployed to GitHub Pages from the `master` branch.

**Live URL**: https://manjeetkumar53.github.io

### Steps:
1. Make changes
2. Commit: `git commit -m "Update"`
3. Push: `git push origin master`
4. Wait ~1 minute for deployment

## 📊 Performance

- ⚡ Lighthouse Score: 95+
- 🎯 First Contentful Paint: < 1s
- 📦 Bundle Size: < 50KB
- 🔄 No external dependencies

## 🤝 Contributing

This is a personal portfolio, but feel free to:
- Report issues
- Suggest improvements
- Fork for your own use

## 📄 License

© 2026 Manjeet Kumar. All rights reserved.

## 📞 Contact

- 📧 Email: manjeetkumar53@gmail.com
- 💼 LinkedIn: [manjeet-kumar](https://www.linkedin.com/in/manjeet-kumar-31963020/)
- 🐙 GitHub: [@manjeetkumar53](https://github.com/manjeetkumar53)
- 📝 Blog: [ariseai.wordpress.com](https://ariseai.wordpress.com/)

---

**Last Updated**: February 2, 2026

Made with ❤️ and ☕ in Berlin

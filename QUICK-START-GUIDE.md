# Decap CMS Quick Start Guide
**Goal:** Get your blog CMS working in 10 minutes

---

## ✅ Current Status

- [x] Blog system files created
- [x] CMS configured for local testing
- [ ] **FILES NOT COMMITTED TO GITHUB** ← You need to do this
- [ ] **OAUTH NOT SETUP** ← You need to do this

---

## 🚀 3 Steps to Make It Work

### **Step 1: Commit Files to GitHub (2 minutes)**

Run these commands in your terminal:

```bash
# Add all blog system files
git add admin/ blog/ data/ js/ *.md index.html

# Commit with message
git commit -m "Add Decap CMS blog system"

# Push to GitHub
git push origin master
```

**Wait 1-2 minutes for GitHub Pages to deploy.**

---

### **Step 2: Create GitHub OAuth App (5 minutes)**

1. **Go to:** https://github.com/settings/developers

2. **Click:** "OAuth Apps" → "New OAuth App"

3. **Fill in the form:**
   ```
   Application name: Manjeet Blog CMS
   Homepage URL: https://manjeetkumar53.github.io
   Application description: Content management for my blog
   Authorization callback URL: https://api.netlify.com/auth/done
   ```

4. **Click:** "Register application"

5. **You'll see:**
   - Client ID: (copy this)
   - Client Secret: Click "Generate a new client secret" → (copy this)

**Keep this tab open - you'll need these values!**

---

### **Step 3: Configure Netlify (Free) (3 minutes)**

1. **Go to:** https://app.netlify.com/signup (sign up with GitHub)

2. **After login, go to:** https://app.netlify.com/user/applications

3. **Scroll to:** "Authentication providers" section

4. **Click:** "Install provider" under GitHub

5. **Fill in:**
   - Client ID: (paste from Step 2)
   - Client Secret: (paste from Step 2)

6. **Click:** "Install"

---

### **Step 4: Update CMS Config**

After OAuth is set up, update `admin/config.yml`:

**Change this:**
```yaml
# Local development mode - allows testing without GitHub OAuth
# Comment this out and uncomment the github backend below after OAuth setup
backend:
  name: test-repo
```

**To this:**
```yaml
# Production mode - saves to GitHub
backend:
  name: github
  repo: manjeetkumar53/manjeetkumar53.github.io
  branch: master
```

Then commit and push again:
```bash
git add admin/config.yml
git commit -m "Enable GitHub backend for CMS"
git push origin master
```

---

## 🎉 You're Done! Test It Out

1. **Go to:** https://manjeetkumar53.github.io/admin/

2. **Click:** "Login with GitHub"

3. **Authorize the app** when GitHub asks

4. **You'll see:** The CMS dashboard with your blog posts!

---

## 📝 Writing Your First Real Blog Post

1. **In the CMS, click:** "New Blog Post"

2. **Fill in:**
   - Title: "My First Blog Post"
   - Category: Choose one (GenAI, Architecture, etc.)
   - Tags: Add a few tags
   - Cover Image: Optional - upload one or leave blank
   - Excerpt: Write a short summary (150 chars)
   - Body: Write your blog content in Markdown

3. **Click:** "Publish" → "Publish now"

4. **Wait 1-2 minutes** for GitHub Pages to update

5. **View your post:** https://manjeetkumar53.github.io/blog/

---

## 🆘 Troubleshooting

### **Problem: CMS won't load**
- ✅ Check you pushed all files to GitHub
- ✅ Wait 2-3 minutes for GitHub Pages to build
- ✅ Hard refresh (Cmd+Shift+R on Mac)

### **Problem: Can't login**
- ✅ Check OAuth callback URL is exactly: `https://api.netlify.com/auth/done`
- ✅ Make sure you copied Client ID and Secret correctly
- ✅ Try logging out of GitHub and back in

### **Problem: Post doesn't appear**
- ✅ Make sure draft is set to `false`
- ✅ Check the post was committed to GitHub
- ✅ Wait 2-3 minutes for GitHub Pages rebuild
- ✅ Update `data/blog-posts.json` manually if needed

---

## 💡 Pro Tips

- **Write drafts:** Set "Draft" to true to save without publishing
- **Use categories wisely:** Stick to the 7 predefined categories
- **Add good excerpts:** They appear in search and on blog index
- **Use cover images:** Makes posts more appealing (1200x630px ideal)
- **Preview before publish:** Click preview to see how it looks
- **Tags for SEO:** Add 3-5 relevant tags per post

---

## 📚 Daily Workflow (After Setup)

**Morning Post (25 minutes):**
```
09:00am - Open https://manjeetkumar53.github.io/admin/
09:01am - Click "New Blog Post"
09:02am - Write content (20 min)
09:22am - Add images, tags, excerpt (3 min)
09:25am - Publish (30 sec)
```

**Evening Post (25 minutes):**
```
06:00pm - Same workflow
06:25pm - Published!
```

**Total: 50 minutes/day for 2 long-form blog posts**

---

## 🎯 Next Steps After First Post

1. ✅ Write 2-3 more posts to test the system
2. ✅ Customize blog design (colors, fonts)
3. ✅ Add Google Analytics (optional)
4. ✅ Enable comments with Utterances (optional)
5. ✅ Generate RSS feed (optional)
6. ✅ Add sitemap.xml (optional)

---

## 📖 Full Documentation

- **OAuth Setup Details:** See [DECAP-CMS-SETUP-GUIDE.md](DECAP-CMS-SETUP-GUIDE.md)
- **Complete Features:** See [IMPLEMENTATION-COMPLETE.md](IMPLEMENTATION-COMPLETE.md)
- **CMS Comparison:** See [BLOG-SYSTEM-ANALYSIS.md](BLOG-SYSTEM-ANALYSIS.md)

---

## 🤝 Need Help?

If you get stuck, check:
1. GitHub Pages deployment status: https://github.com/manjeetkumar53/manjeetkumar53.github.io/actions
2. Browser console for errors (F12 → Console tab)
3. CMS documentation: https://decapcms.org/docs/

---

**You're ready to blog! 🚀**

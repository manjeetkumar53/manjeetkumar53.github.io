# Decap CMS Setup Guide - GitHub OAuth Configuration

## 🔐 GitHub OAuth App Setup

To allow Decap CMS to commit directly to your GitHub repository, you need to create a GitHub OAuth App. This takes about 5-10 minutes.

---

## Step 1: Create GitHub OAuth App

1. **Go to GitHub Settings**
   - Visit: https://github.com/settings/developers
   - Or navigate: GitHub Profile → Settings → Developer settings → OAuth Apps

2. **Click "New OAuth App"**

3. **Fill in the Application Details:**

   ```
   Application name: Manjeet Blog CMS
   
   Homepage URL: https://manjeetkumar53.github.io
   
   Application description: Content management for my portfolio blog
   
   Authorization callback URL: https://api.netlify.com/auth/done
   ```

   ⚠️ **Important:** The callback URL MUST be exactly: `https://api.netlify.com/auth/done`
   
   (This is Netlify's free OAuth service that works with Decap CMS)

4. **Click "Register application"**

5. **Save Your Credentials:**
   - You'll see a **Client ID** (copy this)
   - Click "Generate a new client secret"
   - Copy the **Client Secret** (save it immediately - you can't see it again!)

---

## Step 2: Configure Decap CMS

### Option A: Using Netlify OAuth Service (Recommended - FREE)

1. **Sign up for Netlify** (if you haven't already)
   - Go to: https://www.netlify.com/
   - Sign up with your GitHub account (easiest)

2. **Add OAuth Provider to Netlify**
   - Dashboard → Site settings → Access control → OAuth
   - Click "Install provider"
   - Select "GitHub"
   - Paste your **Client ID**
   - Paste your **Client Secret**
   - Save

3. **Deploy to Netlify** (Optional but recommended)
   - Connect your GitHub repo to Netlify
   - Automatic deploys on git push
   - Free SSL certificate
   - CDN included

### Option B: Using GitHub Pages Only (Alternative)

If you don't want to use Netlify, you can use a third-party OAuth service:

**Use Decap CMS OAuth Gateway:**
```yaml
# In admin/config.yml, update backend section:
backend:
  name: github
  repo: manjeetkumar53/manjeetkumar53.github.io
  branch: master
  base_url: https://oauth.decapcms.org
```

---

## Step 3: Update Decap CMS Configuration

Your `admin/config.yml` is already configured! Just make sure it has:

```yaml
backend:
  name: github
  repo: manjeetkumar53/manjeetkumar53.github.io
  branch: master
```

---

## Step 4: Test Your CMS

1. **Commit and push** all the files we created:
   ```bash
   git add admin/ blog/ data/
   git commit -m "Add Decap CMS for blog management"
   git push origin master
   ```

2. **Wait 1-2 minutes** for GitHub Pages to deploy

3. **Visit your CMS:**
   - Go to: https://manjeetkumar53.github.io/admin/
   - Click "Login with GitHub"
   - Authorize the OAuth app
   - You're in! 🎉

---

## Step 5: Write Your First Blog Post

1. **In the CMS interface:**
   - Click "New Blog Post"
   - Fill in:
     - **Title**: Your blog post title
     - **Date**: Publication date/time
     - **Category**: Choose from dropdown
     - **Tags**: Add relevant tags
     - **Cover Image**: Upload a feature image
     - **Excerpt**: Short summary (150-160 chars)
     - **Body**: Write your content in Markdown

2. **Preview your post:**
   - Click the eye icon to see live preview

3. **Save as draft:**
   - Status: "Draft" (only you can see it)
   - Or click "Publish" to make it live immediately

4. **Publish:**
   - When ready, change status to "Ready"
   - Click "Publish now"
   - The CMS commits to GitHub
   - GitHub Pages auto-deploys (1-2 minutes)

---

## 📝 Daily Blogging Workflow

### Morning Post (Example: 9:00 AM)

```
1. Open: https://manjeetkumar53.github.io/admin/
2. Click: "New Blog Post"
3. Write: Your content (20 minutes)
4. Upload: Images if needed
5. Add: Tags and category
6. Publish: One click
7. Live: Post is online in 2 minutes

Total time: ~25 minutes
```

### Evening Post (Example: 6:00 PM)

```
Same process - takes 20-25 minutes per post
```

**For 2 posts per day: ~50 minutes total (including writing time)**

---

## 🎯 Editorial Workflow (Optional)

If you want a review process before publishing:

1. **Draft Status:**
   - Write post
   - Save as "Draft"
   - Continue editing anytime

2. **In Review:**
   - Mark as "In Review"
   - Share with others (if team)
   - Make revisions

3. **Ready to Publish:**
   - Mark as "Ready"
   - Schedule or publish immediately

---

## 🔍 Finding Your Published Posts

### On Your Website:
- **Blog index:** https://manjeetkumar53.github.io/blog/
- **Individual post:** https://manjeetkumar53.github.io/blog/post.html?post=2026-02-03-your-post-slug

### In GitHub:
- All posts stored in: `/blog/posts/`
- File format: `YYYY-MM-DD-slug-name.md`
- Images stored in: `/images/blog/`

---

## 📱 Mobile Editing

Decap CMS works on mobile browsers:

1. Visit: `https://manjeetkumar53.github.io/admin/` on your phone
2. Login with GitHub
3. Write posts on-the-go
4. Full editor functionality

**Best mobile browsers:** Chrome, Safari, Firefox

---

## 🛠️ Troubleshooting

### "Login Failed" or OAuth Error

**Problem:** Can't login to CMS

**Solutions:**
1. Check OAuth callback URL is exactly: `https://api.netlify.com/auth/done`
2. Verify Client ID and Secret are correct in Netlify
3. Make sure OAuth app is not suspended in GitHub
4. Try incognito/private browsing mode
5. Clear browser cache and cookies

### "Cannot Read Property" Error

**Problem:** CMS interface broken

**Solutions:**
1. Check `admin/config.yml` syntax (YAML is space-sensitive)
2. Verify repo name is correct: `manjeetkumar53/manjeetkumar53.github.io`
3. Check branch name is `master` (not `main`)
4. Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)

### Posts Not Showing on Website

**Problem:** Published post doesn't appear

**Solutions:**
1. Wait 2-3 minutes for GitHub Pages to rebuild
2. Check if post has `draft: true` in frontmatter (remove it)
3. Verify file was actually committed to GitHub
4. Clear browser cache
5. Check `/blog/posts/` folder in GitHub repo

### Images Not Loading

**Problem:** Uploaded images don't show

**Solutions:**
1. Check image was uploaded to `/images/blog/` folder
2. Verify image path in post frontmatter
3. Check image size (keep under 1MB for best performance)
4. Use lowercase filenames without spaces

---

## 💡 Pro Tips

### 1. Markdown Shortcuts

```markdown
# H1 Heading
## H2 Heading
### H3 Heading

**Bold text**
*Italic text*
`code`

[Link text](https://url.com)
![Image alt](https://image-url.jpg)

- List item
- List item

1. Numbered item
2. Numbered item

> Blockquote

\`\`\`javascript
// Code block
const hello = "world";
\`\`\`
```

### 2. SEO Best Practices

- **Title:** 50-60 characters
- **Excerpt:** 150-160 characters
- **Use keywords** naturally in content
- **Add alt text** to all images
- **Internal links** to other posts
- **Use headings** (H2, H3) for structure

### 3. Image Optimization

**Before uploading:**
- Resize to max 1200px width
- Compress using tools like TinyPNG
- Use descriptive filenames
- Keep under 500KB

### 4. Consistent Publishing Schedule

- **Pick times** that work for you (e.g., 9am & 6pm)
- **Set reminders** on phone/calendar
- **Batch write** if possible (write multiple posts at once)
- **Use drafts** to prepare ahead of time

---

## 🚀 Next Steps

1. ✅ **Complete OAuth setup** (above)
2. ✅ **Test CMS login**
3. ✅ **Write first blog post**
4. ✅ **Publish and verify it appears**
5. ✅ **Setup publishing routine**

---

## 📞 Getting Help

If you encounter issues:

1. **Check this guide** for troubleshooting
2. **Check Decap CMS docs:** https://decapcms.org/docs/
3. **GitHub Issues:** https://github.com/decaporg/decap-cms/issues
4. **Ask me** - I'm here to help!

---

## ✅ You're All Set!

Once OAuth is configured, you can:
- ✅ Write unlimited blog posts
- ✅ Upload images and media
- ✅ Preview before publishing
- ✅ Edit from any device
- ✅ Manage content easily
- ✅ Publish 2+ times daily with ease

**Happy blogging!** 🎉

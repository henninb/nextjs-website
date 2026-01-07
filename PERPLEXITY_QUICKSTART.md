# Perplexity API - Quick Start Guide

## 🚀 5-Minute Setup

### 1. Get Your API Key

- Visit: https://www.perplexity.ai/settings/api
- Generate new API key
- Copy the key (starts with `pplx-`)

### 2. Localhost Setup

Edit `.env.local`:

```bash
PERPLEXITY_API_KEY=pplx-your-actual-key-here
```

Restart dev server:

```bash
npm run dev
```

### 3. Vercel Setup

**Via Dashboard:**

1. Go to https://vercel.com/dashboard
2. Select your project → Settings → Environment Variables
3. Add: `PERPLEXITY_API_KEY` = `pplx-your-key`
4. Save and redeploy

**Via CLI:**

```bash
vercel env add PERPLEXITY_API_KEY
# Enter your key when prompted
```

### 4. Enable AI Code (Currently Disabled)

Edit `app/api/categorize/route.ts`:

- Uncomment lines ~74-137 (the AI integration code)
- Test locally first

---

## 🧪 Quick Test

### Test the API Endpoint:

```bash
curl -X POST http://localhost:3000/api/categorize \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Starbucks Coffee",
    "amount": -5.50,
    "availableCategories": ["restaurants", "groceries", "fuel"]
  }'
```

### Expected Response (Rule-Based Fallback):

```json
{
  "category": "restaurants",
  "metadata": {
    "source": "rule-based",
    "timestamp": "2024-12-23T...",
    "fallbackReason": "Perplexity API key not configured - using rule-based system"
  },
  "success": true
}
```

### Expected Response (AI Enabled):

```json
{
  "category": "restaurants",
  "metadata": {
    "source": "ai",
    "aiModel": "sonar-pro",
    "timestamp": "2024-12-23T...",
    "similarTransactionsUsed": 0
  },
  "success": true
}
```

---

## 🔍 Verify Setup

### Check Environment Variables

**Localhost:**

```bash
# In your dev server logs, you should see:
# [AI Categorization] Perplexity API key not configured...
# (if key is missing or placeholder)
```

**Vercel:**

```bash
vercel env ls
# Should show PERPLEXITY_API_KEY
```

### Visual Verification

1. Import transactions or create new transaction
2. Check badge color:
   - 🟣 Purple = AI working ✅
   - 🔵 Blue = Rule-based fallback (API not configured or disabled)
   - 🟢 Green = Manual

---

## 📁 Key Files

| File                          | Purpose                               |
| ----------------------------- | ------------------------------------- |
| `.env.local`                  | Localhost API key (gitignored)        |
| `.env.example`                | Template for environment variables    |
| `app/api/categorize/route.ts` | API endpoint (uncomment to enable AI) |
| `AI_CATEGORIZATION_SETUP.md`  | Full documentation                    |

---

## ⚠️ Security Checklist

- [x] `.env.local` in `.gitignore`
- [x] API key only used server-side
- [x] Graceful fallback if API fails
- [ ] Monitor API usage/costs in Perplexity dashboard

---

## 🐛 Common Issues

**Issue:** Badge always shows blue (rule-based)

**Fix:**

1. Check API key in `.env.local`
2. Restart dev server
3. Uncomment AI code in `route.ts`

**Issue:** Works locally but not on Vercel

**Fix:**

1. Add `PERPLEXITY_API_KEY` to Vercel environment variables
2. Redeploy

---

## 📚 Full Documentation

See `AI_CATEGORIZATION_SETUP.md` for complete details.

---

**Questions?** Check the logs:

- Localhost: Terminal where you ran `npm run dev`
- Vercel: Deployment logs in Vercel dashboard

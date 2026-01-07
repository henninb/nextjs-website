# AI Transaction Categorization Setup Guide

## Overview

The AI categorization system uses the Perplexity API to automatically categorize financial transactions. It includes intelligent fallback to rule-based categorization if the API is unavailable or fails.

---

## 🔑 Getting Your Perplexity API Key

1. Go to [Perplexity API Settings](https://www.perplexity.ai/settings/api)
2. Sign up or log in to your account
3. Generate a new API key
4. Copy the key (it will look like: `pplx-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`)

---

## 💻 Localhost Setup

### Step 1: Add API Key to `.env.local`

The `.env.local` file has already been created with a placeholder. Update it with your actual API key:

```bash
# Edit .env.local
PERPLEXITY_API_KEY=pplx-your-actual-api-key-here
```

**Important:** `.env.local` is already in `.gitignore` - your API key will NOT be committed to git.

### Step 2: Restart Development Server

After updating `.env.local`, restart your dev server:

```bash
npm run dev
```

The API key will now be available as `process.env.PERPLEXITY_API_KEY` in server-side code.

---

## ☁️ Vercel Deployment Setup

### Option 1: Vercel Dashboard (Recommended)

1. Go to your project in [Vercel Dashboard](https://vercel.com/dashboard)
2. Click on your project
3. Go to **Settings** → **Environment Variables**
4. Add a new variable:
   - **Name:** `PERPLEXITY_API_KEY`
   - **Value:** Your Perplexity API key (`pplx-...`)
   - **Environments:** Check all (Production, Preview, Development)
5. Click **Save**
6. Redeploy your application (Vercel will automatically redeploy on next git push)

### Option 2: Vercel CLI

```bash
# Install Vercel CLI if you haven't
npm i -g vercel

# Add environment variable
vercel env add PERPLEXITY_API_KEY

# Follow the prompts to enter your API key and select environments
```

### Verify Deployment

After deploying, you can verify the environment variable is set:

```bash
vercel env ls
```

---

## 🧪 Testing the Integration

### 1. Check if API Key is Loaded

The system will automatically detect if the API key is configured. Check the browser console or server logs.

### 2. Test Transaction Import

1. Go to the Transaction Import page
2. Import pending transactions
3. Look for the "Source" badge column:
   - 🟣 **Purple (AI)** = Successfully categorized with Perplexity AI
   - 🔵 **Blue (Rule)** = Fell back to rule-based system
   - 🟢 **Green (Manual)** = User manually changed category

### 3. Test Manual Transaction Creation

1. Go to any account's transaction page
2. Click "Add Transaction"
3. Enter a description (e.g., "Starbucks Coffee")
4. Tab out of the description field
5. Category should auto-populate with an AI badge

---

## 🔧 Current Implementation Status

### ✅ Implemented

- Transaction metadata model
- AI categorization utility with fallback
- Server-side API endpoint (`/api/categorize`)
- Visual badge component
- Transaction import page integration
- Manual transaction creation auto-suggest
- Environment variable setup

### 📝 To Enable AI (Currently Using Rule-Based Fallback)

The code is ready but currently commented out in `app/api/categorize/route.ts`. To enable:

1. **Add your API key** to `.env.local` and Vercel (as described above)

2. **Uncomment the AI code** in `app/api/categorize/route.ts` (lines ~56-90):
   - The commented code shows example Perplexity API integration
   - You may need to adjust based on Perplexity's actual API format

3. **Test locally first** before deploying to Vercel

---

## 🛡️ Security Notes

### ✅ Best Practices Implemented

1. **Server-Side Only:** API key is only used in server-side API routes (never exposed to client)
2. **Environment Variables:** Key stored in `.env.local` (gitignored) and Vercel environment variables
3. **Graceful Fallback:** System continues working even if API fails
4. **Rate Limiting:** API endpoint includes validation and error handling

### ⚠️ Important Warnings

- **Never commit `.env.local`** to git (already in `.gitignore`)
- **Never expose API key** in client-side code
- **Monitor API usage** to avoid unexpected costs
- **Set up rate limiting** in Perplexity dashboard if available

---

## 📊 How It Works

### Flow Diagram

```
User Action (Import/Create Transaction)
         ↓
getCategoryWithAI() in client
         ↓
POST /api/categorize (server-side)
         ↓
Check process.env.PERPLEXITY_API_KEY
         ↓
    ┌────┴────┐
    ↓         ↓
  Found    Not Found
    ↓         ↓
Call AI   Rule-Based
         ↓
    Response
         ↓
Display with Badge
```

### Badge Colors

- 🟣 **Purple (secondary)** - AI categorization via Perplexity
- 🔵 **Blue (info)** - Rule-based fallback
- 🟢 **Green (success)** - Manual user override

---

## 🐛 Troubleshooting

### Issue: Badge always shows "Rule" (blue)

**Cause:** API key not configured or AI code not uncommented

**Solution:**

1. Verify `PERPLEXITY_API_KEY` in `.env.local`
2. Restart dev server
3. Check `app/api/categorize/route.ts` - uncomment AI integration code

### Issue: Error "Invalid API key"

**Cause:** Incorrect or expired API key

**Solution:**

1. Verify your API key at [Perplexity Settings](https://www.perplexity.ai/settings/api)
2. Generate a new key if needed
3. Update `.env.local` and Vercel environment variables

### Issue: Works locally but not on Vercel

**Cause:** Environment variable not set in Vercel

**Solution:**

1. Check Vercel Dashboard → Settings → Environment Variables
2. Ensure `PERPLEXITY_API_KEY` is set for all environments
3. Redeploy the application

### Issue: High API costs

**Cause:** Too many API calls

**Solution:**

1. Enable caching in the categorization utility
2. Set up rate limiting in Perplexity dashboard
3. Consider using rule-based for common merchants
4. Implement client-side debouncing (already done for manual entry)

---

## 📈 Future Enhancements

Potential improvements (not yet implemented):

1. **Caching:** Cache AI responses for identical descriptions
2. **Batch Processing:** Process multiple transactions in one API call
3. **Learning from Overrides:** Track manual corrections to improve prompts
4. **Confidence Thresholds:** Only use AI if confidence > X%
5. **Cost Monitoring:** Track API usage and costs
6. **A/B Testing:** Compare AI vs rule-based accuracy

---

## 📞 Support

If you encounter issues:

1. Check server logs: `npm run dev` (localhost) or Vercel deployment logs
2. Verify environment variables are set correctly
3. Test the `/api/categorize` endpoint directly:
   ```bash
   curl -X POST http://localhost:3000/api/categorize \
     -H "Content-Type: application/json" \
     -d '{
       "description": "Starbucks Coffee",
       "amount": -5.50,
       "availableCategories": ["restaurants", "groceries", "fuel"]
     }'
   ```

---

## 🔗 Resources

- [Perplexity API Documentation](https://docs.perplexity.ai/)
- [Perplexity API Settings](https://www.perplexity.ai/settings/api)
- [Vercel Environment Variables](https://vercel.com/docs/environment-variables)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)

---

**Last Updated:** December 2024

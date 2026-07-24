# আমার লাইব্রেরি (Islamic Personal Library)

Personal Islamic-book library ওয়েবসাইট। Category-wise ব্রাউজিং, Banglish→বাংলা
কনভার্সন, WafiLife/Rokomari থেকে অটো-ফেচ (দাম, কভার, লেখক, ক্যাটাগরি), পাসওয়ার্ড
প্রোটেকশন, আর পরিসংখ্যান/গ্রাফ — সব একসাথে।

## কীভাবে কাজ করে

- **frontend/** — React app, GitHub Pages এ হোস্ট হবে। ডেটা রাখা হয় আপনার
  নিজের Google Drive এ (একটা hidden app folder এ, শুধু এই অ্যাপ অ্যাক্সেস করতে পারবে)।
- **backend/** — একটা ছোট serverless function (Vercel), যেটা wafilife.com/
  rokomari.com থেকে বইয়ের তথ্য fetch করে। এটা ছাড়া ব্রাউজার থেকে সরাসরি ওই
  সাইটগুলো থেকে ডেটা আনা যায় না (CORS)। আপনাকে কখনো ওই সাইটে নিয়ে যাওয়া হয় না —
  শুধু data পাঠানো হয়।

---

## ধাপ ১: Backend (Vercel) ডিপ্লয় করুন

1. [vercel.com](https://vercel.com) এ ফ্রি অ্যাকাউন্ট খুলুন।
2. এই রিপোজিটরি GitHub এ push করার পর, Vercel এ "New Project" → এই repo সিলেক্ট
   করুন → **Root Directory** হিসেবে `backend` দিন।
3. Deploy করুন। ডিপ্লয় শেষে আপনি একটা URL পাবেন, যেমন:
   `https://your-project.vercel.app`
4. টেস্ট করুন: ব্রাউজারে খুলুন —
   `https://your-project.vercel.app/api/scrape?q=মা মা মা এবং বাবা&site=wafilife`
   — একটা JSON রেসপন্স আসা উচিত।

## ধাপ ২: Google Cloud এ OAuth Client ID বানান (Drive access এর জন্য)

1. [Google Cloud Console](https://console.cloud.google.com/) এ একটা নতুন
   Project বানান।
2. **APIs & Services → Library** থেকে **Google Drive API** enable করুন।
3. **APIs & Services → OAuth consent screen** সেটাপ করুন (User type: External,
   নিজের ইমেইল Test user হিসেবে যোগ করুন — personal use এর জন্য এটাই যথেষ্ট)।
4. **APIs & Services → Credentials → Create Credentials → OAuth client ID**
   - Application type: **Web application**
   - Authorized JavaScript origins এ যোগ করুন:
     - `https://<your-github-username>.github.io`
     - `http://localhost:5173` (লোকাল টেস্টের জন্য)
5. Client ID কপি করে রাখুন (দেখতে হয় এরকম:
   `123456-abc.apps.googleusercontent.com`)।

## ধাপ ৩: Frontend GitHub Pages এ ডিপ্লয় করুন

1. এই পুরো ফোল্ডার একটা নতুন GitHub repository তে push করুন (নাম দিন যেমন
   `islamic-library`)।
2. `frontend/vite.config.js` ফাইলে `base: "/islamic-library/"` — repo নামের
   সাথে মিলিয়ে ঠিক করে নিন।
3. Repo এর **Settings → Pages → Build and deployment → Source** এ
   "GitHub Actions" সিলেক্ট করুন।
4. Repo এর **Settings → Secrets and variables → Actions** এ দুইটা secret যোগ
   করুন:
   - `VITE_GOOGLE_CLIENT_ID` = ধাপ ২ থেকে পাওয়া Client ID
   - `VITE_API_BASE_URL` = ধাপ ১ থেকে পাওয়া Vercel URL (শেষে `/` ছাড়া)
5. `main` ব্রাঞ্চে push করলেই GitHub Actions অটোমেটিক বিল্ড ও ডিপ্লয় করবে
   (`.github/workflows/deploy.yml` ফাইলটা আগে থেকেই সেটাপ করা আছে)।
6. কিছুক্ষণ পর সাইট লাইভ হবে: `https://<username>.github.io/islamic-library/`

## ধাপ ৪: প্রথমবার ব্যবহার

1. সাইটে ঢুকে "Google Drive এর সাথে সংযুক্ত করুন" এ ক্লিক করুন, নিজের Google
   অ্যাকাউন্ট দিয়ে অনুমতি দিন।
2. প্রথমবার একটা পাসওয়ার্ড সেট করতে বলবে — এটাই এখন থেকে লাইব্রেরিতে ঢোকার
   পাসওয়ার্ড। এটা Google Drive এ (hash আকারে, plain text না) সংরক্ষিত থাকে,
   তাই পরের বার যেকোনো ডিভাইস থেকে একই পাসওয়ার্ড কাজ করবে। পরিবর্তন করতে
   চাইলে সেটিংস পেজ থেকে করা যাবে (পুরনো পাসওয়ার্ড লাগবে)।
3. "বই যোগ করুন" থেকে নাম লিখে (Banglish বা বাংলা) "WafiLife থেকে আনুন" চাপুন —
   দাম, কভার, লেখক, ক্যাটাগরি সব auto-fill হয়ে যাবে, প্রয়োজনে এডিট করে সেভ
   করুন। অথবা সব ম্যানুয়ালি লিখতে পারেন।

## লোকাল ডেভেলপমেন্ট (কম্পিউটারে টেস্ট করতে)

```bash
cd frontend
cp .env.example .env    # তারপর .env এ আপনার Client ID ও Vercel URL বসান
npm install
npm run dev
```

## সীমাবদ্ধতা / নোট

- Banglish→বাংলা কনভার্সন একটা সাধারণ phonetic rule-based ইঞ্জিন (Avro-এর
  মতো, তবে ফুল না) — বেশিরভাগ সাধারণ বানানে ঠিকঠাক কাজ করবে, তবে জটিল
  যুক্তাক্ষরে মাঝে মাঝে সামান্য পার্থক্য হতে পারে।
- Auto-fetch feature wafilife.com/rokomari.com এর বর্তমান পেজ-স্ট্রাকচার এর
  উপর নির্ভর করে। ওরা সাইট ডিজাইন পরিবর্তন করলে `backend/api/scrape.js`
  ফাইলের selectors হালকা আপডেট করতে হতে পারে।
- ডেটা সম্পূর্ণভাবে আপনার নিজের Google Drive এ থাকে — এই কোডে কোনো তৃতীয়
  পক্ষের সার্ভারে ডেটা যায় না।

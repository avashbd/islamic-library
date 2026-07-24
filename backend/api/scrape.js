// /api/scrape?q=<book name in Bangla or English>&site=wafilife|rokomari
// Fetches a matching product page from the given site and extracts
// price, cover image, author, publisher, category, pages, etc.
// This runs server-side (Vercel) so there is no CORS problem, and the
// user is never redirected to the source site.

const cheerio = require("cheerio");

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

const bnDigits = "০১২৩৪৫৬৭৮৯";
function bnToEnNumber(str) {
  if (!str) return null;
  const converted = str
    .split("")
    .map((ch) => {
      const idx = bnDigits.indexOf(ch);
      return idx === -1 ? ch : String(idx);
    })
    .join("");
  const match = converted.match(/[0-9]+(\.[0-9]+)?/);
  return match ? Number(match[0]) : null;
}

async function fetchHtml(url) {
  const res = await fetch(url, {
    headers: {
      "User-Agent": UA,
      "Accept-Language": "bn,en;q=0.8",
    },
  });
  if (!res.ok) throw new Error(`Fetch failed (${res.status}) for ${url}`);
  return await res.text();
}

// Downloads an image server-side and returns it as a base64 data URL so the
// frontend can embed/store it directly (no CORS issue, and the bytes are
// actually saved rather than just linked).
async function fetchImageAsDataUrl(imgUrl) {
  const res = await fetch(imgUrl, {
    headers: {
      "User-Agent": UA,
      Referer: "https://www.wafilife.com/",
    },
  });
  if (!res.ok) throw new Error(`Image fetch failed (${res.status})`);
  const contentType = res.headers.get("content-type") || "image/jpeg";
  const buf = Buffer.from(await res.arrayBuffer());
  return `data:${contentType};base64,${buf.toString("base64")}`;
}

// ---------- WafiLife ----------

async function searchWafilife(query) {
  const searchUrl = `https://www.wafilife.com/search?q=${encodeURIComponent(query)}`;
  const html = await fetchHtml(searchUrl);
  const $ = cheerio.load(html);

  const candidates = [];
  $("a[href*='/pd/']").each((_, el) => {
    const href = $(el).attr("href");
    if (href && /\/pd\/\d+/.test(href)) {
      const abs = href.startsWith("http") ? href : `https://www.wafilife.com${href}`;
      if (!candidates.includes(abs)) candidates.push(abs);
    }
  });

  return candidates[0] || null;
}

async function scrapeWafilifeProduct(url) {
  const html = await fetchHtml(url);
  const $ = cheerio.load(html);
  const bodyText = $("body").text().replace(/\s+/g, " ");

  const title =
    $("h1").first().text().trim() ||
    $("meta[property='og:title']").attr("content") ||
    null;

  // Cover image: WafiLife marks the main product image with alt="thumbnail"
  let cover =
    $("img[alt='thumbnail']").attr("src") ||
    $("img[src*='wafilife-media.wafilife.com/uploads']").first().attr("src") ||
    $("meta[property='og:image']").attr("content") ||
    null;
  if (cover && cover.startsWith("//")) cover = "https:" + cover;

  // Author / Publisher / Category via stable href patterns
  const author = $("a[href*='/cat/books/author/']").first().text().trim() || null;
  const publisher = $("a[href*='/cat/books/publisher/']").first().text().trim() || null;
  const category = $("a[href*='/cat/books/subject/']").first().text().trim() || null;

  // Price block, e.g. "১৯৫৳২৬০৳(২৫% ছাড়ে)"
  const priceMatch = bodyText.match(/([০-৯]+)৳\s*([০-৯]+)৳\s*\(([০-৯]+)%/);
  const price = priceMatch ? bnToEnNumber(priceMatch[1]) : null;
  const originalPrice = priceMatch ? bnToEnNumber(priceMatch[2]) : price;
  const discountPercent = priceMatch ? bnToEnNumber(priceMatch[3]) : null;

  // "পৃষ্ঠা : 176, কভার : পেপার ব্যাক, সংস্করণ : 1st Published, 2018, ভাষা : বাংলা"
  const metaMatch = bodyText.match(
    /পৃষ্ঠা\s*:\s*([^,]+),\s*কভার\s*:\s*([^,]+),\s*সংস্করণ\s*:\s*([^,]+(?:,\s*[0-9]{4})?),\s*ভাষা\s*:\s*([^\s.।]+)/
  );
  const pages = metaMatch ? bnToEnNumber(metaMatch[1]) : null;
  const coverType = metaMatch ? metaMatch[2].trim() : null;
  const edition = metaMatch ? metaMatch[3].trim() : null;
  const language = metaMatch ? metaMatch[4].trim() : null;

  return {
    source: "wafilife",
    sourceUrl: url,
    title,
    author,
    publisher,
    category,
    price,
    originalPrice,
    discountPercent,
    pages,
    coverType,
    edition,
    language,
    cover,
  };
}

// ---------- Rokomari ----------

async function searchRokomari(query) {
  const searchUrl = `https://www.rokomari.com/book/search/?q=${encodeURIComponent(query)}`;
  const html = await fetchHtml(searchUrl);
  const $ = cheerio.load(html);

  const candidates = [];
  $("a[href*='/book/']").each((_, el) => {
    const href = $(el).attr("href");
    if (href && /\/book\/\d+/.test(href)) {
      const abs = href.startsWith("http") ? href : `https://www.rokomari.com${href}`;
      if (!candidates.includes(abs)) candidates.push(abs);
    }
  });

  return candidates[0] || null;
}

async function scrapeRokomariProduct(url) {
  const html = await fetchHtml(url);
  const $ = cheerio.load(html);
  const bodyText = $("body").text().replace(/\s+/g, " ");

  const title = $("h1").first().text().trim() || null;

  let cover =
    $("img.book-img").attr("src") ||
    $("meta[property='og:image']").attr("content") ||
    $("img[src*='rokomari']").first().attr("src") ||
    null;
  if (cover && cover.startsWith("//")) cover = "https:" + cover;

  const author =
    $("a[href*='/author/']").first().text().trim() ||
    $(".author-name, .writer-name").first().text().trim() ||
    null;
  const publisher =
    $("a[href*='/publisher/']").first().text().trim() || null;
  const category =
    $("a[href*='/category/']").first().text().trim() || null;

  // Try to find "Tk 195 Tk 260 (25% Off)" style or Bangla equivalent
  const priceMatch =
    bodyText.match(/৳\s*([০-৯0-9]+)[^৳]*৳\s*([০-৯0-9]+)[^%]*\(?\s*([০-৯0-9]+)\s*%/) ||
    bodyText.match(/Tk\.?\s*([0-9]+)[^T]*Tk\.?\s*([0-9]+)[^%]*\(?\s*([0-9]+)\s*%/i);
  const price = priceMatch ? bnToEnNumber(priceMatch[1]) : null;
  const originalPrice = priceMatch ? bnToEnNumber(priceMatch[2]) : price;
  const discountPercent = priceMatch ? bnToEnNumber(priceMatch[3]) : null;

  const pagesMatch = bodyText.match(/(?:Number of Pages|পৃষ্ঠা)\s*:?\s*([০-৯0-9]+)/);
  const pages = pagesMatch ? bnToEnNumber(pagesMatch[1]) : null;

  return {
    source: "rokomari",
    sourceUrl: url,
    title,
    author,
    publisher,
    category,
    price,
    originalPrice,
    discountPercent,
    pages,
    coverType: null,
    edition: null,
    language: null,
    cover,
  };
}

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(200).end();

  // Either a direct product link (?url=...) or a name search (?q=...&site=...)
  const directUrl = (req.query.url || "").toString().trim();
  const query = (req.query.q || "").toString().trim();
  const site = (req.query.site || "wafilife").toString().trim();
  // Set ?image=0 to skip downloading the cover (faster, smaller response)
  const withImage = req.query.image !== "0";

  if (!directUrl && !query) {
    res.status(400).json({ error: "Missing 'url' (product link) or 'q' (book name) parameter" });
    return;
  }

  try {
    let productUrl = directUrl || null;
    let resolvedSite = site;
    let data = null;

    if (directUrl) {
      resolvedSite = /rokomari\.com/i.test(directUrl) ? "rokomari" : "wafilife";
      data =
        resolvedSite === "rokomari"
          ? await scrapeRokomariProduct(directUrl)
          : await scrapeWafilifeProduct(directUrl);
    } else if (site === "rokomari") {
      productUrl = await searchRokomari(query);
      if (productUrl) data = await scrapeRokomariProduct(productUrl);
    } else {
      productUrl = await searchWafilife(query);
      if (productUrl) data = await scrapeWafilifeProduct(productUrl);
    }

    if (!data) {
      res.status(404).json({
        error: "বইটি খুঁজে পাওয়া যায়নি",
        query: query || null,
        url: directUrl || null,
        site: resolvedSite,
      });
      return;
    }

    // Download the cover image server-side (avoids CORS + actually saves the
    // bytes) and attach it as coverDataUrl alongside the plain cover URL.
    if (withImage && data.cover) {
      try {
        data.coverDataUrl = await fetchImageAsDataUrl(data.cover);
      } catch (imgErr) {
        data.coverDataUrl = null;
        data.coverError = imgErr.message;
      }
    }

    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message || "তথ্য আনতে সমস্যা হয়েছে" });
  }
};

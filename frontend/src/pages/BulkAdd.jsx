import { useState } from "react";
import { useLibrary } from "../context/LibraryContext";
import { fetchBookInfoByUrl } from "../lib/scrapeApi";

export default function BulkAdd() {
  const { isAdmin, adminLogin, categories, addCategory, addBook, findDuplicate } = useLibrary();
  const [urls, setUrls] = useState("");
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState([]);

  const handleProcess = async () => {
    const urlList = urls.split("\n").map(u => u.trim()).filter(Boolean);
    if (!urlList.length) return;

    setProcessing(true);
    const tempResults = [];

    for (const url of urlList) {
      try {
        const data = await fetchBookInfoByUrl(url);
        const isDup = findDuplicate({ title: data.title, sourceUrl: url });
        
        if (data.category && !categories.includes(data.category)) {
          addCategory(data.category);
        }

        tempResults.push({
          ...data,
          sourceUrl: url,
          isDuplicate: !!isDup,
          includeAnyway: false,
          status: "pending"
        });
      } catch (e) {
        tempResults.push({ sourceUrl: url, error: "Failed to fetch", status: "error" });
      }
    }
    setResults(tempResults);
    setProcessing(false);
  };

  const handleSaveAll = () => {
    results.forEach((item) => {
      if (item.status === "error") return;
      if (item.isDuplicate && !item.includeAnyway) return;

      addBook({
        title: item.title,
        author: item.author || "",
        publisher: item.publisher || "",
        category: item.category || "অন্যান্য",
        price: item.price || null,
        cover: item.coverDataUrl || item.cover || null,
        sourceUrl: item.sourceUrl
      });
    });
    alert("বইগুলো সফলভাবে লাইব্রেরিতে যোগ করা হয়েছে!");
    setResults([]);
    setUrls("");
  };

  if (!isAdmin) {
    return (
      <div className="container">
        <div className="empty-state">
          এই পেজ শুধু অ্যাডমিনের জন্য।
          <div style={{ marginTop: 12 }}>
            <button className="btn-primary" onClick={adminLogin}>অ্যাডমিন লগইন করুন</button>
          </div>
        </div>
      </div>
    );
  }

  const willSaveCount = results.filter(r => r.status !== "error" && (!r.isDuplicate || r.includeAnyway)).length;

  return (
    <div className="container">
      <h2>একসাথে অনেক বই যোগ করুন (Bulk Add)</h2>
      <textarea
        className="form-control"
        rows="5"
        placeholder="WafiLife বা Rokomari এর লিংকগুলো দিন (প্রতি লাইনে একটি করে)"
        value={urls}
        onChange={(e) => setUrls(e.target.value)}
        style={{ width: "100%", padding: "10px", marginBottom: "10px" }}
      />
      <button className="btn-primary" disabled={processing} onClick={handleProcess}>
        {processing ? "প্রসেস হচ্ছে..." : "তথ্য আনুন"}
      </button>

      {results.length > 0 && (
        <div style={{ marginTop: "20px" }}>
          <h3>ফলাফল:</h3>
          {results.map((res, idx) => (
            <div key={idx} className="form-card" style={{ marginBottom: "10px", padding: "10px", border: "1px solid var(--border-color)" }}>
              {res.error ? (
                <p style={{ color: "red" }}>{res.sourceUrl} - {res.error}</p>
              ) : (
                <>
                  <p><strong>{res.title}</strong></p>
                  
                  {/* Category Dropdown */}
                  <select 
                    value={res.category} 
                    onChange={(e) => {
                      const newRes = [...results];
                      newRes[idx].category = e.target.value;
                      setResults(newRes);
                    }}
                    style={{ marginBottom: "10px", padding: "5px" }}
                  >
                    <option value="">ক্যাটাগরি নির্বাচন করুন</option>
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>

                  {/* Duplicate Warning & Checkbox */}
                  {res.isDuplicate && (
                    <div style={{ color: "#d9534f", marginBottom: "10px" }}>
                      ⚠️ এই বইটি ইতিমধ্যে লাইব্রেরিতে আছে। 
                      <label style={{ marginLeft: "10px", cursor: "pointer" }}>
                        <input 
                          type="checkbox" 
                          checked={res.includeAnyway}
                          onChange={(e) => {
                            const newRes = [...results];
                            newRes[idx].includeAnyway = e.target.checked;
                            setResults(newRes);
                          }}
                        /> তবুও যোগ করুন
                      </label>
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
          
          <button 
            className="btn-primary" 
            style={{ width: "100%", marginTop: "15px" }} 
            disabled={willSaveCount === 0} 
            onClick={handleSaveAll}
          >
            {willSaveCount} টি বই সেভ করুন
          </button>
        </div>
      )}
    </div>
  );
}

import { useState, useRef, useEffect, useCallback } from "react";

// ═══════════════════════════════════════════════════════════════════════
// CURATION ENGINE — transforms any product listing into premium listings
// ═══════════════════════════════════════════════════════════════════════

const REJECT_KW = ["cheap","budget","inflatable","pet bed","dog bed","cat bed","gaming chair","massage chair","salon","barber","camping","disposable","cardboard","office chair","student"];
const STRIP = ["free shipping","hot sale","new arrival","best seller","factory direct","wholesale","dropshipping","in stock","2024","2025","2026","2027","promotion","special offer","high quality","top quality","brand new","100% new","fast delivery","big sale","flash sale","limited time","for home","for living room","for bedroom","for house","home decoration","home furniture","house furniture","european style","american style","simple modern","good quality","premium quality"];

const COLS = {beds:["Milano","Aurora","Torino","Riviera","Palazzo","Sienna","Monaco","Capri","Verona","Portofino"],sofas:["Sahara","Zephyr","Mayfair","Belgravia","Kensington","Chelsea","Amalfi","Como","Positano","Rivera"],dining:["Carrara","Firenze","Tuscany","Provence","Vienna","Geneva","Lucerne","Basel","Zurich","Florence"],chairs:["Windsor","Hampton","Aspen","Marbella","Ravello","Taormina","Sorrento","Bergamo","Portofino","Capri"],tv:["Palazzo","Gallery","Studio","Atelier","Soho","Tribeca","Maison","Meridian","Moderne","Chelsea"],wardrobes:["Maison","Grande","Regency","Imperial","Sovereign","Regal","Estate","Manor","Chateau","Villa"],tables:["Infinity","Meridian","Solstice","Eclipse","Zenith","Apex","Atlas","Nova","Summit","Pinnacle"],nightstands:["Luna","Stella","Nova","Celeste","Aria","Lux","Prima","Elite","Serene","Dusk"],chaise:["Riviera","Amalfi","Como","Portofino","Capri","Monaco","Antibes","Cannes","Sorrento","Positano"]};

const MATS = {velvet:"Velvet","bouclé":"Bouclé",boucle:"Bouclé",leather:"Leather",linen:"Linen",marble:"Marble",sintered:"Sintered Stone",glass:"Glass",oak:"Oak",walnut:"Walnut",teak:"Teak",wood:"Wood",brass:"Brass",chrome:"Chrome"};
const STY = {modern:"Modern",minimalist:"Minimalist",nordic:"Nordic",italian:"Italian",contemporary:"Contemporary",curved:"Curved",tufted:"Tufted",wingback:"Wingback",floating:"Floating",upholstered:"Upholstered"};
const TYP = [["platform bed","Platform Bed"],["storage bed","Storage Bed"],["bed frame","Bed"],["chaise lounge","Chaise Longue"],["chaise","Chaise Longue"],["daybed","Day Bed"],["l shape","L-Shape Sectional"],["l-shape","L-Shape Sectional"],["sectional","Sectional"],["corner sofa","Corner Sectional"],["sofa bed","Sofa Bed"],["sofa","Sofa"],["couch","Sofa"],["dining table","Dining Table"],["dining set","Dining Set"],["nightstand","Nightstand"],["bedside table","Nightstand"],["bedside","Nightstand"],["coffee table","Coffee Table"],["side table","Side Table"],["accent chair","Accent Chair"],["wingback","Wingback Chair"],["armchair","Armchair"],["chair","Chair"],["tv cabinet","Media Console"],["tv stand","TV Console"],["media console","Media Console"],["walk in wardrobe","Walk-In Wardrobe"],["wardrobe","Wardrobe"],["closet","Wardrobe"],["ottoman","Ottoman"],["bench","Bench"],["bed","Bed"]];
const TIERS = [[0,50,3.5],[50,150,3.0],[150,400,2.5],[400,800,2.2],[800,99999,2.0]];
const MP = {marble:1.15,sintered:1.12,italian:1.15,leather:1.10,walnut:1.10,teak:1.12,brass:1.08,oak:1.06};

const DESCS = {
  beds:["Crafted for restful luxury — the centrepiece your bedroom deserves.","Where comfort meets refined design. Rest, elevated.","Precision-built for the bedroom that sets your morning tone."],
  sofas:["Deep generous seating for family evenings and elegant entertaining alike.","Where Sunday mornings and Saturday nights feel equally perfect.","Built for how you actually live — beautifully."],
  dining:["Where premium materials meet memorable meals in your Dubai home.","The table that turns dinner into an occasion.","Designed for conversations that last longer than dessert."],
  chairs:["A statement piece that guests notice and remember.","The kind of chair that earns its place in the room.","Sculptural comfort that anchors any space."],
  tv:["Clean lines, hidden cables — designed to complement your screen.","Your entertainment centre, elevated.","Where technology meets thoughtful design."],
  wardrobes:["Thoughtful organisation meets premium materials.","Because getting dressed should feel effortless.","Every garment has its place. Every morning starts right."],
  tables:["A form that invites conversation and completes your living space.","The centrepiece that ties the room together.","Where function meets sculptural beauty."],
  nightstands:["Perfectly proportioned for your bedside essentials.","Compact luxury for the moments before sleep.","Small footprint. Big presence."],
  chaise:["Sculpted for the art of doing nothing, beautifully.","Where afternoon reading becomes a ritual.","An invitation to slow down in style."],
};

const CATS_ALL = ["beds","sofas","dining","chairs","tv","wardrobes","tables","nightstands","chaise"];
const CAT_ICONS = {beds:"🛏️",sofas:"🛋️",dining:"🍽️",chairs:"💺",tv:"📺",wardrobes:"👔",tables:"☕",nightstands:"🌙",chaise:"🛋️"};
const CAT_LABELS = {beds:"Beds",sofas:"Sofas & Couches",dining:"Dining",chairs:"Accent Chairs",tv:"TV Cabinets",wardrobes:"Wardrobes",tables:"Coffee Tables",nightstands:"Nightstands",chaise:"Chaise Lounges"};

const counters = {};
const usedN = new Set();

function detectCat(n) {
  const l = n.toLowerCase();
  if (l.includes("nightstand") || (l.includes("bedside") && !l.includes("bed frame"))) return "nightstands";
  if (l.includes("chaise") || l.includes("daybed")) return "chaise";
  if (l.includes("sofa") || l.includes("couch") || l.includes("sectional")) return "sofas";
  if (l.includes("dining")) return "dining";
  if (l.includes("bed") && !l.includes("sofa bed") && !l.includes("bedside")) return "beds";
  if (l.includes("chair") && !l.includes("gaming")) return "chairs";
  if (l.includes("tv") || l.match(/\bconsole\b/) || l.includes("entertainment")) return "tv";
  if (l.includes("wardrobe") || l.includes("closet")) return "wardrobes";
  if (l.includes("coffee table") || l.includes("side table")) return "tables";
  return "tables";
}

function curateName(raw, cat) {
  let n = raw.toLowerCase();
  STRIP.forEach(w => n = n.replaceAll(w, " "));
  n = n.replace(/\s+/g, " ").trim();
  let mat = ""; for (const [k, d] of Object.entries(MATS)) { if (n.includes(k)) { mat = d; break; } }
  let sty = ""; for (const [k, d] of Object.entries(STY)) { if (n.includes(k)) { sty = d; break; } }
  if (!sty) sty = "Modern";
  let typ = ""; for (const [k, d] of TYP) { if (n.includes(k)) { typ = d; break; } }
  if (!typ) typ = cat.charAt(0).toUpperCase() + cat.slice(1);
  const cs = COLS[cat] || ["Unicorn","Elite","Prima","Luxe","Regal"];
  const idx = counters[cat] || 0;
  const col = cs[idx % cs.length];
  counters[cat] = idx + 1;
  const p = [col]; if (mat) p.push(mat); if (sty !== "Modern") p.push(sty); else if (!mat) p.push(sty); p.push(typ);
  let name = p.join(" ");
  if (usedN.has(name)) { name = name.replace(col, cs[(idx+1) % cs.length]); counters[cat] = idx + 2; }
  usedN.add(name);
  return name;
}

function calcPrice(cost, raw = "") {
  if (cost <= 0) return { price: 0, old: 0, margin: 0, profit: 0 };
  let mk = 2.5;
  for (const [lo, hi, m] of TIERS) { if (cost >= lo && cost < hi) { mk = m; break; } }
  for (const [m, p] of Object.entries(MP)) { if (raw.toLowerCase().includes(m)) { mk *= p; break; } }
  const r = cost * 3.67 * mk;
  let price = r >= 1000 ? Math.round(r / 100) * 100 - 1 : r >= 200 ? Math.round(r / 50) * 50 - 1 : Math.round(r / 10) * 10 - 1;
  price = Math.max(price, 199);
  const old = Math.round(price * (cost < 200 ? 1.30 : 1.25) / 100) * 100 - 1;
  const margin = Math.round((1 - (cost * 3.67) / price) * 100);
  return { price: Math.round(price), old: Math.round(old), margin, profit: Math.round(price - cost * 3.67) };
}

function getDesc(cat) {
  const arr = DESCS[cat] || DESCS.tables;
  return arr[Math.floor(Math.random() * arr.length)];
}

// ═══════════════════════════════════════════════════════════════════════
// FIRECRAWL SCRAPER — renders JS, bypasses anti-bot, returns clean data
// ═══════════════════════════════════════════════════════════════════════

const FC_KEY = "fc-5f02ac8881034fc58728ca0ed1dc4734";

async function aiFetch(url) {
  const cleanUrl = url.replace(/\/\/([\w]+)\.aliexpress\.com/, "//www.aliexpress.com").split("?")[0];
  const resp = await fetch("https://api.firecrawl.dev/v2/scrape", {
    method: "POST",
    headers: { "Authorization": `Bearer ${FC_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      url: cleanUrl, formats: ["markdown", "json"], timeout: 30000, waitFor: 3000,
      jsonOptions: {
        prompt: "Extract the product details from this furniture/product page.",
        schema: {
          type: "object",
          properties: {
            title: { type: "string", description: "Full product title" },
            price_usd: { type: "number", description: "Current sale price in USD. Convert from AED if needed (divide by 3.67)" },
            image_urls: { type: "array", items: { type: "string" }, description: "All product image URLs" },
            colors: { type: "string", description: "Available color options, comma-separated" },
            sizes: { type: "string", description: "Available size options, comma-separated" },
            orders: { type: "number", description: "Number of orders/sold" },
            rating: { type: "string", description: "Product rating" },
          }, required: ["title"],
        },
      },
    }),
  });
  if (!resp.ok) return await fcFallback(cleanUrl);
  const data = await resp.json();
  if (data.success && data.data) {
    const d = data.data, j = d.json || {};
    let imgs = j.image_urls || [];
    if (!imgs.length && d.markdown) imgs = [...new Set((d.markdown.match(/https?:\/\/ae0[0-9]\.alicdn\.com[^\s\)\"]+/g)||[]))].slice(0,6);
    if (!imgs.length && d.markdown) imgs = (d.markdown.match(/!\[.*?\]\((https?:\/\/[^\)]+)\)/g)||[]).map(m=>m.match(/\((https?:\/\/[^\)]+)\)/)?.[1]).filter(Boolean).slice(0,6);
    return { title: j.title||xTitle(d.markdown)||"", price_usd: j.price_usd||xPrice(d.markdown)||0, image_urls: imgs, colors: j.colors||"", sizes: j.sizes||"", orders: j.orders||0, rating: j.rating||"", found: !!(j.title) };
  }
  return { title:"", price_usd:0, image_urls:[], colors:"", sizes:"", orders:0, rating:"", found:false };
}
async function fcFallback(url) {
  try {
    const r = await fetch("https://api.firecrawl.dev/v2/scrape", { method:"POST", headers:{"Authorization":`Bearer ${FC_KEY}`,"Content-Type":"application/json"}, body:JSON.stringify({url,formats:["markdown"],timeout:30000,waitFor:3000}) });
    if (!r.ok) return {title:"",price_usd:0,image_urls:[],colors:"",sizes:"",orders:0,rating:"",found:false};
    const md = (await r.json()).data?.markdown||"";
    return { title:xTitle(md), price_usd:xPrice(md), image_urls:[...new Set((md.match(/https?:\/\/ae0[0-9]\.alicdn\.com[^\s\)\"]+/g)||[]))].slice(0,6), colors:"",sizes:"",orders:0,rating:"",found:true };
  } catch { return {title:"",price_usd:0,image_urls:[],colors:"",sizes:"",orders:0,rating:"",found:false}; }
}
function xTitle(md) { if(!md)return""; const h=md.match(/^#\s+(.+)/m); if(h)return h[1].trim(); const b=md.match(/\*\*(.{10,100})\*\*/); if(b)return b[1].trim(); return md.split("\n").filter(l=>l.trim().length>20&&l.trim().length<200)[0]?.trim()||""; }
function xPrice(md) { if(!md)return 0; const u=md.match(/\$\s?(\d+(?:\.\d{2})?)/); if(u)return parseFloat(u[1]); const a=md.match(/AED\s?(\d[\d,]*(?:\.\d{2})?)/); if(a)return parseFloat(a[1].replace(/,/g,""))/3.67; return 0; }

// ═══════════════════════════════════════════════════════════════════════
// STORAGE
// ═══════════════════════════════════════════════════════════════════════

const STORAGE_KEY = "unicorn-products";
const DEFAULT_PRODUCTS = [{
  id:"prod_001", raw_name:"Modern Wood Leg Square Coffee Table Sets Home Center Table with Storage Drawers", name:"Infinity Sintered Stone Coffee Table Set", category:"tables",
  cost_usd:2325, price_aed:18999, old_price_aed:23699, margin:55, profit:10466,
  images:["/products/infinity-coffee-table.png"], image:"/products/infinity-coffee-table.png",
  colors:"White + Black Marble, Full White", sizes:"80×80cm Set, 70×70cm Single",
  orders:47, rating_score:4.8, reviews:12, badge:"New",
  description:"A nesting duo of sintered stone coffee tables with concealed storage drawers and solid walnut legs. Functional art for your living room.",
  ae_url:"https://www.aliexpress.com/item/1005011685240962.html", added:"2026-02-28T12:00:00Z",
}];

async function loadProducts() {
  try { if(window.storage){ const r=await window.storage.get(STORAGE_KEY); if(r){const s=JSON.parse(r.value); if(s.length>0)return s;} } } catch{}
  try { const l=localStorage.getItem(STORAGE_KEY); if(l){const p=JSON.parse(l); if(p.length>0)return p;} } catch{}
  return [...DEFAULT_PRODUCTS];
}

async function saveProducts(products) {
  try { if(window.storage) await window.storage.set(STORAGE_KEY, JSON.stringify(products)); } catch{}
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(products)); } catch{}
}

// ═══════════════════════════════════════════════════════════════════════
// WHATSAPP
// ═══════════════════════════════════════════════════════════════════════
const WA = "971526455121";
const waLink = (product) => `https://wa.me/${WA}?text=${encodeURIComponent(`Hi! I'm interested in the ${product.name} (AED ${product.price_aed.toLocaleString()}). Is it available?`)}`;
const waGeneral = `https://wa.me/${WA}?text=${encodeURIComponent("Hi! I'm browsing your furniture collection. Can you help me?")}`;

// ═══════════════════════════════════════════════════════════════════════
// APP
// ═══════════════════════════════════════════════════════════════════════

export default function UnicornFurnitureApp() {
  const [products, setProducts] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [mode, setMode] = useState("store"); // store | admin
  const [view, setView] = useState("home"); // home | shop | product | cart
  const [filter, setFilter] = useState("all");
  const [cart, setCart] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [scrolled, setScrolled] = useState(false);

  // Admin state
  const [url, setUrl] = useState("");
  const [importing, setImporting] = useState(false);
  const [importStatus, setImportStatus] = useState("");
  const [lastImported, setLastImported] = useState(null);
  const [showManual, setShowManual] = useState(false);
  const [manTitle, setManTitle] = useState("");
  const [manPrice, setManPrice] = useState("");
  const [manImage, setManImage] = useState("");
  const [toast, setToast] = useState("");
  const urlRef = useRef(null);
  const scrollRef = useRef(null);

  // Load products from storage
  useEffect(() => {
    loadProducts().then(p => {
      // Rebuild used names
      p.forEach(pr => usedN.add(pr.name));
      // Rebuild counters
      p.forEach(pr => { counters[pr.category] = (counters[pr.category] || 0) + 1; });
      setProducts(p);
      setLoaded(true);
    });
  }, []);

  // Scroll handler
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const h = () => setScrolled(el.scrollTop > 50);
    el.addEventListener("scroll", h);
    return () => el.removeEventListener("scroll", h);
  }, []);

  // Secret admin toggle: type "unicorn" anywhere
  useEffect(() => {
    let buf = "";
    const h = (e) => {
      buf += e.key.toLowerCase();
      if (buf.length > 10) buf = buf.slice(-10);
      if (buf.includes("unicorn")) { setMode(m => m === "store" ? "admin" : "store"); buf = ""; }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  const showToast = (m) => { setToast(m); setTimeout(() => setToast(""), 3500); };

  const navigate = (v, data) => {
    if (v === "product") setSelectedProduct(data);
    setView(v);
    scrollRef.current?.scrollTo(0, 0);
  };

  // ── IMPORT ──
  async function handleImport() {
    if (!url.trim() || importing) return;
    if (!url.startsWith("http")) {
      showToast("Paste a valid product URL"); return;
    }
    setImporting(true);
    setImportStatus("Firecrawl is rendering the page...");
    setLastImported(null);
    try {
      const fetched = await aiFetch(url.trim());
      if (!fetched.title && !fetched.found) {
        setImporting(false); setImportStatus("");
        showToast("Couldn't scrape — use manual mode below"); setShowManual(true); return;
      }
      setImportStatus("Curating premium listing...");
      await new Promise(r => setTimeout(r, 500));

      const raw = fetched.title || "Luxury Furniture Piece";
      const cost = fetched.price_usd || 0;
      if (REJECT_KW.some(kw => raw.toLowerCase().includes(kw))) {
        setImporting(false); setImportStatus("");
        showToast("Rejected — doesn't meet Unicorn quality standards"); return;
      }

      const cat = detectCat(raw);
      const name = curateName(raw, cat);
      const pricing = calcPrice(cost, raw);
      const imgs = (fetched.image_urls || []).filter(u => u && u.startsWith("http")).slice(0, 4);

      const product = {
        id: Date.now().toString(),
        raw_name: raw, name, category: cat,
        cost_usd: cost,
        price_aed: pricing.price,
        old_price_aed: pricing.old,
        margin: pricing.margin,
        profit: pricing.profit,
        images: imgs,
        image: imgs[0] || "",
        colors: fetched.colors || "",
        sizes: fetched.sizes || "",
        orders: fetched.orders || 0,
        rating_score: parseFloat(fetched.rating) || 4.8,
        reviews: fetched.orders ? Math.round(fetched.orders * 0.15) : 0,
        badge: pricing.margin > 65 ? "Best Seller" : cost > 400 ? "Premium" : "New",
        description: getDesc(cat),
        ae_url: url.trim(),
        added: new Date().toISOString(),
      };

      const updated = [...products, product];
      setProducts(updated);
      await saveProducts(updated);
      setLastImported(product);
      setUrl("");
      setImporting(false);
      setImportStatus("");
      showToast(`✅ ${name} — now live on store!`);
      urlRef.current?.focus();
    } catch (err) {
      console.error(err);
      setImporting(false);
      setImportStatus("");
      showToast("Error — check URL and try again");
    }
  }

  async function handleManualImport() {
    if (!manTitle.trim()||!manPrice.trim()) { showToast("Need title and price"); return; }
    const cost = parseFloat(manPrice);
    if (isNaN(cost)||cost<=0) { showToast("Enter a valid USD price"); return; }
    const raw = manTitle.trim();
    if (REJECT_KW.some(kw=>raw.toLowerCase().includes(kw))) { showToast("Rejected — doesn't meet quality standards"); return; }
    const cat = detectCat(raw), name = curateName(raw,cat), pricing = calcPrice(cost,raw);
    const imgs = manImage.trim() ? [manImage.trim()] : [];
    const product = { id:Date.now().toString(), raw_name:raw, name, category:cat, cost_usd:cost, price_aed:pricing.price, old_price_aed:pricing.old, margin:pricing.margin, profit:pricing.profit, images:imgs, image:imgs[0]||"", colors:"", sizes:"", orders:0, rating_score:4.8, reviews:0, badge:pricing.margin>65?"Best Seller":cost>400?"Premium":"New", description:getDesc(cat), ae_url:url.trim()||"", added:new Date().toISOString() };
    const updated = [...products, product];
    setProducts(updated); await saveProducts(updated);
    setLastImported(product); setManTitle(""); setManPrice(""); setManImage(""); setShowManual(false); setUrl("");
    showToast(`✅ ${name} — live!`);
  }

  async function handleDelete(id) {
    const updated = products.filter(p => p.id !== id);
    setProducts(updated);
    await saveProducts(updated);
    showToast("Product removed");
  }

  function addToCart(product) {
    setCart(c => {
      const existing = c.find(i => i.id === product.id);
      if (existing) return c.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i);
      return [...c, { ...product, qty: 1 }];
    });
    showToast(`Added to cart`);
  }

  const shopProducts = filter === "all" ? products : products.filter(p => p.category === filter);
  const categories = [...new Set(products.map(p => p.category))];
  const cartTotal = cart.reduce((s, i) => s + i.price_aed * i.qty, 0);
  const cartCount = cart.reduce((s, i) => s + i.qty, 0);

  if (!loaded) return (
    <div style={{ minHeight: "100vh", background: "#fcfaf7", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <p style={{ fontSize: 40, marginBottom: 12 }}>🦄</p>
        <p style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 18, color: "#999", letterSpacing: 2 }}>Loading...</p>
      </div>
    </div>
  );

  // ═══════════════════════════════════════════════════════════════════
  // ADMIN MODE
  // ═══════════════════════════════════════════════════════════════════
  if (mode === "admin") return (
    <div style={{ minHeight: "100vh", background: "#080808", color: "#e0dcd6", fontFamily: "'Outfit',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500;600&family=Outfit:wght@200;300;400;500;600&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        input::placeholder{color:#333}
        input:focus{border-color:#c9b99a !important;outline:none}
        @keyframes slideUp{from{transform:translateY(30px);opacity:0}to{transform:translateY(0);opacity:1}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.35}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes toast{from{transform:translateY(80px) scale(.9);opacity:0}to{transform:translateY(0) scale(1);opacity:1}}
        button{cursor:pointer;transition:all .15s}button:hover{filter:brightness(1.1)}
      `}</style>

      {/* Admin Header */}
      <header style={{ borderBottom: "1px solid #141414", padding: "18px 28px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: "linear-gradient(135deg,#c9b99a,#8a7a5a)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🦄</div>
          <div>
            <h1 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 20, fontWeight: 400, color: "#c9b99a" }}>Admin Panel</h1>
            <p style={{ fontSize: 9, color: "#444", letterSpacing: 3, textTransform: "uppercase" }}>Paste URL → Live on Store</p>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ textAlign: "right" }}>
            <p style={{ fontSize: 9, color: "#444", letterSpacing: 2, textTransform: "uppercase" }}>Live Products</p>
            <p style={{ fontSize: 22, fontWeight: 200, color: "#c9b99a" }}>{products.length}</p>
          </div>
          <button onClick={() => setMode("store")} style={{ padding: "10px 20px", fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", background: "none", border: "1px solid #222", color: "#888", borderRadius: 6 }}>View Store →</button>
        </div>
      </header>

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "40px 28px 120px" }}>
        {/* URL INPUT */}
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 34, fontWeight: 300, color: "#c9b99a", marginBottom: 8 }}>Paste. Done.</h2>
          <p style={{ color: "#444", fontSize: 13, marginBottom: 32 }}>Paste any product URL — AliExpress, Alibaba, 1688, Wayfair, anywhere. AI scrapes, curates, and publishes.</p>
          <div style={{ position: "relative", maxWidth: 650, margin: "0 auto" }}>
            <input ref={urlRef} value={url} onChange={e => setUrl(e.target.value)} onKeyDown={e => e.key === "Enter" && handleImport()}
              placeholder="https://www.aliexpress.com/item/... or any product URL" disabled={importing}
              style={{ width: "100%", padding: "20px 130px 20px 20px", fontSize: 15, background: "#0c0c0c", border: `1px solid ${importing ? "#c9b99a33" : "#1a1a1a"}`, borderRadius: 12, color: "#e0dcd6", fontFamily: "'Outfit',sans-serif", outline: "none" }} />
            <button onClick={handleImport} disabled={importing || !url.trim()}
              style={{ position: "absolute", right: 6, top: 6, bottom: 6, padding: "0 24px", fontSize: 11, fontWeight: 600, letterSpacing: 1.5, textTransform: "uppercase",
                background: importing ? "#1a1a1a" : "linear-gradient(135deg,#c9b99a,#a08b6c)", color: importing ? "#444" : "#080808", border: "none", borderRadius: 9 }}>
              {importing ? <span style={{ display: "flex", alignItems: "center", gap: 8 }}><span style={{ width: 13, height: 13, border: "2px solid #444", borderTopColor: "#888", borderRadius: "50%", animation: "spin .7s linear infinite", display: "inline-block" }} />Wait</span> : "Import"}
            </button>
          </div>
          {importing && importStatus && <p style={{ color: "#c9b99a", fontSize: 13, marginTop: 16, animation: "pulse 1.5s infinite" }}>{importStatus}</p>}

          <div style={{ textAlign: "center", marginTop: 16 }}>
            <button onClick={() => setShowManual(!showManual)} style={{ background: "none", border: "none", fontSize: 11, color: "#555", letterSpacing: 1, cursor: "pointer" }}>
              {showManual ? "▾ HIDE MANUAL MODE" : "▸ MANUAL MODE"}
            </button>
          </div>
          {showManual && (
            <div style={{ maxWidth: 650, margin: "12px auto 0", display: "grid", gap: 10 }}>
              <input value={manTitle} onChange={e => setManTitle(e.target.value)} placeholder="Product title (copy from any site)"
                style={{ width: "100%", padding: "12px 14px", fontSize: 13, background: "#0c0c0c", border: "1px solid #1a1a1a", borderRadius: 8, color: "#e0dcd6", fontFamily: "'Outfit',sans-serif", outline: "none" }} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <input value={manPrice} onChange={e => setManPrice(e.target.value)} placeholder="Price USD (e.g. 245)" type="number"
                  style={{ padding: "12px 14px", fontSize: 13, background: "#0c0c0c", border: "1px solid #1a1a1a", borderRadius: 8, color: "#e0dcd6", fontFamily: "'Outfit',sans-serif", outline: "none" }} />
                <input value={manImage} onChange={e => setManImage(e.target.value)} placeholder="Image URL (optional)"
                  style={{ padding: "12px 14px", fontSize: 13, background: "#0c0c0c", border: "1px solid #1a1a1a", borderRadius: 8, color: "#e0dcd6", fontFamily: "'Outfit',sans-serif", outline: "none" }} />
              </div>
              <button onClick={handleManualImport} style={{ padding: "12px", fontSize: 11, fontWeight: 600, letterSpacing: 1.5, textTransform: "uppercase", background: "linear-gradient(135deg,#c9b99a,#a08b6c)", color: "#080808", border: "none", borderRadius: 8, cursor: "pointer" }}>
                ADD MANUALLY
              </button>
            </div>
          )}
        </div>

        {/* LAST IMPORTED */}
        {lastImported && (
          <div style={{ animation: "slideUp .4s ease", marginBottom: 48 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", border: "1px solid #1a1a1a", borderRadius: 14, overflow: "hidden" }}>
              <div style={{ background: "#0a0a0a", padding: 28, borderRight: "1px solid #141414" }}>
                <p style={{ fontSize: 9, color: "#ef4444", letterSpacing: 3, textTransform: "uppercase", marginBottom: 14 }}>Source Raw</p>
                <p style={{ fontSize: 13, color: "#555", lineHeight: 1.6, marginBottom: 16 }}>{lastImported.raw_name}</p>
                {lastImported.cost_usd > 0 && <p style={{ fontSize: 22, color: "#555" }}>${lastImported.cost_usd}</p>}
              </div>
              <div style={{ background: "#0c0c0c", padding: 28 }}>
                <p style={{ fontSize: 9, color: "#4ade80", letterSpacing: 3, textTransform: "uppercase", marginBottom: 14 }}>✅ Now Live on Store</p>
                <h3 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 22, fontWeight: 400, color: "#e0dcd6", marginBottom: 8, lineHeight: 1.3 }}>{lastImported.name}</h3>
                <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 12 }}>
                  <span style={{ fontSize: 22, fontWeight: 200, color: "#c9b99a" }}>AED {lastImported.price_aed.toLocaleString()}</span>
                  <span style={{ fontSize: 13, color: "#333", textDecoration: "line-through" }}>AED {lastImported.old_price_aed.toLocaleString()}</span>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 10, padding: "4px 10px", borderRadius: 4, background: "#0f1a0f", color: "#4ade80" }}>{lastImported.margin}% margin</span>
                  <span style={{ fontSize: 10, padding: "4px 10px", borderRadius: 4, background: "#1a150f", color: "#c9b99a" }}>AED {lastImported.profit} profit</span>
                </div>
              </div>
            </div>
            {lastImported.images.length > 0 && (
              <div style={{ display: "flex", gap: 3, marginTop: 3 }}>
                {lastImported.images.map((img, i) => (
                  <div key={i} style={{ flex: 1, height: 70, borderRadius: i === 0 ? "0 0 0 14px" : i === lastImported.images.length - 1 ? "0 0 14px 0" : "0", overflow: "hidden", background: "#080808" }}>
                    <img src={img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", opacity: .85 }} onError={e => e.target.style.display = "none"} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* PRODUCT LIST */}
        {products.length > 0 && (
          <div style={{ animation: "fadeIn .3s ease" }}>
            <h3 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 20, fontWeight: 300, color: "#c9b99a", marginBottom: 16 }}>All Products ({products.length})</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {[...products].reverse().map((p, i) => (
                <div key={p.id} style={{
                  display: "grid", gridTemplateColumns: "50px 1fr 110px 70px 36px", alignItems: "center", gap: 14,
                  padding: "12px 16px", background: "#0c0c0c", border: "1px solid #141414", borderRadius: 8,
                  animation: `slideUp .2s ease ${i * .03}s both`,
                }}>
                  <div style={{ width: 44, height: 44, borderRadius: 6, overflow: "hidden", background: "#080808", flexShrink: 0 }}>
                    {p.image ? <img src={p.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => e.target.style.display = "none"} /> : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#222", fontSize: 18 }}>📷</div>}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 500, color: "#e0dcd6", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</p>
                    <p style={{ fontSize: 10, color: "#444" }}>{p.category} · {p.colors || "—"}</p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ fontSize: 13, color: "#c9b99a" }}>AED {p.price_aed.toLocaleString()}</p>
                    <p style={{ fontSize: 10, color: "#333", textDecoration: "line-through" }}>AED {p.old_price_aed.toLocaleString()}</p>
                  </div>
                  <p style={{ textAlign: "center", fontSize: 12, color: p.margin > 60 ? "#4ade80" : "#fbbf24" }}>{p.margin}%</p>
                  <button onClick={() => handleDelete(p.id)} style={{ background: "none", border: "none", color: "#282828", fontSize: 18 }}
                    onMouseEnter={e => e.target.style.color = "#ef4444"} onMouseLeave={e => e.target.style.color = "#282828"}>×</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {toast && <div style={{ position: "fixed", bottom: 28, left: "50%", transform: "translateX(-50%)", background: "#141414", border: "1px solid #2a2a2a", borderRadius: 10, padding: "14px 28px", fontSize: 13, color: "#e0dcd6", animation: "toast .3s ease", zIndex: 999, boxShadow: "0 12px 48px rgba(0,0,0,.6)" }}>{toast}</div>}
    </div>
  );

  // ═══════════════════════════════════════════════════════════════════
  // STORE MODE — Premium Design (from unicorn-furniture.jsx)
  // ═══════════════════════════════════════════════════════════════════

  const discount = selectedProduct ? (selectedProduct.old_price_aed > selectedProduct.price_aed ? Math.round((1 - selectedProduct.price_aed / selectedProduct.old_price_aed) * 100) : null) : null;
  const related = selectedProduct ? products.filter(p => p.category === selectedProduct.category && p.id !== selectedProduct.id).slice(0, 3) : [];

  return (
    <div ref={scrollRef} data-scroll-container style={{
      fontFamily: "'DM Sans', sans-serif", background: '#fcfaf7', color: '#1a1a1a',
      minHeight: '100vh', overflow: 'auto', height: '100vh',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        button{cursor:pointer;transition:all .3s}
        a{text-decoration:none;color:inherit}
        @keyframes toast{from{transform:translateY(80px) scale(.9);opacity:0}to{transform:translateY(0) scale(1);opacity:1}}
      `}</style>

      {/* ── TOP BAR ── */}
      <div style={{
        background: '#1a1a1a', color: '#c9b99a', textAlign: 'center',
        padding: '8px 20px', fontSize: 12, letterSpacing: 2,
        fontFamily: "'DM Sans', sans-serif", textTransform: 'uppercase',
      }}>
        Free delivery across Dubai · Premium Furniture Collection
      </div>

      {/* ── HEADER ── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: scrolled ? 'rgba(252,250,247,0.95)' : '#fcfaf7',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        borderBottom: '1px solid rgba(0,0,0,0.06)',
        transition: 'all 0.4s cubic-bezier(0.16,1,0.3,1)',
        boxShadow: scrolled ? '0 4px 30px rgba(0,0,0,0.04)' : 'none',
      }}>
        <div style={{
          maxWidth: 1400, margin: '0 auto', padding: '0 40px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          height: scrolled ? 64 : 80, transition: 'height 0.4s cubic-bezier(0.16,1,0.3,1)',
        }}>
          {/* Left nav */}
          <nav style={{ display: 'flex', gap: 32, alignItems: 'center', flex: 1 }}>
            {['Shop', 'Collections'].map(item => (
              <span key={item} onClick={() => navigate('shop')} style={{
                fontFamily: "'DM Sans', sans-serif", fontSize: 13, letterSpacing: 1.5,
                textTransform: 'uppercase', cursor: 'pointer', color: '#1a1a1a',
                borderBottom: view === 'shop' ? '2px solid #c9b99a' : '2px solid transparent',
                paddingBottom: 2, transition: 'all 0.3s',
              }}>{item}</span>
            ))}
          </nav>

          {/* Centre logo */}
          <div onClick={() => navigate('home')} style={{ cursor: 'pointer', textAlign: 'center', flex: 1 }}>
            <div style={{
              fontFamily: "'Cormorant Garamond', serif", fontSize: scrolled ? 22 : 28,
              fontWeight: 300, letterSpacing: 6, textTransform: 'uppercase',
              color: '#1a1a1a', transition: 'font-size 0.4s cubic-bezier(0.16,1,0.3,1)', lineHeight: 1,
            }}>Unicorn</div>
            <div style={{
              fontFamily: "'DM Sans', sans-serif", fontSize: 9, letterSpacing: 4,
              textTransform: 'uppercase', color: '#999', marginTop: 2,
            }}>Furniture · Dubai</div>
          </div>

          {/* Right actions */}
          <div style={{ display: 'flex', gap: 24, alignItems: 'center', justifyContent: 'flex-end', flex: 1 }}>
            <button onClick={() => navigate('cart')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#1a1a1a', position: 'relative' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0"/></svg>
              {cartCount > 0 && <span style={{ position: 'absolute', top: -6, right: -8, background: '#1a1a1a', color: '#fff', borderRadius: '50%', width: 16, height: 16, fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Sans', sans-serif" }}>{cartCount}</span>}
            </button>
          </div>
        </div>
      </header>

      {/* ════════ HOME ════════ */}
      {view === 'home' && (
        <>
          {/* Hero Banner */}
          <div style={{
            position: 'relative', height: '85vh', minHeight: 500, maxHeight: 800,
            overflow: 'hidden', background: '#1a1a1a',
          }}>
            <div style={{
              position: 'absolute', inset: 0,
              backgroundImage: 'url(https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1600&q=80)',
              backgroundSize: 'cover', backgroundPosition: 'center',
              opacity: 0.6, transition: 'all 1.8s cubic-bezier(0.16,1,0.3,1)',
            }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.5) 100%)' }} />
            <div style={{
              position: 'relative', zIndex: 2, height: '100%',
              display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
              textAlign: 'center', padding: '0 20px',
            }}>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, letterSpacing: 5, textTransform: 'uppercase', color: '#c9b99a', marginBottom: 24 }}>
                Curated Luxury Furniture
              </div>
              <h1 style={{
                fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(36px, 7vw, 80px)',
                fontWeight: 300, color: '#fff', lineHeight: 1.1, maxWidth: 800,
                margin: '0 0 24px', letterSpacing: 2,
              }}>
                Furniture That<br />Speaks Luxury
              </h1>
              <p style={{
                fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: 'rgba(255,255,255,0.7)',
                maxWidth: 480, lineHeight: 1.7, margin: '0 0 40px',
              }}>
                Handpicked pieces for Dubai's finest homes.<br />
                No showroom markup. Free delivery across the UAE.
              </p>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
                <button onClick={() => navigate('shop')} style={{
                  fontFamily: "'DM Sans', sans-serif", fontSize: 12, letterSpacing: 3,
                  textTransform: 'uppercase', background: '#c9b99a', color: '#1a1a1a',
                  border: 'none', padding: '16px 48px', fontWeight: 500,
                }}
                onMouseOver={e => { e.target.style.background = '#b8a889'; e.target.style.transform = 'translateY(-2px)'; }}
                onMouseOut={e => { e.target.style.background = '#c9b99a'; e.target.style.transform = 'translateY(0)'; }}
                >Shop Collection</button>
                <button onClick={() => window.open(waGeneral, '_blank')} style={{
                  fontFamily: "'DM Sans', sans-serif", fontSize: 12, letterSpacing: 3,
                  textTransform: 'uppercase', background: 'transparent', color: '#fff',
                  border: '1px solid rgba(255,255,255,0.4)', padding: '16px 48px', fontWeight: 500,
                }}
                onMouseOver={e => { e.target.style.borderColor = '#c9b99a'; e.target.style.color = '#c9b99a'; }}
                onMouseOut={e => { e.target.style.borderColor = 'rgba(255,255,255,0.4)'; e.target.style.color = '#fff'; }}
                >WhatsApp Us</button>
              </div>
            </div>
          </div>

          {/* Trust Strip */}
          <section style={{ background: '#f5f3ef', padding: '48px 40px' }}>
            <div style={{ maxWidth: 1400, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 32, textAlign: 'center' }}>
              {[
                { icon: "🚚", title: "Free Dubai Delivery", sub: "On all orders" },
                { icon: "🔧", title: "Free Assembly", sub: "Professional in-home setup" },
                { icon: "🛡️", title: "Warranty Included", sub: "On all furniture" },
                { icon: "💬", title: "WhatsApp Support", sub: "Instant response" },
              ].map(item => (
                <div key={item.title}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>{item.icon}</div>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, color: '#1a1a1a', letterSpacing: 1, marginBottom: 4 }}>{item.title}</div>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: '#888' }}>{item.sub}</div>
                </div>
              ))}
            </div>
          </section>

          {/* Categories */}
          {categories.length > 0 && (
            <section style={{ maxWidth: 1400, margin: '0 auto', padding: '80px 40px' }}>
              <div style={{ textAlign: 'center', marginBottom: 48 }}>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, letterSpacing: 4, textTransform: 'uppercase', color: '#c9b99a', marginBottom: 12 }}>Browse</div>
                <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 42, fontWeight: 300, color: '#1a1a1a', margin: 0, letterSpacing: 1 }}>Our Collections</h2>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                {categories.slice(0, 8).map((cat, i) => {
                  const cp = products.filter(p => p.category === cat);
                  const img = cp[0]?.image;
                  return (
                    <div key={cat} onClick={() => { setFilter(cat); navigate('shop'); }} style={{
                      position: 'relative', height: i < 2 ? 360 : 280, overflow: 'hidden', cursor: 'pointer', background: '#f0ede8',
                    }}>
                      {img && <div style={{
                        position: 'absolute', inset: 0, backgroundImage: `url(${img})`,
                        backgroundSize: 'cover', backgroundPosition: 'center',
                        transition: 'transform 0.8s cubic-bezier(0.16,1,0.3,1)',
                      }}
                      onMouseOver={e => e.target.style.transform = 'scale(1.08)'}
                      onMouseOut={e => e.target.style.transform = 'scale(1)'}
                      />}
                      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.1) 60%)' }} />
                      <div style={{ position: 'absolute', bottom: 24, left: 24, right: 24 }}>
                        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, fontWeight: 400, color: '#fff', marginBottom: 4 }}>{CAT_LABELS[cat] || cat}</div>
                        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: 'rgba(255,255,255,0.7)', letterSpacing: 1 }}>{cp.length} pieces</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Featured */}
          {products.length > 0 && (
            <section style={{ background: '#fff', padding: '80px 0' }}>
              <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 40px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 48 }}>
                  <div>
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, letterSpacing: 4, textTransform: 'uppercase', color: '#c9b99a', marginBottom: 12 }}>Curated</div>
                    <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 42, fontWeight: 300, color: '#1a1a1a', margin: 0 }}>Featured Pieces</h2>
                  </div>
                  <span onClick={() => navigate('shop')} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, letterSpacing: 2, textTransform: 'uppercase', color: '#1a1a1a', cursor: 'pointer', borderBottom: '1px solid #c9b99a', paddingBottom: 2 }}>View All</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 32 }}>
                  {products.slice(0, 8).map(p => (
                    <StoreProductCard key={p.id} product={p} onAdd={addToCart} onView={() => navigate('product', p)} />
                  ))}
                </div>
              </div>
            </section>
          )}

          {products.length === 0 && (
            <section style={{ textAlign: 'center', padding: '120px 40px' }}>
              <div style={{ fontSize: 48, marginBottom: 16, opacity: .3 }}>🦄</div>
              <p style={{ fontFamily: "'DM Sans', sans-serif", color: '#999', fontSize: 15 }}>Collection launching soon.</p>
              <p style={{ fontFamily: "'DM Sans', sans-serif", color: '#bbb', fontSize: 13, marginTop: 12 }}>Type <code style={{ background: '#f0ede8', padding: '3px 10px', fontSize: 12 }}>unicorn</code> to open admin.</p>
            </section>
          )}

          {/* Promo Banner */}
          <section style={{
            position: 'relative', height: 400, overflow: 'hidden',
            backgroundImage: 'url(https://images.unsplash.com/photo-1600210492493-0946911123ea?w=1600&q=80)',
            backgroundSize: 'cover', backgroundPosition: 'center',
          }}>
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(26,26,26,0.7)' }} />
            <div style={{
              position: 'relative', zIndex: 2, height: '100%',
              display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
              textAlign: 'center', padding: '0 20px',
            }}>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, letterSpacing: 5, textTransform: 'uppercase', color: '#c9b99a', marginBottom: 16 }}>Direct From Source</div>
              <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(28px, 5vw, 52px)', fontWeight: 300, color: '#fff', margin: '0 0 12px' }}>No Showroom Markup</h2>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: 'rgba(255,255,255,0.6)', marginBottom: 32 }}>Save 40-60% vs retail · Free delivery · Assembly included</p>
              <button onClick={() => window.open(waGeneral, '_blank')} style={{
                fontFamily: "'DM Sans', sans-serif", fontSize: 12, letterSpacing: 3,
                textTransform: 'uppercase', background: '#c9b99a', color: '#1a1a1a',
                border: 'none', padding: '16px 48px', cursor: 'pointer',
              }}>Get in Touch</button>
            </div>
          </section>
        </>
      )}

      {/* ════════ SHOP ════════ */}
      {view === 'shop' && (
        <section style={{ maxWidth: 1400, margin: '0 auto', padding: '48px 40px' }}>
          {/* Breadcrumb */}
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: '#999', marginBottom: 32 }}>
            <span onClick={() => navigate('home')} style={{ cursor: 'pointer' }}>Home</span> / <span style={{ color: '#1a1a1a' }}>Shop</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 40, flexWrap: 'wrap', gap: 16 }}>
            <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 42, fontWeight: 300, color: '#1a1a1a', margin: 0 }}>
              {filter === 'all' ? 'All Pieces' : (CAT_LABELS[filter] || filter)}
            </h1>
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: '#999' }}>{shopProducts.length} pieces</span>
          </div>

          {/* Category pills */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 40, overflowX: 'auto', paddingBottom: 8 }}>
            <button onClick={() => setFilter('all')} style={{
              fontFamily: "'DM Sans', sans-serif", fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase',
              padding: '10px 20px', border: '1px solid', cursor: 'pointer', whiteSpace: 'nowrap',
              background: filter === 'all' ? '#1a1a1a' : 'transparent',
              color: filter === 'all' ? '#fff' : '#1a1a1a',
              borderColor: filter === 'all' ? '#1a1a1a' : '#ddd',
            }}>All</button>
            {categories.map(cat => (
              <button key={cat} onClick={() => setFilter(cat)} style={{
                fontFamily: "'DM Sans', sans-serif", fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase',
                padding: '10px 20px', border: '1px solid', cursor: 'pointer', whiteSpace: 'nowrap',
                background: filter === cat ? '#1a1a1a' : 'transparent',
                color: filter === cat ? '#fff' : '#1a1a1a',
                borderColor: filter === cat ? '#1a1a1a' : '#ddd',
              }}>{CAT_LABELS[cat] || cat}</button>
            ))}
          </div>

          {/* Product grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 32 }}>
            {shopProducts.map(p => (
              <StoreProductCard key={p.id} product={p} onAdd={addToCart} onView={() => navigate('product', p)} />
            ))}
          </div>
          {shopProducts.length === 0 && (
            <div style={{ textAlign: 'center', padding: '80px 0', color: '#999', fontFamily: "'DM Sans', sans-serif" }}>No products in this category yet.</div>
          )}
        </section>
      )}

      {/* ════════ PRODUCT DETAIL ════════ */}
      {view === 'product' && selectedProduct && (
        <section style={{ maxWidth: 1400, margin: '0 auto', padding: '48px 40px' }}>
          {/* Breadcrumb */}
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: '#999', marginBottom: 32 }}>
            <span onClick={() => navigate('home')} style={{ cursor: 'pointer' }}>Home</span> / <span onClick={() => navigate('shop')} style={{ cursor: 'pointer' }}>Shop</span> / <span style={{ color: '#1a1a1a' }}>{selectedProduct.name}</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, marginBottom: 80 }}>
            {/* Image */}
            <div>
              <div style={{ position: 'relative', paddingTop: '100%', overflow: 'hidden', background: '#f0ede8' }}>
                {selectedProduct.image ? <img src={selectedProduct.image} alt={selectedProduct.name} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} onError={e => e.target.style.display = 'none'} />
                  : <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48, opacity: .15 }}>🦄</div>}
                {selectedProduct.badge && (
                  <span style={{ position: 'absolute', top: 20, left: 20, background: '#1a1a1a', color: '#fff', fontFamily: "'DM Sans', sans-serif", fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', padding: '6px 14px' }}>{selectedProduct.badge}</span>
                )}
              </div>
              {selectedProduct.images?.length > 1 && (
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  {selectedProduct.images.slice(0, 4).map((img, i) => (
                    <div key={i} style={{ flex: 1, height: 80, overflow: 'hidden', background: '#f0ede8' }}>
                      <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => e.target.style.display = 'none'} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Details */}
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', color: '#c9b99a', marginBottom: 12 }}>
                {CAT_LABELS[selectedProduct.category] || selectedProduct.category}
              </div>

              <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 36, fontWeight: 400, color: '#1a1a1a', margin: '0 0 16px', lineHeight: 1.2 }}>{selectedProduct.name}</h1>

              <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 24 }}>
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 28, fontWeight: 600, color: '#1a1a1a' }}>AED {selectedProduct.price_aed?.toLocaleString()}</span>
                {selectedProduct.old_price_aed > selectedProduct.price_aed && <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 18, color: '#999', textDecoration: 'line-through' }}>AED {selectedProduct.old_price_aed?.toLocaleString()}</span>}
                {discount && <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, background: '#c9b99a', color: '#fff', padding: '3px 10px', letterSpacing: 1 }}>-{discount}%</span>}
              </div>

              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: '#666', lineHeight: 1.7, marginBottom: 32 }}>
                {selectedProduct.description || "Premium quality furniture handpicked for Dubai homes. Each piece is sourced for exceptional quality and delivered with care."}
              </p>

              {/* Colours */}
              {selectedProduct.colors && (
                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 600, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 10, color: '#1a1a1a' }}>Colours</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {selectedProduct.colors.split(',').map(c => c.trim()).filter(Boolean).map(c => (
                      <span key={c} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, padding: '8px 16px', border: '1px solid #ddd', background: '#fff' }}>{c}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Sizes */}
              {selectedProduct.sizes && (
                <div style={{ marginBottom: 32 }}>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 600, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 10, color: '#1a1a1a' }}>Sizes</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {selectedProduct.sizes.split(',').map(s => s.trim()).filter(Boolean).map(s => (
                      <span key={s} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, padding: '8px 16px', border: '1px solid #ddd', background: '#fff' }}>{s}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Add to cart + WhatsApp */}
              <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                <button onClick={() => addToCart(selectedProduct)} style={{
                  flex: 1, fontFamily: "'DM Sans', sans-serif", fontSize: 12, letterSpacing: 3,
                  textTransform: 'uppercase', background: '#1a1a1a', color: '#fff',
                  border: 'none', padding: '16px',
                }}
                onMouseOver={e => e.target.style.background = '#333'}
                onMouseOut={e => e.target.style.background = '#1a1a1a'}
                >Add to Cart — AED {selectedProduct.price_aed?.toLocaleString()}</button>
              </div>

              <a href={waLink(selectedProduct)} target="_blank" rel="noreferrer" style={{
                display: 'block', width: '100%', padding: '14px', fontFamily: "'DM Sans', sans-serif", fontSize: 12,
                letterSpacing: 2, textTransform: 'uppercase', textAlign: 'center',
                background: '#25D366', color: '#fff', border: 'none', marginBottom: 16,
              }}>WhatsApp Us About This Piece</a>

              <div style={{ padding: 20, background: '#f5f3ef', display: 'flex', gap: 12, alignItems: 'center' }}>
                <span style={{ fontSize: 20 }}>💬</span>
                <div>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}>Need help choosing?</div>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: '#666' }}>
                    <a href={waGeneral} target="_blank" rel="noreferrer" style={{ color: '#25D366', textDecoration: 'underline' }}>WhatsApp our team</a> for instant advice
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Related */}
          {related.length > 0 && (
            <>
              <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 32, fontWeight: 300, color: '#1a1a1a', marginBottom: 32 }}>You May Also Like</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 32 }}>
                {related.map(p => (
                  <StoreProductCard key={p.id} product={p} onAdd={addToCart} onView={() => navigate('product', p)} />
                ))}
              </div>
            </>
          )}
        </section>
      )}

      {/* ════════ CART ════════ */}
      {view === 'cart' && (
        <section style={{ maxWidth: 1000, margin: '0 auto', padding: '48px 40px' }}>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 42, fontWeight: 300, color: '#1a1a1a', marginBottom: 48 }}>Your Cart</h1>
          {cart.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 0' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🛍️</div>
              <p style={{ fontFamily: "'DM Sans', sans-serif", color: '#999', marginBottom: 24 }}>Your cart is empty</p>
              <button onClick={() => navigate('shop')} style={{
                fontFamily: "'DM Sans', sans-serif", fontSize: 12, letterSpacing: 3,
                textTransform: 'uppercase', background: '#1a1a1a', color: '#fff',
                border: 'none', padding: '16px 48px',
              }}>Continue Shopping</button>
            </div>
          ) : (
            <>
              {cart.map((item, i) => (
                <div key={item.id} style={{ display: 'flex', gap: 24, padding: '24px 0', borderBottom: '1px solid #eee', alignItems: 'center' }}>
                  <div style={{ width: 100, height: 100, overflow: 'hidden', background: '#f0ede8', flexShrink: 0 }}>
                    {item.image ? <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ccc' }}>🦄</div>}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, fontWeight: 500, color: '#1a1a1a' }}>{item.name}</div>
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: '#999', marginTop: 4 }}>Qty: {item.qty}</div>
                  </div>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 600, color: '#1a1a1a', minWidth: 100, textAlign: 'right' }}>AED {(item.price_aed * item.qty).toLocaleString()}</div>
                  <button onClick={() => setCart(c => c.filter(x => x.id !== item.id))} style={{ background: 'none', border: 'none', color: '#999', fontSize: 18 }}>×</button>
                </div>
              ))}

              <div style={{ padding: '32px 0', borderTop: '2px solid #1a1a1a', marginTop: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: '#666' }}>Subtotal</span>
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600 }}>AED {cartTotal.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: '#666' }}>Delivery</span>
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: '#4a6741' }}>Free</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 32, paddingTop: 16, borderTop: '1px solid #eee' }}>
                  <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 500 }}>Total</span>
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 22, fontWeight: 700 }}>AED {cartTotal.toLocaleString()}</span>
                </div>

                <a href={`https://wa.me/${WA}?text=${encodeURIComponent(`Hi! I'd like to order:\n${cart.map(i => `• ${i.name} x${i.qty} — AED ${(i.price_aed * i.qty).toLocaleString()}`).join("\n")}\n\nTotal: AED ${cartTotal.toLocaleString()}`)}`} target="_blank" rel="noreferrer"
                  style={{
                    display: 'block', width: '100%', padding: '18px', fontFamily: "'DM Sans', sans-serif", fontSize: 13,
                    letterSpacing: 3, textTransform: 'uppercase', background: '#25D366', color: '#fff',
                    border: 'none', textAlign: 'center', marginBottom: 12, fontWeight: 500,
                  }}>Order via WhatsApp</a>
                <button onClick={() => navigate('shop')} style={{
                  width: '100%', padding: '16px', fontFamily: "'DM Sans', sans-serif", fontSize: 12,
                  letterSpacing: 2, textTransform: 'uppercase', background: 'transparent',
                  color: '#1a1a1a', border: '1px solid #ddd',
                }}>Continue Shopping</button>
              </div>
            </>
          )}
        </section>
      )}

      {/* ── FOOTER ── */}
      <footer style={{ background: '#1a1a1a', color: '#fff', padding: '64px 40px 32px' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 48, marginBottom: 48 }}>
            <div>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, fontWeight: 300, letterSpacing: 4, marginBottom: 16 }}>UNICORN</div>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7 }}>
                Premium furniture curated for Dubai's finest homes. A division of First Unicorn Group.
              </p>
            </div>
            <div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: '#c9b99a', marginBottom: 16 }}>Shop</div>
              {Object.values(CAT_LABELS).slice(0, 6).map(item => (
                <div key={item} onClick={() => navigate('shop')} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 10, cursor: 'pointer' }}>{item}</div>
              ))}
            </div>
            <div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: '#c9b99a', marginBottom: 16 }}>Help</div>
              {['Delivery Information', 'Returns & Exchanges', 'Care Guide', 'FAQ'].map(item => (
                <div key={item} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 10 }}>{item}</div>
              ))}
            </div>
            <div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: '#c9b99a', marginBottom: 16 }}>Contact</div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 10 }}>Dubai, UAE</div>
              <a href={waGeneral} target="_blank" rel="noreferrer" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#25D366', marginBottom: 10, display: 'block' }}>WhatsApp: +971 52 645 5121</a>
            </div>
          </div>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 24, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>© 2026 Unicorn Furniture. A First Unicorn Group company.</div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>Prices in AED. VAT included.</div>
          </div>
        </div>
      </footer>

      {/* WhatsApp FAB */}
      <a href={waGeneral} target="_blank" rel="noreferrer" style={{
        position: 'fixed', bottom: 24, right: 24, zIndex: 999,
        width: 56, height: 56, borderRadius: '50%', background: '#25D366',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 4px 20px rgba(37,211,102,0.4)', transition: 'transform 0.3s',
      }}
      onMouseOver={e => e.currentTarget.style.transform = 'scale(1.1)'}
      onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="#fff">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
      </a>

      {toast && <div style={{ position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)', background: '#1a1a1a', borderRadius: 10, padding: '14px 28px', fontSize: 13, color: '#fff', animation: 'toast .3s ease', zIndex: 999, boxShadow: '0 12px 48px rgba(0,0,0,.2)' }}>{toast}</div>}
    </div>
  );
}

// ── Store Product Card ──
function StoreProductCard({ product: p, onAdd, onView }) {
  const [hovered, setHovered] = useState(false);
  const disc = p.old_price_aed > p.price_aed ? Math.round((1 - p.price_aed / p.old_price_aed) * 100) : null;

  return (
    <div onMouseOver={() => setHovered(true)} onMouseOut={() => setHovered(false)} style={{ position: 'relative', cursor: 'pointer' }}>
      {/* Image */}
      <div onClick={onView} style={{ position: 'relative', paddingTop: '120%', overflow: 'hidden', background: '#f0ede8', marginBottom: 16 }}>
        {p.image ? <img src={p.image} alt={p.name} style={{
          position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover',
          transition: 'transform 0.8s cubic-bezier(0.16,1,0.3,1)',
          transform: hovered ? 'scale(1.05)' : 'scale(1)',
        }} onError={e => e.target.style.display = 'none'} />
          : <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48, opacity: .15 }}>🦄</div>}

        {p.badge && (
          <span style={{
            position: 'absolute', top: 12, left: 12,
            background: p.badge === 'Sale' ? '#c9b99a' : '#1a1a1a',
            color: '#fff', fontFamily: "'DM Sans', sans-serif", fontSize: 10,
            letterSpacing: 1.5, textTransform: 'uppercase', padding: '5px 12px',
          }}>{p.badge}{disc ? ` -${disc}%` : ''}</span>
        )}

        {/* Quick add */}
        <div style={{
          position: 'absolute', bottom: 12, left: 12, right: 12,
          display: 'flex', gap: 8, justifyContent: 'center',
          opacity: hovered ? 1 : 0, transform: hovered ? 'translateY(0)' : 'translateY(10px)',
          transition: 'all 0.3s cubic-bezier(0.16,1,0.3,1)',
        }}>
          <button onClick={e => { e.stopPropagation(); onAdd(p); }} style={{
            flex: 1, padding: '12px', background: 'rgba(26,26,26,0.9)', color: '#fff',
            border: 'none', fontFamily: "'DM Sans', sans-serif", fontSize: 11,
            letterSpacing: 2, textTransform: 'uppercase', backdropFilter: 'blur(10px)',
          }}>Add to Cart</button>
        </div>
      </div>

      {/* Info */}
      <div onClick={onView}>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, fontWeight: 500, color: '#1a1a1a', marginBottom: 6, lineHeight: 1.3 }}>{p.name}</div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 600, color: '#1a1a1a' }}>AED {p.price_aed?.toLocaleString()}</span>
          {p.old_price_aed > p.price_aed && <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#999', textDecoration: 'line-through' }}>AED {p.old_price_aed?.toLocaleString()}</span>}
        </div>
        {p.colors && (
          <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
            {p.colors.split(',').slice(0, 3).map(c => c.trim()).filter(Boolean).map(c => (
              <span key={c} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: '#777', background: '#f5f3ef', padding: '3px 8px' }}>{c}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

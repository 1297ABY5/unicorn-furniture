import { useState, useRef, useEffect, useCallback } from "react";

// ═══════════════════════════════════════════════════════════════════════
// CURATION ENGINE — transforms AliExpress garbage into premium listings
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
        prompt: "Extract the product details from this AliExpress product page.",
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
    if (!url.includes("aliexpress") && !url.includes("ali.express") && !url.includes("a]i")) {
      showToast("Paste an AliExpress product URL"); return;
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
          <p style={{ color: "#444", fontSize: 13, marginBottom: 32 }}>Paste any AliExpress URL. AI fetches, curates, and publishes to your live store.</p>
          <div style={{ position: "relative", maxWidth: 650, margin: "0 auto" }}>
            <input ref={urlRef} value={url} onChange={e => setUrl(e.target.value)} onKeyDown={e => e.key === "Enter" && handleImport()}
              placeholder="https://www.aliexpress.com/item/1005007..." disabled={importing}
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
              <input value={manTitle} onChange={e => setManTitle(e.target.value)} placeholder="Product title (copy from AliExpress)"
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
                <p style={{ fontSize: 9, color: "#ef4444", letterSpacing: 3, textTransform: "uppercase", marginBottom: 14 }}>AliExpress Raw</p>
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
  // STORE MODE
  // ═══════════════════════════════════════════════════════════════════
  return (
    <div ref={scrollRef} style={{ minHeight: "100vh", background: "#fcfaf7", color: "#1a1a1a", fontFamily: "'Outfit',sans-serif", overflowY: "auto", height: "100vh" }} data-scroll-container>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=Outfit:wght@200;300;400;500;600&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes slideUp{from{transform:translateY(30px);opacity:0}to{transform:translateY(0);opacity:1}}
        @keyframes toast{from{transform:translateY(80px) scale(.9);opacity:0}to{transform:translateY(0) scale(1);opacity:1}}
        button{cursor:pointer;transition:all .2s ease}
        a{text-decoration:none;color:inherit}
      `}</style>

      {/* ── NAV ── */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 100, padding: "16px 40px",
        background: scrolled ? "rgba(252,250,247,.95)" : "transparent",
        backdropFilter: scrolled ? "blur(12px)" : "none",
        borderBottom: scrolled ? "1px solid #eee" : "none",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        transition: "all .3s ease",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }} onClick={() => navigate("home")}>
          <span style={{ fontSize: 24 }}>🦄</span>
          <div>
            <h1 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 20, fontWeight: 500, letterSpacing: 1, color: "#1a1a1a" }}>Unicorn Furniture</h1>
            <p style={{ fontSize: 8, letterSpacing: 3, textTransform: "uppercase", color: "#999" }}>Premium Living</p>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          <button onClick={() => navigate("shop")} style={{ background: "none", border: "none", fontSize: 13, color: "#666", letterSpacing: .5 }}>Collection</button>
          <button onClick={() => navigate("cart")} style={{ background: "none", border: "none", fontSize: 13, color: "#666", position: "relative" }}>
            Cart {cartCount > 0 && <span style={{ position: "absolute", top: -6, right: -14, width: 18, height: 18, borderRadius: "50%", background: "#1a1a1a", color: "#fff", fontSize: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>{cartCount}</span>}
          </button>
        </div>
      </nav>

      {/* ── HOME ── */}
      {view === "home" && (
        <div style={{ animation: "fadeIn .4s ease" }}>
          {/* Hero */}
          <section style={{ padding: "100px 40px 80px", textAlign: "center", maxWidth: 800, margin: "0 auto" }}>
            <p style={{ fontSize: 11, letterSpacing: 4, textTransform: "uppercase", color: "#c9b99a", marginBottom: 16 }}>Premium Furniture for Dubai Homes</p>
            <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 52, fontWeight: 300, lineHeight: 1.2, marginBottom: 20, color: "#1a1a1a" }}>
              Furniture That<br /><em style={{ fontWeight: 400, fontStyle: "italic" }}>Feels Like Home</em>
            </h2>
            <p style={{ fontSize: 15, color: "#888", lineHeight: 1.7, maxWidth: 500, margin: "0 auto 36px" }}>
              Handpicked luxury pieces delivered to your door. No showroom markup. Free delivery across the UAE.
            </p>
            <button onClick={() => navigate("shop")} style={{
              padding: "16px 48px", fontSize: 12, letterSpacing: 3, textTransform: "uppercase", fontWeight: 500,
              background: "#1a1a1a", color: "#fff", border: "none", fontFamily: "'Outfit',sans-serif",
            }}>Shop Collection</button>
          </section>

          {/* Categories */}
          {categories.length > 0 && (
            <section style={{ padding: "0 40px 60px", maxWidth: 1200, margin: "0 auto" }}>
              <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(categories.length, 4)}, 1fr)`, gap: 16 }}>
                {categories.slice(0, 8).map(cat => {
                  const catProducts = products.filter(p => p.category === cat);
                  const coverImg = catProducts[0]?.image;
                  return (
                    <div key={cat} onClick={() => { setFilter(cat); navigate("shop"); }}
                      style={{ cursor: "pointer", position: "relative", borderRadius: 8, overflow: "hidden", aspectRatio: "4/3", background: "#f0ede8" }}>
                      {coverImg && <img src={coverImg} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", opacity: .7 }} onError={e => e.target.style.display = "none"} />}
                      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: 20, background: "linear-gradient(transparent, rgba(0,0,0,.5))" }}>
                        <p style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 20, fontWeight: 400, color: "#fff" }}>{CAT_LABELS[cat] || cat}</p>
                        <p style={{ fontSize: 11, color: "rgba(255,255,255,.7)" }}>{catProducts.length} pieces</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Featured */}
          {products.length > 0 && (
            <section style={{ padding: "40px 40px 80px", maxWidth: 1200, margin: "0 auto" }}>
              <h3 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 32, fontWeight: 300, textAlign: "center", marginBottom: 40 }}>Featured Pieces</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 24 }}>
                {products.slice(0, 8).map((p, i) => (
                  <ProductCard key={p.id} product={p} onAdd={addToCart} onView={() => navigate("product", p)} delay={i * .05} />
                ))}
              </div>
            </section>
          )}

          {products.length === 0 && (
            <section style={{ textAlign: "center", padding: "60px 40px" }}>
              <p style={{ fontSize: 36, marginBottom: 16, opacity: .3 }}>🦄</p>
              <p style={{ color: "#999", fontSize: 15 }}>Collection coming soon.</p>
              <p style={{ color: "#bbb", fontSize: 13, marginTop: 8 }}>Type <code style={{ background: "#f0ede8", padding: "2px 8px", borderRadius: 4 }}>unicorn</code> to open the admin panel and start importing.</p>
            </section>
          )}

          {/* Trust */}
          <section style={{ padding: "48px 40px", background: "#f5f2ed", display: "flex", justifyContent: "center", gap: 48, flexWrap: "wrap" }}>
            {[["🚚","Free UAE Delivery"],["🔒","Secure Payment"],["↩️","30-Day Returns"],["💬","WhatsApp Support"]].map(([icon, text]) => (
              <div key={text} style={{ textAlign: "center" }}>
                <p style={{ fontSize: 24, marginBottom: 6 }}>{icon}</p>
                <p style={{ fontSize: 12, color: "#888", letterSpacing: 1 }}>{text}</p>
              </div>
            ))}
          </section>

          <Footer />
        </div>
      )}

      {/* ── SHOP ── */}
      {view === "shop" && (
        <div style={{ animation: "fadeIn .3s ease", maxWidth: 1200, margin: "0 auto", padding: "32px 40px 80px" }}>
          <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 36, fontWeight: 300, marginBottom: 24 }}>Collection</h2>
          {/* Filters */}
          <div style={{ display: "flex", gap: 8, marginBottom: 32, flexWrap: "wrap" }}>
            <button onClick={() => setFilter("all")} style={{ padding: "8px 20px", fontSize: 12, letterSpacing: 1, border: `1px solid ${filter === "all" ? "#1a1a1a" : "#ddd"}`, background: filter === "all" ? "#1a1a1a" : "transparent", color: filter === "all" ? "#fff" : "#888", borderRadius: 4 }}>All</button>
            {categories.map(c => (
              <button key={c} onClick={() => setFilter(c)} style={{ padding: "8px 20px", fontSize: 12, letterSpacing: 1, border: `1px solid ${filter === c ? "#1a1a1a" : "#ddd"}`, background: filter === c ? "#1a1a1a" : "transparent", color: filter === c ? "#fff" : "#888", borderRadius: 4 }}>
                {CAT_LABELS[c] || c}
              </button>
            ))}
          </div>
          {shopProducts.length === 0 ? (
            <p style={{ color: "#999", textAlign: "center", padding: 60 }}>No products in this category yet.</p>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 24 }}>
              {shopProducts.map((p, i) => <ProductCard key={p.id} product={p} onAdd={addToCart} onView={() => navigate("product", p)} delay={i * .04} />)}
            </div>
          )}
        </div>
      )}

      {/* ── PRODUCT DETAIL ── */}
      {view === "product" && selectedProduct && (
        <div style={{ animation: "fadeIn .3s ease", maxWidth: 1000, margin: "0 auto", padding: "32px 40px 80px" }}>
          <button onClick={() => navigate("shop")} style={{ background: "none", border: "none", fontSize: 13, color: "#999", marginBottom: 24 }}>← Back to Collection</button>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48, alignItems: "start" }}>
            <div>
              <div style={{ aspectRatio: "1", borderRadius: 8, overflow: "hidden", background: "#f0ede8", marginBottom: 12 }}>
                {selectedProduct.image ? <img src={selectedProduct.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 60, opacity: .2 }}>🦄</div>}
              </div>
              {selectedProduct.images?.length > 1 && (
                <div style={{ display: "flex", gap: 8 }}>
                  {selectedProduct.images.map((img, i) => (
                    <div key={i} style={{ width: 72, height: 72, borderRadius: 6, overflow: "hidden", background: "#f0ede8", cursor: "pointer" }}>
                      <img src={img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => e.target.style.display = "none"} />
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div style={{ paddingTop: 16 }}>
              <p style={{ fontSize: 11, letterSpacing: 3, textTransform: "uppercase", color: "#c9b99a", marginBottom: 8 }}>{CAT_LABELS[selectedProduct.category] || selectedProduct.category}</p>
              {selectedProduct.badge && <span style={{ fontSize: 10, padding: "4px 12px", borderRadius: 3, background: "#f5f2ed", color: "#888", letterSpacing: 1, textTransform: "uppercase", marginBottom: 12, display: "inline-block" }}>{selectedProduct.badge}</span>}
              <h1 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 36, fontWeight: 400, lineHeight: 1.2, marginBottom: 16, marginTop: 8 }}>{selectedProduct.name}</h1>
              <p style={{ fontSize: 14, color: "#888", lineHeight: 1.7, marginBottom: 24 }}>{selectedProduct.description}</p>
              <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 24 }}>
                <span style={{ fontSize: 28, fontWeight: 300 }}>AED {selectedProduct.price_aed?.toLocaleString()}</span>
                {selectedProduct.old_price_aed > selectedProduct.price_aed && <span style={{ fontSize: 16, color: "#bbb", textDecoration: "line-through" }}>AED {selectedProduct.old_price_aed?.toLocaleString()}</span>}
              </div>
              {selectedProduct.colors && <p style={{ fontSize: 12, color: "#888", marginBottom: 8 }}>Colours: {selectedProduct.colors}</p>}
              {selectedProduct.sizes && <p style={{ fontSize: 12, color: "#888", marginBottom: 20 }}>Sizes: {selectedProduct.sizes}</p>}
              <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
                <button onClick={() => addToCart(selectedProduct)} style={{ flex: 1, padding: "16px", fontSize: 12, letterSpacing: 2, textTransform: "uppercase", fontWeight: 500, background: "#1a1a1a", color: "#fff", border: "none" }}>Add to Cart</button>
                <a href={waLink(selectedProduct)} target="_blank" rel="noreferrer" style={{ flex: 1, padding: "16px", fontSize: 12, letterSpacing: 2, textTransform: "uppercase", fontWeight: 500, background: "#25d366", color: "#fff", border: "none", textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center" }}>WhatsApp Us</a>
              </div>
              <div style={{ display: "flex", gap: 24, paddingTop: 20, borderTop: "1px solid #eee" }}>
                {[["🚚","Free delivery"],["↩️","30-day returns"],["🔒","Secure checkout"]].map(([i, t]) => (
                  <p key={t} style={{ fontSize: 11, color: "#999" }}>{i} {t}</p>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── CART ── */}
      {view === "cart" && (
        <div style={{ animation: "fadeIn .3s ease", maxWidth: 700, margin: "0 auto", padding: "32px 40px 80px" }}>
          <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 36, fontWeight: 300, marginBottom: 32 }}>Your Cart</h2>
          {cart.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 0" }}>
              <p style={{ fontSize: 40, marginBottom: 12, opacity: .3 }}>🛒</p>
              <p style={{ color: "#999" }}>Your cart is empty</p>
              <button onClick={() => navigate("shop")} style={{ marginTop: 20, padding: "14px 36px", fontSize: 12, letterSpacing: 2, textTransform: "uppercase", background: "#1a1a1a", color: "#fff", border: "none" }}>Browse Collection</button>
            </div>
          ) : (
            <>
              {cart.map(item => (
                <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 20, padding: "20px 0", borderBottom: "1px solid #eee" }}>
                  <div style={{ width: 80, height: 80, borderRadius: 6, overflow: "hidden", background: "#f0ede8", flexShrink: 0 }}>
                    {item.image ? <img src={item.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>🦄</div>}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 15, fontWeight: 500 }}>{item.name}</p>
                    <p style={{ fontSize: 13, color: "#888" }}>Qty: {item.qty}</p>
                  </div>
                  <p style={{ fontSize: 16, fontWeight: 300 }}>AED {(item.price_aed * item.qty).toLocaleString()}</p>
                  <button onClick={() => setCart(c => c.filter(i => i.id !== item.id))} style={{ background: "none", border: "none", color: "#ccc", fontSize: 18 }}>×</button>
                </div>
              ))}
              <div style={{ padding: "24px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 14, color: "#888" }}>Total</span>
                <span style={{ fontSize: 28, fontWeight: 300 }}>AED {cartTotal.toLocaleString()}</span>
              </div>
              <a href={`https://wa.me/${WA}?text=${encodeURIComponent(`Hi! I'd like to order:\n${cart.map(i => `• ${i.name} x${i.qty} (AED ${(i.price_aed * i.qty).toLocaleString()})`).join("\n")}\n\nTotal: AED ${cartTotal.toLocaleString()}`)}`} target="_blank" rel="noreferrer"
                style={{ display: "block", width: "100%", padding: "18px", fontSize: 12, letterSpacing: 2, textTransform: "uppercase", fontWeight: 500, background: "#25d366", color: "#fff", border: "none", textAlign: "center", borderRadius: 4 }}>
                Order via WhatsApp →
              </a>
            </>
          )}
        </div>
      )}

      {/* WhatsApp Fab */}
      <a href={waGeneral} target="_blank" rel="noreferrer"
        style={{ position: "fixed", bottom: 24, right: 24, width: 56, height: 56, borderRadius: "50%", background: "#25d366", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 20px rgba(37,211,102,.4)", zIndex: 100, fontSize: 26 }}>
        💬
      </a>

      {toast && <div style={{ position: "fixed", bottom: 28, left: "50%", transform: "translateX(-50%)", background: "#1a1a1a", borderRadius: 10, padding: "14px 28px", fontSize: 13, color: "#fff", animation: "toast .3s ease", zIndex: 999, boxShadow: "0 12px 48px rgba(0,0,0,.2)" }}>{toast}</div>}
    </div>
  );
}

// ── Product Card ──
function ProductCard({ product, onAdd, onView, delay = 0 }) {
  const p = product;
  return (
    <div style={{ animation: `slideUp .4s ease ${delay}s both`, cursor: "pointer" }} onClick={onView}>
      <div style={{ aspectRatio: "4/5", borderRadius: 8, overflow: "hidden", background: "#f0ede8", marginBottom: 12, position: "relative" }}>
        {p.image ? <img src={p.image} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform .4s ease" }}
          onMouseEnter={e => e.target.style.transform = "scale(1.05)"} onMouseLeave={e => e.target.style.transform = "scale(1)"}
          onError={e => e.target.style.display = "none"} /> : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 48, opacity: .15 }}>🦄</div>}
        {p.badge && <span style={{ position: "absolute", top: 12, left: 12, fontSize: 9, padding: "4px 10px", borderRadius: 3, background: "rgba(255,255,255,.9)", color: "#1a1a1a", letterSpacing: 1.5, textTransform: "uppercase", fontWeight: 500 }}>{p.badge}</span>}
        <button onClick={(e) => { e.stopPropagation(); onAdd(p); }}
          style={{ position: "absolute", bottom: 12, right: 12, width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,.9)", border: "none", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", opacity: 0, transition: "opacity .2s" }}
          onMouseEnter={e => e.target.style.opacity = 1}>+</button>
      </div>
      <p style={{ fontSize: 13, fontWeight: 500, marginBottom: 4, color: "#1a1a1a" }}>{p.name}</p>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
        <span style={{ fontSize: 15, fontWeight: 300 }}>AED {p.price_aed?.toLocaleString()}</span>
        {p.old_price_aed > p.price_aed && <span style={{ fontSize: 12, color: "#bbb", textDecoration: "line-through" }}>AED {p.old_price_aed?.toLocaleString()}</span>}
      </div>
    </div>
  );
}

// ── Footer ──
function Footer() {
  return (
    <footer style={{ padding: "60px 40px 40px", background: "#1a1a1a", color: "#888" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 40 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <span style={{ fontSize: 20 }}>🦄</span>
            <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 18, color: "#c9b99a" }}>Unicorn Furniture</span>
          </div>
          <p style={{ fontSize: 12, lineHeight: 1.6, maxWidth: 280 }}>Premium luxury furniture for Dubai homes. A First Unicorn Group company.</p>
        </div>
        <div>
          <p style={{ fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: "#555", marginBottom: 12 }}>Contact</p>
          <p style={{ fontSize: 13 }}>WhatsApp: +971 52 645 5121</p>
          <p style={{ fontSize: 13 }}>Dubai, UAE</p>
        </div>
      </div>
      <div style={{ maxWidth: 1200, margin: "40px auto 0", paddingTop: 20, borderTop: "1px solid #2a2a2a", textAlign: "center" }}>
        <p style={{ fontSize: 11, color: "#555" }}>© 2026 Unicorn Furniture · First Unicorn Group · Dubai, UAE</p>
      </div>
    </footer>
  );
}

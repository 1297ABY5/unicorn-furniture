#!/usr/bin/env python3
"""
UNICORN FURNITURE — AUTOMATED SITE GENERATOR
=============================================
Reads product data from Excel spreadsheet → Generates complete React storefront.

Usage:
  python generate_site.py unicorn-furniture-products.xlsx output/unicorn-furniture.jsx

Pipeline:
  1. Fill spreadsheet with products + image URLs
  2. Run this script
  3. Push output to GitHub → Vercel auto-deploys
  4. Add new products → re-run → auto-updates
"""

import json
import sys
import pandas as pd
from pathlib import Path

def read_products(xlsx_path):
    df = pd.read_excel(xlsx_path, sheet_name="Products", header=0, skiprows=[1])
    df = df[df['active'].astype(str).str.upper() == 'YES'] if 'active' in df.columns else df
    
    products = []
    for _, row in df.iterrows():
        images = []
        for i in range(1, 5):
            col = f'image_url_{i}'
            if col in row and pd.notna(row[col]) and str(row[col]).startswith('http'):
                images.append(str(row[col]))
        
        colors = [c.strip() for c in str(row.get('colors', '')).split(',') if c.strip()] if pd.notna(row.get('colors')) else []
        sizes = [s.strip() for s in str(row.get('sizes', '')).split(',') if s.strip()] if pd.notna(row.get('sizes')) else []
        
        products.append({
            'id': str(row.get('product_id', f'P{len(products)+1}')),
            'name': str(row.get('name', 'Untitled')),
            'category': str(row.get('category', 'uncategorized')).lower().replace(' & ', '-').replace(' ', '-'),
            'price': int(row.get('price_aed', 0)),
            'oldPrice': int(row['old_price_aed']) if pd.notna(row.get('old_price_aed')) and row.get('old_price_aed') else None,
            'badge': str(row.get('badge', '')) if pd.notna(row.get('badge')) else None,
            'description': str(row.get('description', '')) if pd.notna(row.get('description')) else '',
            'colors': colors,
            'sizes': sizes,
            'images': images,
            'featured': str(row.get('featured', 'NO')).upper() == 'YES',
            'deliveryDays': int(row.get('delivery_days', 14)) if pd.notna(row.get('delivery_days')) else 14,
        })
    
    return products

def read_categories(xlsx_path):
    try:
        df = pd.read_excel(xlsx_path, sheet_name="Categories")
        cats = []
        for _, row in df.iterrows():
            cats.append({
                'id': str(row.get('category_id', '')),
                'name': str(row.get('name', '')),
                'image': str(row.get('image_url', '')) if pd.notna(row.get('image_url')) else '',
                'description': str(row.get('description', '')) if pd.notna(row.get('description')) else '',
            })
        return cats
    except Exception:
        return []

# Fallback images by category for products without images
FALLBACK_IMAGES = {
    'beds': 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=600&q=80',
    'sofas': 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&q=80',
    'sofas---couches': 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&q=80',
    'dining': 'https://images.unsplash.com/photo-1617806118233-18e1de247200?w=600&q=80',
    'wardrobes': 'https://images.unsplash.com/photo-1558997519-83ea9252edf8?w=600&q=80',
    'chairs': 'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=600&q=80',
    'accent-chairs': 'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=600&q=80',
    'tables': 'https://images.unsplash.com/photo-1532372576444-dda954194ad0?w=600&q=80',
    'coffee-tables': 'https://images.unsplash.com/photo-1532372576444-dda954194ad0?w=600&q=80',
    'tv': 'https://images.unsplash.com/photo-1593062096033-9a26b09da705?w=600&q=80',
    'tv-cabinets': 'https://images.unsplash.com/photo-1593062096033-9a26b09da705?w=600&q=80',
    'nightstands': 'https://images.unsplash.com/photo-1551298370-9d3d53740c72?w=600&q=80',
    'dressing': 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=600&q=80',
    'mattress': 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600&q=80',
    'ottoman': 'https://images.unsplash.com/photo-1519643381401-22c77e60520e?w=600&q=80',
    'chaise': 'https://images.unsplash.com/photo-1519643381401-22c77e60520e?w=600&q=80',
}

CATEGORY_IMAGES = {
    'beds': 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800&q=80',
    'sofas': 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&q=80',
    'sofas---couches': 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&q=80',
    'dining': 'https://images.unsplash.com/photo-1617806118233-18e1de247200?w=800&q=80',
    'wardrobes': 'https://images.unsplash.com/photo-1558997519-83ea9252edf8?w=800&q=80',
    'chairs': 'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=800&q=80',
    'accent-chairs': 'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=800&q=80',
    'tables': 'https://images.unsplash.com/photo-1532372576444-dda954194ad0?w=800&q=80',
    'coffee-tables': 'https://images.unsplash.com/photo-1532372576444-dda954194ad0?w=800&q=80',
    'tv': 'https://images.unsplash.com/photo-1593062096033-9a26b09da705?w=800&q=80',
    'tv-cabinets': 'https://images.unsplash.com/photo-1593062096033-9a26b09da705?w=800&q=80',
    'nightstands': 'https://images.unsplash.com/photo-1551298370-9d3d53740c72?w=800&q=80',
}

def generate_jsx(products, categories, whatsapp="971526455121"):
    """Generate complete React JSX from product data."""
    
    # Assign fallback images
    for p in products:
        if not p['images']:
            fallback = FALLBACK_IMAGES.get(p['category'], 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=600&q=80')
            p['images'] = [fallback]
    
    # Build category list from products if not provided
    if not categories:
        cat_ids = list(dict.fromkeys([p['category'] for p in products]))
        categories = [{'id': cid, 'name': cid.replace('-', ' ').title(), 'image': CATEGORY_IMAGES.get(cid, ''), 'description': ''} for cid in cat_ids]
    
    # Count products per category
    for cat in categories:
        cat['count'] = len([p for p in products if p['category'] == cat['id']])
        if not cat.get('image'):
            cat['image'] = CATEGORY_IMAGES.get(cat['id'], '')
    
    # Filter to categories that have products
    categories = [c for c in categories if c['count'] > 0]
    
    products_json = json.dumps(products, indent=2)
    categories_json = json.dumps(categories, indent=2)
    
    return f'''// ═══════════════════════════════════════════════════════════════
// UNICORN FURNITURE — Auto-generated from product spreadsheet
// Generated by: generate_site.py
// Products: {len(products)} | Categories: {len(categories)}
// ═══════════════════════════════════════════════════════════════

import {{ useState, useEffect, useRef }} from "react";

const WHATSAPP = "{whatsapp}";
const PRODUCTS = {products_json};
const CATEGORIES = {categories_json};

/* ─── Full component code follows (same architecture as handcrafted version) ─── */
/* The complete storefront component with all pages and interactions */

function Header({{ cart, wishlist, onNav, view }}) {{
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  useEffect(() => {{
    const el = document.querySelector("[data-sc]");
    if (!el) return;
    const h = () => setScrolled(el.scrollTop > 40);
    el.addEventListener("scroll", h);
    return () => el.removeEventListener("scroll", h);
  }}, []);

  const filteredProducts = searchQuery.length > 1 
    ? PRODUCTS.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : [];

  return (
    <>
      <div style={{{{ background:"#1a1a1a", color:"#c9b99a", textAlign:"center", padding:"8px 20px", fontSize:"12px", letterSpacing:"2px", fontFamily:"'DM Sans',sans-serif", textTransform:"uppercase" }}}}>
        Free delivery across Dubai · Ramadan Collection Now Live
      </div>
      <header style={{{{ position:"sticky", top:0, zIndex:100, background: scrolled ? "rgba(252,250,247,0.95)" : "#fcfaf7", backdropFilter: scrolled ? "blur(20px)" : "none", borderBottom:"1px solid rgba(0,0,0,0.06)", transition:"all 0.4s cubic-bezier(0.16,1,0.3,1)", boxShadow: scrolled ? "0 4px 30px rgba(0,0,0,0.04)" : "none" }}}}>
        <div style={{{{ maxWidth:1400, margin:"0 auto", padding:"0 40px", display:"flex", alignItems:"center", justifyContent:"space-between", height: scrolled ? 64 : 80, transition:"height 0.4s" }}}}>
          <nav style={{{{ display:"flex", gap:32, flex:1 }}}}>
            {{["Shop","Collections"].map(i => (
              <span key={{i}} onClick={{() => onNav("shop")}} style={{{{ fontFamily:"'DM Sans',sans-serif", fontSize:13, letterSpacing:"1.5px", textTransform:"uppercase", cursor:"pointer", color:"#1a1a1a", borderBottom: view==="shop" && i==="Shop" ? "2px solid #c9b99a" : "2px solid transparent", paddingBottom:2 }}}}>{{}}</span>
            ))}}
          </nav>
          <div onClick={{() => onNav("home")}} style={{{{ cursor:"pointer", textAlign:"center", flex:1 }}}}>
            <div style={{{{ fontFamily:"'Cormorant Garamond',serif", fontSize: scrolled ? 22 : 28, fontWeight:300, letterSpacing:"6px", textTransform:"uppercase", color:"#1a1a1a", transition:"font-size 0.4s", lineHeight:1 }}}}>Unicorn</div>
            <div style={{{{ fontFamily:"'DM Sans',sans-serif", fontSize:9, letterSpacing:"4px", textTransform:"uppercase", color:"#999", marginTop:2 }}}}>Furniture · Dubai</div>
          </div>
          <div style={{{{ display:"flex", gap:24, alignItems:"center", justifyContent:"flex-end", flex:1 }}}}>
            <button onClick={{() => setSearchOpen(!searchOpen)}} style={{{{ background:"none", border:"none", cursor:"pointer", color:"#1a1a1a" }}}}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            </button>
            <button onClick={{() => onNav("wishlist")}} style={{{{ background:"none", border:"none", cursor:"pointer", color:"#1a1a1a", position:"relative" }}}}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
              {{wishlist.length > 0 && <span style={{{{ position:"absolute", top:-6, right:-8, background:"#c9b99a", color:"#fff", borderRadius:"50%", width:16, height:16, fontSize:10, display:"flex", alignItems:"center", justifyContent:"center" }}}}>{{}}</span>}}
            </button>
            <button onClick={{() => onNav("cart")}} style={{{{ background:"none", border:"none", cursor:"pointer", color:"#1a1a1a", position:"relative" }}}}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0"/></svg>
              {{cart.length > 0 && <span style={{{{ position:"absolute", top:-6, right:-8, background:"#1a1a1a", color:"#fff", borderRadius:"50%", width:16, height:16, fontSize:10, display:"flex", alignItems:"center", justifyContent:"center" }}}}>{{}}</span>}}
            </button>
          </div>
        </div>
        {{searchOpen && (
          <div style={{{{ padding:"0 40px 16px", maxWidth:1400, margin:"0 auto", position:"relative" }}}}>
            <input value={{searchQuery}} onChange={{e => setSearchQuery(e.target.value)}} placeholder="Search furniture..." autoFocus style={{{{ width:"100%", padding:"14px 20px", border:"1px solid #e0dcd5", fontFamily:"'DM Sans',sans-serif", fontSize:14, background:"#fff", outline:"none" }}}} />
            {{filteredProducts.length > 0 && (
              <div style={{{{ position:"absolute", top:"100%", left:40, right:40, background:"#fff", border:"1px solid #e0dcd5", maxHeight:300, overflow:"auto", zIndex:200 }}}}>
                {{filteredProducts.slice(0,5).map(p => (
                  <div key={{p.id}} onClick={{() => {{ onNav("product", p.id); setSearchOpen(false); setSearchQuery(""); }}}} style={{{{ padding:"12px 20px", cursor:"pointer", borderBottom:"1px solid #f0f0f0", display:"flex", gap:12, alignItems:"center" }}}}>
                    <img src={{p.images[0]}} style={{{{ width:40, height:40, objectFit:"cover" }}}} />
                    <div>
                      <div style={{{{ fontFamily:"'DM Sans',sans-serif", fontSize:13 }}}}>{{}}</div>
                      <div style={{{{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:"#999" }}}}>AED {{}}</div>
                    </div>
                  </div>
                ))}}
              </div>
            )}}
          </div>
        )}}
      </header>
    </>
  );
}}

function Hero({{ onNav }}) {{
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {{ setTimeout(() => setLoaded(true), 100); }}, []);
  return (
    <div style={{{{ position:"relative", height:"85vh", minHeight:500, maxHeight:800, overflow:"hidden", background:"#1a1a1a" }}}}>
      <div style={{{{ position:"absolute", inset:0, backgroundImage:"url(https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1600&q=80)", backgroundSize:"cover", backgroundPosition:"center", opacity: loaded ? 0.6 : 0, transform: loaded ? "scale(1)" : "scale(1.1)", transition:"all 1.8s cubic-bezier(0.16,1,0.3,1)" }}}} />
      <div style={{{{ position:"absolute", inset:0, background:"linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(0,0,0,0.5))" }}}} />
      <div style={{{{ position:"relative", zIndex:2, height:"100%", display:"flex", flexDirection:"column", justifyContent:"center", alignItems:"center", textAlign:"center", padding:"0 20px" }}}}>
        <div style={{{{ fontFamily:"'DM Sans',sans-serif", fontSize:11, letterSpacing:"5px", textTransform:"uppercase", color:"#c9b99a", marginBottom:24, opacity: loaded ? 1 : 0, transition:"all 1s 0.3s" }}}}>Ramadan Collection 2026</div>
        <h1 style={{{{ fontFamily:"'Cormorant Garamond',serif", fontSize:"clamp(36px,7vw,80px)", fontWeight:300, color:"#fff", lineHeight:1.1, maxWidth:800, margin:"0 0 24px", letterSpacing:"2px", opacity: loaded ? 1 : 0, transition:"all 1s 0.5s" }}}}>Furniture That<br/>Speaks Luxury</h1>
        <p style={{{{ fontFamily:"'DM Sans',sans-serif", fontSize:15, color:"rgba(255,255,255,0.7)", maxWidth:480, lineHeight:1.7, margin:"0 0 40px", opacity: loaded ? 1 : 0, transition:"all 1s 0.7s" }}}}>Handcrafted pieces designed for Dubai's finest homes.<br/>Direct from our workshop to your villa.</p>
        <div style={{{{ display:"flex", gap:16, flexWrap:"wrap", justifyContent:"center", opacity: loaded ? 1 : 0, transition:"all 1s 0.9s" }}}}>
          <button onClick={{() => onNav("shop")}} style={{{{ fontFamily:"'DM Sans',sans-serif", fontSize:12, letterSpacing:"3px", textTransform:"uppercase", background:"#c9b99a", color:"#1a1a1a", border:"none", padding:"16px 48px", cursor:"pointer" }}}}>Shop Collection</button>
          <button onClick={{() => window.open("https://wa.me/"+WHATSAPP, "_blank")}} style={{{{ fontFamily:"'DM Sans',sans-serif", fontSize:12, letterSpacing:"3px", textTransform:"uppercase", background:"transparent", color:"#fff", border:"1px solid rgba(255,255,255,0.4)", padding:"16px 48px", cursor:"pointer" }}}}>WhatsApp Us</button>
        </div>
      </div>
    </div>
  );
}}

function ProductCard({{ product: p, onCart, onWish, wished, onNav }}) {{
  const [hov, setHov] = useState(false);
  const disc = p.oldPrice ? Math.round((1 - p.price / p.oldPrice) * 100) : null;
  return (
    <div onMouseOver={{() => setHov(true)}} onMouseOut={{() => setHov(false)}} style={{{{ position:"relative", cursor:"pointer" }}}}>
      <div onClick={{() => onNav("product", p.id)}} style={{{{ position:"relative", paddingTop:"120%", overflow:"hidden", background:"#f0ede8", marginBottom:16 }}}}>
        <img src={{p.images[0]}} alt={{p.name}} style={{{{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover", transition:"transform 0.8s", transform: hov ? "scale(1.05)" : "scale(1)" }}}} />
        {{p.badge && <span style={{{{ position:"absolute", top:12, left:12, background: p.badge==="Sale" ? "#c9b99a" : "#1a1a1a", color:"#fff", fontFamily:"'DM Sans',sans-serif", fontSize:10, letterSpacing:"1.5px", textTransform:"uppercase", padding:"5px 12px" }}}}>{{}}</span>}}
        <div style={{{{ position:"absolute", bottom:12, left:12, right:12, display:"flex", gap:8, justifyContent:"center", opacity: hov ? 1 : 0, transform: hov ? "translateY(0)" : "translateY(10px)", transition:"all 0.3s" }}}}>
          <button onClick={{e => {{ e.stopPropagation(); onCart(p); }}}} style={{{{ flex:1, padding:"12px", background:"rgba(26,26,26,0.9)", color:"#fff", border:"none", fontFamily:"'DM Sans',sans-serif", fontSize:11, letterSpacing:"2px", textTransform:"uppercase", cursor:"pointer" }}}}>Add to Cart</button>
          <button onClick={{e => {{ e.stopPropagation(); onWish(p.id); }}}} style={{{{ padding:"12px 14px", background:"rgba(252,250,247,0.9)", border:"none", cursor:"pointer", fontSize:16 }}}}>{{}}</button>
        </div>
      </div>
      <div onClick={{() => onNav("product", p.id)}}>
        <div style={{{{ fontFamily:"'Cormorant Garamond',serif", fontSize:18, fontWeight:500, color:"#1a1a1a", marginBottom:6, lineHeight:1.3 }}}}>{{}}</div>
        <div style={{{{ display:"flex", gap:8, alignItems:"center" }}}}>
          <span style={{{{ fontFamily:"'DM Sans',sans-serif", fontSize:15, fontWeight:600, color:"#1a1a1a" }}}}>AED {{}}</span>
          {{p.oldPrice && <span style={{{{ fontFamily:"'DM Sans',sans-serif", fontSize:13, color:"#999", textDecoration:"line-through" }}}}>AED {{}}</span>}}
        </div>
        {{p.colors.length > 0 && <div style={{{{ display:"flex", gap:6, marginTop:8, flexWrap:"wrap" }}}}>{{p.colors.map(c => <span key={{c}} style={{{{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:"#777", background:"#f5f3ef", padding:"3px 8px" }}}}>{{}}</span>)}}</div>}}
      </div>
    </div>
  );
}}

function Shop({{ filter, onCart, onWish, wishlist, onNav }}) {{
  const [cat, setCat] = useState(filter || "all");
  const [sort, setSort] = useState("featured");
  let prods = cat === "all" ? PRODUCTS : PRODUCTS.filter(p => p.category === cat);
  if (sort === "low") prods = [...prods].sort((a,b) => a.price - b.price);
  if (sort === "high") prods = [...prods].sort((a,b) => b.price - a.price);
  
  return (
    <section style={{{{ maxWidth:1400, margin:"0 auto", padding:"48px 40px" }}}}>
      <div style={{{{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:40, flexWrap:"wrap", gap:16 }}}}>
        <h1 style={{{{ fontFamily:"'Cormorant Garamond',serif", fontSize:42, fontWeight:300, color:"#1a1a1a", margin:0 }}}}>
          {{cat === "all" ? "All Pieces" : CATEGORIES.find(c => c.id === cat)?.name || "Shop"}}
        </h1>
        <select value={{sort}} onChange={{e => setSort(e.target.value)}} style={{{{ fontFamily:"'DM Sans',sans-serif", fontSize:12, padding:"10px 16px", border:"1px solid #e0dcd5", background:"#fff" }}}}>
          <option value="featured">Featured</option>
          <option value="low">Price: Low to High</option>
          <option value="high">Price: High to Low</option>
        </select>
      </div>
      <div style={{{{ display:"flex", gap:8, marginBottom:40, overflowX:"auto", paddingBottom:8 }}}}>
        <button onClick={{() => setCat("all")}} style={{{{ fontFamily:"'DM Sans',sans-serif", fontSize:11, letterSpacing:"1.5px", textTransform:"uppercase", padding:"10px 20px", border:"1px solid", cursor:"pointer", whiteSpace:"nowrap", background: cat==="all" ? "#1a1a1a" : "transparent", color: cat==="all" ? "#fff" : "#1a1a1a", borderColor: cat==="all" ? "#1a1a1a" : "#ddd" }}}}>All</button>
        {{CATEGORIES.map(c => <button key={{c.id}} onClick={{() => setCat(c.id)}} style={{{{ fontFamily:"'DM Sans',sans-serif", fontSize:11, letterSpacing:"1.5px", textTransform:"uppercase", padding:"10px 20px", border:"1px solid", cursor:"pointer", whiteSpace:"nowrap", background: cat===c.id ? "#1a1a1a" : "transparent", color: cat===c.id ? "#fff" : "#1a1a1a", borderColor: cat===c.id ? "#1a1a1a" : "#ddd" }}}}>{{}}</button>)}}
      </div>
      <div style={{{{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(280px, 1fr))", gap:32 }}}}>
        {{prods.map(p => <ProductCard key={{p.id}} product={{p}} onCart={{onCart}} onWish={{onWish}} wished={{wishlist.includes(p.id)}} onNav={{onNav}} />)}}
      </div>
      {{prods.length === 0 && <div style={{{{ textAlign:"center", padding:"80px 0", color:"#999", fontFamily:"'DM Sans',sans-serif" }}}}>No products yet. Coming soon.</div>}}
    </section>
  );
}}

function Detail({{ pid, onCart, onWish, wishlist, onNav }}) {{
  const p = PRODUCTS.find(x => x.id === pid);
  const [ci, setCi] = useState(0);
  const [si, setSi] = useState(0);
  const [qty, setQty] = useState(1);
  const [imgIdx, setImgIdx] = useState(0);
  if (!p) return <div style={{{{ padding:80, textAlign:"center" }}}}>Product not found</div>;
  const related = PRODUCTS.filter(x => x.category === p.category && x.id !== p.id).slice(0,3);
  
  return (
    <section style={{{{ maxWidth:1400, margin:"0 auto", padding:"48px 40px" }}}}>
      <div style={{{{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:"#999", marginBottom:32 }}}}>
        <span onClick={{() => onNav("home")}} style={{{{ cursor:"pointer" }}}}>Home</span> / <span onClick={{() => onNav("shop")}} style={{{{ cursor:"pointer" }}}}>Shop</span> / <span style={{{{ color:"#1a1a1a" }}}}>{{}}</span>
      </div>
      <div style={{{{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:64, marginBottom:80 }}}}>
        <div>
          <div style={{{{ position:"relative", paddingTop:"100%", overflow:"hidden", background:"#f0ede8", marginBottom:12 }}}}>
            <img src={{p.images[imgIdx] || p.images[0]}} alt={{p.name}} style={{{{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover" }}}} />
          </div>
          {{p.images.length > 1 && <div style={{{{ display:"flex", gap:8 }}}}>{{p.images.map((img, i) => <div key={{i}} onClick={{() => setImgIdx(i)}} style={{{{ width:72, height:72, overflow:"hidden", border: imgIdx===i ? "2px solid #1a1a1a" : "1px solid #ddd", cursor:"pointer" }}}}><img src={{img}} style={{{{ width:"100%", height:"100%", objectFit:"cover" }}}} /></div>)}}</div>}}
        </div>
        <div style={{{{ display:"flex", flexDirection:"column", justifyContent:"center" }}}}>
          <h1 style={{{{ fontFamily:"'Cormorant Garamond',serif", fontSize:36, fontWeight:400, color:"#1a1a1a", margin:"0 0 16px", lineHeight:1.2 }}}}>{{}}</h1>
          <div style={{{{ display:"flex", gap:12, alignItems:"center", marginBottom:24 }}}}>
            <span style={{{{ fontFamily:"'DM Sans',sans-serif", fontSize:28, fontWeight:600, color:"#1a1a1a" }}}}>AED {{}}</span>
            {{p.oldPrice && <span style={{{{ fontFamily:"'DM Sans',sans-serif", fontSize:18, color:"#999", textDecoration:"line-through" }}}}>AED {{}}</span>}}
          </div>
          {{p.description && <p style={{{{ fontFamily:"'DM Sans',sans-serif", fontSize:14, color:"#666", lineHeight:1.7, marginBottom:32 }}}}>{{}}</p>}}
          {{p.colors.length > 0 && <div style={{{{ marginBottom:24 }}}}>
            <div style={{{{ fontFamily:"'DM Sans',sans-serif", fontSize:12, fontWeight:600, letterSpacing:"1.5px", textTransform:"uppercase", marginBottom:10 }}}}>Colour: {{}}</div>
            <div style={{{{ display:"flex", gap:8 }}}}>{{p.colors.map((c,i) => <button key={{c}} onClick={{() => setCi(i)}} style={{{{ fontFamily:"'DM Sans',sans-serif", fontSize:12, padding:"10px 20px", border: ci===i ? "2px solid #1a1a1a" : "1px solid #ddd", background:"#fff", cursor:"pointer" }}}}>{{}}</button>)}}</div>
          </div>}}
          {{p.sizes.length > 0 && <div style={{{{ marginBottom:32 }}}}>
            <div style={{{{ fontFamily:"'DM Sans',sans-serif", fontSize:12, fontWeight:600, letterSpacing:"1.5px", textTransform:"uppercase", marginBottom:10 }}}}>Size: {{}}</div>
            <div style={{{{ display:"flex", gap:8 }}}}>{{p.sizes.map((s,i) => <button key={{s}} onClick={{() => setSi(i)}} style={{{{ fontFamily:"'DM Sans',sans-serif", fontSize:12, padding:"10px 20px", border: si===i ? "2px solid #1a1a1a" : "1px solid #ddd", background:"#fff", cursor:"pointer" }}}}>{{}}</button>)}}</div>
          </div>}}
          <div style={{{{ display:"flex", gap:12, marginBottom:16 }}}}>
            <div style={{{{ display:"flex", border:"1px solid #ddd" }}}}>
              <button onClick={{() => setQty(Math.max(1,qty-1))}} style={{{{ width:44, height:50, border:"none", background:"#fff", cursor:"pointer", fontSize:18 }}}}>−</button>
              <div style={{{{ width:44, height:50, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'DM Sans',sans-serif", fontSize:14, borderLeft:"1px solid #ddd", borderRight:"1px solid #ddd" }}}}>{{}}</div>
              <button onClick={{() => setQty(qty+1)}} style={{{{ width:44, height:50, border:"none", background:"#fff", cursor:"pointer", fontSize:18 }}}}>+</button>
            </div>
            <button onClick={{() => onCart({{...p, qty, color: p.colors[ci], size: p.sizes[si]}})}} style={{{{ flex:1, fontFamily:"'DM Sans',sans-serif", fontSize:12, letterSpacing:"3px", textTransform:"uppercase", background:"#1a1a1a", color:"#fff", border:"none", cursor:"pointer" }}}}>Add to Cart — AED {{}}</button>
          </div>
          <div style={{{{ marginTop:24, padding:20, background:"#f5f3ef", display:"flex", gap:12, alignItems:"center" }}}}>
            <span style={{{{ fontSize:20 }}}}>💬</span>
            <div>
              <div style={{{{ fontFamily:"'DM Sans',sans-serif", fontSize:13, fontWeight:600 }}}}>Need help?</div>
              <span onClick={{() => window.open("https://wa.me/"+WHATSAPP+"?text=Hi, question about "+p.name, "_blank")}} style={{{{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:"#4a6741", cursor:"pointer", textDecoration:"underline" }}}}>WhatsApp our team</span>
            </div>
          </div>
          <div style={{{{ marginTop:16, fontFamily:"'DM Sans',sans-serif", fontSize:12, color:"#888" }}}}>Estimated delivery: {{p.deliveryDays}} working days</div>
        </div>
      </div>
      {{related.length > 0 && <>
        <h3 style={{{{ fontFamily:"'Cormorant Garamond',serif", fontSize:32, fontWeight:300, marginBottom:32 }}}}>You May Also Like</h3>
        <div style={{{{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(280px, 1fr))", gap:32 }}}}>{{related.map(r => <ProductCard key={{r.id}} product={{r}} onCart={{onCart}} onWish={{onWish}} wished={{wishlist.includes(r.id)}} onNav={{onNav}} />)}}</div>
      </>}}
    </section>
  );
}}

function Cart({{ cart, setCart, onNav }}) {{
  const total = cart.reduce((s,i) => s + i.price * i.qty, 0);
  return (
    <section style={{{{ maxWidth:1000, margin:"0 auto", padding:"48px 40px" }}}}>
      <h1 style={{{{ fontFamily:"'Cormorant Garamond',serif", fontSize:42, fontWeight:300, marginBottom:48 }}}}>Your Cart</h1>
      {{cart.length === 0 ? (
        <div style={{{{ textAlign:"center", padding:"80px 0" }}}}>
          <div style={{{{ fontSize:48, marginBottom:16 }}}}>🛍️</div>
          <p style={{{{ fontFamily:"'DM Sans',sans-serif", color:"#999", marginBottom:24 }}}}>Your cart is empty</p>
          <button onClick={{() => onNav("shop")}} style={{{{ fontFamily:"'DM Sans',sans-serif", fontSize:12, letterSpacing:"3px", textTransform:"uppercase", background:"#1a1a1a", color:"#fff", border:"none", padding:"16px 48px", cursor:"pointer" }}}}>Continue Shopping</button>
        </div>
      ) : <>
        {{cart.map((item,i) => (
          <div key={{i}} style={{{{ display:"flex", gap:24, padding:"24px 0", borderBottom:"1px solid #eee", alignItems:"center" }}}}>
            <img src={{item.images?.[0] || item.image}} style={{{{ width:100, height:100, objectFit:"cover" }}}} />
            <div style={{{{ flex:1 }}}}>
              <div style={{{{ fontFamily:"'Cormorant Garamond',serif", fontSize:18, fontWeight:500 }}}}>{{}}</div>
              <div style={{{{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:"#999", marginTop:4 }}}}>{{item.color}} {{item.size && `· ${{item.size}}`}}</div>
            </div>
            <div style={{{{ display:"flex", border:"1px solid #ddd" }}}}>
              <button onClick={{() => setCart(cart.map((x,j) => j===i ? {{...x, qty: Math.max(1,x.qty-1)}} : x))}} style={{{{ width:32, height:32, border:"none", background:"#fff", cursor:"pointer" }}}}>−</button>
              <span style={{{{ width:32, height:32, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'DM Sans',sans-serif", fontSize:13 }}}}>{{}}</span>
              <button onClick={{() => setCart(cart.map((x,j) => j===i ? {{...x, qty: x.qty+1}} : x))}} style={{{{ width:32, height:32, border:"none", background:"#fff", cursor:"pointer" }}}}>+</button>
            </div>
            <div style={{{{ fontFamily:"'DM Sans',sans-serif", fontSize:15, fontWeight:600, minWidth:100, textAlign:"right" }}}}>AED {{}}</div>
            <button onClick={{() => setCart(cart.filter((_,j) => j!==i))}} style={{{{ background:"none", border:"none", cursor:"pointer", color:"#999", fontSize:18 }}}}>×</button>
          </div>
        ))}}
        <div style={{{{ padding:"32px 0", borderTop:"2px solid #1a1a1a", marginTop:24 }}}}>
          <div style={{{{ display:"flex", justifyContent:"space-between", marginBottom:24 }}}}>
            <span style={{{{ fontFamily:"'Cormorant Garamond',serif", fontSize:22, fontWeight:500 }}}}>Total</span>
            <span style={{{{ fontFamily:"'DM Sans',sans-serif", fontSize:22, fontWeight:700 }}}}>AED {{}}</span>
          </div>
          <button onClick={{() => window.open("https://wa.me/"+WHATSAPP+"?text=Hi, I'd like to order:%0A%0A"+cart.map(i => `• ${{i.name}} (${{i.qty}}x) - AED ${{(i.price*i.qty).toLocaleString()}}`).join("%0A")+"%0A%0ATotal: AED "+total.toLocaleString(), "_blank")}} style={{{{ width:"100%", padding:18, fontFamily:"'DM Sans',sans-serif", fontSize:13, letterSpacing:"3px", textTransform:"uppercase", background:"#25D366", color:"#fff", border:"none", cursor:"pointer", marginBottom:12 }}}}>Order via WhatsApp</button>
        </div>
      </>}}
    </section>
  );
}}

function Footer({{ onNav }}) {{
  return (
    <footer style={{{{ background:"#1a1a1a", color:"#fff", padding:"64px 40px 32px" }}}}>
      <div style={{{{ maxWidth:1400, margin:"0 auto", display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(200px, 1fr))", gap:48 }}}}>
        <div>
          <div style={{{{ fontFamily:"'Cormorant Garamond',serif", fontSize:28, fontWeight:300, letterSpacing:"4px", marginBottom:16 }}}}>UNICORN</div>
          <p style={{{{ fontFamily:"'DM Sans',sans-serif", fontSize:13, color:"rgba(255,255,255,0.5)", lineHeight:1.7 }}}}>Premium furniture for Dubai's finest homes. A First Unicorn Group company.</p>
        </div>
        <div>
          <div style={{{{ fontFamily:"'DM Sans',sans-serif", fontSize:11, letterSpacing:"2px", textTransform:"uppercase", color:"#c9b99a", marginBottom:16 }}}}>Contact</div>
          <div onClick={{() => window.open("https://wa.me/"+WHATSAPP, "_blank")}} style={{{{ fontFamily:"'DM Sans',sans-serif", fontSize:13, color:"#25D366", cursor:"pointer", marginBottom:10 }}}}>WhatsApp: +971 52 645 5121</div>
          <div style={{{{ fontFamily:"'DM Sans',sans-serif", fontSize:13, color:"rgba(255,255,255,0.5)" }}}}>Dubai, UAE</div>
        </div>
      </div>
      <div style={{{{ borderTop:"1px solid rgba(255,255,255,0.1)", paddingTop:24, marginTop:48, fontFamily:"'DM Sans',sans-serif", fontSize:12, color:"rgba(255,255,255,0.3)" }}}}>© 2026 Unicorn Furniture. A First Unicorn Group company.</div>
    </footer>
  );
}}

export default function App() {{
  const [view, setView] = useState("home");
  const [data, setData] = useState(null);
  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const ref = useRef(null);
  
  const nav = (p, d=null) => {{ setView(p); setData(d); if(ref.current) ref.current.scrollTop=0; }};
  const addCart = (p) => {{
    const idx = cart.findIndex(i => i.id===p.id && i.color===p.color && i.size===p.size);
    idx >= 0 ? setCart(cart.map((i,j) => j===idx ? {{...i, qty: i.qty+(p.qty||1)}} : i)) : setCart([...cart, {{...p, qty: p.qty||1}}]);
  }};
  const toggleWish = (id) => setWishlist(w => w.includes(id) ? w.filter(x=>x!==id) : [...w, id]);

  return (
    <div data-sc ref={{ref}} style={{{{ fontFamily:"'DM Sans',sans-serif", background:"#fcfaf7", minHeight:"100vh", overflow:"auto", height:"100vh" }}}}>
      <style>{{"@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500;600;700&family=DM+Sans:wght@300;400;500;600&display=swap');"}}</style>
      <Header cart={{cart}} wishlist={{wishlist}} onNav={{nav}} view={{view}} />
      {{view==="home" && <>
        <Hero onNav={{nav}} />
        <section style={{{{ background:"#f5f3ef", padding:"48px 40px" }}}}>
          <div style={{{{ maxWidth:1400, margin:"0 auto", display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(200px, 1fr))", gap:32, textAlign:"center" }}}}>
            {{[{{ i:"🚚", t:"Free Dubai Delivery", s:"On orders over AED 500" }}, {{ i:"🔧", t:"Free Assembly", s:"Professional setup" }}, {{ i:"🛡️", t:"2-Year Warranty", s:"On all furniture" }}, {{ i:"💬", t:"WhatsApp Support", s:"Instant response" }}].map(x => <div key={{x.t}}><div style={{{{ fontSize:28, marginBottom:8 }}}}>{{}}</div><div style={{{{ fontFamily:"'DM Sans',sans-serif", fontSize:13, fontWeight:600, letterSpacing:"1px", marginBottom:4 }}}}>{{}}</div><div style={{{{ fontSize:12, color:"#888" }}}}>{{}}</div></div>)}}
          </div>
        </section>
        <section style={{{{ maxWidth:1400, margin:"0 auto", padding:"80px 40px" }}}}>
          <div style={{{{ textAlign:"center", marginBottom:48 }}}}>
            <div style={{{{ fontFamily:"'DM Sans',sans-serif", fontSize:11, letterSpacing:"4px", textTransform:"uppercase", color:"#c9b99a", marginBottom:12 }}}}>Browse</div>
            <h2 style={{{{ fontFamily:"'Cormorant Garamond',serif", fontSize:42, fontWeight:300, margin:0 }}}}>Our Collections</h2>
          </div>
          <div style={{{{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(280px, 1fr))", gap:16 }}}}>
            {{CATEGORIES.map(c => <div key={{c.id}} onClick={{() => nav("shop", c.id)}} style={{{{ position:"relative", height:280, overflow:"hidden", cursor:"pointer", background:"#f0ede8" }}}}>
              <div style={{{{ position:"absolute", inset:0, backgroundImage:`url(${{c.image}})`, backgroundSize:"cover", backgroundPosition:"center", transition:"transform 0.8s" }}}} onMouseOver={{e => e.target.style.transform="scale(1.08)"}} onMouseOut={{e => e.target.style.transform="scale(1)"}} />
              <div style={{{{ position:"absolute", inset:0, background:"linear-gradient(to top, rgba(0,0,0,0.6), rgba(0,0,0,0.1) 60%)" }}}} />
              <div style={{{{ position:"absolute", bottom:24, left:24, right:24 }}}}>
                <div style={{{{ fontFamily:"'Cormorant Garamond',serif", fontSize:24, fontWeight:400, color:"#fff", marginBottom:4 }}}}>{{}}</div>
                <div style={{{{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:"rgba(255,255,255,0.7)", letterSpacing:"1px" }}}}>{{c.count}} pieces</div>
              </div>
            </div>)}}
          </div>
        </section>
        {{(() => {{ const feat = PRODUCTS.filter(p => p.featured); return feat.length > 0 ? (
          <section style={{{{ background:"#fff", padding:"80px 0" }}}}>
            <div style={{{{ maxWidth:1400, margin:"0 auto", padding:"0 40px" }}}}>
              <h2 style={{{{ fontFamily:"'Cormorant Garamond',serif", fontSize:42, fontWeight:300, marginBottom:48 }}}}>Featured Pieces</h2>
              <div style={{{{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(280px, 1fr))", gap:32 }}}}>
                {{feat.map(p => <ProductCard key={{p.id}} product={{p}} onCart={{addCart}} onWish={{toggleWish}} wished={{wishlist.includes(p.id)}} onNav={{nav}} />)}}
              </div>
            </div>
          </section>
        ) : null; }})()}}
      </>}}
      {{view==="shop" && <Shop filter={{data}} onCart={{addCart}} onWish={{toggleWish}} wishlist={{wishlist}} onNav={{nav}} />}}
      {{view==="product" && <Detail pid={{data}} onCart={{addCart}} onWish={{toggleWish}} wishlist={{wishlist}} onNav={{nav}} />}}
      {{view==="cart" && <Cart cart={{cart}} setCart={{setCart}} onNav={{nav}} />}}
      {{view==="wishlist" && <section style={{{{ maxWidth:1400, margin:"0 auto", padding:"48px 40px" }}}}>
        <h1 style={{{{ fontFamily:"'Cormorant Garamond',serif", fontSize:42, fontWeight:300, marginBottom:48 }}}}>Wishlist</h1>
        {{wishlist.length === 0 ? <div style={{{{ textAlign:"center", padding:"80px 0" }}}}><p style={{{{ color:"#999" }}}}>Your wishlist is empty</p></div> :
        <div style={{{{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(280px, 1fr))", gap:32 }}}}>{{PRODUCTS.filter(p => wishlist.includes(p.id)).map(p => <ProductCard key={{p.id}} product={{p}} onCart={{addCart}} onWish={{toggleWish}} wished={{true}} onNav={{nav}} />)}}</div>}}
      </section>}}
      <Footer onNav={{nav}} />
      <div onClick={{() => window.open("https://wa.me/"+WHATSAPP, "_blank")}} style={{{{ position:"fixed", bottom:24, right:24, zIndex:999, width:56, height:56, borderRadius:"50%", background:"#25D366", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", boxShadow:"0 4px 20px rgba(37,211,102,0.4)" }}}}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="#fff"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
      </div>
    </div>
  );
}}
'''

def main():
    if len(sys.argv) < 2:
        print("Usage: python generate_site.py <products.xlsx> [output.jsx]")
        print("\\nThis reads your product spreadsheet and generates a complete React storefront.")
        sys.exit(1)
    
    xlsx_path = sys.argv[1]
    output_path = sys.argv[2] if len(sys.argv) > 2 else "unicorn-furniture-generated.jsx"
    
    print(f"📖 Reading products from {xlsx_path}...")
    products = read_products(xlsx_path)
    categories = read_categories(xlsx_path)
    
    print(f"✅ Found {len(products)} active products across {len(set(p['category'] for p in products))} categories")
    print(f"📝 Generating site...")
    
    jsx = generate_jsx(products, categories)
    
    Path(output_path).write_text(jsx)
    print(f"🚀 Site generated: {output_path}")
    print(f"\\nNext steps:")
    print(f"  1. Copy to your Vercel project")
    print(f"  2. git add . && git commit -m 'Update products' && git push")
    print(f"  3. Vercel auto-deploys in ~30 seconds")

if __name__ == "__main__":
    main()

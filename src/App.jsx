import { useState, useEffect, useRef } from "react";

// ─── DATA ───────────────────────────────────────────────────────────────
const CATEGORIES = [
  { id: "beds", name: "Beds", count: 48, icon: "🛏️", image: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800&q=80" },
  { id: "sofas", name: "Sofas & Couches", count: 64, icon: "🛋️", image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&q=80" },
  { id: "dining", name: "Dining Tables", count: 22, icon: "🍽️", image: "https://images.unsplash.com/photo-1617806118233-18e1de247200?w=800&q=80" },
  { id: "wardrobes", name: "Wardrobes", count: 18, icon: "👔", image: "https://images.unsplash.com/photo-1558997519-83ea9252edf8?w=800&q=80" },
  { id: "chairs", name: "Accent Chairs", count: 36, icon: "💺", image: "https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=800&q=80" },
  { id: "tables", name: "Coffee Tables", count: 28, icon: "☕", image: "https://images.unsplash.com/photo-1532372576444-dda954194ad0?w=800&q=80" },
  { id: "tv", name: "TV Cabinets", count: 42, icon: "📺", image: "https://images.unsplash.com/photo-1593062096033-9a26b09da705?w=800&q=80" },
  { id: "nightstands", name: "Nightstands", count: 16, icon: "🔲", image: "https://images.unsplash.com/photo-1551298370-9d3d53740c72?w=800&q=80" },
];

const PRODUCTS = [
  { id: 1, name: "Milano Velvet Platform Bed", category: "beds", price: 3499, oldPrice: 4299, image: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=600&q=80", badge: "Best Seller", colors: ["Charcoal", "Ivory", "Sage"], sizes: ["King", "Queen"], rating: 4.8, reviews: 47 },
  { id: 2, name: "Aurora Curved Headboard Bed", category: "beds", price: 4899, oldPrice: null, image: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600&q=80", badge: "New", colors: ["Cream", "Blush"], sizes: ["King", "Super King"], rating: 5.0, reviews: 12 },
  { id: 3, name: "Torino Storage Bed Frame", category: "beds", price: 2799, oldPrice: 3499, image: "https://images.unsplash.com/photo-1588046130717-0eb0c9a3ba15?w=600&q=80", badge: "Sale", colors: ["Walnut", "Oak"], sizes: ["King", "Queen"], rating: 4.6, reviews: 89 },
  { id: 4, name: "Sahara L-Shape Sectional", category: "sofas", price: 6999, oldPrice: 8499, image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&q=80", badge: "Best Seller", colors: ["Sand", "Graphite", "Ocean"], sizes: ["3-Seater", "4-Seater"], rating: 4.9, reviews: 63 },
  { id: 5, name: "Riviera Bouclé Sofa", category: "sofas", price: 5499, oldPrice: null, image: "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=600&q=80", badge: "New", colors: ["Ivory", "Taupe"], sizes: ["2-Seater", "3-Seater"], rating: 4.7, reviews: 31 },
  { id: 6, name: "Zephyr Modular Sofa", category: "sofas", price: 8999, oldPrice: 10499, image: "https://images.unsplash.com/photo-1567016432779-094069958ea5?w=600&q=80", badge: "Premium", colors: ["Olive", "Charcoal"], sizes: ["5-Piece", "7-Piece"], rating: 4.9, reviews: 22 },
  { id: 7, name: "Carrara Marble Dining Table", category: "dining", price: 7499, oldPrice: null, image: "https://images.unsplash.com/photo-1617806118233-18e1de247200?w=600&q=80", badge: "Exclusive", colors: ["White Marble", "Black Marble"], sizes: ["6-Seater", "8-Seater"], rating: 5.0, reviews: 18 },
  { id: 8, name: "Nordic Oak Dining Set", category: "dining", price: 4299, oldPrice: 5199, image: "https://images.unsplash.com/photo-1615066390971-03e4e1c36ddf?w=600&q=80", badge: "Sale", colors: ["Natural Oak", "Smoked Oak"], sizes: ["4-Seater", "6-Seater"], rating: 4.5, reviews: 55 },
  { id: 9, name: "Velvet Wing Accent Chair", category: "chairs", price: 1899, oldPrice: 2299, image: "https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=600&q=80", badge: "Sale", colors: ["Emerald", "Navy", "Blush"], sizes: ["Standard"], rating: 4.8, reviews: 74 },
  { id: 10, name: "Palazzo TV Console", category: "tv", price: 3299, oldPrice: null, image: "https://images.unsplash.com/photo-1593062096033-9a26b09da705?w=600&q=80", badge: "New", colors: ["Walnut", "White Gloss"], sizes: ["180cm", "220cm"], rating: 4.7, reviews: 29 },
  { id: 11, name: "Infinity Glass Coffee Table", category: "tables", price: 1499, oldPrice: 1899, image: "https://images.unsplash.com/photo-1532372576444-dda954194ad0?w=600&q=80", badge: "Best Seller", colors: ["Gold/Glass", "Black/Glass"], sizes: ["Standard"], rating: 4.6, reviews: 91 },
  { id: 12, name: "Maison Walk-In Wardrobe", category: "wardrobes", price: 12999, oldPrice: null, image: "https://images.unsplash.com/photo-1558997519-83ea9252edf8?w=600&q=80", badge: "Premium", colors: ["Matte White", "Smoky Grey"], sizes: ["2.4m", "3.0m", "3.6m"], rating: 5.0, reviews: 8 },
];

const WHATSAPP = "971526455121";

// ─── STYLES ─────────────────────────────────────────────────────────────
const fonts = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&display=swap');
`;

// ─── COMPONENTS ─────────────────────────────────────────────────────────

function Header({ cart, wishlist, onNavigate, currentView }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const el = document.querySelector('[data-scroll-container]');
    if (!el) return;
    const handler = () => setScrolled(el.scrollTop > 40);
    el.addEventListener('scroll', handler);
    return () => el.removeEventListener('scroll', handler);
  }, []);

  return (
    <>
      {/* Top bar */}
      <div style={{
        background: '#1a1a1a', color: '#c9b99a', textAlign: 'center',
        padding: '8px 20px', fontSize: '12px', letterSpacing: '2px',
        fontFamily: "'DM Sans', sans-serif", textTransform: 'uppercase'
      }}>
        Free delivery across Dubai · Ramadan Collection Now Live
      </div>
      
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
            {['Shop', 'Collections', 'About'].map(item => (
              <span key={item} onClick={() => {
                if (item === 'Shop') onNavigate('shop');
                if (item === 'Collections') onNavigate('shop');
              }} style={{
                fontFamily: "'DM Sans', sans-serif", fontSize: 13, letterSpacing: '1.5px',
                textTransform: 'uppercase', cursor: 'pointer', color: '#1a1a1a',
                borderBottom: (item === 'Shop' && currentView === 'shop') ? '2px solid #c9b99a' : '2px solid transparent',
                paddingBottom: 2, transition: 'all 0.3s',
              }}>{item}</span>
            ))}
          </nav>

          {/* Logo */}
          <div onClick={() => onNavigate('home')} style={{ cursor: 'pointer', textAlign: 'center', flex: 1 }}>
            <div style={{
              fontFamily: "'Cormorant Garamond', serif", fontSize: scrolled ? 22 : 28,
              fontWeight: 300, letterSpacing: '6px', textTransform: 'uppercase',
              color: '#1a1a1a', transition: 'font-size 0.4s cubic-bezier(0.16,1,0.3,1)',
              lineHeight: 1,
            }}>Unicorn</div>
            <div style={{
              fontFamily: "'DM Sans', sans-serif", fontSize: 9, letterSpacing: '4px',
              textTransform: 'uppercase', color: '#999', marginTop: 2,
            }}>Furniture · Dubai</div>
          </div>

          {/* Right actions */}
          <div style={{ display: 'flex', gap: 24, alignItems: 'center', justifyContent: 'flex-end', flex: 1 }}>
            <button onClick={() => setSearchOpen(!searchOpen)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#1a1a1a' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            </button>
            <button onClick={() => onNavigate('wishlist')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#1a1a1a', position: 'relative' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
              {wishlist.length > 0 && <span style={{ position: 'absolute', top: -6, right: -8, background: '#c9b99a', color: '#fff', borderRadius: '50%', width: 16, height: 16, fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Sans', sans-serif" }}>{wishlist.length}</span>}
            </button>
            <button onClick={() => onNavigate('cart')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#1a1a1a', position: 'relative' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0"/></svg>
              {cart.length > 0 && <span style={{ position: 'absolute', top: -6, right: -8, background: '#1a1a1a', color: '#fff', borderRadius: '50%', width: 16, height: 16, fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Sans', sans-serif" }}>{cart.reduce((a,b) => a + b.qty, 0)}</span>}
            </button>
          </div>
        </div>

        {/* Search bar */}
        {searchOpen && (
          <div style={{ padding: '0 40px 16px', maxWidth: 1400, margin: '0 auto' }}>
            <input placeholder="Search beds, sofas, tables..." autoFocus style={{
              width: '100%', padding: '14px 20px', border: '1px solid #e0dcd5',
              borderRadius: 0, fontFamily: "'DM Sans', sans-serif", fontSize: 14,
              background: '#fff', outline: 'none',
            }} />
          </div>
        )}
      </header>
    </>
  );
}

function HeroBanner({ onNavigate }) {
  const [loaded, setLoaded] = useState(false);
  useEffect(() => { setTimeout(() => setLoaded(true), 100); }, []);

  return (
    <div style={{
      position: 'relative', height: '85vh', minHeight: 500, maxHeight: 800,
      overflow: 'hidden', background: '#1a1a1a',
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'url(https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1600&q=80)',
        backgroundSize: 'cover', backgroundPosition: 'center',
        opacity: loaded ? 0.6 : 0, transform: loaded ? 'scale(1)' : 'scale(1.1)',
        transition: 'all 1.8s cubic-bezier(0.16,1,0.3,1)',
      }} />

      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.5) 100%)',
      }} />

      <div style={{
        position: 'relative', zIndex: 2, height: '100%',
        display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
        textAlign: 'center', padding: '0 20px',
      }}>
        <div style={{
          fontFamily: "'DM Sans', sans-serif", fontSize: 11, letterSpacing: '5px',
          textTransform: 'uppercase', color: '#c9b99a', marginBottom: 24,
          opacity: loaded ? 1 : 0, transform: loaded ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 1s 0.3s cubic-bezier(0.16,1,0.3,1)',
        }}>Ramadan Collection 2026</div>

        <h1 style={{
          fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(36px, 7vw, 80px)',
          fontWeight: 300, color: '#fff', lineHeight: 1.1, maxWidth: 800,
          margin: '0 0 24px', letterSpacing: '2px',
          opacity: loaded ? 1 : 0, transform: loaded ? 'translateY(0)' : 'translateY(30px)',
          transition: 'all 1s 0.5s cubic-bezier(0.16,1,0.3,1)',
        }}>
          Furniture That<br />Speaks Luxury
        </h1>

        <p style={{
          fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: 'rgba(255,255,255,0.7)',
          maxWidth: 480, lineHeight: 1.7, margin: '0 0 40px',
          opacity: loaded ? 1 : 0, transform: loaded ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 1s 0.7s cubic-bezier(0.16,1,0.3,1)',
        }}>
          Handcrafted pieces designed for Dubai's finest homes.<br />
          Direct from our workshop to your villa.
        </p>

        <div style={{
          display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center',
          opacity: loaded ? 1 : 0, transform: loaded ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 1s 0.9s cubic-bezier(0.16,1,0.3,1)',
        }}>
          <button onClick={() => onNavigate('shop')} style={{
            fontFamily: "'DM Sans', sans-serif", fontSize: 12, letterSpacing: '3px',
            textTransform: 'uppercase', background: '#c9b99a', color: '#1a1a1a',
            border: 'none', padding: '16px 48px', cursor: 'pointer',
            transition: 'all 0.3s', fontWeight: 500,
          }}
          onMouseOver={e => { e.target.style.background = '#b8a889'; e.target.style.transform = 'translateY(-2px)'; }}
          onMouseOut={e => { e.target.style.background = '#c9b99a'; e.target.style.transform = 'translateY(0)'; }}
          >Shop Collection</button>
          <button onClick={() => window.open(`https://wa.me/${WHATSAPP}?text=Hi, I'd like to discuss a furniture order`, '_blank')} style={{
            fontFamily: "'DM Sans', sans-serif", fontSize: 12, letterSpacing: '3px',
            textTransform: 'uppercase', background: 'transparent', color: '#fff',
            border: '1px solid rgba(255,255,255,0.4)', padding: '16px 48px', cursor: 'pointer',
            transition: 'all 0.3s', fontWeight: 500,
          }}
          onMouseOver={e => { e.target.style.borderColor = '#c9b99a'; e.target.style.color = '#c9b99a'; }}
          onMouseOut={e => { e.target.style.borderColor = 'rgba(255,255,255,0.4)'; e.target.style.color = '#fff'; }}
          >WhatsApp Us</button>
        </div>
      </div>
    </div>
  );
}

function CategoryGrid({ onNavigate }) {
  return (
    <section style={{ maxWidth: 1400, margin: '0 auto', padding: '80px 40px' }}>
      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, letterSpacing: '4px', textTransform: 'uppercase', color: '#c9b99a', marginBottom: 12 }}>Browse</div>
        <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 42, fontWeight: 300, color: '#1a1a1a', margin: 0, letterSpacing: '1px' }}>Our Collections</h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
        {CATEGORIES.map((cat, i) => (
          <div key={cat.id} onClick={() => onNavigate('shop', cat.id)} style={{
            position: 'relative', height: i < 2 ? 360 : 280, overflow: 'hidden', cursor: 'pointer',
            background: '#f0ede8',
          }}>
            <div style={{
              position: 'absolute', inset: 0,
              backgroundImage: `url(${cat.image})`, backgroundSize: 'cover', backgroundPosition: 'center',
              transition: 'transform 0.8s cubic-bezier(0.16,1,0.3,1)',
            }}
            onMouseOver={e => e.target.style.transform = 'scale(1.08)'}
            onMouseOut={e => e.target.style.transform = 'scale(1)'}
            />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.1) 60%)' }} />
            <div style={{ position: 'absolute', bottom: 24, left: 24, right: 24 }}>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, fontWeight: 400, color: '#fff', marginBottom: 4 }}>{cat.name}</div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: 'rgba(255,255,255,0.7)', letterSpacing: '1px' }}>{cat.count} pieces</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function ProductCard({ product, onAddCart, onToggleWishlist, isWished, onNavigate }) {
  const [hovered, setHovered] = useState(false);
  const discount = product.oldPrice ? Math.round((1 - product.price / product.oldPrice) * 100) : null;

  return (
    <div
      onMouseOver={() => setHovered(true)} onMouseOut={() => setHovered(false)}
      style={{ position: 'relative', cursor: 'pointer' }}
    >
      {/* Image */}
      <div onClick={() => onNavigate('product', product.id)} style={{
        position: 'relative', paddingTop: '120%', overflow: 'hidden',
        background: '#f0ede8', marginBottom: 16,
      }}>
        <img src={product.image} alt={product.name} style={{
          position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover',
          transition: 'transform 0.8s cubic-bezier(0.16,1,0.3,1)',
          transform: hovered ? 'scale(1.05)' : 'scale(1)',
        }} />
        
        {product.badge && (
          <span style={{
            position: 'absolute', top: 12, left: 12,
            background: product.badge === 'Sale' ? '#c9b99a' : product.badge === 'New' ? '#1a1a1a' : product.badge === 'Premium' ? '#2d2926' : '#4a6741',
            color: '#fff', fontFamily: "'DM Sans', sans-serif", fontSize: 10,
            letterSpacing: '1.5px', textTransform: 'uppercase', padding: '5px 12px',
          }}>{product.badge}{discount ? ` -${discount}%` : ''}</span>
        )}

        {/* Quick actions */}
        <div style={{
          position: 'absolute', bottom: 12, left: 12, right: 12,
          display: 'flex', gap: 8, justifyContent: 'center',
          opacity: hovered ? 1 : 0, transform: hovered ? 'translateY(0)' : 'translateY(10px)',
          transition: 'all 0.3s cubic-bezier(0.16,1,0.3,1)',
        }}>
          <button onClick={e => { e.stopPropagation(); onAddCart(product); }} style={{
            flex: 1, padding: '12px', background: 'rgba(26,26,26,0.9)', color: '#fff',
            border: 'none', fontFamily: "'DM Sans', sans-serif", fontSize: 11,
            letterSpacing: '2px', textTransform: 'uppercase', cursor: 'pointer',
            backdropFilter: 'blur(10px)',
          }}>Add to Cart</button>
          <button onClick={e => { e.stopPropagation(); onToggleWishlist(product.id); }} style={{
            padding: '12px 14px', background: 'rgba(252,250,247,0.9)', border: 'none',
            cursor: 'pointer', backdropFilter: 'blur(10px)', fontSize: 16,
          }}>{isWished ? '❤️' : '🤍'}</button>
        </div>
      </div>

      {/* Info */}
      <div onClick={() => onNavigate('product', product.id)}>
        <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
          {'★'.repeat(Math.floor(product.rating)).split('').map((s, i) => (
            <span key={i} style={{ color: '#c9b99a', fontSize: 12 }}>★</span>
          ))}
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: '#999', marginLeft: 4 }}>({product.reviews})</span>
        </div>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, fontWeight: 500, color: '#1a1a1a', marginBottom: 6, lineHeight: 1.3 }}>{product.name}</div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 600, color: '#1a1a1a' }}>AED {product.price.toLocaleString()}</span>
          {product.oldPrice && <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#999', textDecoration: 'line-through' }}>AED {product.oldPrice.toLocaleString()}</span>}
        </div>
        <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
          {product.colors.map(c => (
            <span key={c} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: '#777', background: '#f5f3ef', padding: '3px 8px' }}>{c}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

function FeaturedProducts({ onAddCart, onToggleWishlist, wishlist, onNavigate }) {
  const featured = PRODUCTS.filter(p => p.badge === 'Best Seller' || p.badge === 'Premium');
  return (
    <section style={{ background: '#fff', padding: '80px 0' }}>
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 48 }}>
          <div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, letterSpacing: '4px', textTransform: 'uppercase', color: '#c9b99a', marginBottom: 12 }}>Curated</div>
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 42, fontWeight: 300, color: '#1a1a1a', margin: 0 }}>Featured Pieces</h2>
          </div>
          <span onClick={() => onNavigate('shop')} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, letterSpacing: '2px', textTransform: 'uppercase', color: '#1a1a1a', cursor: 'pointer', borderBottom: '1px solid #c9b99a', paddingBottom: 2 }}>View All</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 32 }}>
          {featured.map(p => (
            <ProductCard key={p.id} product={p} onAddCart={onAddCart} onToggleWishlist={onToggleWishlist} isWished={wishlist.includes(p.id)} onNavigate={onNavigate} />
          ))}
        </div>
      </div>
    </section>
  );
}

function PromoBanner() {
  return (
    <section style={{
      position: 'relative', height: 400, overflow: 'hidden',
      backgroundImage: 'url(https://images.unsplash.com/photo-1600210492493-0946911123ea?w=1600&q=80)',
      backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'scroll',
    }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(26,26,26,0.7)' }} />
      <div style={{
        position: 'relative', zIndex: 2, height: '100%',
        display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
        textAlign: 'center', padding: '0 20px',
      }}>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, letterSpacing: '5px', textTransform: 'uppercase', color: '#c9b99a', marginBottom: 16 }}>Limited Time</div>
        <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(28px, 5vw, 52px)', fontWeight: 300, color: '#fff', margin: '0 0 12px' }}>Ramadan Sale — Up to 40% Off</h2>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: 'rgba(255,255,255,0.6)', marginBottom: 32 }}>Free delivery across Dubai · Assembly included</p>
        <button onClick={() => window.open(`https://wa.me/${WHATSAPP}?text=Hi, I'm interested in the Ramadan sale`, '_blank')} style={{
          fontFamily: "'DM Sans', sans-serif", fontSize: 12, letterSpacing: '3px',
          textTransform: 'uppercase', background: '#c9b99a', color: '#1a1a1a',
          border: 'none', padding: '16px 48px', cursor: 'pointer',
        }}>Shop Sale</button>
      </div>
    </section>
  );
}

function TrustStrip() {
  const items = [
    { icon: "🚚", title: "Free Dubai Delivery", sub: "On orders over AED 500" },
    { icon: "🔧", title: "Free Assembly", sub: "Professional in-home setup" },
    { icon: "🛡️", title: "2-Year Warranty", sub: "On all furniture" },
    { icon: "💬", title: "WhatsApp Support", sub: "Instant response" },
  ];
  return (
    <section style={{ background: '#f5f3ef', padding: '48px 40px' }}>
      <div style={{ maxWidth: 1400, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 32, textAlign: 'center' }}>
        {items.map(item => (
          <div key={item.title}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>{item.icon}</div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, color: '#1a1a1a', letterSpacing: '1px', marginBottom: 4 }}>{item.title}</div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: '#888' }}>{item.sub}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function ShopPage({ filter, onAddCart, onToggleWishlist, wishlist, onNavigate }) {
  const [activeCategory, setActiveCategory] = useState(filter || 'all');
  const [sortBy, setSortBy] = useState('featured');

  let products = activeCategory === 'all' ? PRODUCTS : PRODUCTS.filter(p => p.category === activeCategory);
  if (sortBy === 'low') products = [...products].sort((a, b) => a.price - b.price);
  if (sortBy === 'high') products = [...products].sort((a, b) => b.price - a.price);

  return (
    <section style={{ maxWidth: 1400, margin: '0 auto', padding: '48px 40px' }}>
      {/* Breadcrumb */}
      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: '#999', marginBottom: 32 }}>
        <span onClick={() => onNavigate('home')} style={{ cursor: 'pointer' }}>Home</span> / <span style={{ color: '#1a1a1a' }}>Shop</span>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 40, flexWrap: 'wrap', gap: 16 }}>
        <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 42, fontWeight: 300, color: '#1a1a1a', margin: 0 }}>
          {activeCategory === 'all' ? 'All Pieces' : CATEGORIES.find(c => c.id === activeCategory)?.name || 'Shop'}
        </h1>
        <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{
          fontFamily: "'DM Sans', sans-serif", fontSize: 12, padding: '10px 16px',
          border: '1px solid #e0dcd5', background: '#fff', cursor: 'pointer', letterSpacing: '1px',
        }}>
          <option value="featured">Featured</option>
          <option value="low">Price: Low to High</option>
          <option value="high">Price: High to Low</option>
        </select>
      </div>

      {/* Category pills */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 40, overflowX: 'auto', paddingBottom: 8 }}>
        <button onClick={() => setActiveCategory('all')} style={{
          fontFamily: "'DM Sans', sans-serif", fontSize: 11, letterSpacing: '1.5px', textTransform: 'uppercase',
          padding: '10px 20px', border: '1px solid', cursor: 'pointer', whiteSpace: 'nowrap',
          background: activeCategory === 'all' ? '#1a1a1a' : 'transparent',
          color: activeCategory === 'all' ? '#fff' : '#1a1a1a',
          borderColor: activeCategory === 'all' ? '#1a1a1a' : '#ddd',
        }}>All</button>
        {CATEGORIES.map(cat => (
          <button key={cat.id} onClick={() => setActiveCategory(cat.id)} style={{
            fontFamily: "'DM Sans', sans-serif", fontSize: 11, letterSpacing: '1.5px', textTransform: 'uppercase',
            padding: '10px 20px', border: '1px solid', cursor: 'pointer', whiteSpace: 'nowrap',
            background: activeCategory === cat.id ? '#1a1a1a' : 'transparent',
            color: activeCategory === cat.id ? '#fff' : '#1a1a1a',
            borderColor: activeCategory === cat.id ? '#1a1a1a' : '#ddd',
          }}>{cat.name}</button>
        ))}
      </div>

      {/* Product grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 32 }}>
        {products.map(p => (
          <ProductCard key={p.id} product={p} onAddCart={onAddCart} onToggleWishlist={onToggleWishlist} isWished={wishlist.includes(p.id)} onNavigate={onNavigate} />
        ))}
      </div>
      {products.length === 0 && (
        <div style={{ textAlign: 'center', padding: '80px 0', color: '#999', fontFamily: "'DM Sans', sans-serif" }}>No products in this category yet. More coming soon.</div>
      )}
    </section>
  );
}

function ProductDetail({ productId, onAddCart, onToggleWishlist, wishlist, onNavigate }) {
  const product = PRODUCTS.find(p => p.id === productId);
  const [selectedColor, setSelectedColor] = useState(0);
  const [selectedSize, setSelectedSize] = useState(0);
  const [qty, setQty] = useState(1);

  if (!product) return <div style={{ padding: 80, textAlign: 'center' }}>Product not found</div>;

  const related = PRODUCTS.filter(p => p.category === product.category && p.id !== product.id).slice(0, 3);

  return (
    <section style={{ maxWidth: 1400, margin: '0 auto', padding: '48px 40px' }}>
      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: '#999', marginBottom: 32 }}>
        <span onClick={() => onNavigate('home')} style={{ cursor: 'pointer' }}>Home</span> / <span onClick={() => onNavigate('shop')} style={{ cursor: 'pointer' }}>Shop</span> / <span style={{ color: '#1a1a1a' }}>{product.name}</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, marginBottom: 80 }}>
        {/* Image */}
        <div style={{ position: 'relative', paddingTop: '100%', overflow: 'hidden', background: '#f0ede8' }}>
          <img src={product.image} alt={product.name} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
          {product.badge && (
            <span style={{ position: 'absolute', top: 20, left: 20, background: '#1a1a1a', color: '#fff', fontFamily: "'DM Sans', sans-serif", fontSize: 11, letterSpacing: '1.5px', textTransform: 'uppercase', padding: '6px 14px' }}>{product.badge}</span>
          )}
        </div>

        {/* Details */}
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <span key={i} style={{ color: i < Math.floor(product.rating) ? '#c9b99a' : '#ddd', fontSize: 14 }}>★</span>
            ))}
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: '#999', marginLeft: 8 }}>{product.reviews} reviews</span>
          </div>

          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 36, fontWeight: 400, color: '#1a1a1a', margin: '0 0 16px', lineHeight: 1.2 }}>{product.name}</h1>

          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 24 }}>
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 28, fontWeight: 600, color: '#1a1a1a' }}>AED {product.price.toLocaleString()}</span>
            {product.oldPrice && <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 18, color: '#999', textDecoration: 'line-through' }}>AED {product.oldPrice.toLocaleString()}</span>}
          </div>

          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: '#666', lineHeight: 1.7, marginBottom: 32 }}>
            Premium quality furniture handcrafted in our Dubai workshop. Each piece is built to order with the finest materials, ensuring a perfect fit for your home.
          </p>

          {/* Colour selection */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 10, color: '#1a1a1a' }}>Colour: {product.colors[selectedColor]}</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {product.colors.map((c, i) => (
                <button key={c} onClick={() => setSelectedColor(i)} style={{
                  fontFamily: "'DM Sans', sans-serif", fontSize: 12, padding: '10px 20px',
                  border: selectedColor === i ? '2px solid #1a1a1a' : '1px solid #ddd',
                  background: '#fff', cursor: 'pointer',
                }}>{c}</button>
              ))}
            </div>
          </div>

          {/* Size selection */}
          <div style={{ marginBottom: 32 }}>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 10, color: '#1a1a1a' }}>Size: {product.sizes[selectedSize]}</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {product.sizes.map((s, i) => (
                <button key={s} onClick={() => setSelectedSize(i)} style={{
                  fontFamily: "'DM Sans', sans-serif", fontSize: 12, padding: '10px 20px',
                  border: selectedSize === i ? '2px solid #1a1a1a' : '1px solid #ddd',
                  background: '#fff', cursor: 'pointer',
                }}>{s}</button>
              ))}
            </div>
          </div>

          {/* Quantity + Add to cart */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
            <div style={{ display: 'flex', border: '1px solid #ddd' }}>
              <button onClick={() => setQty(Math.max(1, qty - 1))} style={{ width: 44, height: 50, border: 'none', background: '#fff', cursor: 'pointer', fontSize: 18 }}>−</button>
              <div style={{ width: 44, height: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Sans', sans-serif", fontSize: 14, borderLeft: '1px solid #ddd', borderRight: '1px solid #ddd' }}>{qty}</div>
              <button onClick={() => setQty(qty + 1)} style={{ width: 44, height: 50, border: 'none', background: '#fff', cursor: 'pointer', fontSize: 18 }}>+</button>
            </div>
            <button onClick={() => onAddCart({ ...product, qty, color: product.colors[selectedColor], size: product.sizes[selectedSize] })} style={{
              flex: 1, fontFamily: "'DM Sans', sans-serif", fontSize: 12, letterSpacing: '3px',
              textTransform: 'uppercase', background: '#1a1a1a', color: '#fff',
              border: 'none', cursor: 'pointer', transition: 'background 0.3s',
            }}
            onMouseOver={e => e.target.style.background = '#333'}
            onMouseOut={e => e.target.style.background = '#1a1a1a'}
            >Add to Cart — AED {(product.price * qty).toLocaleString()}</button>
          </div>

          <button onClick={() => onToggleWishlist(product.id)} style={{
            width: '100%', padding: '14px', fontFamily: "'DM Sans', sans-serif", fontSize: 12,
            letterSpacing: '2px', textTransform: 'uppercase',
            background: 'transparent', border: '1px solid #ddd', cursor: 'pointer',
            color: wishlist.includes(product.id) ? '#c9b99a' : '#1a1a1a',
          }}>{wishlist.includes(product.id) ? '❤️ Added to Wishlist' : '🤍 Add to Wishlist'}</button>

          <div style={{ marginTop: 24, padding: '20px', background: '#f5f3ef', display: 'flex', gap: 12, alignItems: 'center' }}>
            <span style={{ fontSize: 20 }}>💬</span>
            <div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}>Need help choosing?</div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: '#666' }}>
                <span onClick={() => window.open(`https://wa.me/${WHATSAPP}?text=Hi, I have a question about ${product.name}`, '_blank')} style={{ color: '#4a6741', cursor: 'pointer', textDecoration: 'underline' }}>WhatsApp our team</span> for instant advice
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
              <ProductCard key={p.id} product={p} onAddCart={onAddCart} onToggleWishlist={onToggleWishlist} isWished={wishlist.includes(p.id)} onNavigate={onNavigate} />
            ))}
          </div>
        </>
      )}
    </section>
  );
}

function CartPage({ cart, setCart, onNavigate }) {
  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const updateQty = (idx, newQty) => {
    if (newQty < 1) return;
    setCart(cart.map((item, i) => i === idx ? { ...item, qty: newQty } : item));
  };
  const remove = idx => setCart(cart.filter((_, i) => i !== idx));

  return (
    <section style={{ maxWidth: 1000, margin: '0 auto', padding: '48px 40px' }}>
      <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 42, fontWeight: 300, color: '#1a1a1a', marginBottom: 48 }}>Your Cart</h1>

      {cart.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 0' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🛍️</div>
          <p style={{ fontFamily: "'DM Sans', sans-serif", color: '#999', marginBottom: 24 }}>Your cart is empty</p>
          <button onClick={() => onNavigate('shop')} style={{
            fontFamily: "'DM Sans', sans-serif", fontSize: 12, letterSpacing: '3px',
            textTransform: 'uppercase', background: '#1a1a1a', color: '#fff',
            border: 'none', padding: '16px 48px', cursor: 'pointer',
          }}>Continue Shopping</button>
        </div>
      ) : (
        <>
          {cart.map((item, i) => (
            <div key={i} style={{ display: 'flex', gap: 24, padding: '24px 0', borderBottom: '1px solid #eee', alignItems: 'center' }}>
              <img src={item.image} alt={item.name} style={{ width: 100, height: 100, objectFit: 'cover', background: '#f0ede8' }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, fontWeight: 500, color: '#1a1a1a' }}>{item.name}</div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: '#999', marginTop: 4 }}>
                  {item.color && `${item.color}`}{item.size && ` · ${item.size}`}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, border: '1px solid #ddd' }}>
                <button onClick={() => updateQty(i, item.qty - 1)} style={{ width: 32, height: 32, border: 'none', background: '#fff', cursor: 'pointer' }}>−</button>
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13 }}>{item.qty}</span>
                <button onClick={() => updateQty(i, item.qty + 1)} style={{ width: 32, height: 32, border: 'none', background: '#fff', cursor: 'pointer' }}>+</button>
              </div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 600, color: '#1a1a1a', minWidth: 100, textAlign: 'right' }}>AED {(item.price * item.qty).toLocaleString()}</div>
              <button onClick={() => remove(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#999', fontSize: 18 }}>×</button>
            </div>
          ))}

          <div style={{ padding: '32px 0', borderTop: '2px solid #1a1a1a', marginTop: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: '#666' }}>Subtotal</span>
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600 }}>AED {total.toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: '#666' }}>Delivery</span>
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: '#4a6741' }}>{total >= 500 ? 'Free' : 'AED 99'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 32, paddingTop: 16, borderTop: '1px solid #eee' }}>
              <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 500 }}>Total</span>
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 22, fontWeight: 700 }}>AED {(total + (total >= 500 ? 0 : 99)).toLocaleString()}</span>
            </div>

            <button onClick={() => window.open(`https://wa.me/${WHATSAPP}?text=Hi, I'd like to place an order:%0A%0A${cart.map(item => `• ${item.name} (${item.qty}x) - AED ${(item.price * item.qty).toLocaleString()}`).join('%0A')}%0A%0ATotal: AED ${total.toLocaleString()}`, '_blank')} style={{
              width: '100%', padding: '18px', fontFamily: "'DM Sans', sans-serif", fontSize: 13,
              letterSpacing: '3px', textTransform: 'uppercase', background: '#25D366', color: '#fff',
              border: 'none', cursor: 'pointer', marginBottom: 12, fontWeight: 500,
            }}>Order via WhatsApp</button>
            <button onClick={() => onNavigate('shop')} style={{
              width: '100%', padding: '16px', fontFamily: "'DM Sans', sans-serif", fontSize: 12,
              letterSpacing: '2px', textTransform: 'uppercase', background: 'transparent',
              color: '#1a1a1a', border: '1px solid #ddd', cursor: 'pointer',
            }}>Continue Shopping</button>
          </div>
        </>
      )}
    </section>
  );
}

function Footer({ onNavigate }) {
  return (
    <footer style={{ background: '#1a1a1a', color: '#fff', padding: '64px 40px 32px' }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 48, marginBottom: 48 }}>
          <div>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, fontWeight: 300, letterSpacing: '4px', marginBottom: 16 }}>UNICORN</div>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7 }}>
              Premium furniture designed for Dubai's finest homes. A division of First Unicorn Group.
            </p>
          </div>
          <div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, letterSpacing: '2px', textTransform: 'uppercase', color: '#c9b99a', marginBottom: 16 }}>Shop</div>
            {['Beds', 'Sofas', 'Dining', 'Wardrobes', 'Chairs', 'Tables'].map(item => (
              <div key={item} onClick={() => onNavigate('shop')} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 10, cursor: 'pointer' }}>{item}</div>
            ))}
          </div>
          <div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, letterSpacing: '2px', textTransform: 'uppercase', color: '#c9b99a', marginBottom: 16 }}>Help</div>
            {['Delivery Information', 'Returns & Exchanges', 'Care Guide', 'FAQ'].map(item => (
              <div key={item} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 10, cursor: 'pointer' }}>{item}</div>
            ))}
          </div>
          <div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, letterSpacing: '2px', textTransform: 'uppercase', color: '#c9b99a', marginBottom: 16 }}>Contact</div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 10 }}>Dubai, UAE</div>
            <div onClick={() => window.open(`https://wa.me/${WHATSAPP}`, '_blank')} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#25D366', marginBottom: 10, cursor: 'pointer' }}>WhatsApp: +971 52 645 5121</div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>hello@unicornfurniture.ae</div>
          </div>
        </div>
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 24, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>© 2026 Unicorn Furniture. A First Unicorn Group company.</div>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>Prices in AED. VAT included.</div>
        </div>
      </div>
    </footer>
  );
}

// ─── WHATSAPP FAB ───────────────────────────────────────────────────────
function WhatsAppFab() {
  return (
    <div onClick={() => window.open(`https://wa.me/${WHATSAPP}`, '_blank')} style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 999,
      width: 56, height: 56, borderRadius: '50%', background: '#25D366',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      cursor: 'pointer', boxShadow: '0 4px 20px rgba(37,211,102,0.4)',
      transition: 'transform 0.3s',
    }}
    onMouseOver={e => e.currentTarget.style.transform = 'scale(1.1)'}
    onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
    >
      <svg width="28" height="28" viewBox="0 0 24 24" fill="#fff">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
      </svg>
    </div>
  );
}

// ─── MAIN APP ───────────────────────────────────────────────────────────
export default function UnicornFurniture() {
  const [view, setView] = useState('home');
  const [viewData, setViewData] = useState(null);
  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const scrollRef = useRef(null);

  const navigate = (page, data = null) => {
    setView(page);
    setViewData(data);
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  };

  const addToCart = (product) => {
    const existing = cart.findIndex(item => item.id === product.id && item.color === product.color && item.size === product.size);
    if (existing >= 0) {
      setCart(cart.map((item, i) => i === existing ? { ...item, qty: item.qty + (product.qty || 1) } : item));
    } else {
      setCart([...cart, { ...product, qty: product.qty || 1 }]);
    }
  };

  const toggleWishlist = (id) => {
    setWishlist(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  return (
    <div data-scroll-container ref={scrollRef} style={{
      fontFamily: "'DM Sans', sans-serif", background: '#fcfaf7', color: '#1a1a1a',
      minHeight: '100vh', overflow: 'auto', height: '100vh',
    }}>
      <style>{fonts}</style>
      <Header cart={cart} wishlist={wishlist} onNavigate={navigate} currentView={view} />

      {view === 'home' && (
        <>
          <HeroBanner onNavigate={navigate} />
          <TrustStrip />
          <CategoryGrid onNavigate={navigate} />
          <FeaturedProducts onAddCart={addToCart} onToggleWishlist={toggleWishlist} wishlist={wishlist} onNavigate={navigate} />
          <PromoBanner />
        </>
      )}

      {view === 'shop' && (
        <ShopPage filter={viewData} onAddCart={addToCart} onToggleWishlist={toggleWishlist} wishlist={wishlist} onNavigate={navigate} />
      )}

      {view === 'product' && (
        <ProductDetail productId={viewData} onAddCart={addToCart} onToggleWishlist={toggleWishlist} wishlist={wishlist} onNavigate={navigate} />
      )}

      {view === 'cart' && (
        <CartPage cart={cart} setCart={setCart} onNavigate={navigate} />
      )}

      {view === 'wishlist' && (
        <section style={{ maxWidth: 1400, margin: '0 auto', padding: '48px 40px' }}>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 42, fontWeight: 300, marginBottom: 48 }}>Wishlist</h1>
          {wishlist.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 0' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🤍</div>
              <p style={{ color: '#999', marginBottom: 24 }}>Your wishlist is empty</p>
              <button onClick={() => navigate('shop')} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, letterSpacing: '3px', textTransform: 'uppercase', background: '#1a1a1a', color: '#fff', border: 'none', padding: '16px 48px', cursor: 'pointer' }}>Browse Collection</button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 32 }}>
              {PRODUCTS.filter(p => wishlist.includes(p.id)).map(p => (
                <ProductCard key={p.id} product={p} onAddCart={addToCart} onToggleWishlist={toggleWishlist} isWished={true} onNavigate={navigate} />
              ))}
            </div>
          )}
        </section>
      )}

      <Footer onNavigate={navigate} />
      <WhatsAppFab />
    </div>
  );
}

#!/usr/bin/env python3
"""
UNICORN FURNITURE — PREMIUM CURATION ENGINE v2
================================================
Takes ANY raw product feed (AliExpress, Alibaba, CSV, manual)
and transforms it into premium-grade Unicorn Furniture listings.

PIPELINE:
  Raw Feed → Quality Gate → Name Transform → Price Position → 
  Description Generate → Image Upgrade → Badge Assign → Curated Output

USAGE:
  # As module (used by aliexpress_import.py and quick_collect.py)
  from premium_curator import PremiumCurator
  curator = PremiumCurator()
  curated = curator.curate(raw_products)

  # Standalone demo
  python premium_curator.py
"""

import re
import hashlib
from typing import List, Dict, Optional

# ═══════════════════════════════════════════════════════════════
# CONSTANTS
# ═══════════════════════════════════════════════════════════════

USD_TO_AED = 3.67


# ═══════════════════════════════════════════════════════════════
# HELPER: Normalise field names across different input sources
# ═══════════════════════════════════════════════════════════════

def _get_cost_usd(product: Dict) -> float:
    """Extract cost in USD from any field format."""
    for key in ["cost_usd", "cost_aed", "cost"]:
        val = product.get(key)
        if val:
            try:
                v = float(val)
                if v > 0:
                    return v / USD_TO_AED if "aed" in key else v
            except (ValueError, TypeError):
                pass
    return 0


def _get_images(product: Dict) -> List[str]:
    """Extract images from any field format."""
    images = []
    
    if isinstance(product.get("images"), list):
        images = [str(i) for i in product["images"] if i and str(i).startswith("http")]
    
    for i in range(1, 5):
        val = product.get(f"image_url_{i}")
        if val and str(val).startswith("http") and str(val) not in images:
            images.append(str(val))
    
    if not images and product.get("image_url"):
        val = str(product["image_url"])
        if val.startswith("http"):
            images = [val]
    
    return images


# ═══════════════════════════════════════════════════════════════
# QUALITY GATES — Only reject genuinely unsellable products
# ═══════════════════════════════════════════════════════════════

class QualityGates:
    
    REJECT_KEYWORDS = [
        "cheap", "budget", "economy", "wholesale lot", "clearance",
        "inflatable", "blow up", "bean bag",
        "kids cartoon", "student dorm", "disposable",
        "pet bed", "dog bed", "cat bed", "cat tree",
        "outdoor camping", "camping chair", "beach chair",
        "car seat", "massage chair", "gaming chair",
        "nail table", "salon", "barber", "tattoo",
        "3d print", "cardboard furniture",
    ]
    
    PREMIUM_MATERIALS = [
        "velvet", "bouclé", "boucle", "linen", "leather", "genuine leather",
        "marble", "sintered stone", "sintered", "slate", "travertine", "granite",
        "solid wood", "oak", "walnut", "teak", "ash wood", "beech", "acacia",
        "brass", "gold", "chrome", "stainless steel", "brushed metal",
        "ceramic", "porcelain", "crystal", "glass", "tempered glass",
        "memory foam", "latex", "down", "feather",
        "italian", "european", "scandinavian", "nordic",
    ]
    
    MIN_COST_USD = {
        "beds": 60, "sofas": 100, "dining": 80, "chairs": 25,
        "tv": 40, "wardrobes": 80, "tables": 20, "nightstands": 18,
        "dressing": 35, "mattress": 40, "ottoman": 15, "chaise": 60,
    }
    
    @classmethod
    def evaluate(cls, product: Dict) -> tuple:
        score = 50
        reasons = []
        
        name = str(product.get("name", "") or "").lower()
        desc = str(product.get("description", "") or "").lower()
        full_text = f"{name} {desc}"
        category = str(product.get("category", "")).lower()
        cost_usd = _get_cost_usd(product)
        images = _get_images(product)
        orders = int(product.get("ae_orders", 0) or 0)
        rating = str(product.get("ae_rating", "0") or "0")
        
        # Hard reject
        for kw in cls.REJECT_KEYWORDS:
            if kw in full_text:
                return (False, 0, [f"Rejected: '{kw}'"])
        
        # Price floor
        min_cost = cls.MIN_COST_USD.get(category, 15)
        if 0 < cost_usd < min_cost:
            return (False, 0, [f"Too cheap: ${cost_usd:.0f} < ${min_cost} min for {category}"])
        
        # Must have image
        if not images:
            return (False, 0, ["No images"])
        
        # Premium materials
        mat_count = sum(1 for m in cls.PREMIUM_MATERIALS if m in full_text)
        if mat_count:
            score += min(mat_count * 7, 28)
            reasons.append(f"{mat_count} premium material(s)")
        
        # Multiple images
        if len(images) >= 3: score += 8
        elif len(images) == 1: score -= 3
        
        # Demand
        if orders > 200:
            score += 12
            reasons.append(f"High demand ({orders})")
        elif orders > 50:
            score += 7
            reasons.append(f"Good demand ({orders})")
        
        # Rating
        try:
            r = float(rating.replace("%", ""))
            if r > 95: score += 8
            elif r > 90: score += 4
            elif r < 75: score -= 8
        except (ValueError, TypeError):
            pass
        
        passes = score >= 40
        if not passes:
            reasons.append(f"Score {score}/100 below threshold")
        
        return (passes, min(score, 100), reasons)


# ═══════════════════════════════════════════════════════════════
# NAME TRANSFORMER
# ═══════════════════════════════════════════════════════════════

class NameTransformer:
    
    STRIP = [
        "free shipping", "hot sale", "new arrival", "best seller",
        "factory direct", "wholesale", "dropshipping", "in stock",
        "2024", "2025", "2026", "2027", "promotion", "special offer",
        "high quality", "top quality", "brand new", "100% new",
        "fast delivery", "big sale", "flash sale", "limited time",
        "for home", "for living room", "for bedroom", "for house",
        "home decoration", "home furniture", "house furniture",
        "european style", "american style", "simple modern",
        "hot", "new", "sale", "good quality", "premium quality",
    ]
    
    COLLECTIONS = {
        "beds":        ["Milano", "Aurora", "Torino", "Riviera", "Palazzo", "Sienna", "Monaco", "Capri", "Verona", "Portofino"],
        "sofas":       ["Sahara", "Zephyr", "Mayfair", "Belgravia", "Kensington", "Chelsea", "Amalfi", "Como", "Positano", "Riviera"],
        "dining":      ["Carrara", "Firenze", "Tuscany", "Provence", "Vienna", "Geneva", "Nordic", "Lucerne", "Basel", "Zurich"],
        "chairs":      ["Windsor", "Hampton", "Aspen", "Marbella", "Ravello", "Taormina", "Sorrento", "Bergamo", "Portofino", "Capri"],
        "tv":          ["Palazzo", "Gallery", "Studio", "Atelier", "Soho", "Tribeca", "Maison", "Meridian", "Moderne", "Chelsea"],
        "wardrobes":   ["Maison", "Grande", "Regency", "Imperial", "Sovereign", "Regal", "Estate", "Manor", "Chateau", "Villa"],
        "tables":      ["Infinity", "Meridian", "Solstice", "Eclipse", "Zenith", "Apex", "Atlas", "Nova", "Summit", "Pinnacle"],
        "nightstands": ["Luna", "Stella", "Nova", "Celeste", "Aria", "Lux", "Prima", "Elite", "Serene", "Dusk"],
        "dressing":    ["Vanity", "Elegance", "Grace", "Belle", "Cherie", "Jolie", "Luxe", "Glam", "Opulent", "Bijou"],
        "ottoman":     ["Florence", "Heritage", "Metro", "Mayfair", "Camden", "Soho", "Knightsbridge", "Belgravia", "Kensington", "Chelsea"],
        "chaise":      ["Riviera", "Amalfi", "Como", "Portofino", "Capri", "Monaco", "Antibes", "Cannes", "Sorrento", "Positano"],
        "mattress":    ["Dreamscape", "Serenity", "Haven", "Cloud", "Elysium", "Plush", "Horizon", "Zenith", "Tranquil", "Oasis"],
    }
    
    MATERIALS = {
        "velvet": "Velvet", "bouclé": "Bouclé", "boucle": "Bouclé",
        "leather": "Leather", "linen": "Linen",
        "marble": "Marble", "sintered": "Sintered Stone", "travertine": "Travertine",
        "glass": "Glass", "tempered glass": "Glass",
        "oak": "Oak", "walnut": "Walnut", "teak": "Teak", "wood": "Wood",
        "brass": "Brass", "gold": "Gold-Accented", "chrome": "Chrome",
    }
    
    STYLES = {
        "modern": "Modern", "minimalist": "Minimalist",
        "nordic": "Nordic", "italian": "Italian", "contemporary": "Contemporary",
        "mid century": "Mid-Century", "art deco": "Art Deco",
        "curved": "Curved", "tufted": "Tufted", "channel": "Channel-Tufted",
        "wingback": "Wingback", "floating": "Floating", "upholstered": "Upholstered",
    }
    
    # IMPORTANT: Ordered longest-first to prevent partial matches
    # ("bed" in "bedroom" must not override "wardrobe", "nightstand", etc.)
    TYPES = [
        ("chaise lounge", "Chaise Longue"), ("chaise", "Chaise Longue"), ("daybed", "Day Bed"),
        ("platform bed", "Platform Bed"), ("storage bed", "Storage Bed"), ("bed frame", "Bed"),
        ("l-shape sectional", "L-Shape Sectional"), ("l shape", "L-Shape Sectional"),
        ("corner sofa", "Corner Sectional"), ("sectional", "Sectional"),
        ("sofa bed", "Sofa Bed"), ("sofa", "Sofa"), ("couch", "Sofa"),
        ("dining table", "Dining Table"), ("dining set", "Dining Collection"),
        ("nightstand", "Nightstand"), ("bedside table", "Nightstand"), ("bedside", "Nightstand"), ("night table", "Nightstand"),
        ("coffee table", "Coffee Table"), ("side table", "Side Table"), ("console table", "Console Table"),
        ("accent chair", "Accent Chair"), ("wingback", "Wingback Chair"),
        ("armchair", "Armchair"), ("lounge chair", "Lounge Chair"), ("chair", "Chair"),
        ("tv cabinet", "Media Console"), ("tv stand", "TV Console"), ("tv console", "TV Console"),
        ("media console", "Media Console"), ("entertainment", "Entertainment Unit"),
        ("walk in wardrobe", "Walk-In Wardrobe"), ("wardrobe", "Wardrobe"), ("closet", "Wardrobe System"),
        ("dressing table", "Dressing Table"), ("vanity", "Vanity Table"),
        ("chest of drawer", "Chest of Drawers"), ("dresser", "Chest of Drawers"),
        ("ottoman", "Ottoman"), ("pouf", "Pouf"), ("bench", "Bench"),
        ("mattress", "Mattress"), ("bookshelf", "Bookshelf"), ("shelf", "Shelf Unit"),
        ("bed", "Bed"),  # LAST — only if nothing else matched
    ]
    
    _counters = {}
    _used = set()
    
    @classmethod
    def reset(cls):
        cls._counters = {}
        cls._used = set()
    
    @classmethod
    def transform(cls, raw_name: str, category: str) -> str:
        name_lower = raw_name.lower()
        
        for junk in cls.STRIP:
            name_lower = name_lower.replace(junk, " ")
        name_lower = re.sub(r'\s+', ' ', name_lower).strip()
        
        # Detect material
        material = ""
        for kw, display in cls.MATERIALS.items():
            if kw in name_lower:
                material = display
                break
        
        # Detect style
        style = ""
        for kw, display in cls.STYLES.items():
            if kw in name_lower:
                style = display
                break
        if not style:
            style = "Modern"
        
        # Detect type (list is ordered longest-first)
        product_type = ""
        for kw, display in cls.TYPES:
            if kw in name_lower:
                product_type = display
                break
        if not product_type:
            product_type = category.replace("-", " ").title() if category else "Furniture"
        
        # Collection name
        cat_key = category.lower().strip()
        collections = cls.COLLECTIONS.get(cat_key, ["Unicorn", "Elite", "Prima", "Luxe", "Regal"])
        idx = cls._counters.get(cat_key, 0)
        collection = collections[idx % len(collections)]
        cls._counters[cat_key] = idx + 1
        
        # Assemble: Collection + Material + [Style] + Type
        parts = [collection]
        if material:
            parts.append(material)
        if style and style != "Modern":
            parts.append(style)
        elif not material:
            parts.append(style)
        parts.append(product_type)
        
        name = " ".join(parts)
        
        if name in cls._used:
            alt = collections[(idx + 1) % len(collections)]
            name = name.replace(collection, alt)
            cls._counters[cat_key] = idx + 2
        cls._used.add(name)
        
        return name


# ═══════════════════════════════════════════════════════════════
# DESCRIPTION GENERATOR
# ═══════════════════════════════════════════════════════════════

class DescriptionGenerator:
    
    TEMPLATES = {
        "beds": [
            "Crafted for restful luxury. The {name} features {mat}, combining lasting comfort with refined aesthetics — the centrepiece your bedroom deserves.",
            "Where comfort meets contemporary design. The {name} brings {mat} together with clean architectural lines, creating a sanctuary of calm in your master suite.",
            "Engineered for both beauty and function. The {name} offers {mat} with thoughtful proportions — built to transform your bedroom into a five-star retreat.",
        ],
        "sofas": [
            "Designed for the way you actually live. The {name} delivers {mat} with deep, generous seating — perfect for family evenings and elegant entertaining alike.",
            "Sink into the {name}. {mat} meets precision tailoring in a silhouette that anchors any living space with effortless sophistication.",
            "The {name} redefines comfort. {mat} and a design that adapts to your space, your lifestyle, and your vision for home.",
        ],
        "dining": [
            "Gather around the {name} — where {mat} creates the backdrop for memorable meals and meaningful conversations in your Dubai home.",
            "The {name} brings {mat} to your dining space. Designed to seat your family in comfort and your guests in style.",
        ],
        "chairs": [
            "A statement piece that earns its place. The {name} features {mat} — the kind of chair that guests notice and remember.",
            "The {name} brings personality to any corner. {mat} with expert proportions that balance comfort with visual impact.",
        ],
        "tv": [
            "Clean lines. Hidden cables. The {name} brings {mat} to your entertainment space — designed to complement your screen, not compete with it.",
            "The {name} combines {mat} with intelligent cable management. Your living room's most refined anchor piece.",
        ],
        "wardrobes": [
            "Your wardrobe, elevated. The {name} offers {mat} with thoughtful organisation — because getting dressed should feel effortless every morning.",
        ],
        "tables": [
            "The {name} — {mat} in a form that draws the eye. A table that invites conversation and completes your living space.",
        ],
        "nightstands": [
            "The {name} — {mat} within arm's reach. Compact, considered, and perfectly proportioned for your bedside essentials.",
        ],
        "chaise": [
            "The {name} — where afternoon reading becomes a ritual. {mat} sculpted into a silhouette that invites you to slow down.",
        ],
    }
    
    MAT_PHRASES = {
        "velvet": "sumptuous velvet upholstery", "bouclé": "textured bouclé fabric",
        "boucle": "textured bouclé fabric", "leather": "premium genuine leather",
        "linen": "breathable natural linen", "marble": "natural marble surfaces",
        "sintered": "Italian sintered stone", "glass": "tempered glass and polished metal",
        "oak": "natural European oak", "walnut": "rich American walnut",
        "teak": "sustainably sourced teak", "wood": "solid hardwood construction",
        "brass": "brushed brass accents", "gold": "gold-finished detailing",
        "chrome": "polished chrome hardware", "upholstered": "premium performance fabric",
    }
    
    DEFAULT = "premium materials and expert craftsmanship"
    
    @classmethod
    def generate(cls, curated_name: str, raw_name: str, category: str) -> str:
        raw_lower = raw_name.lower()
        
        mat = cls.DEFAULT
        for kw, phrase in cls.MAT_PHRASES.items():
            if kw in raw_lower:
                mat = phrase
                break
        
        templates = cls.TEMPLATES.get(category.lower(), [
            "The {name} — {mat}. Designed for homes that demand more."
        ])
        
        return templates[hash(curated_name) % len(templates)].format(name=curated_name, mat=mat)


# ═══════════════════════════════════════════════════════════════
# PRICE POSITIONER
# ═══════════════════════════════════════════════════════════════

class PricePositioner:
    
    TIERS = [
        (0,   50,  3.5),
        (50,  150, 3.0),
        (150, 400, 2.5),
        (400, 800, 2.2),
        (800, 9999, 2.0),
    ]
    
    MATERIAL_PREMIUM = {
        "marble": 1.15, "sintered": 1.12, "italian": 1.15,
        "leather": 1.10, "walnut": 1.10, "teak": 1.12,
        "brass": 1.08, "oak": 1.06,
    }
    
    @classmethod
    def calculate(cls, cost_usd: float, raw_name: str = "") -> Dict:
        if cost_usd <= 0:
            return {"price_aed": 0, "old_price_aed": None, "margin_pct": 0}
        
        markup = 2.5
        for low, high, m in cls.TIERS:
            if low <= cost_usd < high:
                markup = m
                break
        
        name_lower = raw_name.lower()
        for mat, premium in cls.MATERIAL_PREMIUM.items():
            if mat in name_lower:
                markup *= premium
                break
        
        raw_price = cost_usd * USD_TO_AED * markup
        
        if raw_price >= 1000:
            price = round(raw_price / 100) * 100 - 1
        elif raw_price >= 200:
            price = round(raw_price / 50) * 50 - 1
        else:
            price = round(raw_price / 10) * 10 - 1
        price = max(price, 199)
        
        discount_pct = 0.30 if cost_usd < 200 else 0.25
        old_price = round(price * (1 + discount_pct) / 100) * 100 - 1
        
        cost_aed = cost_usd * USD_TO_AED
        margin = round((1 - cost_aed / price) * 100, 1) if price > 0 else 0
        
        return {"price_aed": int(price), "old_price_aed": int(old_price), "margin_pct": margin}


# ═══════════════════════════════════════════════════════════════
# IMAGE CURATOR
# ═══════════════════════════════════════════════════════════════

class ImageCurator:
    
    REJECT = [r'_50x50', r'_100x100', r'icon', r'logo', r'banner', r'avatar', r'\.gif$']
    
    @classmethod
    def curate(cls, images: List[str]) -> List[str]:
        out = []
        for img in images:
            if not img or not isinstance(img, str) or len(img) < 10:
                continue
            if any(re.search(p, img, re.IGNORECASE) for p in cls.REJECT):
                continue
            u = re.sub(r'_\d+x\d+', '', img)
            if 'alicdn.com' in u:
                u = u.replace('.webp', '.jpg')
            out.append(u)
        return out[:4]


# ═══════════════════════════════════════════════════════════════
# BADGE ASSIGNER
# ═══════════════════════════════════════════════════════════════

def assign_badge(product: Dict, score: int, cost_usd: float) -> str:
    orders = int(product.get("ae_orders", 0) or 0)
    if cost_usd > 500 and score >= 75: return "Premium"
    if cost_usd > 800: return "Exclusive"
    if orders > 100: return "Best Seller"
    if score >= 65: return "New"
    return "New"


# ═══════════════════════════════════════════════════════════════
# MASTER CURATOR
# ═══════════════════════════════════════════════════════════════

class PremiumCurator:
    
    def __init__(self, min_score=40):
        self.min_score = min_score
        self.stats = {"input": 0, "passed": 0, "rejected": 0, "reject_log": [], "avg_score": 0, "avg_margin": 0}
    
    def curate(self, raw_products: List[Dict]) -> List[Dict]:
        self.stats["input"] = len(raw_products)
        curated = []
        scores = []
        margins = []
        
        NameTransformer.reset()
        
        for product in raw_products:
            passes, score, reasons = QualityGates.evaluate(product)
            if not passes:
                self.stats["rejected"] += 1
                self.stats["reject_log"].append(
                    f"  ✗ {str(product.get('name',''))[:45]}  → {reasons[0] if reasons else 'low score'}"
                )
                continue
            
            scores.append(score)
            raw_name = str(product.get("name", ""))
            category = str(product.get("category", "uncategorized")).lower().strip()
            cost_usd = _get_cost_usd(product)
            images = _get_images(product)
            
            premium_name = NameTransformer.transform(raw_name, category)
            
            if cost_usd > 0:
                pricing = PricePositioner.calculate(cost_usd, raw_name)
            else:
                existing = int(product.get("price_aed", 0) or 0)
                if existing > 0:
                    pricing = {"price_aed": existing, "old_price_aed": round(existing * 1.28 / 100) * 100 - 1, "margin_pct": 0}
                else:
                    pricing = {"price_aed": 999, "old_price_aed": 1299, "margin_pct": 0}
            
            margins.append(pricing["margin_pct"])
            description = DescriptionGenerator.generate(premium_name, raw_name, category)
            curated_images = ImageCurator.curate(images)
            badge = assign_badge(product, score, cost_usd)
            featured = "YES" if (score >= 65 or badge in ["Premium", "Exclusive", "Best Seller"]) else "NO"
            
            curated.append({
                "product_id": product.get("product_id", f"UF-{len(curated)+1:03d}"),
                "name": premium_name,
                "raw_name": raw_name,
                "category": category,
                "description": description,
                "price_aed": pricing["price_aed"],
                "old_price_aed": pricing["old_price_aed"],
                "badge": badge,
                "featured": featured,
                "active": "YES",
                "colors": product.get("colors", ""),
                "sizes": product.get("sizes", ""),
                "images": curated_images,
                "cost_usd": round(cost_usd, 2),
                "cost_aed": round(cost_usd * USD_TO_AED),
                "margin_pct": pricing["margin_pct"],
                "delivery_days": product.get("delivery_days", 21),
                "ae_url": product.get("ae_url", ""),
                "ae_orders": product.get("ae_orders", 0),
                "ae_rating": product.get("ae_rating", ""),
                "quality_score": score,
            })
        
        curated.sort(key=lambda x: x.get("quality_score", 0), reverse=True)
        
        featured_count = sum(1 for p in curated if p["featured"] == "YES")
        if featured_count < 6:
            for p in curated[:min(6, len(curated))]:
                p["featured"] = "YES"
        
        self.stats["passed"] = len(curated)
        self.stats["avg_score"] = round(sum(scores) / len(scores), 1) if scores else 0
        self.stats["avg_margin"] = round(sum(margins) / len(margins), 1) if margins else 0
        
        return curated
    
    def print_report(self):
        s = self.stats
        print(f"\n{'='*60}")
        print(f"  🦄  UNICORN PREMIUM CURATION REPORT")
        print(f"{'='*60}")
        print(f"  Raw input:      {s['input']} products")
        print(f"  Passed filter:  {s['passed']} products ({round(s['passed']/max(s['input'],1)*100)}%)")
        print(f"  Rejected:       {s['rejected']} products")
        print(f"  Avg quality:    {s['avg_score']}/100")
        print(f"  Avg margin:     {s['avg_margin']}%")
        if s['reject_log']:
            print(f"\n  Rejections:")
            for r in s['reject_log']:
                print(f"  {r}")
        print(f"{'='*60}")


# ═══════════════════════════════════════════════════════════════
# DEMO
# ═══════════════════════════════════════════════════════════════

def demo():
    print("🦄 UNICORN PREMIUM CURATION ENGINE v2 — DEMO")
    print("=" * 60)
    
    raw = [
        {"name": "Hot Sale 2025 Modern Luxury Velvet Platform Bed King Size Hydraulic Storage For Bedroom Furniture Free Shipping", "category": "beds", "cost_usd": 180, "images": ["https://ae01.alicdn.com/kf/Sbed001.jpg", "https://ae01.alicdn.com/kf/Sbed002.jpg", "https://ae01.alicdn.com/kf/Sbed003.jpg"], "ae_orders": 250, "ae_rating": "96"},
        {"name": "Nordic Bouclé Fabric L Shape Sectional Sofa Living Room Modern Corner Couch Set", "category": "sofas", "cost_usd": 320, "images": ["https://ae01.alicdn.com/kf/Ssofa001.jpg", "https://ae01.alicdn.com/kf/Ssofa002.jpg", "https://ae01.alicdn.com/kf/Ssofa003.jpg", "https://ae01.alicdn.com/kf/Ssofa004.jpg"], "ae_orders": 180, "ae_rating": "95"},
        {"name": "Italian Sintered Stone Dining Table Luxury Marble Top Brass Base 6 8 Seater", "category": "dining", "cost_usd": 450, "images": ["https://ae01.alicdn.com/kf/Sdin001.jpg", "https://ae01.alicdn.com/kf/Sdin002.jpg"], "ae_orders": 80, "ae_rating": "98"},
        {"name": "Cheap Plastic Folding Chair Student Desk Office", "category": "chairs", "cost_usd": 8, "images": [], "ae_orders": 5, "ae_rating": "60"},
        {"name": "Modern Luxury Velvet Accent Chair Wingback Design Gold Legs", "category": "chairs", "cost_usd": 65, "images": ["https://ae01.alicdn.com/kf/Schair001.jpg", "https://ae01.alicdn.com/kf/Schair002.jpg"], "ae_orders": 320, "ae_rating": "94"},
        {"name": "Free Shipping Inflatable Sofa Camping Lazy Bag", "category": "sofas", "cost_usd": 12, "images": ["https://ae01.alicdn.com/kf/Scheap.jpg"], "ae_orders": 10, "ae_rating": "70"},
        {"name": "Premium Walnut Wood TV Console Cabinet LED Ambient Light Modern Minimalist Design", "category": "tv", "cost_usd": 140, "images": ["https://ae01.alicdn.com/kf/Stv001.jpg"], "ae_orders": 90, "ae_rating": "92"},
        {"name": "Modern Luxury Brass Gold Frame Tempered Glass Coffee Table Living Room", "category": "tables", "cost_usd": 95, "images": ["https://ae01.alicdn.com/kf/Stable001.jpg", "https://ae01.alicdn.com/kf/Stable002.jpg"], "ae_orders": 350, "ae_rating": "94"},
        {"name": "Pet Dog Bed Comfortable Large Size Waterproof", "category": "beds", "cost_usd": 20, "images": ["https://ae01.alicdn.com/kf/Sdog.jpg"], "ae_orders": 500, "ae_rating": "98"},
        {"name": "European Style Walk In Wardrobe Closet System Sliding Door Modern Bedroom", "category": "wardrobes", "cost_usd": 380, "images": ["https://ae01.alicdn.com/kf/Sward001.jpg"], "ae_orders": 45, "ae_rating": "91"},
        {"name": "Modern Curved Headboard Upholstered Bed Frame Luxury Bedroom Furniture Linen", "category": "beds", "cost_usd": 210, "images": ["https://ae01.alicdn.com/kf/Sbed004.jpg", "https://ae01.alicdn.com/kf/Sbed005.jpg", "https://ae01.alicdn.com/kf/Sbed006.jpg"], "ae_orders": 120, "ae_rating": "93"},
        {"name": "Simple Modern Oak Wood Nightstand Bedside Table With Drawer", "category": "nightstands", "cost_usd": 45, "images": ["https://ae01.alicdn.com/kf/Sns001.jpg", "https://ae01.alicdn.com/kf/Sns002.jpg", "https://ae01.alicdn.com/kf/Sns003.jpg"], "ae_orders": 200, "ae_rating": "90"},
        {"name": "Luxury Modern Leather Chaise Lounge Italian Design Living Room Daybed", "category": "chaise", "cost_usd": 280, "images": ["https://ae01.alicdn.com/kf/Schaise001.jpg", "https://ae01.alicdn.com/kf/Schaise002.jpg"], "ae_orders": 60, "ae_rating": "96"},
    ]
    
    curator = PremiumCurator()
    curated = curator.curate(raw)
    
    print(f"\n{'─'*60}")
    print(f"  {'ALIEXPRESS (RAW)':42s}  →  UNICORN (CURATED)")
    print(f"{'─'*60}")
    
    for p in curated:
        raw_short = p['raw_name']
        if len(raw_short) > 40:
            raw_short = raw_short[:38] + ".."
        print(f"\n  ❌ {raw_short}")
        print(f"  ✅ {p['name']}")
        print(f"     AED {p['price_aed']:,}  (was AED {p['old_price_aed']:,})  │  {p['badge']:12s}  │  {p['margin_pct']}% margin")
        print(f"     {p['description'][:85]}...")
    
    curator.print_report()


if __name__ == "__main__":
    demo()

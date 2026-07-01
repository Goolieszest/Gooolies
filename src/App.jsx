import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Droplet, ShoppingCart, MapPin, Truck, Package, CheckCircle2,
  X, Plus, Minus, ArrowLeft, Clock, Layers, ChevronRight, BookOpen, Sun, Moon, Activity,
  Phone, CreditCard, Banknote, MessageCircle, Send, Bot
} from 'lucide-react';

// Storage shim: this app was originally built as a Claude artifact, which provides
// window.storage automatically. Outside that environment it doesn't exist, so this
// gives the same get/set/delete interface backed by localStorage instead.
if (typeof window !== 'undefined' && !window.storage) {
  window.storage = {
    async get(key) {
      const raw = localStorage.getItem(key);
      if (raw === null) throw new Error('not found');
      return { key, value: raw };
    },
    async set(key, value) {
      localStorage.setItem(key, value);
      return { key, value };
    },
    async delete(key) {
      localStorage.removeItem(key);
      return { key, deleted: true };
    },
  };
}

const FONT_DISPLAY = "'Fraunces', serif";
const FONT_MONO = "'IBM Plex Mono', monospace";

const PACKS = [
  {
    id: 'daily',
    name: 'BBX',
    tagline: 'Even-mineral spring water for everyday drinking',
    price: 30,
    units: 12,
    source: 'Cascade Aquifer, Layer II',
    ph: 7.2,
    tds: 150,
    minerals: [
      { name: 'Calcium', mg: 28 },
      { name: 'Magnesium', mg: 9 },
      { name: 'Potassium', mg: 2 },
    ],
  },
  {
    id: 'goolies-solo',
    name: 'PF',
    tagline: 'High-pH spring water, naturally filtered through limestone',
    price: 40,
    units: 12,
    source: 'Limestone Shelf, Layer IV',
    ph: 9.1,
    tds: 210,
    minerals: [
      { name: 'Calcium', mg: 41 },
      { name: 'Bicarbonate', mg: 88 },
      { name: 'Magnesium', mg: 6 },
    ],
  },
];

const DELIVERY_WINDOWS = [
  { id: 'morning', label: '8:00 – 11:00', period: 'Morning' },
  { id: 'afternoon', label: '12:00 – 16:00', period: 'Afternoon' },
  { id: 'evening', label: '17:00 – 20:00', period: 'Evening' },
];

const GUIDES = [
  {
    id: 'how-much-water',
    icon: Droplet,
    category: 'Hydration',
    title: 'How much water you actually need',
    minutes: 4,
    price: 15,
    body: [
      "The old \"eight glasses a day\" rule is a rough average, not a target. A more useful starting point is body weight: aim for roughly half an ounce to an ounce per pound, then adjust for climate, activity, and how much water-rich food you eat.",
      "Heat, altitude, and exercise all raise the number. If you're sweating visibly or training for more than an hour, you'll likely need an electrolyte source alongside plain water, not just more volume.",
      "Urine color is the simplest day-to-day gauge. Pale straw is the target; darker than that for most of the day is a sign to drink more, while consistently clear can mean you're overdoing it.",
      "Spread intake across the day rather than front- or back-loading it. A glass on waking, one with each meal, and one in the afternoon covers most people without needing to track every ounce.",
    ],
  },
  {
    id: 'electrolytes-explained',
    icon: Activity,
    category: 'Hydration',
    title: 'Electrolytes: when you actually need them',
    minutes: 5,
    price: 15,
    body: [
      "Electrolytes — mainly sodium, potassium, and magnesium — manage fluid balance and muscle and nerve function. Plain water replaces volume but not what you lose in sweat, which is why heavy exercise can leave you thirsty even after drinking a lot.",
      "For everyday activity, food covers most electrolyte needs. Added electrolyte drinks earn their place during long or hot workouts, illness with vomiting or diarrhea, or heavy manual labor in heat.",
      "More isn't automatically better. Excess sodium intake on top of a normal diet can be counterproductive for some people, particularly those managing blood pressure — check with a doctor if that applies to you.",
      "A practical cue: if a session runs past 60–90 minutes or you're sweating heavily, an electrolyte drink alongside water is reasonable. For a 20-minute walk, water alone is fine.",
    ],
  },
  {
    id: 'sleep-basics',
    icon: Moon,
    category: 'Sleep',
    title: 'Building a sleep routine that sticks',
    minutes: 5,
    price: 15,
    body: [
      "Consistency matters more than any single trick. Going to bed and waking up at roughly the same time daily — weekends included — does more for sleep quality than most supplements or gadgets.",
      "Light is the primary signal your body uses to set its clock. Bright light in the morning and dim, warm light in the evening reinforce a healthy rhythm; screens late at night work against it for many people.",
      "Caffeine has a longer half-life than most expect — a mid-afternoon coffee can still be affecting sleep onset eight hours later. If sleep is a struggle, an early cutoff is one of the highest-leverage changes available.",
      "A cool, dark, quiet room remains the most reliable environmental setup. If you wake up and can't fall back asleep within 20 minutes or so, getting up and doing something calm until you're drowsy again tends to work better than lying there frustrated.",
    ],
  },
  {
    id: 'morning-routine',
    icon: Sun,
    category: 'Daily habits',
    title: 'A simple, sustainable morning routine',
    minutes: 3,
    price: 15,
    body: [
      "A good morning routine is less about doing more and more about removing friction from the things that matter. Pick two or three anchors — water, light, movement — rather than an elaborate stack you'll abandon in a week.",
      "Rehydrating after a night's sleep is a low-effort win: a glass of water before coffee helps offset the mild dehydration that builds up overnight.",
      "A few minutes of natural light and light movement, even just a short walk, helps set your circadian rhythm and tends to improve mood and focus through the morning.",
      "The routine that survives a bad day is the one worth keeping. Build something you could still do at 80% effort, not just on your best mornings.",
    ],
  },
];

const STAGES = [
  { key: 'placed', label: 'Order placed', icon: CheckCircle2 },
  { key: 'packed', label: 'Packed at source', icon: Package },
  { key: 'transit', label: 'Out for delivery', icon: Truck },
  { key: 'delivered', label: 'Delivered', icon: MapPin },
];

const STAGE_INTERVAL_MS = 5000;

function findCatalogItem(id) {
  return PACKS.find((p) => p.id === id) || GUIDES.find((g) => g.id === id);
}

function ContourBackground({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 800 400" preserveAspectRatio="none" aria-hidden="true">
      {[60, 110, 160, 210, 260, 310].map((y, i) => (
        <path
          key={i}
          d={`M0,${y} C150,${y - 30} 250,${y + 30} 400,${y} C550,${y - 30} 650,${y + 30} 800,${y}`}
          fill="none"
          stroke="#5eead4"
          strokeWidth="1"
          opacity={0.08 + i * 0.015}
        />
      ))}
    </svg>
  );
}

function SpecReadout({ pack, compact = false }) {
  const phPct = Math.min(100, (pack.ph / 14) * 100);
  const tdsPct = Math.min(100, (pack.tds / 600) * 100);
  return (
    <div style={{ fontFamily: FONT_MONO }} className={compact ? 'text-[11px]' : 'text-xs'}>
      <div className="flex justify-between text-slate-500 mb-1">
        <span>SOURCE</span>
        <span className="text-slate-300 text-right">{pack.source}</span>
      </div>
      <div className="space-y-1.5 mt-2">
        <div>
          <div className="flex justify-between text-slate-500">
            <span>pH</span>
            <span className="text-teal-300">{pack.ph.toFixed(1)}</span>
          </div>
          <div className="h-1 bg-slate-800 rounded-full mt-0.5 overflow-hidden">
            <div className="h-full bg-teal-400/70 rounded-full" style={{ width: `${phPct}%` }} />
          </div>
        </div>
        <div>
          <div className="flex justify-between text-slate-500">
            <span>TDS</span>
            <span className="text-teal-300">{pack.tds} mg/L</span>
          </div>
          <div className="h-1 bg-slate-800 rounded-full mt-0.5 overflow-hidden">
            <div className="h-full bg-orange-300/70 rounded-full" style={{ width: `${tdsPct}%` }} />
          </div>
        </div>
      </div>
      {!compact && (
        <div className="mt-3 pt-3 border-t border-slate-800 grid grid-cols-3 gap-2">
          {pack.minerals.map((m) => (
            <div key={m.name}>
              <div className="text-slate-500 leading-tight">{m.name}</div>
              <div className="text-slate-200">{m.mg}mg</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function StrataWaterApp() {
  const [view, setView] = useState('catalog');
  const [cart, setCart] = useState({});
  const [order, setOrder] = useState(null);
  const [storageReady, setStorageReady] = useState(false);
  const [address, setAddress] = useState({ name: '', phone: '', street: '', city: '', zip: '', window: 'morning', payment: 'card' });
  const [selectedGuide, setSelectedGuide] = useState(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [shuffledGuides] = useState(() => {
    const arr = [...GUIDES];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  });
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef(null);
  const intervalRef = useRef(null);

  // Load persisted cart / active order on mount
  useEffect(() => {
    (async () => {
      try {
        const c = await window.storage.get('strata-cart', false);
        if (c && c.value) setCart(JSON.parse(c.value));
      } catch (e) { /* no cart yet */ }
      try {
        const o = await window.storage.get('strata-active-order', false);
        if (o && o.value) {
          const parsed = JSON.parse(o.value);
          setOrder(parsed);
          if (parsed.stage !== 'delivered') setView('tracking');
        }
      } catch (e) { /* no order yet */ }
      setStorageReady(true);
    })();
  }, []);

  // Persist cart whenever it changes
  useEffect(() => {
    if (!storageReady) return;
    window.storage.set('strata-cart', JSON.stringify(cart), false).catch(() => {});
  }, [cart, storageReady]);

  // Drive tracking simulation forward in real time
  useEffect(() => {
    if (view !== 'tracking' || !order || order.stage === 'delivered') {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => {
      setOrder((prev) => {
        if (!prev) return prev;
        const idx = STAGES.findIndex((s) => s.key === prev.stage);
        if (idx >= STAGES.length - 1) {
          clearInterval(intervalRef.current);
          return prev;
        }
        const nextStage = STAGES[idx + 1].key;
        const updated = {
          ...prev,
          stage: nextStage,
          timestamps: { ...prev.timestamps, [nextStage]: new Date().toISOString() },
        };
        window.storage.set('strata-active-order', JSON.stringify(updated), false).catch(() => {});
        return updated;
      });
    }, STAGE_INTERVAL_MS);
    return () => clearInterval(intervalRef.current);
  }, [view, order?.stage]);

  const addToCart = useCallback((id) => {
    setCart((prev) => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
  }, []);
  const removeFromCart = useCallback((id) => {
    setCart((prev) => {
      const next = { ...prev };
      if (!next[id]) return next;
      next[id] -= 1;
      if (next[id] <= 0) delete next[id];
      return next;
    });
  }, []);

  const cartCount = Object.values(cart).reduce((a, b) => a + b, 0);
  const cartItems = Object.entries(cart)
    .map(([id, qty]) => ({ pack: findCatalogItem(id), qty }))
    .filter((x) => x.pack);
  const cartTotal = cartItems.reduce((sum, x) => sum + x.pack.price * x.qty, 0);

  const placeOrder = () => {
    const now = new Date().toISOString();
    const newOrder = {
      id: 'STR-' + Math.random().toString(36).slice(2, 8).toUpperCase(),
      items: cartItems.map((x) => ({ name: x.pack.name, qty: x.qty, price: x.pack.price })),
      total: cartTotal,
      address: { ...address },
      stage: 'placed',
      timestamps: { placed: now },
    };
    setOrder(newOrder);
    setCart({});
    window.storage.set('strata-active-order', JSON.stringify(newOrder), false).catch(() => {});
    window.storage.set('strata-cart', JSON.stringify({}), false).catch(() => {});
    // Record the order centrally so the owner can see it in /admin.
    // If this fails (e.g. offline), the order still works locally for the customer —
    // it just won't show up in the admin dashboard.
    fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newOrder),
    }).catch(() => {});
    setView('tracking');
  };

  const startNewOrder = () => {
    setOrder(null);
    window.storage.delete('strata-active-order', false).catch(() => {});
    setView('catalog');
  };

  const canCheckout = address.name.trim() && address.phone.trim() && address.street.trim() && address.city.trim() && address.zip.trim();

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, chatLoading]);

  const buildSystemPrompt = () => {
    const packList = PACKS.map(
      (p) => `${p.name}: R${p.price} for ${p.units} bottles, ${p.tagline}, source ${p.source}, pH ${p.ph}, TDS ${p.tds}mg/L`
    ).join(' | ');
    const guideList = GUIDES.map((g) => `${g.title} (${g.category}, R${g.price})`).join(' | ');
    let orderInfo = 'This customer has no active order.';
    if (order) {
      orderInfo = `Active order ${order.id}, status: ${order.stage}, total R${order.total}, payment: ${order.address.payment === 'cash' ? 'cash on delivery' : 'card'}, delivering to ${order.address.street}, ${order.address.city} ${order.address.zip}.`;
    }
    return `You are GOOLIES Support, the friendly customer service assistant for GOOLIES, an online water health-pack delivery service.

Available packs: ${packList}
Available health guides: ${guideList}
Delivery windows: Morning 8:00-11:00, Afternoon 12:00-16:00, Evening 17:00-20:00.
Payment methods: card or cash on delivery.

${orderInfo}

Be warm, concise, and helpful. Answer questions about products, pricing, delivery windows, payment options, and this customer's order status using the info above. If something is outside what you know (e.g. exact courier location), say so honestly and suggest checking the in-app tracking screen. Keep replies short — a few sentences, not paragraphs, since this is a chat widget on a phone screen.`;
  };

  const sendChatMessage = async () => {
    const text = chatInput.trim();
    if (!text || chatLoading) return;
    const userMsg = { role: 'user', content: text };
    const newMessages = [...chatMessages, userMsg];
    setChatMessages(newMessages);
    setChatInput('');
    setChatLoading(true);
    try {
      const firstUserIdx = newMessages.findIndex((m) => m.role === 'user');
      const apiMessages = newMessages.slice(firstUserIdx);
      // NOTE: calls our own backend (api/chat.js), which holds the real Anthropic
      // API key server-side and forwards the request. The browser never sees the key.
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system: buildSystemPrompt(),
          messages: apiMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await response.json();
      const replyText = (data.content || [])
        .map((block) => (block.type === 'text' ? block.text : ''))
        .filter(Boolean)
        .join('\n') || "Sorry, I didn't catch that — could you try again?";
      setChatMessages((prev) => [...prev, { role: 'assistant', content: replyText }]);
    } catch (e) {
      setChatMessages((prev) => [
        ...prev,
        { role: 'assistant', content: "Sorry, I'm having trouble connecting right now. Please try again in a moment." },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const openChat = () => {
    setChatOpen(true);
    if (chatMessages.length === 0) {
      setChatMessages([
        { role: 'assistant', content: "Hi, I'm GOOLIES Support. Ask me about your order, our packs, or delivery — happy to help." },
      ]);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100" style={{ fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300..700&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap');
      `}</style>

      {/* Header */}
      <header className="sticky top-0 z-20 bg-slate-950/90 backdrop-blur border-b border-slate-800">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => setView(order && order.stage !== 'delivered' ? 'tracking' : 'catalog')}
            className="flex items-center gap-2"
          >
            <Layers className="w-5 h-5 text-teal-300" />
            <span style={{ fontFamily: FONT_DISPLAY }} className="text-lg tracking-wide font-medium">
              GOOLIES
            </span>
          </button>
          {view === 'catalog' && (
            <div className="flex items-center gap-4">
              <button
                onClick={() => setView('guides')}
                className="flex items-center gap-1.5 text-sm text-slate-300 hover:text-teal-300 transition-colors"
              >
                <BookOpen className="w-5 h-5" />
              </button>
              <button
                onClick={() => setView('cart')}
                className="relative flex items-center gap-1.5 text-sm text-slate-300 hover:text-teal-300 transition-colors"
              >
                <ShoppingCart className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-orange-300 text-slate-950 text-[10px] font-semibold w-4 h-4 rounded-full flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </button>
            </div>
          )}
          {(view === 'cart' || view === 'checkout' || view === 'guides') && (
            <button
              onClick={() => setView(view === 'checkout' ? 'cart' : 'catalog')}
              className="flex items-center gap-1 text-sm text-slate-400 hover:text-slate-200"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
          )}
          {view === 'guide-detail' && (
            <button
              onClick={() => setView('guides')}
              className="flex items-center gap-1 text-sm text-slate-400 hover:text-slate-200"
            >
              <ArrowLeft className="w-4 h-4" /> Guides
            </button>
          )}
        </div>
      </header>

      {/* CATALOG VIEW */}
      {view === 'catalog' && (
        <main>
          <section className="relative overflow-hidden border-b border-slate-800">
            <ContourBackground className="absolute inset-0 w-full h-full opacity-70" />
            <div className="relative max-w-2xl mx-auto px-4 pt-10 pb-8">
              <div className="flex items-center gap-2 text-[11px] tracking-widest text-teal-300/80 mb-3" style={{ fontFamily: FONT_MONO }}>
                <Droplet className="w-3.5 h-3.5" /> RESET AND RELAX AT ONLINE ZEPPING
              </div>
              <h1
                style={{ fontFamily: FONT_DISPLAY }}
                className="text-4xl leading-[1.05] font-light text-slate-50 mb-3"
              >
                Got you back<br />when most needed.
              </h1>
              <p className="text-slate-400 text-sm mb-6 max-w-md">
                Four mineral profiles, drawn from four aquifer layers. Pick by what your body needs, not just the label.
              </p>
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-slate-200">{PACKS[0].name}</span>
                  <span className="text-[10px] text-slate-500" style={{ fontFamily: FONT_MONO }}>FEATURED</span>
                </div>
                <SpecReadout pack={PACKS[0]} />
              </div>
            </div>
          </section>

          <section className="max-w-2xl mx-auto px-4 py-6">
            <div className="grid gap-4">
              {PACKS.map((pack) => (
                <div key={pack.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                  <div className="flex items-start justify-between gap-3 mb-1">
                    <div>
                      <h3 style={{ fontFamily: FONT_DISPLAY }} className="text-xl text-slate-50">{pack.name}</h3>
                      <p className="text-slate-400 text-xs mt-0.5">{pack.tagline}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-lg text-slate-50 font-medium">R{pack.price}</div>
                      <div className="text-[10px] text-slate-500">{pack.units} bottles</div>
                    </div>
                  </div>
                  <div className="mt-3 bg-slate-950/60 rounded-lg p-3 border border-slate-800/80">
                    <SpecReadout pack={pack} compact />
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    {cart[pack.id] ? (
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => removeFromCart(pack.id)}
                          className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-200 hover:bg-slate-700"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-5 text-center" style={{ fontFamily: FONT_MONO }}>{cart[pack.id]}</span>
                        <button
                          onClick={() => addToCart(pack.id)}
                          className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-200 hover:bg-slate-700"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => addToCart(pack.id)}
                        className="text-sm font-medium text-slate-950 bg-teal-300 hover:bg-teal-200 transition-colors px-4 py-2 rounded-full"
                      >
                        Add to cart
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="max-w-2xl mx-auto px-4 pb-10">
            <button
              onClick={() => setView('guides')}
              className="w-full bg-slate-900 border border-slate-800 hover:border-teal-300/40 rounded-xl p-4 flex items-center justify-between transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-teal-300/10 flex items-center justify-center text-teal-300">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-medium text-slate-100">Health guides</div>
                  <div className="text-xs text-slate-500">Hydration, sleep, and daily-habit reads — R15 each</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500" />
            </button>
          </section>
        </main>
      )}

      {/* GUIDES LIST VIEW */}
      {view === 'guides' && (
        <main className="max-w-2xl mx-auto px-4 py-6">
          <h2 style={{ fontFamily: FONT_DISPLAY }} className="text-2xl mb-1">Health guides</h2>
          <p className="text-xs text-slate-500 mb-6">General wellness reading, written by our team. R15 each, yours to keep.</p>
          <div className="space-y-3">
            {shuffledGuides.map((g) => {
              const Icon = g.icon;
              return (
                <div
                  key={g.id}
                  className="bg-slate-900 border border-slate-800 rounded-xl p-4"
                >
                  <button
                    onClick={() => { setSelectedGuide(g); setView('guide-detail'); }}
                    className="w-full flex items-start gap-3 text-left"
                  >
                    <div className="w-9 h-9 rounded-full bg-teal-300/10 flex items-center justify-center text-teal-300 shrink-0 mt-0.5">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[10px] uppercase tracking-wide text-slate-500 mb-0.5" style={{ fontFamily: FONT_MONO }}>
                        {g.category} · {g.minutes} min
                      </div>
                      <div className="text-sm font-medium text-slate-100">{g.title}</div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-600 shrink-0 ml-2 mt-1" />
                  </button>
                  <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between">
                    <span className="text-sm text-slate-300" style={{ fontFamily: FONT_MONO }}>R{g.price}</span>
                    {cart[g.id] ? (
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => removeFromCart(g.id)}
                          className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-slate-200 hover:bg-slate-700"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-5 text-center text-sm" style={{ fontFamily: FONT_MONO }}>{cart[g.id]}</span>
                        <button
                          onClick={() => addToCart(g.id)}
                          className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-slate-200 hover:bg-slate-700"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => addToCart(g.id)}
                        className="text-xs font-medium text-slate-950 bg-teal-300 hover:bg-teal-200 transition-colors px-3 py-1.5 rounded-full"
                      >
                        Buy guide
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </main>
      )}

      {/* GUIDE DETAIL VIEW */}
      {view === 'guide-detail' && selectedGuide && (
        <main className="max-w-2xl mx-auto px-4 py-6">
          <div className="text-[10px] uppercase tracking-wide text-teal-300/80 mb-2" style={{ fontFamily: FONT_MONO }}>
            {selectedGuide.category} · {selectedGuide.minutes} min read
          </div>
          <h2 style={{ fontFamily: FONT_DISPLAY }} className="text-3xl leading-tight mb-4">
            {selectedGuide.title}
          </h2>

          <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-xl p-3 mb-6">
            <span className="text-sm text-slate-300" style={{ fontFamily: FONT_MONO }}>R{selectedGuide.price}</span>
            {cart[selectedGuide.id] ? (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => removeFromCart(selectedGuide.id)}
                  className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-slate-200 hover:bg-slate-700"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-5 text-center text-sm" style={{ fontFamily: FONT_MONO }}>{cart[selectedGuide.id]}</span>
                <button
                  onClick={() => addToCart(selectedGuide.id)}
                  className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-slate-200 hover:bg-slate-700"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => addToCart(selectedGuide.id)}
                className="text-sm font-medium text-slate-950 bg-teal-300 hover:bg-teal-200 transition-colors px-4 py-2 rounded-full"
              >
                Buy guide
              </button>
            )}
          </div>

          <div className="space-y-4">
            {selectedGuide.body.map((para, i) => (
              <p key={i} className="text-sm text-slate-300 leading-relaxed">{para}</p>
            ))}
          </div>
          <p className="text-xs text-slate-600 mt-8 pt-4 border-t border-slate-800">
            This is general information, not medical advice. Talk to a doctor about what's right for you.
          </p>
          <button
            onClick={() => setView('guides')}
            className="mt-6 text-teal-300 text-sm hover:underline flex items-center gap-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> All guides
          </button>
        </main>
      )}

      {/* CART VIEW */}
      {view === 'cart' && (
        <main className="max-w-2xl mx-auto px-4 py-6">
          <h2 style={{ fontFamily: FONT_DISPLAY }} className="text-2xl mb-4">Your cart</h2>
          {cartItems.length === 0 ? (
            <div className="text-center py-16 text-slate-500">
              <Droplet className="w-8 h-8 mx-auto mb-3 opacity-40" />
              <p className="text-sm">Nothing in here yet.</p>
              <button onClick={() => setView('catalog')} className="mt-4 text-teal-300 text-sm hover:underline">
                Browse packs
              </button>
            </div>
          ) : (
            <>
              <div className="space-y-3 mb-6">
                {cartItems.map(({ pack, qty }) => (
                  <div key={pack.id} className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-lg p-3">
                    <div>
                      <div className="text-sm font-medium text-slate-100">{pack.name}</div>
                      <div className="text-xs text-slate-500" style={{ fontFamily: FONT_MONO }}>R{pack.price} × {qty}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => removeFromCart(pack.id)} className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center hover:bg-slate-700">
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-5 text-center text-sm" style={{ fontFamily: FONT_MONO }}>{qty}</span>
                      <button onClick={() => addToCart(pack.id)} className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center hover:bg-slate-700">
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between border-t border-slate-800 pt-4 mb-6">
                <span className="text-slate-400 text-sm">Total</span>
                <span className="text-xl font-medium" style={{ fontFamily: FONT_MONO }}>R{cartTotal}</span>
              </div>
              <button
                onClick={() => setView('checkout')}
                className="w-full bg-teal-300 hover:bg-teal-200 text-slate-950 font-medium py-3 rounded-full flex items-center justify-center gap-1.5 transition-colors"
              >
                Continue to delivery <ChevronRight className="w-4 h-4" />
              </button>
            </>
          )}
        </main>
      )}

      {/* CHECKOUT VIEW */}
      {view === 'checkout' && (
        <main className="max-w-2xl mx-auto px-4 py-6">
          <h2 style={{ fontFamily: FONT_DISPLAY }} className="text-2xl mb-1">Delivery details</h2>
          <p className="text-xs text-slate-500 mb-6">Card payment is simulated in this demo. Cash on delivery works as shown.</p>

          <div className="space-y-3 mb-6">
            <input
              placeholder="Full name"
              value={address.name}
              onChange={(e) => setAddress({ ...address, name: e.target.value })}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2.5 text-sm placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-400/50"
            />
            <input
              type="tel"
              placeholder="Cell phone number"
              value={address.phone}
              onChange={(e) => setAddress({ ...address, phone: e.target.value })}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2.5 text-sm placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-400/50"
            />
            <input
              placeholder="Street address"
              value={address.street}
              onChange={(e) => setAddress({ ...address, street: e.target.value })}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2.5 text-sm placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-400/50"
            />
            <div className="flex gap-3">
              <input
                placeholder="City"
                value={address.city}
                onChange={(e) => setAddress({ ...address, city: e.target.value })}
                className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2.5 text-sm placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-400/50"
              />
              <input
                placeholder="ZIP"
                value={address.zip}
                onChange={(e) => setAddress({ ...address, zip: e.target.value })}
                className="w-28 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2.5 text-sm placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-400/50"
              />
            </div>
          </div>

          <div className="mb-6">
            <div className="text-xs text-slate-500 mb-2 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" /> Delivery window
            </div>
            <div className="grid grid-cols-3 gap-2">
              {DELIVERY_WINDOWS.map((w) => (
                <button
                  key={w.id}
                  onClick={() => setAddress({ ...address, window: w.id })}
                  className={`rounded-lg border px-2 py-2.5 text-center transition-colors ${
                    address.window === w.id
                      ? 'border-teal-300 bg-teal-300/10 text-teal-200'
                      : 'border-slate-800 bg-slate-900 text-slate-400'
                  }`}
                >
                  <div className="text-[10px] uppercase tracking-wide">{w.period}</div>
                  <div className="text-xs mt-0.5" style={{ fontFamily: FONT_MONO }}>{w.label}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <div className="text-xs text-slate-500 mb-2 flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5" /> Payment method
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setAddress({ ...address, payment: 'card' })}
                className={`rounded-lg border px-3 py-2.5 flex items-center gap-2 transition-colors ${
                  address.payment === 'card'
                    ? 'border-teal-300 bg-teal-300/10 text-teal-200'
                    : 'border-slate-800 bg-slate-900 text-slate-400'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                <span className="text-sm">Card</span>
              </button>
              <button
                onClick={() => setAddress({ ...address, payment: 'cash' })}
                className={`rounded-lg border px-3 py-2.5 flex items-center gap-2 transition-colors ${
                  address.payment === 'cash'
                    ? 'border-teal-300 bg-teal-300/10 text-teal-200'
                    : 'border-slate-800 bg-slate-900 text-slate-400'
                }`}
              >
                <Banknote className="w-4 h-4" />
                <span className="text-sm">Cash on delivery</span>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-slate-800 pt-4 mb-6">
            <span className="text-slate-400 text-sm">Total</span>
            <span className="text-xl font-medium" style={{ fontFamily: FONT_MONO }}>R{cartTotal}</span>
          </div>

          <button
            onClick={placeOrder}
            disabled={!canCheckout}
            className="w-full bg-orange-300 hover:bg-orange-200 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 font-medium py-3 rounded-full transition-colors"
          >
            Confirm order
          </button>
        </main>
      )}

      {/* TRACKING VIEW */}
      {view === 'tracking' && order && (
        <main className="max-w-2xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-1">
            <h2 style={{ fontFamily: FONT_DISPLAY }} className="text-2xl">Order {order.id}</h2>
          </div>
          <p className="text-xs text-slate-500 mb-6" style={{ fontFamily: FONT_MONO }}>
            R{order.total} · {order.items.reduce((a, i) => a + i.qty, 0)} packs
          </p>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 mb-6">
            {STAGES.map((s, i) => {
              const reached = STAGES.findIndex((x) => x.key === order.stage) >= i;
              const Icon = s.icon;
              const ts = order.timestamps[s.key];
              return (
                <div key={s.key} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${
                      reached ? 'bg-teal-300/15 border-teal-300 text-teal-300' : 'border-slate-700 text-slate-600'
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    {i < STAGES.length - 1 && (
                      <div className={`w-px flex-1 my-1 ${reached ? 'bg-teal-300/40' : 'bg-slate-800'}`} style={{ minHeight: '28px' }} />
                    )}
                  </div>
                  <div className="pb-6">
                    <div className={`text-sm ${reached ? 'text-slate-100' : 'text-slate-600'}`}>{s.label}</div>
                    {ts && (
                      <div className="text-[11px] text-slate-500" style={{ fontFamily: FONT_MONO }}>
                        {new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-6">
            <div className="text-[11px] text-slate-500 mb-2 flex items-center gap-1.5" style={{ fontFamily: FONT_MONO }}>
              <MapPin className="w-3.5 h-3.5" /> DELIVERING TO
            </div>
            <div className="text-sm text-slate-200">{order.address.name}</div>
            <div className="text-sm text-slate-400">{order.address.street}, {order.address.city} {order.address.zip}</div>
            <div className="text-sm text-slate-400 mt-1 flex items-center gap-1.5">
              <Phone className="w-3 h-3" /> {order.address.phone}
            </div>
            <div className="text-sm text-slate-400 mt-1 flex items-center gap-1.5">
              {order.address.payment === 'cash' ? <Banknote className="w-3 h-3" /> : <CreditCard className="w-3 h-3" />}
              {order.address.payment === 'cash' ? 'Cash on delivery' : 'Card'}
            </div>
          </div>

          {order.stage === 'delivered' ? (
            <button
              onClick={startNewOrder}
              className="w-full bg-teal-300 hover:bg-teal-200 text-slate-950 font-medium py-3 rounded-full transition-colors"
            >
              Start a new order
            </button>
          ) : (
            <p className="text-center text-xs text-slate-600">Tracking updates automatically.</p>
          )}
        </main>
      )}

      {/* CHAT WIDGET */}
      {!chatOpen && (
        <button
          onClick={openChat}
          className="fixed bottom-5 right-5 z-30 w-14 h-14 rounded-full bg-teal-300 hover:bg-teal-200 text-slate-950 flex items-center justify-center shadow-lg shadow-black/40 transition-colors"
          aria-label="Open chat support"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      )}

      {chatOpen && (
        <div className="fixed inset-x-0 bottom-0 z-30 max-w-2xl mx-auto sm:bottom-5 sm:right-5 sm:left-auto sm:inset-x-auto sm:w-96">
          <div className="bg-slate-900 border border-slate-800 sm:rounded-2xl rounded-t-2xl shadow-2xl shadow-black/50 flex flex-col h-[75vh] sm:h-[28rem]">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-teal-300/15 flex items-center justify-center text-teal-300">
                  <Bot className="w-4 h-4" />
                </div>
                <span style={{ fontFamily: FONT_DISPLAY }} className="text-sm font-medium">GOOLIES Support</span>
              </div>
              <button onClick={() => setChatOpen(false)} className="text-slate-500 hover:text-slate-300">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              {chatMessages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                      m.role === 'user'
                        ? 'bg-teal-300 text-slate-950'
                        : 'bg-slate-800 text-slate-100'
                    }`}
                  >
                    {m.content}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className="flex justify-start">
                  <div className="bg-slate-800 text-slate-400 rounded-2xl px-3 py-2 text-sm">···</div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <div className="flex items-center gap-2 p-3 border-t border-slate-800">
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') sendChatMessage(); }}
                placeholder="Ask about your order..."
                className="flex-1 bg-slate-950 border border-slate-800 rounded-full px-4 py-2 text-sm placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-400/50"
              />
              <button
                onClick={sendChatMessage}
                disabled={!chatInput.trim() || chatLoading}
                className="w-9 h-9 rounded-full bg-teal-300 hover:bg-teal-200 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 flex items-center justify-center shrink-0 transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

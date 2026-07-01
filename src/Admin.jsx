import React, { useState } from 'react';
import { Lock, Package, DollarSign, TrendingUp, RefreshCw, Phone, MapPin } from 'lucide-react';

const FONT_MONO = "'IBM Plex Mono', monospace";

export default function Admin() {
  const [password, setPassword] = useState('');
  const [authed, setAuthed] = useState(false);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadOrders = async (pw) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/orders?password=${encodeURIComponent(pw)}`);
      if (res.status === 401) {
        setError('Wrong password.');
        setLoading(false);
        return;
      }
      const data = await res.json();
      setOrders(Array.isArray(data) ? data : []);
      setAuthed(true);
    } catch (e) {
      setError('Could not load orders. Check your connection and try again.');
    }
    setLoading(false);
  };

  const handleLogin = (e) => {
    e.preventDefault();
    loadOrders(password);
  };

  if (!authed) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center px-4" style={{ fontFamily: "'Inter', sans-serif" }}>
        <form onSubmit={handleLogin} className="w-full max-w-xs">
          <div className="flex items-center gap-2 mb-4 text-teal-300">
            <Lock className="w-5 h-5" />
            <span className="text-sm tracking-wide">GOOLIES ADMIN</span>
          </div>
          <input
            type="password"
            placeholder="Admin password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2.5 text-sm placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-400/50 mb-3"
            autoFocus
          />
          {error && <p className="text-xs text-red-400 mb-3">{error}</p>}
          <button
            type="submit"
            disabled={loading || !password}
            className="w-full bg-teal-300 hover:bg-teal-200 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 font-medium py-2.5 rounded-full transition-colors"
          >
            {loading ? 'Checking…' : 'Log in'}
          </button>
        </form>
      </div>
    );
  }

  const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total || 0), 0);
  const orderCount = orders.length;
  const avgOrder = orderCount ? (totalRevenue / orderCount).toFixed(0) : 0;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100" style={{ fontFamily: "'Inter', sans-serif" }}>
      <header className="border-b border-slate-800 px-4 py-3 flex items-center justify-between sticky top-0 bg-slate-950/90 backdrop-blur">
        <span className="text-sm tracking-wide text-teal-300">GOOLIES ADMIN</span>
        <button
          onClick={() => loadOrders(password)}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        <div className="grid grid-cols-3 gap-3 mb-8">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center gap-1.5 text-slate-500 text-[11px] mb-1">
              <Package className="w-3.5 h-3.5" /> ORDERS
            </div>
            <div className="text-2xl font-medium" style={{ fontFamily: FONT_MONO }}>{orderCount}</div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center gap-1.5 text-slate-500 text-[11px] mb-1">
              <DollarSign className="w-3.5 h-3.5" /> REVENUE
            </div>
            <div className="text-2xl font-medium" style={{ fontFamily: FONT_MONO }}>R{totalRevenue}</div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center gap-1.5 text-slate-500 text-[11px] mb-1">
              <TrendingUp className="w-3.5 h-3.5" /> AVG ORDER
            </div>
            <div className="text-2xl font-medium" style={{ fontFamily: FONT_MONO }}>R{avgOrder}</div>
          </div>
        </div>

        <h2 className="text-sm text-slate-400 mb-3">Recent orders</h2>
        {orders.length === 0 ? (
          <p className="text-sm text-slate-600">No orders yet.</p>
        ) : (
          <div className="space-y-2">
            {orders.map((o) => (
              <div key={o.order_id} className="bg-slate-900 border border-slate-800 rounded-lg p-3">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium" style={{ fontFamily: FONT_MONO }}>{o.order_id}</span>
                  <span className="text-sm text-teal-300" style={{ fontFamily: FONT_MONO }}>R{o.total}</span>
                </div>
                <div className="text-xs text-slate-400 flex items-center gap-1.5 mb-0.5">
                  <MapPin className="w-3 h-3" /> {o.customer_name} — {o.street}, {o.city} {o.zip}
                </div>
                <div className="text-xs text-slate-500 flex items-center gap-1.5">
                  <Phone className="w-3 h-3" /> {o.customer_phone} · {o.payment_method === 'cash' ? 'Cash on delivery' : 'Card'} · {o.stage}
                </div>
                <div className="text-[10px] text-slate-600 mt-1">
                  {new Date(o.created_at).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
          }

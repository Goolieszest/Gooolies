// POST /api/orders — saves a new order to Supabase.
// Requires SUPABASE_URL and SUPABASE_SERVICE_KEY env vars (server-side only).

export default async function handler(req, res) {
  if (req.method === 'POST') {
    return createOrder(req, res);
  }
  if (req.method === 'GET') {
    return listOrders(req, res);
  }
  return res.status(405).json({ error: 'Method not allowed' });
}

async function createOrder(req, res) {
  const order = req.body;
  if (!order || !order.id) {
    return res.status(400).json({ error: 'Missing order data' });
  }

  try {
    const response = await fetch(`${process.env.SUPABASE_URL}/rest/v1/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: process.env.SUPABASE_SERVICE_KEY,
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_KEY}`,
        Prefer: 'return=representation',
      },
      body: JSON.stringify({
        order_id: order.id,
        items: order.items,
        total: order.total,
        customer_name: order.address?.name,
        customer_phone: order.address?.phone,
        street: order.address?.street,
        city: order.address?.city,
        zip: order.address?.zip,
        delivery_window: order.address?.window,
        payment_method: order.address?.payment,
        stage: order.stage,
        created_at: order.timestamps?.placed || new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(500).json({ error: 'Failed to save order', details: errText });
    }

    const data = await response.json();
    return res.status(201).json(data);
  } catch (err) {
    return res.status(500).json({ error: 'Server error saving order' });
  }
}

async function listOrders(req, res) {
  const { password } = req.query;
  if (!process.env.ADMIN_PASSWORD || password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const response = await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/orders?select=*&order=created_at.desc`,
      {
        headers: {
          apikey: process.env.SUPABASE_SERVICE_KEY,
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_KEY}`,
        },
      }
    );
    const data = await response.json();
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: 'Server error fetching orders' });
  }
}

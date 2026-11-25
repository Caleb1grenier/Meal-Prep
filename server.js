require('dotenv').config();

const path = require('path');
const express = require('express');
const { MEALS, BUNDLE, DELIVERY_DAYS } = require('./meals');

const PORT = process.env.PORT || 3000;
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;
const STRIPE_KEY = process.env.STRIPE_SECRET_KEY;
const stripe = STRIPE_KEY ? require('stripe')(STRIPE_KEY) : null;

const MAX_QTY_PER_MEAL = 20;

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Menu + config for the frontend
app.get('/api/meals', (req, res) => {
  res.json({
    meals: MEALS,
    bundle: BUNDLE,
    deliveryDays: DELIVERY_DAYS,
    paymentsEnabled: Boolean(stripe),
  });
});

// Validate the cart against the server-side menu and compute totals.
function buildOrder(items) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error('Your cart is empty.');
  }

  const lines = [];
  for (const item of items) {
    const meal = MEALS.find((m) => m.id === item.id);
    const qty = Number.parseInt(item.quantity, 10);
    if (!meal) throw new Error(`Unknown meal: ${item.id}`);
    if (!Number.isInteger(qty) || qty < 1 || qty > MAX_QTY_PER_MEAL) {
      throw new Error(`Invalid quantity for ${meal.name}.`);
    }
    lines.push({ meal, quantity: qty });
  }

  const totalMeals = lines.reduce((sum, l) => sum + l.quantity, 0);
  const subtotal = lines.reduce((sum, l) => sum + l.meal.price * l.quantity, 0);
  const discountApplies = totalMeals >= BUNDLE.minMeals;
  const discount = discountApplies ? Math.round((subtotal * BUNDLE.percentOff) / 100) : 0;

  return { lines, totalMeals, subtotal, discount, total: subtotal - discount };
}

app.post('/api/checkout', async (req, res) => {
  try {
    const { items, deliveryDay, notes } = req.body || {};
    if (!DELIVERY_DAYS.includes(deliveryDay)) {
      return res.status(400).json({ error: 'Please choose a delivery day.' });
    }

    const order = buildOrder(items);

    // Demo mode: no Stripe key configured, so skip real payment.
    if (!stripe) {
      return res.json({ url: `/success.html?demo=1&total=${order.total}` });
    }

    const lineItems = order.lines.map(({ meal, quantity }) => ({
      quantity,
      price_data: {
        currency: 'usd',
        unit_amount: meal.price,
        product_data: { name: meal.name, description: meal.description },
      },
    }));

    const sessionParams = {
      mode: 'payment',
      line_items: lineItems,
      // Stripe automatically shows cards, Apple Pay, Google Pay, Link, etc.
      // based on what you enable in your Stripe Dashboard.
      shipping_address_collection: { allowed_countries: ['US'] },
      phone_number_collection: { enabled: true },
      metadata: {
        delivery_day: deliveryDay,
        notes: String(notes || '').slice(0, 450),
      },
      success_url: `${BASE_URL}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${BASE_URL}/cancel.html`,
    };

    if (order.discount > 0) {
      const coupon = await stripe.coupons.create({
        amount_off: order.discount,
        currency: 'usd',
        duration: 'once',
        name: `Full Week Bundle (${BUNDLE.percentOff}% off)`,
        max_redemptions: 1,
      });
      sessionParams.discounts = [{ coupon: coupon.id }];
    }

    const session = await stripe.checkout.sessions.create(sessionParams);
    res.json({ url: session.url });
  } catch (err) {
    console.error('Checkout error:', err.message);
    const isStripe = err.type && err.type.startsWith('Stripe');
    res.status(isStripe ? 500 : 400).json({
      error: isStripe ? 'Payment service error. Please try again.' : err.message,
    });
  }
});

// Lets the success page show the order summary.
app.get('/api/order/:sessionId', async (req, res) => {
  if (!stripe) return res.status(404).json({ error: 'Payments not configured.' });
  try {
    const session = await stripe.checkout.sessions.retrieve(req.params.sessionId);
    res.json({
      status: session.payment_status,
      total: session.amount_total,
      email: session.customer_details && session.customer_details.email,
      deliveryDay: session.metadata && session.metadata.delivery_day,
    });
  } catch {
    res.status(404).json({ error: 'Order not found.' });
  }
});

app.listen(PORT, () => {
  console.log(`Meal prep site running at ${BASE_URL}`);
  if (!stripe) {
    console.log('No STRIPE_SECRET_KEY set: running in DEMO mode (no real payments).');
  }
});

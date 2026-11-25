# Weekday Prep: Meal Prep Website

A starter website for a weekday meal prep business. Customers pick from 5 meals, add them to a cart, choose a delivery day and pay online with Stripe.

## Features

- Landing page with a hero section, "How it works", menu and FAQ
- 5 meals with prices, macros (calories, protein, carbs, fat) and diet tags
- Cart drawer with quantity controls, saved in the browser between visits
- Full-week bundle: 10% off when ordering 5 or more meals
- Delivery day picker (Sunday or Monday) and an order notes field for allergies
- **Payments with Stripe Checkout**: cards, Apple Pay, Google Pay and Link, with address and phone collected at checkout
- Prices are recalculated on the server, so they can't be changed from the browser
- Demo mode: without a Stripe key the whole flow works but no charge is made
- Works on phones and desktops

## Getting started

```bash
npm install
npm start
```

Open http://localhost:3000. Without a Stripe key it runs in **demo mode**.

## Turning on real payments

1. Create a free account at [stripe.com](https://stripe.com) and copy your **test** secret key from the dashboard (starts with `sk_test_`).
2. Copy the example config and add your key:
   ```bash
   cp .env.example .env
   # then edit .env and set STRIPE_SECRET_KEY
   ```
3. Restart the server. Checkout now sends you to Stripe's payment page.
   Test with card `4242 4242 4242 4242`, any future expiry date and any CVC.
4. When you're ready to go live, swap in your live key (`sk_live_...`) and set `BASE_URL` to your real domain.

To pick which payment methods appear (Apple Pay, Google Pay, Klarna, etc.), go to **Stripe Dashboard → Settings → Payment methods**.

## Customizing

| What | Where |
| --- | --- |
| Meals, prices, macros, bundle discount, delivery days | `meals.js` |
| Page text, FAQ, branding | `public/index.html` |
| Colors and fonts | the `:root` variables at the top of `public/styles.css` |
| Cart and checkout behavior | `public/app.js` |
| Payment logic | `server.js` |

## Project structure

```
server.js          Express server and Stripe checkout API
meals.js           Menu and pricing data
public/
  index.html       Main site
  styles.css       Styles
  app.js           Menu rendering, cart, checkout
  success.html     Order confirmation page
  cancel.html      Checkout canceled page
```

## Ideas for next steps

- A Stripe webhook (`checkout.session.completed`) to save orders to a database and email the kitchen
- Weekly subscriptions using Stripe Billing (`mode: 'subscription'`)
- An admin page to update the weekly menu
- Real food photos in place of the emoji art
- An order cutoff time (for example, orders close Thursday at midnight)

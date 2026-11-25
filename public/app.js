(() => {
  const CART_KEY = 'weekday-prep-cart';
  const state = { meals: [], bundle: { minMeals: 5, percentOff: 10 }, cart: {} };

  const $ = (id) => document.getElementById(id);
  const money = (cents) => `$${(cents / 100).toFixed(2)}`;

  function loadCart() {
    try { state.cart = JSON.parse(localStorage.getItem(CART_KEY)) || {}; } catch { state.cart = {}; }
  }
  function saveCart() {
    try { localStorage.setItem(CART_KEY, JSON.stringify(state.cart)); } catch { /* ignore */ }
  }

  function setQty(id, qty) {
    if (qty <= 0) delete state.cart[id];
    else state.cart[id] = Math.min(qty, 20);
    saveCart();
    render();
  }

  function totals() {
    let count = 0, subtotal = 0;
    for (const [id, qty] of Object.entries(state.cart)) {
      const meal = state.meals.find((m) => m.id === id);
      if (!meal) continue;
      count += qty;
      subtotal += meal.price * qty;
    }
    const discount = count >= state.bundle.minMeals ? Math.round(subtotal * state.bundle.percentOff / 100) : 0;
    return { count, subtotal, discount, total: subtotal - discount };
  }

  function renderMenu() {
    $('menuGrid').innerHTML = state.meals.map((m) => {
      const qty = state.cart[m.id] || 0;
      return `
      <article class="meal-card">
        <div class="meal-art" style="--c:${m.color}"><span>${m.emoji}</span></div>
        <div class="meal-body">
          <div class="tags">${m.tags.map((t) => `<span class="tag">${t}</span>`).join('')}</div>
          <h3>${m.name}</h3>
          <p>${m.description}</p>
          <ul class="macros">
            <li><strong>${m.calories}</strong>cal</li>
            <li><strong>${m.protein}g</strong>protein</li>
            <li><strong>${m.carbs}g</strong>carbs</li>
            <li><strong>${m.fat}g</strong>fat</li>
          </ul>
          <div class="meal-foot">
            <span class="price">${money(m.price)}</span>
            ${qty === 0
              ? `<button class="btn btn-primary btn-sm" data-add="${m.id}">Add</button>`
              : `<div class="stepper">
                   <button data-dec="${m.id}" aria-label="Remove one">−</button>
                   <span>${qty}</span>
                   <button data-inc="${m.id}" aria-label="Add one">+</button>
                 </div>`}
          </div>
        </div>
      </article>`;
    }).join('');
  }

  function renderCart() {
    const t = totals();
    $('cartCount').textContent = t.count;

    const entries = Object.entries(state.cart);
    $('cartItems').innerHTML = entries.length === 0
      ? '<p class="empty">Your cart is empty. Add a few meals to get started!</p>'
      : entries.map(([id, qty]) => {
          const m = state.meals.find((x) => x.id === id);
          if (!m) return '';
          return `
          <div class="cart-item">
            <span class="ci-emoji" style="--c:${m.color}">${m.emoji}</span>
            <div class="ci-info"><strong>${m.name}</strong><span>${money(m.price)} each</span></div>
            <div class="stepper small">
              <button data-dec="${id}" aria-label="Remove one">−</button>
              <span>${qty}</span>
              <button data-inc="${id}" aria-label="Add one">+</button>
            </div>
          </div>`;
        }).join('');

    const left = state.bundle.minMeals - t.count;
    $('bundleHint').textContent = t.count === 0 ? ''
      : left > 0 ? `Add ${left} more meal${left > 1 ? 's' : ''} to save ${state.bundle.percentOff}%!`
      : `🎉 Full-week bundle applied: ${state.bundle.percentOff}% off!`;

    $('subtotal').textContent = money(t.subtotal);
    $('discount').textContent = `-${money(t.discount)}`;
    $('discountRow').hidden = t.discount === 0;
    $('total').textContent = money(t.total);
    $('checkoutBtn').disabled = t.count === 0;
  }

  function render() { renderMenu(); renderCart(); }

  function openCart() {
    $('cart').classList.add('open');
    $('cart').setAttribute('aria-hidden', 'false');
    $('overlay').hidden = false;
  }
  function closeCart() {
    $('cart').classList.remove('open');
    $('cart').setAttribute('aria-hidden', 'true');
    $('overlay').hidden = true;
  }

  document.addEventListener('click', (e) => {
    const t = e.target.closest('button');
    if (!t) return;
    if (t.dataset.add) { setQty(t.dataset.add, 1); }
    else if (t.dataset.inc) { setQty(t.dataset.inc, (state.cart[t.dataset.inc] || 0) + 1); }
    else if (t.dataset.dec) { setQty(t.dataset.dec, (state.cart[t.dataset.dec] || 0) - 1); }
  });

  $('cartBtn').addEventListener('click', openCart);
  $('closeCart').addEventListener('click', closeCart);
  $('overlay').addEventListener('click', closeCart);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeCart(); });

  $('checkoutBtn').addEventListener('click', async () => {
    const btn = $('checkoutBtn');
    const err = $('checkoutError');
    err.hidden = true;
    btn.disabled = true;
    btn.textContent = 'Redirecting to payment…';
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: Object.entries(state.cart).map(([id, quantity]) => ({ id, quantity })),
          deliveryDay: $('deliveryDay').value,
          notes: $('notes').value,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Checkout failed.');
      localStorage.removeItem(CART_KEY);
      window.location.href = data.url;
    } catch (e) {
      err.textContent = e.message;
      err.hidden = false;
      btn.disabled = false;
      btn.textContent = 'Checkout';
    }
  });

  async function init() {
    $('year').textContent = new Date().getFullYear();
    loadCart();
    try {
      const res = await fetch('/api/meals');
      const data = await res.json();
      state.meals = data.meals;
      state.bundle = data.bundle;
      $('bundlePct').textContent = data.bundle.percentOff;
      $('deliveryDay').innerHTML = data.deliveryDays.map((d) => `<option>${d}</option>`).join('');
      $('demoNotice').hidden = data.paymentsEnabled;
    } catch {
      $('menuGrid').innerHTML = '<p class="error">Could not load the menu. Please refresh.</p>';
      return;
    }
    render();
  }

  init();
})();

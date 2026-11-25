// The single source of truth for the menu and pricing.
// Prices are in cents. The server always recalculates totals from this file,
// so customers can't change prices from the browser.

const MEALS = [
  {
    id: 'lemon-herb-chicken',
    name: 'Lemon Herb Chicken & Quinoa',
    description: 'Grilled chicken thigh, lemon-garlic quinoa, roasted broccoli and a lemon-herb drizzle.',
    price: 1199,
    calories: 540,
    protein: 45,
    carbs: 42,
    fat: 18,
    tags: ['High Protein', 'Gluten Free'],
    emoji: '🍋',
    color: '#f4d35e',
  },
  {
    id: 'teriyaki-salmon',
    name: 'Teriyaki Salmon Rice Bowl',
    description: 'Glazed Atlantic salmon over jasmine rice with edamame, carrots and sesame cucumbers.',
    price: 1399,
    calories: 610,
    protein: 38,
    carbs: 58,
    fat: 22,
    tags: ['Omega-3', 'Dairy Free'],
    emoji: '🍣',
    color: '#ee964b',
  },
  {
    id: 'turkey-taco-bowl',
    name: 'Turkey Taco Burrito Bowl',
    description: 'Seasoned ground turkey, cilantro-lime rice, black beans, corn salsa and chipotle crema.',
    price: 1149,
    calories: 580,
    protein: 40,
    carbs: 60,
    fat: 16,
    tags: ['Fan Favorite'],
    emoji: '🌮',
    color: '#f95738',
  },
  {
    id: 'beef-broccoli',
    name: 'Beef & Broccoli Stir-Fry',
    description: 'Tender flank steak and broccoli in a ginger-garlic sauce with brown rice.',
    price: 1299,
    calories: 590,
    protein: 42,
    carbs: 50,
    fat: 20,
    tags: ['High Protein', 'Dairy Free'],
    emoji: '🥦',
    color: '#5a8f29',
  },
  {
    id: 'mediterranean-chickpea',
    name: 'Mediterranean Chickpea Bowl',
    description: 'Crispy chickpeas, herbed farro, cucumber, tomato, olives, pickled onion and lemon tahini.',
    price: 1099,
    calories: 520,
    protein: 20,
    carbs: 68,
    fat: 19,
    tags: ['Vegan', 'High Fiber'],
    emoji: '🫒',
    color: '#0d3b66',
  },
];

// Ordering 5 or more meals (a full work week) earns a discount.
const BUNDLE = {
  minMeals: 5,
  percentOff: 10,
};

const DELIVERY_DAYS = ['Sunday', 'Monday'];

module.exports = { MEALS, BUNDLE, DELIVERY_DAYS };

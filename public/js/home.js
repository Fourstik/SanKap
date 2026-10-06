// home.js — fills the Featured Restaurants section with the top 3 from the API
(function () {
  const container = document.getElementById('featuredCards');
  if (!container) return;

  // Small helper: make an element with a class and (safe) text
  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text; // textContent = never runs as HTML
    return node;
  }

  function buildCard(r) {
    const card = el('article', 'card');

    // Header: name on the left, stars + number on the right
    const header = el('div', 'card__header');
    header.append(el('h3', 'card__name', r.name));

    const rating = el('div', 'card__rating');
    const filled = Math.round(r.rating);
    rating.append(
      el('span', 'card__stars', '★'.repeat(filled) + '☆'.repeat(5 - filled)),
      el('span', 'card__num', r.rating.toFixed(1))
    );
    header.append(rating);

    // Body: cuisine badge + location
    const body = el('div', 'card__body');
    const meta = el('div', 'card__meta');
    meta.append(
      el('span', 'badge badge--' + r.cuisine.toLowerCase(), r.cuisine),
      el('span', '', '📍 ' + r.address)
    );
    body.append(meta);

    // Footer: tappable phone number
    const footer = el('div', 'card__footer');
    const contact = el('a', 'card__contact', '📞 ' + r.contact);
    contact.href = 'tel:' + r.contact;
    footer.append(contact);

    card.append(header, body, footer);
    return card;
  }

  function showError() {
    container.replaceChildren();
    const msg = el('p', 'section-sub', "Couldn't load restaurants. Please try again later.");
    msg.style.gridColumn = '1 / -1';
    msg.style.textAlign = 'center';
    container.append(msg);
  }

  fetch('/api/restaurants?sort=rating_desc&limit=3')
    .then((res) => {
      if (!res.ok) throw new Error('Request failed');
      return res.json();
    })
    .then((restaurants) => {
      container.replaceChildren(...restaurants.map(buildCard)); // swaps out the skeletons
    })
    .catch(showError);
})();
// shared.js — card builders used by the homepage and Browse

// Make an element with a class and (safe) text
function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text; 
  return node;
}

function starsText(rating) {
  const filled = Math.round(rating);
  return '★'.repeat(filled) + '☆'.repeat(5 - filled);
}

function contactLink(className, contact) {
  const a = el('a', className, '📞 ' + contact);
  a.href = 'tel:' + contact;
  return a;
}

// Grid card (same markup that index already uses)
function buildCard(r) {
  const card = el('article', 'card');

  const header = el('div', 'card__header');
  header.append(el('h3', 'card__name', r.name));
  const rating = el('div', 'card__rating');
  rating.append(el('span', 'card__stars', starsText(r.rating)), el('span', 'card__num', r.rating.toFixed(1)));
  header.append(rating);

  const body = el('div', 'card__body');
  const meta = el('div', 'card__meta');
  meta.append(el('span', 'badge badge--' + r.cuisine.toLowerCase(), r.cuisine), el('span', '', '📍 ' + r.address));
  body.append(meta);

  const footer = el('div', 'card__footer');
  footer.append(contactLink('card__contact', r.contact));

  card.append(header, body, footer);
  return card;
}

// List-view row
function buildListItem(r) {
  const item = el('article', 'list-item');

  const left = el('div', 'list-item__left');
  left.append(el('h3', 'list-item__name', r.name));
  const meta = el('div', 'list-item__meta');
  meta.append(el('span', 'badge badge--' + r.cuisine.toLowerCase(), r.cuisine), el('span', '', '📍 ' + r.address));
  left.append(meta);

  const right = el('div', 'list-item__right');
  const rating = el('div', 'list-item__rating');
  rating.append(el('span', 'list-item__stars', starsText(r.rating)), el('span', 'list-item__num', r.rating.toFixed(1)));
  right.append(rating, contactLink('list-item__contact', r.contact));

  item.append(left, right);
  return item;
}
// home.js — fills the Featured Restaurants section with the top 3 from the API
(function () {
  const container = document.getElementById('featuredCards');
  if (!container) return;

  function showError() {
    const msg = el('p', 'section-sub', "Couldn't load restaurants. Please try again later.");
    msg.style.gridColumn = '1 / -1';
    msg.style.textAlign = 'center';
    container.replaceChildren(msg);
  }

  fetch('/api/restaurants?sort=rating_desc&limit=3')
    .then((res) => {
      if (!res.ok) throw new Error('Request failed');
      return res.json();
    })
    .then((list) => container.replaceChildren(...list.map(buildCard)))
    .catch(showError);
})();
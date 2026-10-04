/**
 * Regal Spritz website → Shopify order sync (Google Apps Script).
 *
 * Every website order (regal.famcoventures.com) is also created as a real Shopify order,
 * so Shopify gives it the next #RS number (no duplicate order IDs) and the dashboard's
 * Shopify sync picks it up on its own (every 30 minutes, or with "Sync now").
 *
 * Setup (once): see README.md in this folder. In short:
 *   1. Paste this file into your website's Apps Script project as a new file "ShopifySync".
 *   2. Project Settings → Script properties: add SHOPIFY_SHOP and either
 *      SHOPIFY_CLIENT_ID + SHOPIFY_CLIENT_SECRET (Dev Dashboard app) or SHOPIFY_ADMIN_TOKEN.
 *   3. In your existing 'order' handler, after the order is saved, add one line:
 *        try { pushOrderToShopify(order); } catch (e) { queueShopifyOrder_(order, e); }
 *   4. Run setupShopifyRetry() once from the editor (retries failed sends every 10 minutes).
 *   5. Run testShopifyConnection() once to check the keys.
 */
var SHOPIFY_API_VERSION = '2025-07';

function shopifyProps_() {
  var p = PropertiesService.getScriptProperties();
  return {
    shop: p.getProperty('SHOPIFY_SHOP') || 'tjs1uz-4a.myshopify.com',
    id: p.getProperty('SHOPIFY_CLIENT_ID'),
    secret: p.getProperty('SHOPIFY_CLIENT_SECRET'),
    token: p.getProperty('SHOPIFY_ADMIN_TOKEN')
  };
}

// Access token: a fixed admin token, or a 24-hour client-credentials token (cached ~23 hours).
function shopifyToken_() {
  var c = shopifyProps_();
  if (c.token) return c.token;
  if (!c.id || !c.secret) throw new Error('Add SHOPIFY_CLIENT_ID and SHOPIFY_CLIENT_SECRET (or SHOPIFY_ADMIN_TOKEN) in Script properties.');
  var cache = CacheService.getScriptCache(), hit = cache.get('shopify_token');
  if (hit) return hit;
  var r = UrlFetchApp.fetch('https://' + c.shop + '/admin/oauth/access_token', {
    method: 'post', contentType: 'application/x-www-form-urlencoded', muteHttpExceptions: true,
    payload: { grant_type: 'client_credentials', client_id: c.id, client_secret: c.secret }
  });
  var j = JSON.parse(r.getContentText() || '{}');
  if (!j.access_token) throw new Error('Shopify token failed (' + r.getResponseCode() + '): ' + r.getContentText().slice(0, 200));
  cache.put('shopify_token', j.access_token, 6 * 60 * 60); // Apps Script cache max is 6 hours
  return j.access_token;
}

function shopifyGql_(query, variables) {
  var c = shopifyProps_();
  var r = UrlFetchApp.fetch('https://' + c.shop + '/admin/api/' + SHOPIFY_API_VERSION + '/graphql.json', {
    method: 'post', contentType: 'application/json', muteHttpExceptions: true,
    headers: { 'X-Shopify-Access-Token': shopifyToken_() },
    payload: JSON.stringify({ query: query, variables: variables || {} })
  });
  var j = JSON.parse(r.getContentText() || '{}');
  if (r.getResponseCode() >= 300 || j.errors) throw new Error('Shopify error ' + r.getResponseCode() + ': ' + JSON.stringify(j.errors || j).slice(0, 300));
  return j.data;
}

var FIND_Q = 'query RSWebOrderFind($q: String!, $h: String!) { orders(first: 1, query: $q) { nodes { id name } } products(first: 1, query: $h) { nodes { id variants(first: 1) { nodes { id } } } } }';
var CREATE_M = 'mutation RSWebOrderCreate($order: OrderCreateOrderInput!, $options: OrderCreateOptionsInput) { orderCreate(order: $order, options: $options) { order { id name } userErrors { field message } } }';

function money_(n) { return { shopMoney: { amount: String(Math.round((Number(n) || 0) * 100) / 100), currencyCode: 'PHP' } }; }

/**
 * Creates the Shopify order for one website order. Safe to call twice: an order already
 * sent (same website ref) is not created again. Returns the Shopify order name, e.g. "#RS9992".
 * `o` is the order object the website sends: { ref, first, last, email, mobile, address, shipping,
 * total, due, pointsUsed, payment, delivery, note, items: [{ t, v, q, p, h }] }.
 */
function pushOrderToShopify(o) {
  if (!o || !o.ref) throw new Error('Order has no ref.');
  var refTag = 'WEB-' + String(o.ref).replace(/[^A-Za-z0-9-]/g, '');
  var found = shopifyGql_(FIND_Q, { q: 'tag:"' + refTag + '"', h: 'handle:__none__' });
  if (found.orders.nodes.length) return found.orders.nodes[0].name;

  var lines = (o.items || []).map(function (i) {
    var line = { title: String(i.t || 'Item'), quantity: Math.max(1, Number(i.q) || 1), priceSet: money_(i.p), requiresShipping: true };
    if (i.v) line.variantTitle = String(i.v);
    if (i.h) { // link to the Shopify product when the website id is a product handle
      try {
        var hit = shopifyGql_(FIND_Q, { q: 'tag:__none__', h: 'handle:' + String(i.h) }).products.nodes[0];
        if (hit && hit.variants.nodes[0]) { line.variantId = hit.variants.nodes[0].id; delete line.title; delete line.variantTitle; }
      } catch (e) { /* keep it as a custom line */ }
    }
    return line;
  });
  var itemsSum = (o.items || []).reduce(function (a, i) { return a + (Number(i.p) || 0) * (Number(i.q) || 1); }, 0);
  var bal = Number((String(o.note || '').match(/Balance before delivery (\d+(?:\.\d+)?)/) || [])[1]) || 0;
  var discount = Math.round((itemsSum + (Number(o.shipping) || 0) - ((Number(o.total) || 0) + bal)) * 100) / 100;
  var pre = (o.items || []).some(function (i) { return /pre-?order/i.test(String(i.v || '')); });
  var a = o.address || {};
  var order = {
    currency: 'PHP',
    email: o.email || null,
    phone: o.mobile || null,
    sourceName: 'regal-website',
    sourceIdentifier: String(o.ref),
    financialStatus: 'PENDING',
    tags: ['WEBSITE', refTag].concat(pre ? ['PREORDER'] : []),
    note: ['Website order ' + o.ref, 'Pay: ' + (o.payment || '-'), 'Delivery: ' + (o.delivery || '-'), 'Due now: ₱' + (o.due || 0), bal ? 'Balance before delivery: ₱' + bal : '', o.pointsUsed ? 'Points used: ' + o.pointsUsed : '', o.note || ''].filter(String).join(' | '),
    lineItems: lines,
    shippingAddress: {
      firstName: o.first || '', lastName: o.last || '', phone: o.mobile || '', countryCode: 'PH', zip: a.zip || '',
      address1: [a.addr, a.brgy].filter(String).join(', '), address2: [a.landmark ? 'Landmark: ' + a.landmark : '', a.prov].filter(String).join(' · '), city: a.city || ''
    },
    shippingLines: [{ title: o.delivery || 'Shipping', priceSet: money_(o.shipping) }],
    customer: { toUpsert: { email: o.email || null, phone: o.mobile || null, firstName: o.first || '', lastName: o.last || '' } }
  };
  if (discount >= 1) order.discountCode = { itemFixedDiscountCode: { code: 'WEBSITE', amountSet: money_(discount) } };
  if (!order.email) delete order.email;
  if (!order.customer.toUpsert.email && !order.customer.toUpsert.phone) delete order.customer;

  var res = shopifyGql_(CREATE_M, { order: order, options: { sendReceipt: false, inventoryBehaviour: 'DECREMENT_OBEYING_POLICY' } }).orderCreate;
  if (res.userErrors && res.userErrors.length) {
    // A customer that clashes with an existing account: retry without the customer link.
    if (order.customer && res.userErrors.some(function (e) { return /customer|email|phone/i.test(e.message); })) {
      delete order.customer;
      res = shopifyGql_(CREATE_M, { order: order, options: { sendReceipt: false, inventoryBehaviour: 'DECREMENT_OBEYING_POLICY' } }).orderCreate;
    }
    if (res.userErrors && res.userErrors.length) throw new Error(res.userErrors.map(function (e) { return e.message; }).join('; '));
  }
  return res.order.name;
}

// Failed sends wait here and are retried every 10 minutes, so no order is lost.
function queueShopifyOrder_(o, err) {
  var p = PropertiesService.getScriptProperties(), q = JSON.parse(p.getProperty('SHOPIFY_QUEUE') || '[]');
  if (!q.some(function (x) { return x.ref === o.ref; })) q.push(o);
  p.setProperty('SHOPIFY_QUEUE', JSON.stringify(q));
  console.warn('Queued website order ' + o.ref + ' for Shopify: ' + (err && err.message));
}
function retryShopifyQueue() {
  var lock = LockService.getScriptLock(); if (!lock.tryLock(5000)) return;
  try {
    var p = PropertiesService.getScriptProperties(), q = JSON.parse(p.getProperty('SHOPIFY_QUEUE') || '[]'), left = [];
    q.forEach(function (o) { try { console.log(o.ref + ' → ' + pushOrderToShopify(o)); } catch (e) { left.push(o); console.warn(o.ref + ': ' + e.message); } });
    p.setProperty('SHOPIFY_QUEUE', JSON.stringify(left));
  } finally { lock.releaseLock(); }
}
function setupShopifyRetry() {
  ScriptApp.getProjectTriggers().filter(function (t) { return t.getHandlerFunction() === 'retryShopifyQueue'; }).forEach(function (t) { ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger('retryShopifyQueue').timeBased().everyMinutes(10).create();
}
function testShopifyConnection() {
  var d = shopifyGql_('{ shop { name myshopifyDomain } }');
  console.log('Connected to ' + d.shop.name + ' (' + d.shop.myshopifyDomain + ')');
}

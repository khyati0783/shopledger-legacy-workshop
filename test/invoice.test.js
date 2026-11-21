'use strict';

var test = require('node:test');
var assert = require('node:assert/strict');
var invoice = require('../lib/invoice');
var pricing = require('../lib/pricing');

// All fixtures are in memory. These tests document existing billing/invoice behavior;
// they do not read or write data/db.json.
test('invoice uses the item HSN GST slab', function () {
  var items = [{ id: 1, name: 'Rice', sku: 'RICE', hsn: '1006', price: 100, qty: 1 }];
  var billed = pricing.computeTotals(items, '');
  var figures = invoice.computeInvoiceFigures({ items: items });

  assert.equal(billed.tax, 5);
  assert.equal(billed.total, 105);
  assert.equal(figures.tax, 5);
  assert.equal(figures.total, 105);
});

test('invoice accepts decimal GST rates on order lines', function () {
  var figures = invoice.computeInvoiceFigures({
    items: [{ name: 'Item', price: 100, qty: 1, gstRate: 0.05 }]
  });

  assert.equal(figures.rows[0].gstPercent, 5);
  assert.equal(figures.tax, 5);
  assert.equal(figures.total, 105);
});

test('invoice coupon discount is calculated on subtotal, matching the order ledger', function () {
  var items = [{ id: 2, name: 'Coffee', hsn: '0901', price: 1000, qty: 1 }];
  var billed = pricing.computeTotals(items, 'SAVE10');
  var figures = invoice.computeInvoiceFigures({ items: items, coupon: 'SAVE10' });

  assert.equal(billed.discount, 100);
  assert.equal(billed.total, 1062);
  assert.equal(figures.discount, 100);
  assert.equal(figures.total, 1062);
});

test('invoice renders computed CGST and SGST in the breakdown', function () {
  var order = {
    id: 42,
    date: '2026-01-01',
    total: 105,
    items: [{ name: 'Rice', hsn: '1006', price: 100, qty: 1 }]
  };
  var figures = invoice.computeInvoiceFigures(order);
  var html = invoice.render(order);

  assert.equal(figures.tax, 5);
  assert.equal(figures.cgst, 2.5);
  assert.equal(figures.sgst, 2.5);
  assert.match(html, />CGST</);
  assert.match(html, />SGST</);
  assert.doesNotMatch(html, /CGST \+ SGST \(Total GST\)/);
});



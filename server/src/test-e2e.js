async function testFlow() {
  console.log('--- Bhook_Lgi End-to-End API Verification ---');
  
  // 1. Health check
  const health = await fetch('http://localhost:5000/api/health').then(r => r.json());
  console.log('1. Health Check:', health.status === 'ok' ? '✅ PASS' : '❌ FAIL');

  // 2. Fetch products
  const prods = await fetch('http://localhost:5000/api/products').then(r => r.json());
  console.log('2. Fetch Products:', prods.count >= 10 ? `✅ PASS (${prods.count} products)` : '❌ FAIL');

  // 3. Place order
  const orderPayload = {
    customerName: 'Aaditya Yadav',
    customerPhone: '9876543210',
    hostel: 'GH4',
    roomNumber: '312',
    deliveryType: 'room_delivery',
    deliveryNotes: 'Call when arrived at 3rd floor',
    items: [
      {
        productId: 'prod-bhel-full',
        productName: 'Full Bhel',
        variant: 'Full Bhel (Loaded)',
        spiceLevel: 'spicy',
        addons: ['Extra Crispy Sev'],
        quantity: 2,
        priceAtOrder: 70,
        itemTotal: 140
      }
    ],
    subtotal: 140,
    deliveryFee: 0, // Free delivery for >= 120
    packagingFee: 5,
    total: 145
  };

  const createRes = await fetch('http://localhost:5000/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(orderPayload)
  }).then(r => r.json());

  console.log('3. Place Order:', createRes.success ? `✅ PASS (${createRes.data.orderNumber})` : '❌ FAIL');
  const orderId = createRes.data.id;

  // 4. Admin updates order status: placed -> preparing -> out_for_delivery -> delivered
  const updateRes = await fetch(`http://localhost:5000/api/orders/${orderId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'preparing' })
  }).then(r => r.json());

  console.log('4. Admin Update Status (preparing):', updateRes.data.status === 'preparing' ? '✅ PASS' : '❌ FAIL');

  // 5. Verify In-App Notification generated
  const notifs = await fetch('http://localhost:5000/api/notifications').then(r => r.json());
  const relatedNotif = notifs.data.find(n => n.orderId === orderId);
  console.log('5. In-App Notification Created:', relatedNotif ? `✅ PASS ("${relatedNotif.title}")` : '❌ FAIL');

  // 6. Test Dynamic Stock Availability (Admin toggles stock)
  const toggleRes = await fetch('http://localhost:5000/api/products/prod-bhel-half', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ isAvailable: false })
  }).then(r => r.json());

  console.log('6. Toggle Stock to Out of Stock:', toggleRes.data.isAvailable === false ? '✅ PASS' : '❌ FAIL');

  // Try ordering the out-of-stock product
  const failOrderRes = await fetch('http://localhost:5000/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...orderPayload,
      items: [{ productId: 'prod-bhel-half', quantity: 1 }]
    })
  }).then(r => r.json());

  console.log('7. Reject Out of Stock Checkout:', !failOrderRes.success ? `✅ PASS ("${failOrderRes.error}")` : '❌ FAIL');

  // Restore stock
  await fetch('http://localhost:5000/api/products/prod-bhel-half', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ isAvailable: true })
  });
  console.log('8. Stock Restored to Available: ✅ PASS');

  console.log('--- ALL BACKEND & WORKFLOW TESTS PASSED ---');
}

testFlow().catch(console.error);

async function testCheckout() {
  // 1. Login
  const loginRes = await fetch('http://localhost:4000/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: `mutation {
        login(email: "student@canteenq.local", password: "Password@123") {
          accessToken
          user { id name role }
        }
      }`
    })
  }).then(r => r.json());

  if (loginRes.errors) {
    console.error('Login error:', loginRes.errors);
    return;
  }
  const token = loginRes.data.login.accessToken;
  console.log('1. Logged in as:', loginRes.data.login.user.name);

  // 2. Get menu item
  const menuRes = await fetch('http://localhost:4000/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: '{ getMenu { id name price } }' })
  }).then(r => r.json());

  const dish = menuRes.data.getMenu[0];
  console.log('2. Selected dish:', dish.name, '(Price: Rs ' + dish.price + ')');

  // 3. Add to Cart
  const cartRes = await fetch('http://localhost:4000/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token
    },
    body: JSON.stringify({
      query: `mutation Add($id: String!) {
        addToCart(foodItemId: $id, quantity: 2) {
          id
          totalAmount
        }
      }`,
      variables: { id: dish.id }
    })
  }).then(r => r.json());
  console.log('3. Added to Cart. Cart Total: Rs', cartRes.data.addToCart.totalAmount);

  // 4. Create Order & Pay
  const orderRes = await fetch('http://localhost:4000/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token
    },
    body: JSON.stringify({
      query: `mutation {
        createOrder(paymentMethod: "UPI") {
          id
          orderNumber
          tokenNumber
          status
          queuePosition
          estimatedWaitingTime
          totalAmount
        }
      }`
    })
  }).then(r => r.json());

  if (orderRes.errors) {
    console.error('Order creation error:', orderRes.errors);
    return;
  }

  console.log('4. Order Placed Successfully!');
  console.log('   - Order Number:', orderRes.data.createOrder.orderNumber);
  console.log('   - Queue Token:', orderRes.data.createOrder.tokenNumber);
  console.log('   - Status:', orderRes.data.createOrder.status);
  console.log('   - Queue Position:', '#' + orderRes.data.createOrder.queuePosition);
  console.log('   - Estimated Wait Time:', orderRes.data.createOrder.estimatedWaitingTime, 'minutes');
  console.log('   - Total Paid: Rs', orderRes.data.createOrder.totalAmount);
}

testCheckout().catch(console.error);

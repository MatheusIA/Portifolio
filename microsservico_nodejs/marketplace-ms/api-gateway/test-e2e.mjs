import fs from 'fs';

const GATEWAY_URL = 'http://localhost:3005';

async function request(method, path, body = null, token = null) {
  const headers = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const options = {
    method,
    headers,
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${GATEWAY_URL}${path}`, options);
  
  const status = response.status;
  let data;
  try {
    data = await response.json();
  } catch (e) {
    data = await response.text();
  }

  return { status, data };
}

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runE2E() {
  console.log('--- Iniciando Teste E2E ---');

  // 1. Registrar seller
  console.log('\n[1] Registrando Seller...');
  const sellerEmail = `seller_${Date.now()}@test.com`;
  let res = await request('POST', '/auth/register', {
    email: sellerEmail,
    password: 'password123',
    firstName: 'Seller',
    lastName: 'Test',
    role: 'seller'
  });
  console.log(res.status, res.data);

  // 2. Registrar buyer
  console.log('\n[2] Registrando Buyer...');
  const buyerEmail = `buyer_${Date.now()}@test.com`;
  res = await request('POST', '/auth/register', {
    email: buyerEmail,
    password: 'password123',
    firstName: 'Buyer',
    lastName: 'Test',
    role: 'buyer'
  });
  console.log(res.status, res.data);

  // 3. Login seller
  console.log('\n[3] Login Seller...');
  res = await request('POST', '/auth/login', {
    email: sellerEmail,
    password: 'password123'
  });
  console.log(res.status, res.data.access_token ? 'Token recebido' : res.data);
  const sellerToken = res.data.access_token;

  // 4. Login buyer
  console.log('\n[4] Login Buyer...');
  res = await request('POST', '/auth/login', {
    email: buyerEmail,
    password: 'password123'
  });
  console.log(res.status, res.data.access_token ? 'Token recebido' : res.data);
  const buyerToken = res.data.access_token;

  if (!sellerToken || !buyerToken) {
    console.error('Falha na autenticação, abortando teste.');
    return;
  }

  // 5. Criar produto normal
  console.log('\n[5] Criando produto normal (150.00)...');
  res = await request('POST', '/products', {
    name: 'Produto Normal',
    description: 'Um produto que será aprovado',
    price: 150.00,
    stock: 10
  }, sellerToken);
  console.log(res.status, res.data);
  const normalProductId = res.data.id;

  // 6. Criar produto .99
  console.log('\n[6] Criando produto .99 (49.99)...');
  res = await request('POST', '/products', {
    name: 'Produto 99',
    description: 'Um produto que será rejeitado',
    price: 49.99,
    stock: 10
  }, sellerToken);
  console.log(res.status, res.data);
  const rejectedProductId = res.data.id;

  // 7. Listar produtos
  console.log('\n[7] Listando produtos (Buyer)...');
  res = await request('GET', '/products', null, buyerToken);
  console.log(res.status, `Encontrados ${res.data.length} produtos`);

  // Fluxo 1: Pagamento Aprovado
  console.log('\n--- Fluxo 1: Compra Aprovada ---');
  // 8. Add normal product to cart
  console.log('[8] Adicionando produto normal ao carrinho...');
  res = await request('POST', '/cart/items', {
    productId: normalProductId,
    quantity: 1
  }, buyerToken);
  console.log(res.status, res.data);

  // 10. Realizar checkout
  console.log('\n[10] Realizando checkout...');
  res = await request('POST', '/cart/checkout', {
    paymentMethod: 'credit_card'
  }, buyerToken);
  console.log(res.status, res.data);
  const orderId1 = res.data.id;

  // 11. Consultar pedido
  console.log(`\n[11] Consultando pedido ${orderId1}...`);
  res = await request('GET', `/orders/${orderId1}`, null, buyerToken);
  console.log(res.status, `Status: ${res.data.status}`);

  // 12. Aguardar
  console.log('\n[12] Aguardando processamento (3s)...');
  await delay(3000);

  // Consultar pedido novamente
  console.log(`\n[12.1] Consultando pedido novamente ${orderId1}...`);
  res = await request('GET', `/orders/${orderId1}`, null, buyerToken);
  console.log(res.status, `Status Atualizado: ${res.data.status}`);

  // 13. Consultar pagamento
  console.log(`\n[13] Consultando pagamento via gateway ${orderId1}...`);
  res = await request('GET', `/payments/${orderId1}`, null, buyerToken);
  console.log(res.status, res.data);

  // Fluxo 2: Pagamento Rejeitado
  console.log('\n--- Fluxo 2: Compra Rejeitada ---');
  // 14. Add .99 product to cart
  console.log('[14] Adicionando produto .99 ao carrinho...');
  res = await request('POST', '/cart/items', {
    productId: rejectedProductId,
    quantity: 1
  }, buyerToken);
  console.log(res.status, res.data);

  // 16. Realizar checkout
  console.log('\n[16] Realizando checkout...');
  res = await request('POST', '/cart/checkout', {
    paymentMethod: 'credit_card'
  }, buyerToken);
  console.log(res.status, res.data);
  const orderId2 = res.data.id;

  // 18. Aguardar
  console.log('\n[18] Aguardando processamento (3s)...');
  await delay(3000);

  // Consultar pedido novamente
  console.log(`\n[18.1] Consultando pedido novamente ${orderId2}...`);
  res = await request('GET', `/orders/${orderId2}`, null, buyerToken);
  console.log(res.status, `Status Atualizado: ${res.data.status}`);

  // 19. Consultar pagamento
  console.log(`\n[19] Consultando pagamento via gateway ${orderId2}...`);
  res = await request('GET', `/payments/${orderId2}`, null, buyerToken);
  console.log(res.status, res.data);

  console.log('\n--- Fim do Teste ---');
}

runE2E().catch(console.error);

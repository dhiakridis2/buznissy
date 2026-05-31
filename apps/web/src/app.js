const apiBaseUrl = "http://127.0.0.1:4000";
let activeStore = null;
let activeOwner = null;
let accessToken = null;

const apiStatus = document.querySelector("#apiStatus");
const authState = document.querySelector("#authState");
const registerForm = document.querySelector("#registerForm");
const loginForm = document.querySelector("#loginForm");
const storeForm = document.querySelector("#storeForm");
const productForm = document.querySelector("#productForm");
const serviceForm = document.querySelector("#serviceForm");
const storeSlug = document.querySelector("#storeSlug");
const storeName = document.querySelector("#storeName");
const storeDescription = document.querySelector("#storeDescription");
const products = document.querySelector("#productList");
const services = document.querySelector("#serviceList");
const productMetric = document.querySelector("#productMetric");
const serviceMetric = document.querySelector("#serviceMetric");
const salesMetric = document.querySelector("#salesMetric");
const storeStatusMetric = document.querySelector("#storeStatusMetric");
const productCount = document.querySelector("#productCount");
const serviceCount = document.querySelector("#serviceCount");
const mockCheckout = document.querySelector("#mockCheckout");
const checkoutResult = document.querySelector("#checkoutResult");
const ownerScreenTabs = document.querySelector("#ownerScreenTabs");
const customerScreenTabs = document.querySelector("#customerScreenTabs");
const ownerPhoneScreen = document.querySelector("#ownerPhoneScreen");
const customerPhoneScreen = document.querySelector("#customerPhoneScreen");
const logoMarkup = '<img src="/assets/buznissy-logo.png" alt="Buznissy logo" />';

async function api(path, options = {}) {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...options,
    headers: {
      "content-type": "application/json",
      ...(options.headers || {}),
    },
  });
  const body = await response.json();

  if (!response.ok) {
    throw new Error(body.message || "API request failed.");
  }

  return body;
}

function formData(form) {
  return Object.fromEntries(new FormData(form).entries());
}

function money(value) {
  return `${Number(value || 0).toFixed(3)} OMR`;
}

function setOwnerSession(session) {
  activeOwner = session.owner;
  accessToken = session.accessToken;
  authState.textContent = `Signed in as ${activeOwner.fullName}`;
  checkoutResult.textContent = "Owner session ready.";
}

function renderItems(target, items, emptyText, render) {
  target.innerHTML = "";

  if (items.length === 0) {
    target.innerHTML = `<div class="item"><div class="itemMedia">+</div><span>${emptyText}</span></div>`;
    return;
  }

  for (const item of items) {
    const element = document.createElement("article");
    element.className = "item";
    element.innerHTML = render(item);
    target.append(element);
  }
}

async function refreshStorefront() {
  if (!activeStore) {
    return;
  }

  const [productList, serviceList] = await Promise.all([
    api(`/stores/${activeStore.slug}/products`),
    api(`/stores/${activeStore.slug}/services`),
  ]);

  storeSlug.textContent = activeStore.slug;
  storeName.textContent = activeStore.name;
  storeDescription.textContent = activeStore.description || "No description yet.";

  renderItems(products, productList, "No products yet.", (product) => {
    return `<div class="itemMedia">${product.name.slice(0, 1).toUpperCase()}</div><strong>${product.name}</strong><span>${money(product.price)} - Stock ${product.stock}</span>`;
  });

  renderItems(services, serviceList, "No services yet.", (service) => {
    return `<div class="itemMedia">${service.name.slice(0, 1).toUpperCase()}</div><strong>${service.name}</strong><span>${money(service.price)} - ${service.durationMinutes} min</span>`;
  });

  productMetric.textContent = String(productList.length);
  serviceMetric.textContent = String(serviceList.length);
  productCount.textContent = `${productList.length} item${productList.length === 1 ? "" : "s"}`;
  serviceCount.textContent = `${serviceList.length} item${serviceList.length === 1 ? "" : "s"}`;
  salesMetric.textContent = money(productList.reduce((total, item) => total + Number(item.price || 0), 0));
  storeStatusMetric.textContent = activeStore.status;
}

async function checkApi() {
  try {
    await api("/health");
    apiStatus.textContent = "API connected";
    apiStatus.closest(".sidebarStatus").classList.add("ok");
  } catch {
    apiStatus.textContent = "API offline";
    apiStatus.closest(".sidebarStatus").classList.remove("ok");
  }
}

registerForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const session = await api("/auth/register", {
    method: "POST",
    body: JSON.stringify(formData(registerForm)),
  });
  setOwnerSession(session);
});

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const session = await api("/auth/login", {
    method: "POST",
    body: JSON.stringify(formData(loginForm)),
  });
  setOwnerSession(session);
});

storeForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!accessToken) {
    checkoutResult.textContent = "Register or login as owner first.";
    return;
  }
  activeStore = await api("/stores", {
    method: "POST",
    body: JSON.stringify(formData(storeForm)),
  });
  checkoutResult.textContent = `${activeStore.name} is ready.`;
  await refreshStorefront();
});

productForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!activeStore) {
    checkoutResult.textContent = "Create a store first.";
    return;
  }

  await api(`/stores/${activeStore.slug}/products`, {
    method: "POST",
    body: JSON.stringify(formData(productForm)),
  });
  checkoutResult.textContent = "Product added to storefront.";
  await refreshStorefront();
});

serviceForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!activeStore) {
    checkoutResult.textContent = "Create a store first.";
    return;
  }

  await api(`/stores/${activeStore.slug}/services`, {
    method: "POST",
    body: JSON.stringify(formData(serviceForm)),
  });
  checkoutResult.textContent = "Service added to storefront.";
  await refreshStorefront();
});

mockCheckout.addEventListener("click", async () => {
  if (!activeStore) {
    checkoutResult.textContent = "Create a store first.";
    return;
  }

  const intent = await api(`/stores/${activeStore.slug}/payment-intents`, {
    method: "POST",
    body: JSON.stringify({ amount: 12, currency: "OMR" }),
  });

  checkoutResult.textContent = intent.message;
});

const ownerScreens = [
  {
    id: "splash",
    label: "Splash",
    html: `
      <div class="phoneLogo">${logoMarkup}</div>
      <div class="phoneTitle" style="justify-content:center;text-align:center">
        <div>
          <h3>BUZNISSY</h3>
          <p class="eyebrow">Store owner app</p>
        </div>
      </div>
    `,
  },
  {
    id: "onboarding",
    label: "Onboarding",
    html: `
      <div class="walkthroughArt"></div>
      <div class="phoneTitle">
        <div>
          <h3>Build, sell, and manage</h3>
          <p>Launch products, services, bookings, and orders from one polished mobile console.</p>
        </div>
      </div>
      <div class="paginationDots"><span></span><span class="active"></span><span></span></div>
      <div class="bottomTabs"><span>Skip</span><span class="active">Next</span></div>
    `,
  },
  {
    id: "gateway",
    label: "Gateway",
    html: `
      <div class="phoneTitle">
        <div><p class="eyebrow">Welcome</p><h3>Start your store</h3></div>
        <span class="languagePill">EN / AR</span>
      </div>
      <div class="gatewayActions">
        <button class="glassAction primary">Create New Store</button>
        <button class="glassAction">Login to Existing Store</button>
      </div>
      <div class="shimmer" style="margin-top:26px"></div>
      <div class="shimmer" style="width:72%;margin-top:10px"></div>
    `,
  },
  {
    id: "wizard",
    label: "Wizard",
    html: `
      <div class="phoneTitle">
        <div><p class="eyebrow">Step 1 / 3</p><h3>Create store</h3></div>
        <span class="phoneChip">Draft</span>
      </div>
      <div class="wizardStack">
        <input class="wizardInput" value="Al Noor Gifts" readonly />
        <textarea class="wizardInput" readonly>Premium gifts and handmade items from Oman.</textarea>
        <div class="categoryCard active"><strong>Products</strong><p>Sell physical catalog items.</p></div>
        <div class="categoryCard"><strong>Services</strong><p>Accept service bookings.</p></div>
        <div class="categoryCard"><strong>Both Categories</strong><p>Use products and services together.</p></div>
        <div class="domainInput"><input value="al-noor" readonly /><span>.buznissy.com</span></div>
        <div class="uploadBox">Upload store logo</div>
      </div>
    `,
  },
  {
    id: "dashboard",
    label: "Dashboard",
    html: `
      <div class="phoneTitle">
        <span>Notifications</span><h3>BUZNISSY</h3><span>EN/AR</span>
      </div>
      <p class="eyebrow">Quick glance this month</p>
      <div class="dashboardGrid" style="margin:12px 0 18px">
        <div class="metricBlock"><span>Total sales</span><strong>OMR 4,820.000</strong></div>
        <div class="metricBlock"><span>Total orders</span><strong>342</strong></div>
        <div class="metricBlock"><span>Visitors</span><strong>5,820</strong></div>
        <div class="metricBlock"><span>Pending</span><strong>14</strong></div>
      </div>
      <p class="eyebrow">Recent orders</p>
      <div class="phoneList" style="margin-top:10px">
        <div class="orderRow">#1024 - Ahmed Al-Balushi <span class="phoneBadge">Pending</span></div>
        <div class="orderRow">#1023 - Fatima Raoof <span class="phoneBadge">Completed</span></div>
      </div>
      <div class="bottomTabs"><span class="active">Dash</span><span>Items</span><span>Orders</span><span>Stats</span><span>Settings</span></div>
    `,
  },
  {
    id: "inventory",
    label: "Inventory",
    html: `
      <div class="phoneTitle"><h3>Inventory</h3><span class="phoneChip">Products</span></div>
      <div class="searchBar">Search inventory</div>
      <div class="phoneList">
        <div class="inventoryRow"><strong>Gift Box</strong><p>20 in stock - Active</p></div>
        <div class="inventoryRow"><strong>Omani Candle</strong><p>8 in stock - Active</p></div>
        <div class="inventoryRow"><strong>Gift wrapping</strong><p>60 min - Service</p></div>
      </div>
      <div class="durationRail" style="margin-top:16px"><span>30 min</span><span>1 hour</span><span>2 hours</span></div>
    `,
  },
  {
    id: "orders",
    label: "Orders",
    html: `
      <div class="phoneTitle"><h3>Orders</h3><span class="phoneChip">All</span></div>
      <div class="durationRail"><span>All</span><span>Pending</span><span>Completed</span></div>
      <div class="phoneList" style="margin-top:14px">
        <div class="orderRow"><strong>#1024</strong><p>Ahmed - 2 items - OMR 15.000</p><span class="phoneBadge">View Details</span></div>
        <div class="orderRow"><strong>#1023</strong><p>Fatima - 1 service - OMR 25.000</p><span class="phoneBadge">View Details</span></div>
      </div>
    `,
  },
  {
    id: "analytics",
    label: "Analytics",
    html: `
      <div class="phoneTitle"><h3>Analytics</h3><span class="phoneChip">Month</span></div>
      <div class="durationRail"><span>Week</span><span>Month</span><span>Year</span></div>
      <div class="summaryCard" style="height:170px;margin:14px 0"><div class="shimmer" style="margin-top:60px"></div></div>
      <div class="summaryCard"><strong>Top performers</strong><p>Gift Box - OMR 1,240.000</p><p>Gift wrapping - OMR 820.000</p></div>
    `,
  },
  {
    id: "settings",
    label: "Settings",
    html: `
      <div class="phoneTitle"><h3>Settings</h3><span class="phoneChip">Owner</span></div>
      <div class="settingsList">
        <div class="accountRow">Store Properties</div>
        <div class="accountRow">Payment Options</div>
        <div class="accountRow">Logistics and Shipping</div>
        <div class="accountRow">Language Settings</div>
        <div class="accountRow">Logout</div>
      </div>
    `,
  },
];

const customerScreens = [
  {
    id: "home",
    label: "Home",
    html: `
      <div class="phoneLight" style="min-height:700px;margin:-18px;padding:18px">
        <div class="phoneTitle"><span class="brandMark">${logoMarkup}</span><h3>Al Noor Gifts</h3><span>Cart 0</span></div>
        <div class="bannerArt"></div>
        <div class="catalogGrid" style="margin-top:14px">
          <div class="productCard"><div class="productImage">G</div><strong>Gift Box</strong><p>OMR 12.000</p></div>
          <div class="productCard"><div class="productImage">C</div><strong>Candle</strong><p>OMR 6.500</p></div>
        </div>
        <div class="reviewCard" style="margin-top:14px"><strong>About the brand</strong><p>Handmade gifting, elegant packaging, and fast local service.</p></div>
      </div>
    `,
  },
  {
    id: "catalog",
    label: "Catalog",
    html: `
      <div class="phoneLight" style="min-height:700px;margin:-18px;padding:18px">
        <div class="phoneTitle"><h3>Catalog</h3><span class="phoneChip">Filter</span></div>
        <div class="searchBar">Search products</div>
        <div class="catalogGrid">
          <div class="productCard"><div class="productImage">G</div><strong>Gift Box</strong><p>OMR 12.000</p></div>
          <div class="productCard"><div class="productImage">C</div><strong>Candle</strong><p>OMR 6.500</p></div>
          <div class="productCard"><div class="productImage">P</div><strong>Perfume</strong><p>OMR 18.000</p></div>
          <div class="productCard"><div class="productImage">W</div><strong>Wrapping</strong><p>OMR 5.000</p></div>
        </div>
      </div>
    `,
  },
  {
    id: "details",
    label: "Details",
    html: `
      <div class="phoneLight" style="min-height:700px;margin:-18px;padding:18px">
        <div class="mediaHero"></div>
        <div class="phoneTitle" style="margin-top:16px"><div><h3>Premium Gift Box</h3><p>Rating 4.9 - OMR 12.000</p></div></div>
        <p>Elegant packaging with a curated handmade selection for special occasions.</p>
        <div class="stepper"><span>-</span><strong>1</strong><span>+</span></div>
        <div class="buttonDeck"><button class="outlineButton">Add to Cart</button><button>Buy Now</button></div>
      </div>
    `,
  },
  {
    id: "booking",
    label: "Booking",
    html: `
      <div class="phoneLight" style="min-height:700px;margin:-18px;padding:18px">
        <div class="phoneTitle"><h3>Book service</h3><span class="phoneChip">Gift wrap</span></div>
        <div class="summaryCard"><strong>Calendar</strong><p>Mon Tue Wed Thu Fri Sat Sun</p><div class="slotGrid" style="margin-top:12px"><span>12</span><span>13</span><span>14</span><span>15</span><span>16</span><span>17</span></div></div>
        <div class="slotGrid" style="margin-top:14px"><span>10:00</span><span>12:30</span><span>16:00</span></div>
        <input class="wizardInput" value="Customer name" readonly style="margin-top:14px;color:#111827;background:white" />
        <input class="wizardInput" value="Phone number" readonly style="margin-top:10px;color:#111827;background:white" />
        <button style="margin-top:14px">Confirm Appointment Booking</button>
      </div>
    `,
  },
  {
    id: "cart",
    label: "Cart",
    html: `
      <div class="phoneLight" style="min-height:700px;margin:-18px;padding:18px">
        <div class="phoneTitle"><h3>Cart</h3><span>2 items</span></div>
        <div class="phoneList">
          <div class="inventoryRow"><strong>Gift Box</strong><p>Quantity 1 - OMR 12.000</p></div>
          <div class="inventoryRow"><strong>Gift wrapping</strong><p>Quantity 1 - OMR 5.000</p></div>
        </div>
        <div class="checkoutSheet" style="margin-top:18px"><p>Subtotal OMR 17.000</p><strong>Total OMR 17.000</strong><button style="margin-top:12px">Proceed to Checkout</button></div>
      </div>
    `,
  },
  {
    id: "checkout",
    label: "Checkout",
    html: `
      <div class="phoneLight" style="min-height:700px;margin:-18px;padding:18px">
        <div class="phoneTitle"><h3>Checkout</h3><span class="phoneChip">Payment mock</span></div>
        <input class="wizardInput" value="Full name" readonly style="color:#111827;background:white" />
        <input class="wizardInput" value="Email" readonly style="color:#111827;background:white;margin-top:10px" />
        <input class="wizardInput" value="Shipping address" readonly style="color:#111827;background:white;margin-top:10px" />
        <div class="paymentGrid" style="margin-top:14px"><span class="summaryCard">Card</span><span class="summaryCard">Apple Pay</span><span class="summaryCard">Google Pay</span><span class="summaryCard">Cash</span></div>
        <button style="margin-top:14px">Complete Payment Transaction</button>
      </div>
    `,
  },
  {
    id: "tracking",
    label: "Tracking",
    html: `
      <div class="phoneLight" style="min-height:700px;margin:-18px;padding:18px;text-align:center">
        <div class="phoneLogo" style="margin:70px auto 20px;background:#dcfce7;color:#15803d">OK</div>
        <h3>Order confirmed</h3>
        <p>Tracking ID BZ-1024</p>
        <div class="timeline" style="text-align:left"><span>Pending</span><span>Dispatched</span><span>Completed</span></div>
      </div>
    `,
  },
  {
    id: "account",
    label: "Account",
    html: `
      <div class="phoneLight" style="min-height:700px;margin:-18px;padding:18px">
        <div class="phoneTitle"><h3>Account</h3><span class="phoneChip">Customer</span></div>
        <div class="settingsList">
          <div class="accountRow">Profile</div>
          <div class="accountRow">Saved addresses</div>
          <div class="accountRow">Order history</div>
          <div class="accountRow">Booking history</div>
          <div class="accountRow">Change language</div>
          <div class="accountRow">Logout</div>
        </div>
      </div>
    `,
  },
];

function lightHaptic() {
  if (navigator.vibrate) {
    navigator.vibrate(8);
  }
}

function renderMobileScreens(tabsTarget, screenTarget, screens, activeId = screens[0].id) {
  const activeScreen = screens.find((screen) => screen.id === activeId) || screens[0];
  tabsTarget.innerHTML = screens
    .map((screen) => {
      const active = screen.id === activeScreen.id ? " active" : "";
      return `<button class="${active}" type="button" data-screen="${screen.id}">${screen.label}</button>`;
    })
    .join("");
  screenTarget.innerHTML = activeScreen.html;

  for (const button of tabsTarget.querySelectorAll("button")) {
    button.addEventListener("click", () => {
      lightHaptic();
      renderMobileScreens(tabsTarget, screenTarget, screens, button.dataset.screen);
    });
  }
}

checkApi();
renderMobileScreens(ownerScreenTabs, ownerPhoneScreen, ownerScreens);
renderMobileScreens(customerScreenTabs, customerPhoneScreen, customerScreens);

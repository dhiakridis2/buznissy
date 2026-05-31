const apiBaseUrl = "http://127.0.0.1:4000";
let activeStore = null;

const apiStatus = document.querySelector("#apiStatus");
const storeForm = document.querySelector("#storeForm");
const productForm = document.querySelector("#productForm");
const serviceForm = document.querySelector("#serviceForm");
const storeSlug = document.querySelector("#storeSlug");
const storeName = document.querySelector("#storeName");
const storeDescription = document.querySelector("#storeDescription");
const products = document.querySelector("#products");
const services = document.querySelector("#services");
const mockCheckout = document.querySelector("#mockCheckout");
const checkoutResult = document.querySelector("#checkoutResult");

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

function renderItems(target, items, emptyText, render) {
  target.innerHTML = "";

  if (items.length === 0) {
    target.innerHTML = `<div class="item"><span>${emptyText}</span></div>`;
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
    return `<strong>${product.name}</strong><span>${money(product.price)} - Stock ${product.stock}</span>`;
  });

  renderItems(services, serviceList, "No services yet.", (service) => {
    return `<strong>${service.name}</strong><span>${money(service.price)} - ${service.durationMinutes} min</span>`;
  });
}

async function checkApi() {
  try {
    await api("/health");
    apiStatus.textContent = "API connected";
    apiStatus.classList.add("ok");
  } catch {
    apiStatus.textContent = "API offline";
    apiStatus.classList.remove("ok");
  }
}

storeForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  activeStore = await api("/stores", {
    method: "POST",
    body: JSON.stringify(formData(storeForm)),
  });
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

checkApi();

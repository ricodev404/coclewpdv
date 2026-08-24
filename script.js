const API_BASE_URL =
"https://coclew-pdv.ricardorodrigues0671.workers.dev";

let products = [];
let cart = [];
let payment = "PIX";
let sales = [];

const $ = (selector) => document.querySelector(selector);

const money = (value) =>
Number(value || 0).toLocaleString("pt-BR", {
style: "currency",
currency: "BRL",
});

function showToast(message) {
const toast = $("#toast");
if (!toast) return;

toast.textContent = message;
toast.classList.add("show");

setTimeout(() => {
toast.classList.remove("show");
}, 2200);
}

/* =========================
CARREGAR PRODUTOS
========================= */

async function loadProducts() {
try {
const response = await fetch(`${API_BASE_URL}/products`);

if (!response.ok) {
throw new Error(`Erro HTTP ${response.status}`);
}

const data = await response.json();

if (!data.ok) {
throw new Error(data.error || "Erro no Worker");
}

products = (data.products || []).map((p) => ({
id: p.id,
name: p["produto"] || "Produto sem nome",
price: Number(p["preço de venda"] || 0),
stock: Number(p["estoque"] || 0),
category: p["categoria"] || "",
image: p["imagem"] || "",
description: p["descrição"] || "",
active: p["ativo"],
}));

renderProducts();
renderProductsTable();
renderDashboard();

if (products.length === 0) {
showToast("Nenhum produto cadastrado no Baserow.");
}
} catch (error) {
console.error("Erro Coclew:", error);

products = [];

renderProducts();
renderProductsTable();
renderDashboard();

showToast("Não foi possível carregar os produtos.");
}
}

/* =========================
MOSTRAR PRODUTOS
========================= */

function renderProducts(filter = "") {
const grid = $("#productGrid");
if (!grid) return;

const search = filter.toLowerCase().trim();

const list = products.filter((product) => {
const name = String(product.name).toLowerCase();
const category = String(product.category).toLowerCase();

return (
(!search ||
name.includes(search) ||
category.includes(search)) &&
product.active !== false
);
});

if (!list.length) {
grid.innerHTML = `
<div class="empty">
${
products.length
? "Nenhum produto encontrado."
: "Nenhum produto cadastrado no Baserow."
}
</div>
`;
return;
}

grid.innerHTML = list
.map(
(product) => `
<article class="product">
<div class="product-name">
${escapeHtml(product.name)}
</div>

<div class="product-meta">
<div>
<div class="price">
${money(product.price)}
</div>

<div class="stock">
Estoque: ${product.stock}
</div>
</div>

<button
class="primary"
onclick="addToCart(${product.id})"
${product.stock <= 0 ? "disabled" : ""}
>
${product.stock <= 0 ? "Sem estoque" : "+"}
</button>
</div>
</article>
`
)
.join("");
}

/* =========================
CARRINHO
========================= */

function addToCart(id) {
const product = products.find((p) => p.id === id);

if (!product || product.stock <= 0) {
showToast("Produto sem estoque.");
return;
}

const item = cart.find((item) => item.id === id);

if (item) {
if (item.qty >= product.stock) {
showToast("Quantidade maior que o estoque.");
return;
}

item.qty++;
} else {
cart.push({
id,
qty: 1,
});
}

renderCart();
}

function changeQty(id, change) {
const item = cart.find((item) => item.id === id);
const product = products.find((p) => p.id === id);

if (!item || !product) return;

item.qty += change;

if (item.qty <= 0) {
cart = cart.filter((item) => item.id !== id);
}

if (item.qty > product.stock) {
item.qty = product.stock;
showToast("Quantidade limitada pelo estoque.");
}

renderCart();
}

function cartTotal() {
return cart.reduce((total, item) => {
const product = products.find((p) => p.id === item.id);

if (!product) return total;

return total + product.price * item.qty;
}, 0);
}

function renderCart() {
const cartCount = $("#cartCount");
const cartTotalElement = $("#cartTotal");
const cartItems = $("#cartItems");

if (!cartCount || !cartTotalElement || !cartItems) return;

cartCount.textContent = cart.reduce(
(total, item) => total + item.qty,
0
);

cartTotalElement.textContent = money(cartTotal());

if (!cart.length) {
cartItems.innerHTML = `
<div class="empty">
Seu carrinho está vazio.
</div>
`;
return;
}

cartItems.innerHTML = cart
.map((item) => {
const product = products.find((p) => p.id === item.id);

if (!product) return "";

return `
<div class="cart-row">

<div>
<div class="cart-name">
${escapeHtml(product.name)}
</div>

<div class="cart-sub">
${money(product.price)}
× ${item.qty}
=
${money(product.price * item.qty)}
</div>
</div>

<div class="qty">

<button
onclick="changeQty(${product.id}, -1)"
>
−
</button>

<b>${item.qty}</b>

<button
onclick="changeQty(${product.id}, 1)"
>
+
</button>

</div>

</div>
`;
})
.join("");
}

/* =========================
FINALIZAR VENDA
========================= */

async function finishSale() {
if (!cart.length) {
showToast("Adicione produtos ao carrinho.");
return;
}

showToast("Venda será enviada ao Worker na próxima etapa.");
}

/* =========================
TABELA DE PRODUTOS
========================= */

function renderProductsTable() {
const table = $("#productsTable");

if (!table) return;

if (!products.length) {
table.innerHTML = `
<div class="empty">
Nenhum produto cadastrado.
</div>
`;
return;
}

table.innerHTML = `
<table>

<thead>
<tr>
<th>Produto</th>
<th>Categoria</th>
<th>Preço</th>
<th>Estoque</th>
</tr>
</thead>

<tbody>

${products
.map(
(product) => `
<tr>

<td>
${escapeHtml(product.name)}
</td>

<td>
${escapeHtml(product.category || "—")}
</td>

<td>
${money(product.price)}
</td>

<td>
${product.stock}
</td>

</tr>
`
)
.join("")}

</tbody>

</table>
`;
}

/* =========================
VENDAS
========================= */

function renderSales() {
const table = $("#salesTable");

if (!table) return;

if (!sales.length) {
table.innerHTML = `
<div class="empty">
Nenhuma venda registrada.
</div>
`;
return;
}

table.innerHTML = `
<table>

<thead>
<tr>
<th>Venda</th>
<th>Data</th>
<th>Pagamento</th>
<th>Total</th>
</tr>
</thead>

<tbody>

${sales
.map(
(sale) => `
<tr>

<td>
#${String(sale.id).slice(-5)}
</td>

<td>
${new Date(
sale.created_on
).toLocaleString("pt-BR")}
</td>

<td>
${escapeHtml(sale.payment || "—")}
</td>

<td>
${money(sale.total)}
</td>

</tr>
`
)
.join("")}

</tbody>

</table>
`;
}

/* =========================
DASHBOARD
========================= */

function renderDashboard() {
const today = new Date().toDateString();

const todaySales = sales.filter(
(sale) =>
new Date(sale.created_on).toDateString() === today
);

const statSales = $("#statSales");
const statRevenue = $("#statRevenue");
const statProducts = $("#statProducts");
const statStock = $("#statStock");

if (statSales) {
statSales.textContent = todaySales.length;
}

if (statRevenue) {
statRevenue.textContent = money(
todaySales.reduce(
(total, sale) =>
total + Number(sale.total || 0),
0
)
);
}

if (statProducts) {
statProducts.textContent = products.length;
}

if (statStock) {
statStock.textContent = products.reduce(
(total, product) =>
total + Number(product.stock || 0),
0
);
}
}

/* =========================
NAVEGAÇÃO
========================= */

function setView(view) {
document
.querySelectorAll(".view")
.forEach((element) =>
element.classList.remove("active")
);

document
.querySelectorAll(".nav-btn")
.forEach((element) =>
element.classList.remove("active")
);

const target = $(`#${view}View`);

const button = document.querySelector(
`[data-view="${view}"]`
);

if (target) {
target.classList.add("active");
}

if (button) {
button.classList.add("active");
}

const titles = {
pdv: [
"Nova venda",
"Monte o pedido e finalize a venda.",
],

products: [
"Produtos",
"Cadastre e acompanhe os produtos.",
],

sales: [
"Vendas",
"Histórico das vendas realizadas.",
],

dashboard: [
"Dashboard",
"Resumo do movimento da lanchonete.",
],
};

if (titles[view]) {
$("#pageTitle").textContent = titles[view][0];
$("#pageSubtitle").textContent = titles[view][1];
}
}

/* =========================
PROTEÇÃO DE TEXTO
========================= */

function escapeHtml(value) {
return String(value ?? "")
.replaceAll("&", "&amp;")
.replaceAll("<", "&lt;")
.replaceAll(">", "&gt;")
.replaceAll('"', "&quot;")
.replaceAll("'", "&#039;");
}

/* =========================
EVENTOS
========================= */

document
.querySelectorAll(".nav-btn")
.forEach((button) => {
button.addEventListener("click", () => {
setView(button.dataset.view);
});
});

const searchInput = $("#searchInput");

if (searchInput) {
searchInput.addEventListener("input", (event) => {
renderProducts(event.target.value);
});
}

const clearCart = $("#clearCart");

if (clearCart) {
clearCart.addEventListener("click", () => {
cart = [];
renderCart();
});
}

const finishSaleButton = $("#finishSale");

if (finishSaleButton) {
finishSaleButton.addEventListener(
"click",
finishSale
);
}

document
.querySelectorAll(".payment")
.forEach((button) => {
button.addEventListener("click", () => {
document
.querySelectorAll(".payment")
.forEach((element) =>
element.classList.remove("active")
);

button.classList.add("active");

payment = button.dataset.payment;
});
});

const adminBtn = $("#adminBtn");
const adminModal = $("#adminModal");
const closeAdmin = $("#closeAdmin");

if (adminBtn && adminModal) {
adminBtn.addEventListener("click", () => {
adminModal.classList.remove("hidden");
});
}

if (closeAdmin && adminModal) {
closeAdmin.addEventListener("click", () => {
adminModal.classList.add("hidden");
});
}

if (adminModal) {
adminModal.addEventListener("click", (event) => {
if (event.target.id === "adminModal") {
adminModal.classList.add("hidden");
}
});
}

const refreshSales = $("#refreshSales");

if (refreshSales) {
refreshSales.addEventListener("click", () => {
renderSales();
showToast("Vendas atualizadas.");
});
}

const newProductBtn = $("#newProductBtn");

if (newProductBtn) {
newProductBtn.addEventListener("click", () => {
showToast(
"Cadastro será ligado ao Baserow na próxima etapa."
);
});
}

/* =========================
INICIAR COCLEW
========================= */

loadProducts();
renderCart();
renderSales();
renderDashboard();

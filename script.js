const API_URL =
"https://coclew-pdv.ricardorodrigues0671.workers.dev";

let produtos = [];
let carrinho = [];
let vendas = [];

let pagamentoSelecionado = "PIX";


// ========================================
// INICIAR
// ========================================

document.addEventListener("DOMContentLoaded", () => {

carregarProdutos();
configurarNavegacao();
configurarPagamento();
configurarBusca();
configurarBotoes();

});


// ========================================
// PRODUTOS
// ========================================

async function carregarProdutos() {

const grid =
document.getElementById("productGrid");

if (!grid) return;

grid.innerHTML =
`<div class="empty">Carregando produtos...</div>`;

try {

const response =
await fetch(`${API_URL}/products`);

if (!response.ok) {
throw new Error(`HTTP ${response.status}`);
}

const data =
await response.json();

if (!data.ok) {
throw new Error(
data.error ||
"Erro ao buscar produtos"
);
}

produtos =
data.products || [];

mostrarProdutos(produtos);

atualizarDashboard();

} catch (error) {

console.error(error);

grid.innerHTML =
`<div class="empty">
Erro ao carregar produtos.
</div>`;

}

}


// ========================================
// MOSTRAR PRODUTOS
// ========================================

function mostrarProdutos(lista) {

const grid =
document.getElementById("productGrid");

if (!grid) return;

grid.innerHTML = "";

if (!lista.length) {

grid.innerHTML =
`<div class="empty">
Nenhum produto cadastrado.
</div>`;

return;

}


lista.forEach(produto => {

const id =
produto.id;

const nome =
produto["Produto"] ??
produto["produto"] ??
"";

const categoria =
typeof produto["Categoria"] === "object"
? produto["Categoria"]?.value || ""
: produto["Categoria"] ??
produto["categoria"] ??
"";

const preco =
Number(
produto["Preço de venda"] ??
produto["preço de venda"] ??
produto["Preco de venda"] ??
0
);

const estoque =
Number(
produto["Estoque"] ??
produto["estoque"] ??
0
);

const imagem =
produto["Imagem"] ??
produto["imagem"] ??
"";

const descricao =
produto["Descrição"] ??
produto["descrição"] ??
produto["Descricao"] ??
"";

const ativo =
produto["Ativo"] ??
produto["ativo"];


if (
ativo === false ||
ativo === "false" ||
ativo === 0
) {
return;
}


let imagemURL = "";

if (typeof imagem === "string") {

imagemURL = imagem;

} else if (
Array.isArray(imagem) &&
imagem.length > 0
) {

imagemURL =
imagem[0].url ||
imagem[0].thumbnails?.card_cover?.url ||
imagem[0].thumbnails?.large?.url ||
imagem[0].thumbnails?.medium?.url ||
"";

}


const card =
document.createElement("div");

card.className =
"product-card";


card.innerHTML = `

${
imagemURL
? `
<img
src="${escapeHTML(imagemURL)}"
class="product-image"
alt="${escapeHTML(nome)}"
>
`
: `
<div class="product-image empty-image">
🥤
</div>
`
}

<div class="product-info">

<div class="product-category">
${escapeHTML(categoria)}
</div>

<h3>
${escapeHTML(nome)}
</h3>

${
descricao
? `
<p class="product-description">
${escapeHTML(descricao)}
</p>
`
: ""
}

<div class="product-bottom">

<strong>
${formatarMoeda(preco)}
</strong>

<span>
Estoque: ${estoque}
</span>

</div>

<button
class="primary full"
onclick="adicionarCarrinho(${id})"
${estoque <= 0 ? "disabled" : ""}
>
${
estoque <= 0
? "Sem estoque"
: "Adicionar"
}
</button>

</div>

`;


grid.appendChild(card);

});

}


// ========================================
// ADICIONAR CARRINHO
// ========================================

function adicionarCarrinho(id) {

const produto =
produtos.find(
p => Number(p.id) === Number(id)
);

if (!produto) return;


const nome =
produto["Produto"] ??
produto["produto"] ??
"";


const preco =
Number(
produto["Preço de venda"] ??
produto["preço de venda"] ??
produto["Preco de venda"] ??
0
);


const estoque =
Number(
produto["Estoque"] ??
produto["estoque"] ??
0
);


const existente =
carrinho.find(
item =>
Number(item.id) === Number(id)
);


if (existente) {

if (
existente.quantidade >=
estoque
) {

alert(
"Quantidade maior que o estoque."
);

return;

}


existente.quantidade++;

} else {

carrinho.push({

id,

nome,

preco,

quantidade: 1,

estoque

});

}


atualizarCarrinho();

}


// ========================================
// ATUALIZAR CARRINHO
// ========================================

function atualizarCarrinho() {

const container =
document.getElementById("cartItems");

const totalElement =
document.getElementById("cartTotal");

const countElement =
document.getElementById("cartCount");


if (!container) return;


container.innerHTML = "";


if (!carrinho.length) {

container.innerHTML =
`<div class="empty">
Seu carrinho está vazio.
</div>`;

} else {

carrinho.forEach(item => {

const subtotal =
item.preco *
item.quantidade;


const linha =
document.createElement("div");

linha.className =
"cart-item";


linha.innerHTML = `

<div>

<strong>
${escapeHTML(item.nome)}
</strong>

<small>
${item.quantidade} ×
${formatarMoeda(item.preco)}
</small>

</div>

<div>

<strong>
${formatarMoeda(subtotal)}
</strong>

<button
class="btn-remove"
onclick="removerCarrinho(${item.id})"
>
×
</button>

</div>

`;


container.appendChild(linha);

});

}


const total =
calcularTotal();


if (totalElement) {

totalElement.textContent =
formatarMoeda(total);

}


if (countElement) {

countElement.textContent =
carrinho.reduce(
(total, item) =>
total + item.quantidade,
0
);

}

}


// ========================================
// REMOVER CARRINHO
// ========================================

function removerCarrinho(id) {

const index =
carrinho.findIndex(
item =>
Number(item.id) === Number(id)
);


if (index === -1) return;


if (
carrinho[index].quantidade > 1
) {

carrinho[index].quantidade--;

} else {

carrinho.splice(index, 1);

}


atualizarCarrinho();

}


// ========================================
// TOTAL
// ========================================

function calcularTotal() {

return carrinho.reduce(
(total, item) =>
total +
Number(item.preco || 0) *
Number(item.quantidade || 0),
0
);

}


// ========================================
// FINALIZAR VENDA
// ========================================

async function finalizarVenda() {

if (!carrinho.length) {

alert(
"Adicione algum produto primeiro."
);

return;

}


const total =
calcularTotal();


const venda = {

desconto: 0,

total_bruto: total,

total_venda: total,

pagamento:
pagamentoSelecionado,

status:
"Concluída",

observacao: ""

};


try {

const response =
await fetch(
`${API_URL}/sales`,
{

method: "POST",

headers: {
"Content-Type":
"application/json"
},

body:
JSON.stringify({

venda,

itens:
carrinho

})

}
);


const data =
await response.json();


if (
!response.ok ||
!data.ok
) {

throw new Error(
data.error ||
"Erro ao registrar venda"
);

}


alert(
"Venda registrada com sucesso!"
);


carrinho = [];

atualizarCarrinho();

await carregarProdutos();

await carregarVendas();

atualizarDashboard();


} catch (error) {

console.error(error);

alert(
error.message ||
"Não foi possível registrar a venda."
);

}

}


// ========================================
// CARREGAR VENDAS
// ========================================

async function carregarVendas() {

const container =
document.getElementById(
"salesTable"
);

if (!container) return;


container.innerHTML =
`<div class="empty">
Carregando vendas...
</div>`;


try {

const response =
await fetch(
`${API_URL}/sales`
);


if (!response.ok) {

throw new Error(
`HTTP ${response.status}`
);

}


const data =
await response.json();


if (!data.ok) {

throw new Error(
data.error ||
"Erro ao buscar vendas"
);

}


vendas =
data.sales || [];


mostrarVendas(
vendas
);


atualizarDashboard();


} catch (error) {

console.error(error);

container.innerHTML =
`<div class="empty">
Erro ao carregar vendas.
</div>`;

}

}


// ========================================
// MOSTRAR VENDAS
// ========================================

function mostrarVendas(lista) {

const container =
document.getElementById(
"salesTable"
);

if (!container) return;


if (!lista.length) {

container.innerHTML =
`<div class="empty">
Nenhuma venda registrada.
</div>`;

return;

}


container.innerHTML = `

<table>

<thead>

<tr>

<th>ID</th>

<th>Data</th>

<th>Itens</th>

<th>Pagamento</th>

<th>Status</th>

<th>Total</th>

</tr>

</thead>

<tbody>

${lista.map(venda => {

// CORREÇÃO PRINCIPAL
const total =
Number(
venda["Total da Venda"] ??
venda["Total venda"] ??
venda.total_venda ??
venda["Total Bruto"] ??
venda.total_bruto ??
0
);


const pagamento =
venda["Pagamento"] ??
venda.pagamento ??
"";


const status =
venda["Status"] ??
venda.status ??
"";


const dataVenda =
venda["Criado em"] ??
venda["Data da venda"] ??
venda.data_da_venda ??
"";


const itens =
Array.isArray(
venda.itens
)
? venda.itens
: [];


const nomes =
itens
.map(item => {

if (
item.produto &&
item.produto.nome
) {

return item.produto.nome;

}

return "Produto";

})
.join(", ");


return `

<tr>

<td>
#${venda.id}
</td>

<td>
${formatarData(dataVenda)}
</td>

<td>
${escapeHTML(
nomes || "-"
)}
</td>

<td>
${escapeHTML(
String(pagamento)
)}
</td>

<td>
${escapeHTML(
String(status)
)}
</td>

<td>
<strong>
${formatarMoeda(total)}
</strong>
</td>

</tr>

`;

}).join("")}

</tbody>

</table>

`;

}


// ========================================
// DASHBOARD
// ========================================

function atualizarDashboard() {

const hoje =
new Date();


const vendasHoje =
vendas.filter(venda => {

const data =
venda["Criado em"] ??
venda["Data da venda"] ??
venda.data_da_venda ??
venda["created_on"];


if (!data) return false;


const d =
new Date(data);


return (
d.getDate() ===
hoje.getDate() &&

d.getMonth() ===
hoje.getMonth() &&

d.getFullYear() ===
hoje.getFullYear()
);

});


// ========================================
// QUANTIDADE DE VENDAS
// ========================================

const statSales =
document.getElementById(
"statSales"
);


if (statSales) {

statSales.textContent =
vendasHoje.length;

}


// ========================================
// FATURAMENTO
// ========================================

const faturamento =
vendasHoje.reduce(
(total, venda) => {

// CORREÇÃO PRINCIPAL
const valor =
Number(
venda["Total da Venda"] ??
venda["Total venda"] ??
venda.total_venda ??
venda["Total Bruto"] ??
venda.total_bruto ??
0
);


return total + valor;

},
0
);


const statRevenue =
document.getElementById(
"statRevenue"
);


if (statRevenue) {

statRevenue.textContent =
formatarMoeda(
faturamento
);

}


// ========================================
// PRODUTOS
// ========================================

const statProducts =
document.getElementById(
"statProducts"
);


if (statProducts) {

statProducts.textContent =
produtos.length;

}


// ========================================
// ESTOQUE
// ========================================

const estoqueTotal =
produtos.reduce(
(total, produto) =>
total +
Number(
produto["Estoque"] ??
produto["estoque"] ??
0
),
0
);


const statStock =
document.getElementById(
"statStock"
);


if (statStock) {

statStock.textContent =
estoqueTotal;

}

}


// ========================================
// NAVEGAÇÃO
// ========================================

function configurarNavegacao() {

const botoes =
document.querySelectorAll(
".nav-btn"
);


botoes.forEach(botao => {

botao.addEventListener(
"click",
async () => {

botoes.forEach(
b =>
b.classList.remove(
"active"
)
);


botao.classList.add(
"active"
);


const view =
botao.dataset.view;


document.querySelectorAll(
".view"
).forEach(section => {

section.classList.remove(
"active"
);

});


const target =
document.getElementById(
`${view}View`
);


if (target) {

target.classList.add(
"active"
);

}


const title =
document.getElementById(
"pageTitle"
);


const subtitle =
document.getElementById(
"pageSubtitle"
);


if (view === "pdv") {

title.textContent =
"Nova venda";

subtitle.textContent =
"Monte o pedido e finalize a venda.";

}


if (view === "products") {

title.textContent =
"Produtos";

subtitle.textContent =
"Produtos cadastrados.";

}


if (view === "sales") {

title.textContent =
"Vendas";

subtitle.textContent =
"Histórico de vendas.";

await carregarVendas();

}


if (view === "dashboard") {

title.textContent =
"Dashboard";

subtitle.textContent =
"Resumo das vendas do dia.";

await carregarVendas();

atualizarDashboard();

}

}
);

});

}


// ========================================
// PAGAMENTO
// ========================================

function configurarPagamento() {

document
.querySelectorAll(
".payment"
)
.forEach(botao => {

botao.addEventListener(
"click",
() => {

document
.querySelectorAll(
".payment"
)
.forEach(
b =>
b.classList.remove(
"active"
)
);


botao.classList.add(
"active"
);


pagamentoSelecionado =
botao.dataset.payment ||
"PIX";

}
);

});

}


// ========================================
// BUSCA
// ========================================

function configurarBusca() {

const input =
document.getElementById(
"searchInput"
);


if (!input) return;


input.addEventListener(
"input",
() => {

const termo =
input.value
.toLowerCase()
.trim();


const filtrados =
produtos.filter(
produto => {

const nome =
String(
produto["Produto"] ??
produto["produto"] ??
""
).toLowerCase();


const categoria =
String(
produto["Categoria"]?.value ??
produto["Categoria"] ??
""
).toLowerCase();


return (
nome.includes(termo) ||
categoria.includes(termo)
);

}
);


mostrarProdutos(
filtrados
);

}
);

}


// ========================================
// BOTÕES
// ========================================

function configurarBotoes() {

const finish =
document.getElementById(
"finishSale"
);


if (finish) {

finish.addEventListener(
"click",
finalizarVenda
);

}


const clear =
document.getElementById(
"clearCart"
);


if (clear) {

clear.addEventListener(
"click",
() => {

carrinho = [];

atualizarCarrinho();

}
);

}


const refreshSales =
document.getElementById(
"refreshSales"
);


if (refreshSales) {

refreshSales.addEventListener(
"click",
carregarVendas
);

}


const adminBtn =
document.getElementById(
"adminBtn"
);


const adminModal =
document.getElementById(
"adminModal"
);


const closeAdmin =
document.getElementById(
"closeAdmin"
);


if (
adminBtn &&
adminModal
) {

adminBtn.addEventListener(
"click",
() => {

adminModal.classList.remove(
"hidden"
);

}
);

}


if (
closeAdmin &&
adminModal
) {

closeAdmin.addEventListener(
"click",
() => {

adminModal.classList.add(
"hidden"
);

}
);

}

}


// ========================================
// FORMATAÇÃO
// ========================================

function formatarMoeda(valor) {

return Number(
valor || 0
).toLocaleString(
"pt-BR",
{
style: "currency",
currency: "BRL"
}
);

}


// ========================================
// DATA
// ========================================

function formatarData(valor) {

if (!valor) return "-";


const data =
new Date(valor);


if (
Number.isNaN(
data.getTime()
)
) {

return String(valor);

}


return data.toLocaleString(
"pt-BR"
);

}


// ========================================
// ESCAPAR HTML
// ========================================

function escapeHTML(valor) {

return String(
valor ?? ""
)
.replace(
/&/g,
"&amp;"
)
.replace(
/</g,
"&lt;"
)
.replace(
/>/g,
"&gt;"
)
.replace(
/"/g,
"&quot;"
)
.replace(
/'/g,
"&#039;"
);

}

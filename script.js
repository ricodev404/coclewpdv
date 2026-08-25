const API_URL =
"https://coclew-pdv.ricardorodrigues0671.workers.dev";

let produtos = [];
let vendas = [];
let carrinho = [];
let pagamentoSelecionado = "PIX";


// ========================================
// INICIAR
// ========================================

document.addEventListener("DOMContentLoaded", () => {

configurarNavegacao();
configurarBusca();
configurarPagamento();
configurarCarrinho();
configurarAdmin();

carregarProdutos();
carregarVendas();

});


// ========================================
// NAVEGAÇÃO
// ========================================

function configurarNavegacao() {

const botoes =
document.querySelectorAll(".nav-btn");

botoes.forEach(botao => {

botao.addEventListener("click", () => {

const view =
botao.dataset.view;

trocarView(view);

});

});

}


function trocarView(view) {

document.querySelectorAll(".nav-btn")
.forEach(botao => {

botao.classList.toggle(
"active",
botao.dataset.view === view
);

});


document.querySelectorAll(".view")
.forEach(secao => {

secao.classList.remove("active");

});


const secao =
document.getElementById(
`${view}View`
);


if (secao) {

secao.classList.add("active");

}


const titulo =
document.getElementById("pageTitle");

const subtitulo =
document.getElementById("pageSubtitle");


const textos = {

pdv: [
"Nova venda",
"Monte o pedido e finalize a venda."
],

products: [
"Produtos",
"Gerencie os produtos cadastrados."
],

sales: [
"Vendas",
"Consulte o histórico de vendas."
],

dashboard: [
"Dashboard",
"Resumo do seu Mini PDV."
]

};


if (textos[view]) {

titulo.textContent =
textos[view][0];

subtitulo.textContent =
textos[view][1];

}


if (view === "products") {

mostrarTabelaProdutos();

}


if (view === "sales") {

mostrarTabelaVendas();

}


if (view === "dashboard") {

atualizarDashboard();

}

}


// ========================================
// PRODUTOS
// ========================================

async function carregarProdutos() {

const grid =
document.getElementById(
"productGrid"
);


if (!grid) return;


grid.innerHTML = `
<div class="empty">
Carregando produtos...
</div>
`;


try {

const response =
await fetch(
`${API_URL}/products`,
{
method: "GET",
headers: {
"Accept":
"application/json"
}
}
);


if (!response.ok) {

throw new Error(
`Erro HTTP ${response.status}`
);

}


const data =
await response.json();


console.log(
"Produtos recebidos:",
data
);


if (!data.ok) {

throw new Error(
data.error ||
"Erro ao buscar produtos"
);

}


produtos =
Array.isArray(data.products)
? data.products
: [];


mostrarProdutos(
produtos
);


mostrarTabelaProdutos();

atualizarDashboard();


} catch (erro) {

console.error(
"Erro nos produtos:",
erro
);


grid.innerHTML = `
<div class="empty">
Erro ao carregar produtos.
<br>
${escapeHTML(erro.message)}
</div>
`;

}

}


// ========================================
// MOSTRAR PRODUTOS
// ========================================

function mostrarProdutos(lista) {

const grid =
document.getElementById(
"productGrid"
);


if (!grid) return;


grid.innerHTML = "";


if (
!Array.isArray(lista) ||
lista.length === 0
) {

grid.innerHTML = `
<div class="empty">
Nenhum produto cadastrado.
</div>
`;

return;

}


lista.forEach(produto => {

const id =
produto.ID ??
produto.id;


const nome =
produto.Produto ??
produto.produto ??
"Produto sem nome";


let categoria = "";


if (
produto.Categoria &&
typeof produto.Categoria === "object"
) {

categoria =
produto.Categoria.value ??
"";

} else {

categoria =
produto.Categoria ??
"";

}


const preco =
Number(
produto["Preço de venda"] ??
produto["preço de venda"] ??
produto["Preco de venda"] ??
0
);


const estoque =
Number(
produto.Estoque ??
produto.estoque ??
0
);


const descricao =
produto.Descrição ??
produto.descrição ??
produto.Descricao ??
"";


const ativo =
produto.Ativo ??
produto.ativo ??
true;


if (
ativo === false ||
ativo === "false" ||
ativo === 0
) {

return;

}


const imagem =
obterImagem(produto.Imagem);


const card =
document.createElement("div");


card.className =
"product-card";


card.innerHTML = `

${
imagem
? `
<img
src="${escapeHTML(imagem)}"
class="product-image"
alt="${escapeHTML(nome)}"
loading="lazy"
>
`
: `
<div class="product-image product-no-image">
🥤
</div>
`
}


<div class="product-info">

${
categoria
? `
<div class="product-category">
${escapeHTML(categoria)}
</div>
`
: ""
}


<h3>
${escapeHTML(nome)}
</h3>


${
descricao
? `
<p>
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
data-add-product="${escapeHTML(String(id))}"
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


const botao =
card.querySelector(
"[data-add-product]"
);


if (botao) {

botao.addEventListener(
"click",
() => {

adicionarCarrinho(id);

}
);

}


grid.appendChild(card);

});

}


// ========================================
// IMAGEM
// ========================================

function obterImagem(imagem) {

if (
typeof imagem === "string" &&
imagem
) {

return imagem;

}


if (
Array.isArray(imagem) &&
imagem.length > 0
) {

const arquivo =
imagem[0];


return (
arquivo.url ||
arquivo.thumbnails?.card_cover?.url ||
arquivo.thumbnails?.small?.url ||
""
);

}


return "";

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

const texto =
input.value
.trim()
.toLowerCase();


if (!texto) {

mostrarProdutos(
produtos
);

return;

}


const filtrados =
produtos.filter(produto => {

const nome =
String(
produto.Produto ?? ""
).toLowerCase();


let categoria = "";


if (
produto.Categoria &&
typeof produto.Categoria ===
"object"
) {

categoria =
String(
produto.Categoria.value ??
""
).toLowerCase();

} else {

categoria =
String(
produto.Categoria ??
""
).toLowerCase();

}


return (
nome.includes(texto) ||
categoria.includes(texto)
);

});


mostrarProdutos(
filtrados
);

}
);

}


// ========================================
// CARRINHO
// ========================================

function configurarCarrinho() {

const limpar =
document.getElementById(
"clearCart"
);


if (limpar) {

limpar.addEventListener(
"click",
() => {

carrinho = [];

atualizarCarrinho();

}
);

}


const finalizar =
document.getElementById(
"finishSale"
);


if (finalizar) {

finalizar.addEventListener(
"click",
finalizarVenda
);

}

}


function adicionarCarrinho(id) {

const produto =
produtos.find(
p =>
String(
p.ID ?? p.id
) === String(id)
);


if (!produto) {

alert(
"Produto não encontrado."
);

return;

}


const nome =
produto.Produto ??
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
produto.Estoque ??
produto.estoque ??
0
);


if (estoque <= 0) {

alert(
"Produto sem estoque."
);

return;

}


const existente =
carrinho.find(
item =>
String(item.id) ===
String(id)
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

estoque,

quantidade: 1

});

}


atualizarCarrinho();

}


// ========================================
// ATUALIZAR CARRINHO
// ========================================

function atualizarCarrinho() {

const container =
document.getElementById(
"cartItems"
);


const total =
document.getElementById(
"cartTotal"
);


const contador =
document.getElementById(
"cartCount"
);


if (!container) return;


container.innerHTML = "";


if (
carrinho.length === 0
) {

container.innerHTML = `
<div class="empty">
Seu carrinho está vazio.
</div>
`;

} else {

carrinho.forEach(item => {

const linha =
document.createElement("div");


linha.className =
"cart-item";


const subtotal =
item.preco *
item.quantidade;


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
class="text-btn"
data-remove="${escapeHTML(String(item.id))}"
>
×
</button>

</div>

`;


const remover =
linha.querySelector(
"[data-remove]"
);


if (remover) {

remover.addEventListener(
"click",
() => {

removerCarrinho(
item.id
);

}
);

}


container.appendChild(
linha
);

});

}


const valor =
calcularTotal();


if (total) {

total.textContent =
formatarMoeda(valor);

}


if (contador) {

contador.textContent =
carrinho.reduce(
(total, item) =>
total +
item.quantidade,
0
);

}

}


function removerCarrinho(id) {

const index =
carrinho.findIndex(
item =>
String(item.id) ===
String(id)
);


if (index === -1) return;


if (
carrinho[index].quantidade > 1
) {

carrinho[index].quantidade--;

} else {

carrinho.splice(
index,
1
);

}


atualizarCarrinho();

}


function calcularTotal() {

return carrinho.reduce(
(total, item) =>
total +
item.preco *
item.quantidade,
0
);

}


// ========================================
// PAGAMENTO
// ========================================

function configurarPagamento() {

const botoes =
document.querySelectorAll(
".payment"
);


botoes.forEach(botao => {

botao.addEventListener(
"click",
() => {

botoes.forEach(b => {

b.classList.remove(
"active"
);

});


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
// FINALIZAR VENDA
// ========================================

async function finalizarVenda() {

if (
carrinho.length === 0
) {

alert(
"Adicione algum produto primeiro."
);

return;

}


const total =
calcularTotal();


const venda = {

data_da_venda:
new Date().toISOString(),

total_bruto:
total,

desconto:
0,

total_venda:
total,

pagamento:
pagamentoSelecionado,

status:
"Concluída",

observacao:
""

};


try {

const response =
await fetch(
`${API_URL}/sales`,
{

method: "POST",

headers: {
"Content-Type":
"application/json",

"Accept":
"application/json"

},

body:
JSON.stringify({

venda,

itens:
carrinho.map(item => ({

id:
item.id,

nome:
item.nome,

preco:
item.preco,

quantidade:
item.quantidade

}))

})

}
);


const data =
await response.json();


console.log(
"Resposta da venda:",
data
);


if (
!response.ok ||
!data.ok
) {

throw new Error(
data.error ||
`Erro HTTP ${response.status}`
);

}


alert(
"Venda registrada com sucesso!"
);


carrinho = [];


atualizarCarrinho();


await carregarProdutos();

await carregarVendas();


} catch (erro) {

console.error(
"Erro ao finalizar venda:",
erro
);


alert(
"Não foi possível registrar a venda.\n\n" +
erro.message
);

}

}


// ========================================
// VENDAS
// ========================================

async function carregarVendas() {

try {

const response =
await fetch(
`${API_URL}/sales`
);


if (!response.ok) {

throw new Error(
`Erro HTTP ${response.status}`
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
Array.isArray(data.sales)
? data.sales
: [];


mostrarTabelaVendas();

atualizarDashboard();


} catch (erro) {

console.error(
"Erro nas vendas:",
erro
);

}

}


// ========================================
// TABELA DE PRODUTOS
// ========================================

function mostrarTabelaProdutos() {

const tabela =
document.getElementById(
"productsTable"
);


if (!tabela) return;


if (
produtos.length === 0
) {

tabela.innerHTML = `
<div class="empty">
Nenhum produto cadastrado.
</div>
`;

return;

}


tabela.innerHTML = `

<table>

<thead>

<tr>

<th>ID</th>
<th>Produto</th>
<th>Categoria</th>
<th>Preço</th>
<th>Estoque</th>
<th>Status</th>

</tr>

</thead>


<tbody>

${produtos.map(produto => {

const id =
produto.ID ??
produto.id;


const categoria =
produto.Categoria &&
typeof produto.Categoria ===
"object"
? produto.Categoria.value
: produto.Categoria;


const ativo =
produto.Ativo ??
true;


return `

<tr>

<td>
${escapeHTML(String(id))}
</td>

<td>
${escapeHTML(
produto.Produto ?? ""
)}
</td>

<td>
${escapeHTML(
categoria ?? ""
)}
</td>

<td>
${formatarMoeda(
produto["Preço de venda"] ?? 0
)}
</td>

<td>
${escapeHTML(
String(
produto.Estoque ?? 0
)
)}
</td>

<td>
${
ativo
? "Ativo"
: "Inativo"
}
</td>

</tr>

`;

}).join("")}

</tbody>

</table>

`;

}


// ========================================
// TABELA DE VENDAS
// ========================================

function mostrarTabelaVendas() {

const tabela =
document.getElementById("salesTable");

if (!tabela) return;


if (
!Array.isArray(vendas) ||
vendas.length === 0
) {

tabela.innerHTML = `
<div class="empty">
Nenhuma venda registrada.
</div>
`;

return;
}


tabela.innerHTML = `

<table>

<thead>

<tr>
<th>ID</th>
<th>Data</th>
<th>Produto</th>
<th>Qtd.</th>
<th>Total</th>
<th>Pagamento</th>
<th>Status</th>
</tr>

</thead>

<tbody>

${vendas.map(venda => {

const id =
venda.id ??
venda.ID ??
"-";


const data =
venda["Criado em"] ??
venda["created_on"] ??
venda.data_da_venda ??
"";


const total =
Number(
venda["Total venda"] ??
venda.total_venda ??
0
);


const pagamento =
obterTexto(
venda.Pagamento ??
venda.pagamento ??
""
);


const status =
obterTexto(
venda.Status ??
venda.status ??
""
);


const itens =
Array.isArray(venda.itens)
? venda.itens
: [];


let produtosHTML = "";

let quantidadeTotal = 0;


if (itens.length === 0) {

produtosHTML =
"Nenhum item";

} else {

produtosHTML =
itens.map(item => {

const nome =
item.produto?.nome ??
"Produto";

const quantidade =
Number(
item.quantidade ?? 0
);

quantidadeTotal +=
quantidade;

return `
<div>
${escapeHTML(nome)}
</div>
`;

}).join("");

}


return `

<tr>

<td>
${escapeHTML(
String(id)
)}
</td>

<td>
${escapeHTML(
formatarData(data)
)}
</td>

<td>
${produtosHTML}
</td>

<td>
${quantidadeTotal}
</td>

<td>
<strong>
${formatarMoeda(total)}
</strong>
</td>

<td>
${escapeHTML(
pagamento
)}
</td>

<td>
${escapeHTML(
status
)}
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


const diaHoje =
hoje
.toISOString()
.slice(0, 10);


const vendasHoje =
vendas.filter(venda => {

const data =
venda["Criado em"] ??
venda["created_on"] ??
venda.data_da_venda ??
"";


if (!data) {
return false;
}


return String(data)
.startsWith(diaHoje);

});


const faturamento =
vendasHoje.reduce(
(total, venda) => {

const valor =
Number(
venda["Total venda"] ??
venda.total_venda ??
0
);


return total + valor;

},
0
);


const estoque =
produtos.reduce(
(total, produto) => {

return total +
Number(
produto.Estoque ??
produto.estoque ??
0
);

},
0
);


const statSales =
document.getElementById(
"statSales"
);


const statRevenue =
document.getElementById(
"statRevenue"
);


const statProducts =
document.getElementById(
"statProducts"
);


const statStock =
document.getElementById(
"statStock"
);


if (statSales) {

statSales.textContent =
vendasHoje.length;

}


if (statRevenue) {

statRevenue.textContent =
formatarMoeda(
faturamento
);

}


if (statProducts) {

statProducts.textContent =
produtos.length;

}


if (statStock) {

statStock.textContent =
estoque;

}

}


// ========================================
// TRANSFORMAR OBJETOS EM TEXTO
// ========================================

function obterTexto(valor) {

if (
valor === null ||
valor === undefined
) {

return "";

}


if (
typeof valor === "string" ||
typeof valor === "number" ||
typeof valor === "boolean"
) {

return String(valor);

}


if (
typeof valor === "object"
) {

if (
valor.value !== undefined
) {

return String(
valor.value
);

}


if (
valor.name !== undefined
) {

return String(
valor.name
);

}


if (
Array.isArray(valor)
) {

return valor
.map(item =>
obterTexto(item)
)
.join(", ");

}

}


return "";

}


// ========================================
// ADMIN
// ========================================

function configurarAdmin() {

const abrir =
document.getElementById(
"adminBtn"
);


const fechar =
document.getElementById(
"closeAdmin"
);


const modal =
document.getElementById(
"adminModal"
);


if (
abrir &&
modal
) {

abrir.addEventListener(
"click",
() => {

modal.classList.remove(
"hidden"
);

}
);

}


if (
fechar &&
modal
) {

fechar.addEventListener(
"click",
() => {

modal.classList.add(
"hidden"
);

}
);

}


if (modal) {

modal.addEventListener(
"click",
event => {

if (
event.target === modal
) {

modal.classList.add(
"hidden"
);

}

}
);

}

}


// ========================================
// UTILITÁRIOS
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


function formatarData(data) {

if (!data) return "-";


const d =
new Date(data);


if (
Number.isNaN(
d.getTime()
)
) {

return String(data);

}


return d.toLocaleString(
"pt-BR"
);

}


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

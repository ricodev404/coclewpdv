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
configurarNovoProduto();

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

document
.querySelectorAll(".view")
.forEach(secao => {
secao.classList.remove("active");
});


document
.querySelectorAll(".nav-btn")
.forEach(botao => {
botao.classList.remove("active");
});


const secao =
document.getElementById(
view + "View"
);

if (secao) {
secao.classList.add("active");
}


const botao =
document.querySelector(
`.nav-btn[data-view="${view}"]`
);

if (botao) {
botao.classList.add("active");
}


const titulo =
document.getElementById("pageTitle");

const subtitulo =
document.getElementById("pageSubtitle");


const paginas = {

pdv: {
titulo: "Nova venda",
subtitulo:
"Monte o pedido e finalize a venda."
},

products: {
titulo: "Produtos",
subtitulo:
"Gerencie os produtos cadastrados."
},

sales: {
titulo: "Vendas",
subtitulo:
"Consulte o histórico de vendas."
},

dashboard: {
titulo: "Dashboard",
subtitulo:
"Resumo do seu PDV."
}

};


if (paginas[view]) {

titulo.textContent =
paginas[view].titulo;

subtitulo.textContent =
paginas[view].subtitulo;

}


if (view === "products") {
mostrarTabelaProdutos();
}


if (view === "sales") {
carregarVendas();
}


if (view === "dashboard") {
atualizarDashboard();
}

}


// ========================================
// BUSCA
// ========================================

function configurarBusca() {

const input =
document.getElementById("searchInput");

if (!input) return;


input.addEventListener("input", () => {

const termo =
input.value
.trim()
.toLowerCase();


if (!termo) {

mostrarProdutos(produtos);
return;

}


const filtrados =
produtos.filter(produto => {

const nome =
String(
produto.Produto ??
produto.produto ??
""
).toLowerCase();


const categoria =
obterTexto(
produto.Categoria ??
produto.categoria ??
""
).toLowerCase();


return (
nome.includes(termo) ||
categoria.includes(termo)
);

});


mostrarProdutos(filtrados);

});

}


// ========================================
// PRODUTOS
// ========================================

async function carregarProdutos() {

try {

const response =
await fetch(`${API_URL}/products`);


const data =
await response.json();


if (
!response.ok ||
!data.ok
) {

throw new Error(
data.error ||
"Erro ao buscar produtos."
);

}


produtos =
Array.isArray(data.products)
? data.products
: [];


mostrarProdutos(produtos);
mostrarTabelaProdutos();
atualizarDashboard();

} catch (erro) {

console.error(
"Erro ao carregar produtos:",
erro
);


const grid =
document.getElementById(
"productGrid"
);


if (grid) {

grid.innerHTML = `
<div class="empty">
Erro ao carregar produtos.
</div>
`;

}

}

}


// ========================================
// MOSTRAR PRODUTOS
// ========================================

function mostrarProdutos(lista) {

const container =
document.getElementById(
"productGrid"
);


if (!container) return;


container.innerHTML = "";


if (
!Array.isArray(lista) ||
lista.length === 0
) {

container.innerHTML = `
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
"Produto";


const categoria =
obterTexto(
produto.Categoria ??
produto.categoria ??
""
);


const preco =
obterNumero(
produto["Preço de venda"] ??
produto["preço de venda"] ??
produto["Preco de venda"] ??
0
);


const estoque =
obterNumero(
produto.Estoque ??
produto.estoque ??
0
);


const descricao =
obterTexto(
produto.Descrição ??
produto.descrição ??
produto.Descricao ??
""
);


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
produto.Imagem ??
produto.imagem ??
null;


let imagemURL = "";


if (typeof imagem === "string") {

imagemURL = imagem;

}

else if (
Array.isArray(imagem) &&
imagem.length > 0
) {

imagemURL =
imagem[0]?.url ||
imagem[0]?.thumbnails?.card_cover?.url ||
imagem[0]?.thumbnails?.small?.url ||
"";

}


const card =
document.createElement("div");


card.className =
"produto-card";


let imagemHTML = "";


if (imagemURL) {

imagemHTML = `
<img
src="${escapeHTML(imagemURL)}"
class="produto-imagem"
alt="${escapeHTML(nome)}"
>
`;

} else {

imagemHTML = `
<div class="produto-sem-imagem">
🥤
</div>
`;

}


card.innerHTML = `

${imagemHTML}

<div class="produto-info">

<div class="produto-categoria">
${escapeHTML(categoria)}
</div>

<h3>
${escapeHTML(nome)}
</h3>

${
descricao
? `
<p class="produto-descricao">
${escapeHTML(descricao)}
</p>
`
: ""
}

<div class="produto-rodape">

<strong class="produto-preco">
${formatarMoeda(preco)}
</strong>

<span class="produto-estoque">
Estoque: ${estoque}
</span>

</div>

<button
class="btn-adicionar"
data-id="${id}"
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
".btn-adicionar"
);


if (botao) {

botao.addEventListener(
"click",
() => {
adicionarCarrinho(id);
}
);

}


container.appendChild(card);

});

}


// ========================================
// TABELA PRODUTOS
// ========================================

function mostrarTabelaProdutos() {

const tabela =
document.getElementById(
"productsTable"
);


if (!tabela) return;


if (produtos.length === 0) {

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
produto.id ??
"-";


const categoria =
obterTexto(
produto.Categoria ??
produto.categoria ??
""
);


const ativo =
produto.Ativo ??
produto.ativo ??
true;


const preco =
obterNumero(
produto["Preço de venda"] ??
produto["preço de venda"] ??
produto["Preco de venda"] ??
0
);


const estoque =
obterNumero(
produto.Estoque ??
produto.estoque ??
0
);


return `

<tr>

<td>
${escapeHTML(String(id))}
</td>

<td>
${escapeHTML(
produto.Produto ??
produto.produto ??
""
)}
</td>

<td>
${escapeHTML(categoria)}
</td>

<td>
${formatarMoeda(preco)}
</td>

<td>
${escapeHTML(
String(estoque)
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


// ========================================
// ADICIONAR CARRINHO
// ========================================

function adicionarCarrinho(id) {

const produto =
produtos.find(
p =>
Number(
p.ID ??
p.id
) === Number(id)
);


if (!produto) {

alert(
"Produto não encontrado."
);

return;

}


const nome =
produto.Produto ??
produto.produto ??
"Produto";


const preco =
obterNumero(
produto["Preço de venda"] ??
produto["preço de venda"] ??
produto["Preco de venda"] ??
0
);


const estoque =
obterNumero(
produto.Estoque ??
produto.estoque ??
0
);


const existente =
carrinho.find(
item =>
Number(item.id) ===
Number(id)
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

id: Number(id),

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
document.getElementById(
"cartItems"
);


const totalElement =
document.getElementById(
"cartTotal"
);


const countElement =
document.getElementById(
"cartCount"
);


if (!container) return;


container.innerHTML = "";


if (carrinho.length === 0) {

container.innerHTML = `
<div class="empty">
Seu carrinho está vazio.
</div>
`;

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
class="btn-remover"
data-id="${item.id}"
>
×
</button>

</div>

`;


const remover =
linha.querySelector(
".btn-remover"
);


if (remover) {

remover.addEventListener(
"click",
() => {
removerCarrinho(item.id);
}
);

}


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
total +
item.quantidade,
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
Number(item.id) ===
Number(id)
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
(
obterNumero(item.preco) *
obterNumero(item.quantidade)
),
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

botoes.forEach(
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
// FINALIZAR VENDA
// ========================================

async function finalizarVenda() {

if (carrinho.length === 0) {

alert(
"Adicione algum produto primeiro."
);

return;

}


const total =
calcularTotal();


const venda = {

total_bruto: total,

desconto: 0,

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
"application/json",

"Accept":
"application/json"
},

body:
JSON.stringify({
venda,
itens: carrinho
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
"Erro ao registrar venda."
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


const data =
await response.json();


if (
!response.ok ||
!data.ok
) {

throw new Error(
data.error ||
"Erro ao buscar vendas."
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
"Erro ao carregar vendas:",
erro
);

}

}


// ========================================
// TABELA DE VENDAS
// ========================================

function mostrarTabelaVendas() {

const tabela =
document.getElementById(
"salesTable"
);


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
venda["Created on"] ??
venda["Data da venda"] ??
venda["Data de venda"] ??
venda.data_da_venda ??
"";


/*
* IMPORTANTE:
* O Baserow da sua tabela usa
* "Total da Venda".
*/

const total =
obterNumero(
venda["Total da Venda"] ??
venda["Total da venda"] ??
venda["Total venda"] ??
venda["Total de Venda"] ??
venda["Total de venda"] ??
venda.total_venda ??
venda.total ??
venda.valor_total ??
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


const nomes =
itens
.map(item => {

if (
item.produto &&
typeof item.produto === "object"
) {

return obterTexto(
item.produto.nome ??
item.produto.Produto ??
item.produto.produto ??
"Produto"
);

}


if (
typeof item.produto === "string"
) {

return item.produto;

}


return "Produto";

})
.filter(Boolean)
.join(", ");


const quantidade =
itens.reduce(
(totalQuantidade, item) =>
totalQuantidade +
obterNumero(
item.quantidade ??
item.Quantidade ??
0
),
0
);


return `

<tr>

<td>
${escapeHTML(
String(id)
)}
</td>

<td>
${formatarData(data)}
</td>

<td>
${escapeHTML(
nomes || "Produto"
)}
</td>

<td>
${quantidade}
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


const vendasHoje =
vendas.filter(venda => {

const data =
venda["Criado em"] ??
venda["created_on"] ??
venda["Created on"] ??
venda["Data da venda"] ??
venda["Data de venda"] ??
venda.data_da_venda ??
"";


if (!data) {
return false;
}


const d =
converterDataBaserow(data);


if (!d) {
return false;
}


return (
d.getDate() ===
hoje.getDate() &&
d.getMonth() ===
hoje.getMonth() &&
d.getFullYear() ===
hoje.getFullYear()
);

});


let faturamento = 0;


vendasHoje.forEach(venda => {

const valor =
obterNumero(
venda["Total da Venda"] ??
venda["Total da venda"] ??
venda["Total venda"] ??
venda["Total de Venda"] ??
venda["Total de venda"] ??
venda.total_venda ??
venda.total ??
venda.valor_total ??
0
);


faturamento += valor;

});


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
produtos.reduce(
(total, produto) =>
total +
obterNumero(
produto.Estoque ??
produto.estoque ??
0
),
0
);

}

}


// ========================================
// NOVO PRODUTO
// ========================================

function configurarNovoProduto() {

const botao =
document.getElementById(
"newProductBtn"
);


if (!botao) return;


botao.addEventListener(
"click",
abrirFormularioProduto
);

}


// ========================================
// ABRIR FORMULÁRIO
// ========================================

function abrirFormularioProduto() {

const existente =
document.getElementById(
"novoProdutoModal"
);


if (existente) {

existente.classList.remove(
"hidden"
);

return;

}


const modal =
document.createElement("div");


modal.id =
"novoProdutoModal";

modal.className =
"modal";


modal.innerHTML = `

<div class="modal-card">

<button
class="close"
id="fecharNovoProduto"
>
×
</button>

<h2>
Novo produto
</h2>

<p>
Cadastre um novo produto.
</p>

<div class="admin-grid">

<div style="grid-column:1/-1">

<label>
Produto
</label>

<input
id="novoProdutoNome"
type="text"
placeholder="Nome do produto"
>

</div>

<div>

<label>
Categoria
</label>

<input
id="novoProdutoCategoria"
type="text"
placeholder="Bebidas"
>

</div>

<div>

<label>
Estoque
</label>

<input
id="novoProdutoEstoque"
type="number"
min="0"
value="0"
>

</div>

<div>

<label>
Preço de venda
</label>

<input
id="novoProdutoPreco"
type="number"
min="0"
step="0.01"
value="0"
>

</div>

<div>

<label>
Custo
</label>

<input
id="novoProdutoCusto"
type="number"
min="0"
step="0.01"
value="0"
>

</div>

<div style="grid-column:1/-1">

<label>
Descrição
</label>

<textarea
id="novoProdutoDescricao"
rows="3"
placeholder="Descrição do produto"
></textarea>

</div>

</div>

<div
style="
display:flex;
gap:10px;
margin-top:20px;
"
>

<button
class="secondary"
id="cancelarNovoProduto"
>
Cancelar
</button>

<button
class="primary"
id="salvarNovoProduto"
>
CADASTRAR PRODUTO
</button>

</div>

</div>

`;


document.body.appendChild(modal);


document
.getElementById(
"fecharNovoProduto"
)
.addEventListener(
"click",
fecharFormularioProduto
);


document
.getElementById(
"cancelarNovoProduto"
)
.addEventListener(
"click",
fecharFormularioProduto
);


modal.addEventListener(
"click",
event => {

if (
event.target === modal
) {

fecharFormularioProduto();

}

}
);


document
.getElementById(
"salvarNovoProduto"
)
.addEventListener(
"click",
salvarNovoProduto
);

}


// ========================================
// FECHAR FORMULÁRIO
// ========================================

function fecharFormularioProduto() {

const modal =
document.getElementById(
"novoProdutoModal"
);


if (modal) {
modal.remove();
}

}


// ========================================
// SALVAR NOVO PRODUTO
// ========================================

async function salvarNovoProduto() {

const nome =
document
.getElementById(
"novoProdutoNome"
)
.value
.trim();


const categoria =
document
.getElementById(
"novoProdutoCategoria"
)
.value
.trim();


const preco =
Number(
document
.getElementById(
"novoProdutoPreco"
)
.value || 0
);


const custo =
Number(
document
.getElementById(
"novoProdutoCusto"
)
.value || 0
);


const estoque =
Number(
document
.getElementById(
"novoProdutoEstoque"
)
.value || 0
);


const descricao =
document
.getElementById(
"novoProdutoDescricao"
)
.value
.trim();


if (!nome) {

alert(
"Digite o nome do produto."
);

return;

}


if (
preco < 0 ||
custo < 0 ||
estoque < 0
) {

alert(
"Os valores não podem ser negativos."
);

return;

}


const botao =
document.getElementById(
"salvarNovoProduto"
);


botao.disabled = true;

botao.textContent =
"CADASTRANDO...";


try {

const response =
await fetch(
`${API_URL}/products`,
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

Produto:
nome,

Categoria:
categoria || null,

"Preço de venda":
preco,

Custo:
custo,

Estoque:
estoque,

Descrição:
descricao,

Ativo:
true

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
"Não foi possível cadastrar o produto."
);

}


alert(
"Produto cadastrado com sucesso!"
);


fecharFormularioProduto();


await carregarProdutos();


trocarView("products");

} catch (erro) {

console.error(
"Erro ao cadastrar produto:",
erro
);


alert(
"Erro ao cadastrar produto:\n" +
erro.message
);


botao.disabled = false;

botao.textContent =
"CADASTRAR PRODUTO";

}

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
// CONVERTER NÚMERO
// ========================================

function obterNumero(valor) {

if (
valor === null ||
valor === undefined ||
valor === ""
) {

return 0;

}


if (
typeof valor === "number"
) {

return Number.isFinite(valor)
? valor
: 0;

}


if (
typeof valor === "object"
) {

return obterNumero(
valor.value ??
valor.amount ??
valor.valor ??
valor.number ??
0
);

}


let texto =
String(valor).trim();


/*
* Trata números no formato:
* 15
* 15.50
* 15,50
* R$ 15,50
*/

texto =
texto.replace(
/R\$/gi,
""
)
.trim();


if (
texto.includes(",")
) {

texto =
texto
.replace(/\./g, "")
.replace(",", ".");

}


texto =
texto.replace(
/[^0-9.-]/g,
""
);


const numero =
Number(texto);


return Number.isFinite(numero)
? numero
: 0;

}


// ========================================
// OBTER TEXTO
// ========================================

function obterTexto(valor) {

if (
valor === null ||
valor === undefined
) {

return "";

}


if (
Array.isArray(valor)
) {

return valor
.map(item =>
obterTexto(item)
)
.filter(Boolean)
.join(", ");

}


if (
typeof valor === "object"
) {

return String(
valor.value ??
valor.name ??
valor.label ??
valor.nome ??
valor.Produto ??
valor.produto ??
""
);

}


return String(valor);

}


// ========================================
// DATA BASEROW
// ========================================

function converterDataBaserow(valor) {

if (!valor) {
return null;
}


if (
valor instanceof Date
) {

return valor;

}


if (
typeof valor === "object"
) {

valor =
valor.value ??
valor.date ??
valor.datetime ??
valor.created_on ??
"";

}


const texto =
String(valor).trim();


if (!texto) {
return null;
}


/*
* ISO normal do Baserow
*/

let data =
new Date(texto);


if (
!Number.isNaN(
data.getTime()
)
) {

return data;

}


/*
* Caso venha:
* 22/08/2026 21:17
*/

const match =
texto.match(
/^(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2}):(\d{2})(?::(\d{2}))?)?$/
);


if (match) {

const dia =
Number(match[1]);

const mes =
Number(match[2]) - 1;

const ano =
Number(match[3]);

const hora =
Number(match[4] || 0);

const minuto =
Number(match[5] || 0);

const segundo =
Number(match[6] || 0);


return new Date(
ano,
mes,
dia,
hora,
minuto,
segundo
);

}


return null;

}


// ========================================
// FORMATAR MOEDA
// ========================================

function formatarMoeda(valor) {

const numero =
obterNumero(valor);


return numero.toLocaleString(
"pt-BR",
{
style: "currency",
currency: "BRL"
}
);

}


// ========================================
// FORMATAR DATA
// ========================================

function formatarData(valor) {

if (!valor) {
return "-";
}


const data =
converterDataBaserow(valor);


if (!data) {
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

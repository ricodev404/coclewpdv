const API_URL =
"https://coclew-pdv.ricardorodrigues0671.workers.dev";

let produtos = [];
let carrinho = [];

// ========================================
// INICIAR
// ========================================

document.addEventListener("DOMContentLoaded", () => {
carregarProdutos();
});


// ========================================
// BUSCAR PRODUTOS
// ========================================

async function carregarProdutos() {
const container = document.getElementById("produtos");

if (!container) {
console.error("Elemento #produtos não encontrado.");
return;
}

container.innerHTML = `
<p class="carregando">Carregando produtos...</p>
`;

try {
const response = await fetch(`${API_URL}/products`);

if (!response.ok) {
throw new Error(`Erro HTTP ${response.status}`);
}

const data = await response.json();

console.log("Resposta da API:", data);

if (!data.ok) {
throw new Error(data.error || "Erro ao buscar produtos");
}

produtos = data.products || [];

mostrarProdutos(produtos);

} catch (error) {

console.error("Erro:", error);

container.innerHTML = `
<div class="erro">
<strong>Erro ao carregar produtos.</strong>
<br>
Verifique a conexão com o servidor.
</div>
`;
}
}


// ========================================
// MOSTRAR PRODUTOS
// ========================================

function mostrarProdutos(lista) {

const container = document.getElementById("produtos");

if (!container) return;

container.innerHTML = "";

if (lista.length === 0) {

container.innerHTML = `
<p class="sem-produtos">
Nenhum produto cadastrado.
</p>
`;

return;
}


lista.forEach(produto => {

// Campos da tabela Produtos
const id = produto.id;

const nome =
produto["Produto"] ??
produto["produto"] ??
"";

const categoria =
produto["Categoria"] ??
produto["categoria"] ??
"";

const preco =
produto["Preço de venda"] ??
produto["preço de venda"] ??
produto["Preco de venda"] ??
0;

const estoque =
produto["Estoque"] ??
produto["estoque"] ??
0;

const imagem =
produto["Imagem"] ??
produto["imagem"] ??
"";

const descricao =
produto["Descrição"] ??
produto["descrição"] ??
produto["Descricao"] ??
"";


// Se estiver inativo, não mostra
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


const card =
document.createElement("div");

card.className = "produto-card";


// Imagem
let imagemHTML = "";

if (imagem) {

let urlImagem = "";

if (typeof imagem === "string") {
urlImagem = imagem;
}

else if (
Array.isArray(imagem) &&
imagem.length > 0
) {
urlImagem =
imagem[0].url ||
imagem[0].thumbnails?.large?.url ||
imagem[0].thumbnails?.medium?.url ||
"";
}

if (urlImagem) {

imagemHTML = `
<img
src="${escapeHTML(urlImagem)}"
class="produto-imagem"
alt="${escapeHTML(nome)}"
>
`;
}
}


if (!imagemHTML) {

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
? `<p class="produto-descricao">
${escapeHTML(descricao)}
</p>`
: ""
}

<div class="produto-rodape">

<strong class="produto-preco">
${formatarMoeda(preco)}
</strong>

<span class="produto-estoque">
Estoque: ${escapeHTML(String(estoque))}
</span>

</div>

<button
class="btn-adicionar"
onclick="adicionarCarrinho(${id})"
${Number(estoque) <= 0 ? "disabled" : ""}
>
${
Number(estoque) <= 0
? "Sem estoque"
: "Adicionar"
}
</button>

</div>
`;


container.appendChild(card);

});
}


// ========================================
// ADICIONAR AO CARRINHO
// ========================================

function adicionarCarrinho(id) {

const produto =
produtos.find(p => p.id === id);

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
carrinho.find(item => item.id === id);


if (existente) {

if (existente.quantidade >= estoque) {

alert("Quantidade maior que o estoque.");
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
document.getElementById("carrinho");

const totalElement =
document.getElementById("total");

if (!container) return;


container.innerHTML = "";


if (carrinho.length === 0) {

container.innerHTML = `
<p class="carrinho-vazio">
Carrinho vazio
</p>
`;

} else {

carrinho.forEach(item => {

const subtotal =
item.preco * item.quantidade;


const linha =
document.createElement("div");

linha.className =
"carrinho-item";


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
onclick="removerCarrinho(${item.id})"
class="btn-remover"
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
}


// ========================================
// REMOVER DO CARRINHO
// ========================================

function removerCarrinho(id) {

const index =
carrinho.findIndex(
item => item.id === id
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
item.preco *
item.quantidade,
0
);
}


// ========================================
// FINALIZAR VENDA
// ========================================

async function finalizarVenda() {

if (carrinho.length === 0) {

alert("Adicione algum produto primeiro.");
return;
}


const pagamentoElement =
document.getElementById("pagamento");


const pagamento =
pagamentoElement
? pagamentoElement.value
: "Dinheiro";


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
pagamento,

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


if (!response.ok || !data.ok) {

throw new Error(
data.error ||
"Erro ao registrar venda"
);
}


alert("Venda registrada com sucesso!");

carrinho = [];

atualizarCarrinho();

carregarProdutos();


} catch (error) {

console.error(error);

alert(
"Não foi possível registrar a venda."
);
}
}


// ========================================
// FORMATAR DINHEIRO
// ========================================

function formatarMoeda(valor) {

return Number(valor || 0)
.toLocaleString(
"pt-BR",
{
style: "currency",
currency: "BRL"
}
);
}


// ========================================
// PROTEGER HTML
// ========================================

function escapeHTML(valor) {

return String(valor ?? "")
.replace(/&/g, "&amp;")
.replace(/</g, "&lt;")
.replace(/>/g, "&gt;")
.replace(/"/g, "&quot;")
.replace(/'/g, "&#039;");
}

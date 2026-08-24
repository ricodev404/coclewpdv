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
const response = await fetch(`${API_URL}/products`, {
method: "GET",
headers: {
"Accept": "application/json"
}
});

if (!response.ok) {
throw new Error(`Erro HTTP ${response.status}`);
}

const data = await response.json();

console.log("Resposta da API:", data);

if (!data.ok) {
throw new Error(
data.error || "Erro ao buscar produtos"
);
}

if (!Array.isArray(data.products)) {
throw new Error(
"A API não retornou uma lista de produtos."
);
}

produtos = data.products;

mostrarProdutos(produtos);

} catch (error) {

console.error("Erro ao carregar produtos:", error);

container.innerHTML = `
<div class="erro">
<strong>Erro ao carregar produtos.</strong>
<br>
${escapeHTML(error.message)}
</div>
`;
}
}


// ========================================
// MOSTRAR PRODUTOS
// ========================================

function mostrarProdutos(lista) {

const container =
document.getElementById("produtos");

if (!container) return;

container.innerHTML = "";

if (!Array.isArray(lista) || lista.length === 0) {

container.innerHTML = `
<p class="sem-produtos">
Nenhum produto cadastrado.
</p>
`;

return;
}


lista.forEach(produto => {

// ========================================
// ID
// ========================================

const id =
produto.ID ??
produto.id;


// ========================================
// NOME
// ========================================

const nome =
produto.Produto ??
produto.produto ??
"";


// ========================================
// CATEGORIA
// ========================================

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
produto.categoria ??
"";
}


// ========================================
// PREÇO
// ========================================

const preco =
Number(
produto["Preço de venda"] ??
produto["preço de venda"] ??
produto["Preco de venda"] ??
0
);


// ========================================
// ESTOQUE
// ========================================

const estoque =
Number(
produto.Estoque ??
produto.estoque ??
0
);


// ========================================
// IMAGEM
// ========================================

const imagem =
produto.Imagem ??
produto.imagem ??
null;


// ========================================
// DESCRIÇÃO
// ========================================

const descricao =
produto.Descrição ??
produto.descrição ??
produto.Descricao ??
"";


// ========================================
// ATIVO
// ========================================

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


// ========================================
// CARD
// ========================================

const card =
document.createElement("div");

card.className =
"produto-card";


// ========================================
// IMAGEM HTML
// ========================================

let urlImagem = "";


if (typeof imagem === "string") {

urlImagem = imagem;

} else if (
Array.isArray(imagem) &&
imagem.length > 0
) {

const arquivo =
imagem[0];

urlImagem =
arquivo.url ||
arquivo.thumbnails?.card_cover?.url ||
arquivo.thumbnails?.large?.url ||
arquivo.thumbnails?.medium?.url ||
arquivo.thumbnails?.small?.url ||
"";
}


let imagemHTML = "";


if (urlImagem) {

imagemHTML = `
<img
src="${escapeHTML(urlImagem)}"
class="produto-imagem"
alt="${escapeHTML(nome)}"
loading="lazy"
onerror="this.style.display='none'"
>
`;

} else {

imagemHTML = `
<div class="produto-sem-imagem">
🥤
</div>
`;
}


// ========================================
// HTML DO CARD
// ========================================

card.innerHTML = `

${imagemHTML}

<div class="produto-info">

${
categoria
? `
<div class="produto-categoria">
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
Estoque: ${escapeHTML(String(estoque))}
</span>

</div>

<button
class="btn-adicionar"
data-produto-id="${escapeHTML(String(id))}"
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


// ========================================
// BOTÃO ADICIONAR
// ========================================

const botao =
card.querySelector(".btn-adicionar");


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
// ADICIONAR AO CARRINHO
// ========================================

function adicionarCarrinho(id) {

const produto =
produtos.find(
p =>
String(p.ID ?? p.id) ===
String(id)
);


if (!produto) {

console.error(
"Produto não encontrado:",
id
);

return;
}


const nome =
produto.Produto ??
produto.produto ??
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

id: id,

nome: nome,

preco: preco,

quantidade: 1,

estoque: estoque

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
item.preco *
item.quantidade;


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
class="btn-remover"
data-produto-id="${escapeHTML(String(item.id))}"
>
×
</button>

</div>

`;


const botaoRemover =
linha.querySelector(
".btn-remover"
);


if (botaoRemover) {

botaoRemover.addEventListener(
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
}


// ========================================
// REMOVER DO CARRINHO
// ========================================

function removerCarrinho(id) {

const index =
carrinho.findIndex(
item =>
String(item.id) ===
String(id)
);


if (index === -1) return;


if (
carrinho[index].quantidade >
1
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

alert(
"Adicione algum produto primeiro."
);

return;
}


const pagamentoElement =
document.getElementById(
"pagamento"
);


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
"Erro ao registrar venda"
);
}


alert(
"Venda registrada com sucesso!"
);


carrinho = [];


atualizarCarrinho();


await carregarProdutos();


} catch (error) {

console.error(
"Erro ao finalizar venda:",
error
);


alert(
"Não foi possível registrar a venda.\n\n" +
error.message
);
}
}


// ========================================
// FORMATAR DINHEIRO
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
// PROTEGER HTML
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

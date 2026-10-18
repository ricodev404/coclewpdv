const API_URL = "https://coclew-pdv.ricardorodrigues0671.workers.dev";

let produtos = [];
let vendas = [];
let carrinho = [];
let pagamentoSelecionado = "PIX";

document.addEventListener("DOMContentLoaded", () => {
  configurarNavegacao();
  configurarBusca();
  configurarPagamento();
  configurarCarrinho();
  configurarAdmin();
  configurarNovoProduto();

  atualizarCarrinho();
  carregarProdutos();
  carregarVendas();

  const atualizarVendas = document.getElementById("refreshSales");
  if (atualizarVendas) {
    atualizarVendas.addEventListener("click", carregarVendas);
  }
});

// ========================================
// NAVEGAÇÃO
// ========================================

function configurarNavegacao() {
  document.querySelectorAll(".nav-btn").forEach(botao => {
    botao.addEventListener("click", () => {
      trocarView(botao.dataset.view);
    });
  });
}

function trocarView(view) {
  document.querySelectorAll(".view").forEach(secao => {
    secao.classList.remove("active");
  });

  document.querySelectorAll(".nav-btn").forEach(botao => {
    botao.classList.remove("active");
  });

  document.getElementById(`${view}View`)?.classList.add("active");

  document
    .querySelector(`.nav-btn[data-view="${view}"]`)
    ?.classList.add("active");

  const paginas = {
    pdv: ["Nova venda", "Monte o pedido e finalize a venda."],
    products: ["Produtos", "Gerencie os produtos cadastrados."],
    sales: ["Vendas", "Consulte o histórico de vendas."],
    dashboard: ["Dashboard", "Resumo do seu PDV."]
  };

  const pagina = paginas[view];

  if (pagina) {
    const titulo = document.getElementById("pageTitle");
    const subtitulo = document.getElementById("pageSubtitle");

    if (titulo) titulo.textContent = pagina[0];
    if (subtitulo) subtitulo.textContent = pagina[1];
  }

  if (view === "products") mostrarTabelaProdutos();
  if (view === "sales") carregarVendas();
  if (view === "dashboard") atualizarDashboard();
}

// ========================================
// BUSCA
// ========================================

function configurarBusca() {
  const input = document.getElementById("searchInput");
  if (!input) return;

  input.addEventListener("input", () => {
    const termo = input.value.trim().toLowerCase();

    const filtrados = produtos.filter(produto => {
      const nome = obterTexto(
        produto.Produto ?? produto.produto
      ).toLowerCase();

      const categoria = obterTexto(
        produto.Categoria ?? produto.categoria
      ).toLowerCase();

      return nome.includes(termo) || categoria.includes(termo);
    });

    mostrarProdutos(filtrados);
  });
}

// ========================================
// PRODUTOS
// ========================================

async function carregarProdutos() {
  try {
    const response = await fetch(`${API_URL}/products`);
    const data = await lerResposta(response);

    if (!response.ok || data.ok === false) {
      throw new Error(data.error || "Erro ao buscar produtos.");
    }

    produtos = Array.isArray(data.products) ? data.products : [];

    mostrarProdutos(produtos);
    mostrarTabelaProdutos();
    atualizarDashboard();
  } catch (erro) {
    console.error("Erro ao carregar produtos:", erro);

    const grid = document.getElementById("productGrid");
    if (grid) {
      grid.innerHTML = `<div class="empty">Erro ao carregar produtos. Verifique a conexão com o servidor.</div>`;
    }

    notificar("Não foi possível carregar os produtos.");
  }
}

function mostrarProdutos(lista) {
  const container = document.getElementById("productGrid");
  if (!container) return;

  container.replaceChildren();

  const disponiveis = (Array.isArray(lista) ? lista : []).filter(produto => {
    const ativo = produto.Ativo ?? produto.ativo ?? true;
    return !(
      ativo === false ||
      ativo === "false" ||
      ativo === 0
    );
  });

  if (disponiveis.length === 0) {
    container.innerHTML = `<div class="empty">Nenhum produto cadastrado.</div>`;
    return;
  }

  disponiveis.forEach(produto => {
    const id = produto.ID ?? produto.id;
    const nome = obterTexto(produto.Produto ?? produto.produto ?? "Produto");
    const categoria = obterTexto(produto.Categoria ?? produto.categoria);
    const descricao = obterTexto(
      produto.Descrição ?? produto.descrição ?? produto.Descricao
    );
    const preco = obterNumero(
      produto["Preço de venda"] ??
      produto["preço de venda"] ??
      produto["Preco de venda"] ??
      0
    );
    const estoque = obterNumero(produto.Estoque ?? produto.estoque ?? 0);
    const imagemURL = obterImagemURL(produto.Imagem ?? produto.imagem);

    const card = document.createElement("article");
    card.className = "product produto-card";

    const imagem = document.createElement("div");
    imagem.className = "produto-visual";

    if (imagemURL) {
      const img = document.createElement("img");
      img.src = imagemURL;
      img.alt = nome;
      img.className = "produto-imagem";
      img.loading = "lazy";

      img.addEventListener("error", () => {
        imagem.replaceChildren();
        imagem.textContent = "🥤";
        imagem.classList.add("produto-sem-imagem");
      });

      imagem.appendChild(img);
    } else {
      imagem.textContent = "🥤";
      imagem.classList.add("produto-sem-imagem");
    }

    const informacoes = document.createElement("div");
    informacoes.className = "product-info produto-info";

    const categoriaEl = document.createElement("small");
    categoriaEl.className = "product-meta produto-categoria";
    categoriaEl.textContent = categoria || "Sem categoria";

    const nomeEl = document.createElement("h3");
    nomeEl.className = "product-name";
    nomeEl.textContent = nome;

    informacoes.append(categoriaEl, nomeEl);

    if (descricao) {
      const descricaoEl = document.createElement("p");
      descricaoEl.className = "produto-descricao";
      descricaoEl.textContent = descricao;
      informacoes.appendChild(descricaoEl);
    }

    const rodape = document.createElement("div");
    rodape.className = "produto-rodape";

    const precoEl = document.createElement("strong");
    precoEl.className = "price produto-preco";
    precoEl.textContent = formatarMoeda(preco);

    const estoqueEl = document.createElement("span");
    estoqueEl.className = "stock produto-estoque";
    estoqueEl.textContent = `Estoque: ${estoque}`;

    rodape.append(precoEl, estoqueEl);

    const botao = document.createElement("button");
    botao.type = "button";
    botao.className = "primary btn-adicionar";
    botao.textContent = estoque <= 0 ? "Sem estoque" : "Adicionar";
    botao.disabled = estoque <= 0 || id == null;

    botao.addEventListener("click", () => adicionarCarrinho(id));

    informacoes.append(rodape, botao);
    card.append(imagem, informacoes);
    container.appendChild(card);
  });
}

function obterImagemURL(imagem) {
  if (typeof imagem === "string") return imagem;

  if (Array.isArray(imagem) && imagem.length > 0) {
    const arquivo = imagem[0];
    return arquivo?.url ||
      arquivo?.thumbnails?.card_cover?.url ||
      arquivo?.thumbnails?.small?.url ||
      "";
  }

  if (imagem && typeof imagem === "object") {
    return imagem.url || imagem.value || "";
  }

  return "";
}

// ========================================
// TABELA DE PRODUTOS
// ========================================

function mostrarTabelaProdutos() {
  const tabela = document.getElementById("productsTable");
  if (!tabela) return;

  if (produtos.length === 0) {
    tabela.innerHTML = `<div class="empty">Nenhum produto cadastrado.</div>`;
    return;
  }

  const table = document.createElement("table");
  table.innerHTML = `
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
    <tbody></tbody>
  `;

  const tbody = table.querySelector("tbody");

  produtos.forEach(produto => {
    const ativo = produto.Ativo ?? produto.ativo ?? true;
    const linha = document.createElement("tr");

    [
      produto.ID ?? produto.id ?? "-",
      produto.Produto ?? produto.produto ?? "",
      obterTexto(produto.Categoria ?? produto.categoria),
      formatarMoeda(
        produto["Preço de venda"] ??
        produto["preço de venda"] ??
        produto["Preco de venda"] ??
        0
      ),
      obterNumero(produto.Estoque ?? produto.estoque ?? 0),
      ativo === false || ativo === "false" || ativo === 0
        ? "Inativo"
        : "Ativo"
    ].forEach(valor => {
      const td = document.createElement("td");
      td.textContent = String(valor);
      linha.appendChild(td);
    });

    tbody.appendChild(linha);
  });

  tabela.replaceChildren(table);
}

// ========================================
// CARRINHO
// ========================================

function configurarCarrinho() {
  document.getElementById("clearCart")?.addEventListener("click", () => {
    carrinho = [];
    atualizarCarrinho();
  });

  document.getElementById("finishSale")?.addEventListener("click", finalizarVenda);
}

function adicionarCarrinho(id) {
  const produto = produtos.find(p =>
    String(p.ID ?? p.id) === String(id)
  );

  if (!produto) {
    notificar("Produto não encontrado.");
    return;
  }

  const nome = obterTexto(produto.Produto ?? produto.produto ?? "Produto");
  const preco = obterNumero(
    produto["Preço de venda"] ??
    produto["preço de venda"] ??
    produto["Preco de venda"] ??
    0
  );
  const estoque = obterNumero(produto.Estoque ?? produto.estoque ?? 0);

  const existente = carrinho.find(item => String(item.id) === String(id));

  if (estoque <= 0) {
    notificar("Produto sem estoque.");
    return;
  }

  if (existente) {
    if (existente.quantidade >= estoque) {
      notificar("Quantidade maior que o estoque disponível.");
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

function removerCarrinho(id) {
  const index = carrinho.findIndex(item => String(item.id) === String(id));
  if (index < 0) return;

  if (carrinho[index].quantidade > 1) {
    carrinho[index].quantidade--;
  } else {
    carrinho.splice(index, 1);
  }

  atualizarCarrinho();
}

function atualizarCarrinho() {
  const container = document.getElementById("cartItems");
  const totalElement = document.getElementById("cartTotal");
  const countElement = document.getElementById("cartCount");

  if (container) {
    container.replaceChildren();

    if (carrinho.length === 0) {
      container.innerHTML = `<div class="empty">Seu carrinho está vazio.</div>`;
    } else {
      carrinho.forEach(item => {
        const linha = document.createElement("div");
        linha.className = "cart-row cart-item";

        const detalhes = document.createElement("div");
        const nome = document.createElement("strong");
        nome.className = "cart-name";
        nome.textContent = item.nome;

        const quantidade = document.createElement("small");
        quantidade.className = "cart-sub";
        quantidade.textContent = `${item.quantidade} × ${formatarMoeda(item.preco)}`;

        detalhes.append(nome, quantidade);

        const valores = document.createElement("div");
        valores.className = "cart-actions";

        const subtotal = document.createElement("strong");
        subtotal.textContent = formatarMoeda(item.preco * item.quantidade);

        const remover = document.createElement("button");
        remover.type = "button";
        remover.className = "text-btn btn-remover";
        remover.textContent = "×";
        remover.setAttribute("aria-label", `Remover uma unidade de ${item.nome}`);
        remover.addEventListener("click", () => removerCarrinho(item.id));

        valores.append(subtotal, remover);
        linha.append(detalhes, valores);
        container.appendChild(linha);
      });
    }
  }

  if (totalElement) totalElement.textContent = formatarMoeda(calcularTotal());

  if (countElement) {
    countElement.textContent = carrinho.reduce(
      (total, item) => total + item.quantidade,
      0
    );
  }
}

function calcularTotal() {
  return carrinho.reduce(
    (total, item) => total + item.preco * item.quantidade,
    0
  );
}

// ========================================
// PAGAMENTO
// ========================================

function configurarPagamento() {
  const botoes = document.querySelectorAll(".payment");

  botoes.forEach(botao => {
    botao.addEventListener("click", () => {
      botoes.forEach(b => b.classList.remove("active"));
      botao.classList.add("active");
      pagamentoSelecionado = botao.dataset.payment || "PIX";
    });
  });

  const ativo = document.querySelector(".payment.active");
  if (ativo) pagamentoSelecionado = ativo.dataset.payment || "PIX";
}

// ========================================
// FINALIZAR VENDA
// ========================================

async function finalizarVenda() {
  if (carrinho.length === 0) {
    notificar("Adicione algum produto primeiro.");
    return;
  }

  const botao = document.getElementById("finishSale");
  if (botao?.disabled) return;

  if (botao) botao.disabled = true;

  const total = calcularTotal();

  const venda = {
    total_bruto: total,
    desconto: 0,
    total_venda: total,
    pagamento: pagamentoSelecionado,
    status: "Concluída",
    observacao: ""
  };

  try {
    const response = await fetch(`${API_URL}/sales`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({
        venda,
        itens: carrinho.map(item => ({
          id: item.id,
          nome: item.nome,
          preco: item.preco,
          quantidade: item.quantidade,
          subtotal: item.preco * item.quantidade
        }))
      })
    });

    const data = await lerResposta(response);

    if (!response.ok || data.ok === false) {
      throw new Error(data.error || "Erro ao registrar venda.");
    }

    notificar("Venda registrada com sucesso!");
    carrinho = [];
    atualizarCarrinho();

    await Promise.all([
      carregarProdutos(),
      carregarVendas()
    ]);

    atualizarDashboard();
  } catch (erro) {
    console.error("Erro ao finalizar venda:", erro);
    notificar(`Não foi possível registrar a venda: ${erro.message}`);
  } finally {
    if (botao) botao.disabled = false;
  }
}

// ========================================
// VENDAS
// ========================================

async function carregarVendas() {
  try {
    const response = await fetch(`${API_URL}/sales`);
    const data = await lerResposta(response);

    if (!response.ok || data.ok === false) {
      throw new Error(data.error || "Erro ao buscar vendas.");
    }

    vendas = Array.isArray(data.sales) ? data.sales : [];

    mostrarTabelaVendas();
    atualizarDashboard();
  } catch (erro) {
    console.error("Erro ao carregar vendas:", erro);

    const tabela = document.getElementById("salesTable");
    if (tabela) {
      tabela.innerHTML = `<div class="empty">Não foi possível carregar as vendas.</div>`;
    }
  }
}

function mostrarTabelaVendas() {
  const container = document.getElementById("salesTable");
  if (!container) return;

  if (vendas.length === 0) {
    container.innerHTML = `<div class="empty">Nenhuma venda registrada.</div>`;
    return;
  }

  const tabela = document.createElement("table");
  tabela.innerHTML = `
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
    <tbody></tbody>
  `;

  const tbody = tabela.querySelector("tbody");

  vendas.forEach(venda => {
    const itens = Array.isArray(venda.itens) ? venda.itens : [];
    const nomes = itens.map(item => {
      if (item.produto && typeof item.produto === "object") {
        return obterTexto(
          item.produto.nome ??
          item.produto.Produto ??
          item.produto.produto ??
          "Produto"
        );
      }

      return typeof item.produto === "string"
        ? item.produto
        : obterTexto(item.nome ?? item.Produto ?? "Produto");
    }).filter(Boolean).join(", ");

    const quantidade = itens.reduce(
      (soma, item) => soma + obterNumero(item.quantidade ?? item.Quantidade),
      0
    );

    const data = obterCampo(venda, [
      "Criado em",
      "created_on",
      "Created on",
      "Data da venda",
      "Data de venda",
      "data_da_venda"
    ]);

    const total = obterNumero(obterCampo(venda, [
      "Total da Venda",
      "Total da venda",
      "Total venda",
      "Total de Venda",
      "Total de venda",
      "total_venda",
      "total",
      "valor_total"
    ]));

    const campos = [
      venda.id ?? venda.ID ?? "-",
      formatarData(data),
      nomes || "—",
      quantidade,
      formatarMoeda(total),
      obterTexto(venda.Pagamento ?? venda.pagamento),
      obterTexto(venda.Status ?? venda.status)
    ];

    const tr = document.createElement("tr");

    campos.forEach(valor => {
      const td = document.createElement("td");
      td.textContent = String(valor);
      tr.appendChild(td);
    });

    tbody.appendChild(tr);
  });

  container.replaceChildren(tabela);
}

// ========================================
// DASHBOARD
// ========================================

function atualizarDashboard() {
  const hoje = new Date();

  const vendasHoje = vendas.filter(venda => {
    const valorData = obterCampo(venda, [
      "Criado em",
      "created_on",
      "Created on",
      "Data da venda",
      "Data de venda",
      "data_da_venda"
    ]);

    const data = converterDataBaserow(valorData);
    if (!data) return false;

    return data.getFullYear() === hoje.getFullYear() &&
      data.getMonth() === hoje.getMonth() &&
      data.getDate() === hoje.getDate();
  });

  const faturamento = vendasHoje.reduce((soma, venda) => {
    return soma + obterNumero(obterCampo(venda, [
      "Total da Venda",
      "Total da venda",
      "Total venda",
      "Total de Venda",
      "Total de venda",
      "total_venda",
      "total",
      "valor_total"
    ]));
  }, 0);

  const statSales = document.getElementById("statSales");
  const statRevenue = document.getElementById("statRevenue");
  const statProducts = document.getElementById("statProducts");
  const statStock = document.getElementById("statStock");

  if (statSales) statSales.textContent = vendasHoje.length;
  if (statRevenue) statRevenue.textContent = formatarMoeda(faturamento);
  if (statProducts) statProducts.textContent = produtos.length;

  if (statStock) {
    statStock.textContent = produtos.reduce(
      (soma, produto) => soma + obterNumero(produto.Estoque ?? produto.estoque),
      0
    );
  }
}

// ========================================
// NOVO PRODUTO
// ========================================

function configurarNovoProduto() {
  document.getElementById("newProductBtn")
    ?.addEventListener("click", abrirFormularioProduto);
}

function abrirFormularioProduto() {
  if (document.getElementById("novoProdutoModal")) return;

  const modal = document.createElement("div");
  modal.id = "novoProdutoModal";
  modal.className = "modal";

  modal.innerHTML = `
    <div class="modal-card">
      <button class="close" id="fecharNovoProduto" type="button">×</button>
      <h2>Novo produto</h2>
      <p>Cadastre um novo produto.</p>

      <div class="admin-grid">
        <div style="grid-column:1/-1">
          <label for="novoProdutoNome">Produto</label>
          <input id="novoProdutoNome" type="text" placeholder="Nome do produto" required>
        </div>

        <div>
          <label for="novoProdutoCategoria">Categoria</label>
          <input id="novoProdutoCategoria" type="text" placeholder="Bebidas">
        </div>

        <div>
          <label for="novoProdutoEstoque">Estoque</label>
          <input id="novoProdutoEstoque" type="number" min="0" step="1" value="0">
        </div>

        <div>
          <label for="novoProdutoPreco">Preço de venda</label>
          <input id="novoProdutoPreco" type="number" min="0" step="0.01" value="0">
        </div>

        <div>
          <label for="novoProdutoCusto">Custo</label>
          <input id="novoProdutoCusto" type="number" min="0" step="0.01" value="0">
        </div>

        <div style="grid-column:1/-1">
          <label for="novoProdutoDescricao">Descrição</label>
          <textarea id="novoProdutoDescricao" rows="3" placeholder="Descrição do produto"></textarea>
        </div>
      </div>

      <div style="display:flex;gap:10px;margin-top:20px">
        <button class="secondary" id="cancelarNovoProduto" type="button">Cancelar</button>
        <button class="primary" id="salvarNovoProduto" type="button">CADASTRAR PRODUTO</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  document.getElementById("fecharNovoProduto")
    .addEventListener("click", fecharFormularioProduto);

  document.getElementById("cancelarNovoProduto")
    .addEventListener("click", fecharFormularioProduto);

  modal.addEventListener("click", event => {
    if (event.target === modal) fecharFormularioProduto();
  });

  document.getElementById("salvarNovoProduto")
    .addEventListener("click", salvarNovoProduto);
}

function fecharFormularioProduto() {
  document.getElementById("novoProdutoModal")?.remove();
}

async function salvarNovoProduto() {
  const nome = document.getElementById("novoProdutoNome")?.value.trim() ?? "";
  const categoria = document.getElementById("novoProdutoCategoria")?.value.trim() ?? "";
  const precoTexto = document.getElementById("novoProdutoPreco")?.value ?? "";
  const custoTexto = document.getElementById("novoProdutoCusto")?.value ?? "";
  const estoqueTexto = document.getElementById("novoProdutoEstoque")?.value ?? "";
  const descricao = document.getElementById("novoProdutoDescricao")?.value.trim() ?? "";

  const preco = Number(precoTexto);
  const custo = Number(custoTexto);
  const estoque = Number(estoqueTexto);

  if (!nome) {
    notificar("Digite o nome do produto.");
    return;
  }

  if (
    precoTexto === "" || custoTexto === "" || estoqueTexto === "" ||
    !Number.isFinite(preco) || !Number.isFinite(custo) ||
    !Number.isFinite(estoque) || preco < 0 || custo < 0 ||
    estoque < 0 || !Number.isInteger(estoque)
  ) {
    notificar("Confira os valores de preço, custo e estoque.");
    return;
  }

  const botao = document.getElementById("salvarNovoProduto");
  if (botao) {
    botao.disabled = true;
    botao.textContent = "CADASTRANDO...";
  }

  try {
    const response = await fetch(`${API_URL}/products`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({
        Produto: nome,
        Categoria: categoria || null,
        "Preço de venda": preco,
        Custo: custo,
        Estoque: estoque,
        Descrição: descricao,
        Ativo: true
      })
    });

    const data = await lerResposta(response);

    if (!response.ok || data.ok === false) {
      throw new Error(data.error || "Não foi possível cadastrar o produto.");
    }

    fecharFormularioProduto();
    notificar("Produto cadastrado com sucesso!");

    await carregarProdutos();
    trocarView("products");
  } catch (erro) {
    console.error("Erro ao cadastrar produto:", erro);
    notificar(`Erro ao cadastrar produto: ${erro.message}`);

    if (botao) {
      botao.disabled = false;
      botao.textContent = "CADASTRAR PRODUTO";
    }
  }
}

// ========================================
// ADMIN
// ========================================

function configurarAdmin() {
  const abrir = document.getElementById("adminBtn");
  const fechar = document.getElementById("closeAdmin");
  const modal = document.getElementById("adminModal");

  abrir?.addEventListener("click", () => modal?.classList.remove("hidden"));
  fechar?.addEventListener("click", () => modal?.classList.add("hidden"));

  modal?.addEventListener("click", event => {
    if (event.target === modal) modal.classList.add("hidden");
  });
}

// ========================================
// UTILITÁRIOS
// ========================================

async function lerResposta(response) {
  const texto = await response.text();

  let data;
  try {
    data = texto ? JSON.parse(texto) : {};
  } catch {
    throw new Error(
      `O servidor retornou uma resposta inválida (HTTP ${response.status}).`
    );
  }

  return data;
}

function obterCampo(objeto, nomes) {
  for (const nome of nomes) {
    if (
      objeto &&
      Object.prototype.hasOwnProperty.call(objeto, nome) &&
      objeto[nome] !== null &&
      objeto[nome] !== undefined
    ) {
      return objeto[nome];
    }
  }

  return "";
}

function obterNumero(valor) {
  if (valor === null || valor === undefined || valor === "") return 0;

  if (typeof valor === "number") {
    return Number.isFinite(valor) ? valor : 0;
  }

  if (typeof valor === "object") {
    return obterNumero(
      valor.value ??
      valor.amount ??
      valor.valor ??
      valor.number ??
      0
    );
  }

  let texto = String(valor).trim().replace(/R\$/gi, "").trim();

  if (texto.includes(",")) {
    texto = texto.replace(/\./g, "").replace(",", ".");
  }

  texto = texto.replace(/[^0-9.-]/g, "");

  const numero = Number(texto);
  return Number.isFinite(numero) ? numero : 0;
}

function obterTexto(valor) {
  if (valor === null || valor === undefined) return "";

  if (Array.isArray(valor)) {
    return valor.map(obterTexto).filter(Boolean).join(", ");
  }

  if (typeof valor === "object") {
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

function converterDataBaserow(valor) {
  if (!valor) return null;
  if (valor instanceof Date) return valor;

  if (typeof valor === "object") {
    valor = valor.value ??
      valor.date ??
      valor.datetime ??
      valor.created_on ??
      "";
  }

  const texto = String(valor).trim();
  if (!texto) return null;

  const iso = new Date(texto);
  if (!Number.isNaN(iso.getTime())) return iso;

  const match = texto.match(
    /^(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2}):(\d{2})(?::(\d{2}))?)?$/
  );

  if (!match) return null;

  return new Date(
    Number(match[3]),
    Number(match[2]) - 1,
    Number(match[1]),
    Number(match[4] || 0),
    Number(match[5] || 0),
    Number(match[6] || 0)
  );
}

function formatarMoeda(valor) {
  return obterNumero(valor).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function formatarData(valor) {
  if (!valor) return "-";

  const data = converterDataBaserow(valor);
  if (!data) return String(valor);

  return data.toLocaleString("pt-BR");
}

function notificar(mensagem) {
  const toast = document.getElementById("toast");

  if (toast) {
    toast.textContent = mensagem;
    toast.classList.remove("hidden");

    clearTimeout(notificar.timer);
    notificar.timer = setTimeout(() => {
      toast.classList.add("hidden");
    }, 3500);
  } else {
    alert(mensagem);
  }
}

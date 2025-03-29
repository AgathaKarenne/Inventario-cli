import * as readline from 'readline';
import { Produto } from './produto';
import { Categoria } from './categoria';
import { TipoProduto, TipoCategoria, Id } from './tipos';
import * as fs from 'fs';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

let produtos: Produto[] = [];
let categorias: Categoria[] = [];
let produtoIdCounter = 1;
let categoriaIdCounter = 1;


function exibirMenu() {
  console.log('\n--- Gerenciador de Inventário ---');
  console.log('1. Adicionar Categoria');
  console.log('2. Listar Categorias');
  console.log('3. Buscar Categoria');
  console.log('4. Atualizar Categoria');
  console.log('5. Remover Categoria');
  console.log('6. Adicionar Produto');
  console.log('7. Listar Produtos');
  console.log('8. Buscar Produto');
  console.log('9. Atualizar Produto');
  console.log('10. Remover Produto');
  console.log('11. Sair');

}
//funções auxiliares para capturar entradas do usuário de forma segura,
// tratando possíveis erros de conversão de tipos.
//Entrada de Dados: Sistema para capturar entradas do usuário de forma segura
function lerEntrada(pergunta: string): Promise<string> {
    return new Promise((resolve) => {
      rl.question(pergunta, (resposta) => {
        resolve(resposta);
      });
    });
  }
  
  async function lerNumero(pergunta: string): Promise<number> {
    while (true) {
      const entrada = await lerEntrada(pergunta);
      const numero = parseFloat(entrada);
      if (!isNaN(numero)) {
        return numero;
      }
      console.log('Entrada inválida. Digite um número.');
    }
  }
  
  function exibirCategorias(listaCategorias: Categoria[]) {
    console.table(listaCategorias, [
        'id',
        'nome',
        'descricao',
        'dataCriacao',
        'tipo'
    ]);
  }
  
  function exibirProdutos(listaProdutos: Produto[]) {
    console.table(listaProdutos, [
      'id',
      'nome',
      'descricao',
      'preco',
      'quantidade',
      'categoriaId',
      'dataCriacao',
      'dataAtualizacao',
      'tipo'
    ]);
  }

// Funções de Gestão de Categorias
function adicionarCategoria() {
    rl.question('Nome da categoria: ', (nome) => {
        rl.question('Descrição da categoria: ', (descricao) => {
            rl.question('Tipo da categoria (Produto ou Serviço): ', (tipo) => {
                let tipoCategoria: TipoCategoria;
                if (tipo.toLowerCase() === 'produto') {
                    tipoCategoria = TipoCategoria.Produto;
                } else if (tipo.toLowerCase() === 'serviço') {
                    tipoCategoria = TipoCategoria.Servico;
                } else {
                    console.log('Tipo de categoria inválido. Categoria adicionada como produto.');
                    tipoCategoria = TipoCategoria.Produto;
                }
                const novaCategoria: Categoria = {
                    id: categoriaIdCounter++,
                    nome,
                    descricao,
                    dataCriacao: new Date(),
                    tipo: tipoCategoria,
                };
                categorias.push(novaCategoria);
                console.log('Categoria adicionada com sucesso!');
                exibirMenu();
                processarOpcao();
            });
        });
    });
}

  function listarCategorias() {
    console.log('\n--- Lista de Categorias ---');
    exibirCategorias(categorias);
    exibirMenu();
    processarOpcao();
  }

  //generics permitem criar funçoes e calsses reutilizaveis que funcionam com diferentes tipos de daods.
  function buscar<T>(lista: T[], termo: string): T[] {
    return lista.filter((item: any) => {
        for (const prop in item) {
            if (item[prop].toString().toLowerCase().includes(termo.toLowerCase())) {
                return true;
            }
        }
        return false;
    });
}
function buscarCategoria() {
    rl.question('ID ou nome da categoria: ', (termo) => {
        const resultados = buscar<Categoria>(categorias, termo);
        if (resultados.length > 0) {
            console.log('\n--- Resultados da Busca ---');
            exibirCategorias(resultados);
        } else {
            console.log('Categoria não encontrada.');
        }
        exibirMenu();
        processarOpcao();
    });
}

  function atualizarCategoria() {
    rl.question('ID da categoria a ser atualizada: ', (id) => {
      const categoriaIndex = categorias.findIndex((categoria) => categoria.id === parseInt(id));
      if (categoriaIndex !== -1) {
        rl.question('Novo nome (ou deixe em branco para manter): ', (nome) => {
          rl.question('Nova descrição (ou deixe em branco para manter): ', (descricao) => {
            if (nome) categorias[categoriaIndex].nome = nome;
            if (descricao) categorias[categoriaIndex].descricao = descricao;
            console.log('Categoria atualizada com sucesso!');
            exibirMenu();
            processarOpcao();
          });
        });
      } else {
        console.log('Categoria não encontrada.');
        exibirMenu();
        processarOpcao();
      }
    });
  }

  //Antes de remover um produto ou categoria,
  //solicite confirmação do usuário para evitar remoções acidentais.
  async function removerCategoria() {
    const id = await lerNumero('ID da categoria a ser removida: ');
    const categoria = categorias.find((categoria) => categoria.id === id);
    if (categoria) {
      const produtosAssociados = produtos.filter(
        (produto) => produto.categoriaId === categoria.id
      );
      if (produtosAssociados.length > 0) {
        console.log(
          'Não é possível remover a categoria. Existem produtos associados a ela.'
        );
      } else {
        const confirmacao = await lerEntrada(
          `Tem certeza que deseja remover a categoria "${categoria.nome}"? (s/n): `
        );
        if (confirmacao.toLowerCase() === 's') {
          categorias = categorias.filter((categoria) => categoria.id !== id);
          console.log('Categoria removida com sucesso!');
        } else {
          console.log('Remoção cancelada.');
        }
      }
    } else {
      console.log('Categoria não encontrada.');
    }
    exibirMenu();
    processarOpcao();
  }


// Funções de Gestão de Produtos (com validações e tratamento de erros)
async function adicionarProduto() {
    try {
      const nome = await lerEntrada('Nome do produto: ');
      const descricao = await lerEntrada('Descrição do produto: ');
      const preco = await lerNumero('Preço do produto: ');
      const quantidade = await lerNumero('Quantidade: ');
      const categoriaId = await lerNumero('ID da categoria: ');
      const tipoProdutoString = await lerEntrada(`Tipo do produto (${Object.values(TipoProduto).join(', ')}): `);
  
      const categoriaExiste = categorias.some((categoria) => categoria.id === categoriaId);
      if (!categoriaExiste) {
        console.log('Categoria não encontrada.');
        exibirMenu();
        processarOpcao();
        return;
      }
  
      if (preco < 0 || quantidade < 0) {
        console.log('Preço e quantidade não podem ser negativos.');
        exibirMenu();
        processarOpcao();
        return;
      }
  
      let tipo: TipoProduto;
      if (Object.values(TipoProduto).includes(tipoProdutoString as TipoProduto)) {
        tipo = tipoProdutoString as TipoProduto;
      } else {
        console.log('Tipo de produto inválido. Produto adicionado como Eletrônico.');
        tipo = TipoProduto.Eletronico;
      }
  
      const novoProduto: Produto = {
        id: produtoIdCounter++,
        nome,
        descricao,
        preco,
        quantidade,
        categoriaId,
        dataCriacao: new Date(),
        dataAtualizacao: new Date(),
        tipo: tipo, // Correção: atribuição correta
      };
      produtos.push(novoProduto);
      console.log('Produto adicionado com sucesso!');
      exibirMenu();
      processarOpcao();
    } catch (erro) {
      console.error('Ocorreu um erro:', erro);
      registrarErro(erro);
      exibirMenu();
      processarOpcao();
    }
  }

function listarProdutos() {
  console.log('\n--- Lista de Produtos ---');
  exibirProdutos(produtos);
  exibirMenu();
  processarOpcao();
}

function buscarProduto() {
    rl.question('ID, nome ou categoria do produto: ', (termo) => {
        const resultados = buscar<Produto>(produtos, termo);
        if (resultados.length > 0) {
            console.log('\n--- Resultados da Busca ---');
            exibirProdutos(resultados);
        } else {
            console.log('Nenhum produto encontrado.');
        }
        exibirMenu();
        processarOpcao();
    });
}

function atualizarProduto() {
  rl.question('ID do produto a ser atualizado: ', (id) => {
    const produtoIndex = produtos.findIndex((produto) => produto.id === parseInt(id));
    if (produtoIndex !== -1) {
      rl.question('Novo nome (ou deixe em branco para manter): ', (nome) => {
        rl.question('Nova descrição (ou deixe em branco para manter): ', (descricao) => {
          rl.question('Novo preço (ou deixe em branco para manter): ', (preco) => {
            rl.question('Nova quantidade (ou deixe em branco para manter): ', (quantidade) => {
              rl.question('Nova categoria ID (ou deixe em branco para manter): ', (categoriaId) => {
                if (nome) produtos[produtoIndex].nome = nome;
                if (descricao) produtos[produtoIndex].descricao = descricao;
                if (preco) produtos[produtoIndex].preco = parseFloat(preco);
                if (quantidade) produtos[produtoIndex].quantidade = parseInt(quantidade);
                if (categoriaId) produtos[produtoIndex].categoriaId = parseInt(categoriaId);
                produtos[produtoIndex].dataAtualizacao = new Date();
                console.log('Produto atualizado com sucesso!');
                exibirMenu();
                processarOpcao();
              });
            });
          });
        });
      });
    } else {
      console.log('Produto não encontrado.');
      exibirMenu();
      processarOpcao();
    }
  });
}

function removerProduto() {
  rl.question('ID do produto a ser removido: ', (id) => {
    produtos = produtos.filter((produto) => produto.id !== parseInt(id));
    console.log('Produto removido com sucesso!');
    exibirMenu();
    processarOpcao();
  });
}

//registrar os erros em um arquivo de log para facilitar a depuração e o monitoramento.
function registrarErro(erro: any) {
    const mensagemErro = `${new Date().toISOString()} - ${erro.stack || erro.message || erro}\n`;
    fs.appendFile('erros.log', mensagemErro, (err) => {
      if (err) {
        console.error('Erro ao registrar erro:', err);
      }
    });
  }

async function processarOpcao() {
    try { //tratar erros e garantir que o menu seja exibido após cada interação.
      const opcao = await lerEntrada('Escolha uma opção: ');
      switch (opcao) {
        case '1':
          adicionarCategoria();
          break;
        case '2':
          listarCategorias();
          break;
        case '3':
          buscarCategoria();
          break;
        case '4':
          atualizarCategoria();
          break;
        case '5':
          removerCategoria();
          break;
        case '6':
          adicionarProduto();
          break;
        case '7':
          listarProdutos();
          break;
        case '8':
          buscarProduto();
          break;
        case '9':
          atualizarProduto();
          break;
        case '10':
          removerProduto();
          break;
        case '11':
          rl.close();
          break;
        default:
          console.log('Opção inválida!');
      }
    } catch (erro) {
      console.error('Ocorreu um erro:', erro);
      registrarErro(erro); // aqui registrara o erro no arquivo
    } finally {
      exibirMenu();
      processarOpcao();
    }
  }

exibirMenu();
processarOpcao();
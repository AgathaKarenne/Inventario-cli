import { TipoProduto, Id } from './tipos';

export interface Produto {
  id: Id;
  nome: string;
  descricao: string;
  preco: number;
  quantidade: number;
  categoriaId: Id;
  dataCriacao: Date;
  dataAtualizacao: Date;
  tipo: TipoProduto;
}
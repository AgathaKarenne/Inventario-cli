import { TipoCategoria, Id } from './tipos';

export interface Categoria {
  id: Id;
  nome: string;
  descricao: string;
  dataCriacao: Date;
  dataAtualizacao?: Date; // funcionalidade opcional
  tipo: TipoCategoria;
}

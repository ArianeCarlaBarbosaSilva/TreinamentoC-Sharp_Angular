export interface Lote {
    id: number; 
    nome: string;
    preço: number;
    dataInicio?: Date;
    dataFim?: Date;
    quantidade: number; 
    eventoId: number; 
}

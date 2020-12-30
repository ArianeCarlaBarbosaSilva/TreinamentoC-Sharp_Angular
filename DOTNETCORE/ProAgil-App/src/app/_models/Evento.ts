import { Lote } from './Lote';
import { Palestrante } from './Palestrante';
import { RedeSocial } from './RedeSocial';

export class Evento {

    constructor() { }

    id: number; 
    local: string; 
    dataEvento: Date;
    tema: string; 
    qtdePessoas: number; 
    imagemURL: string; 
    telefone: string; 
    email: string; 
    lote: string; 
    lotes: Lote[];
    redesSociais: RedeSocial[];
    palestranteEventos: Palestrante[];
}

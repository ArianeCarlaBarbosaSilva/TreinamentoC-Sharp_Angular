import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import { EventoService } from '../_services/evento.service';
import { Evento } from '../_models/Evento';
import { BsModalService } from 'ngx-bootstrap/modal';
import { defineLocale, ptBrLocale } from 'ngx-bootstrap/chronos';
import { BsLocaleService } from "ngx-bootstrap/datepicker";
import { ToastrService } from "ngx-toastr";

defineLocale('pt-br', ptBrLocale);

@Component({
  selector: 'app-eventos',
  templateUrl: './eventos.component.html',
  styleUrls: ['./eventos.component.css']
})
export class EventosComponent implements OnInit {

  titulo = 'Eventos';

  eventosFiltrados: Evento[];
  eventos: Evento[];
  evento: Evento;
  modoSalvar = 'post';
  imagemLargura: number = 50;
  imagemMargem: number = 2;
  mostrarImagem: boolean = false;
  registerForm: FormGroup;
  bodyDeletarEvento = '';

  file: File;
  fileNameToUpdate: string;
  dataAtual: string;

  _filtroLista: string;
  
  constructor(
    private eventoService: EventoService,
    private modalService: BsModalService,
    private localeService: BsLocaleService,
    private toastr: ToastrService,
    private fb: FormBuilder,
    ) { 
      this.localeService.use('pt-Br');
    }

  public get filtroLista() : string {
    return this._filtroLista;
  }
  
  public set filtroLista(value : string) {
    this._filtroLista = value;
    this.eventosFiltrados = this.filtroLista ? this.filtrarEventos(this.filtroLista) : this.eventos;
  }

  ngOnInit(): void {
    this.validation();
    this.getEventos();
  }

  openModal(template: any) {
    this.registerForm.reset();
    template.show();
  }

  editarEvento(evento: Evento, template: any) {
    this.modoSalvar = 'put'; //porque vamos atualizar
    this.openModal(template);
    this.evento = Object.assign({}, evento); //copiar as informações dentro do evento para um novo objeto...
    this.fileNameToUpdate = evento.imagemURL.toString();
    this.evento.imagemURL = ''; //...e usar o elemento do atributo da classe pois o evento que recebemos como parametro
    this.registerForm.patchValue(this.evento); //está sofrendo um binding com o html. Aqui queremos desassociar os dois
    //assim, quando limpamos a imagem '' não estamos limpando a do html mas sim a cópia que fizemos dele.
  }

  novoEvento(template: any) {
    this.modoSalvar = 'post';
    this.openModal(template);
  }

  getEventos() {
    this.dataAtual = new Date().getMilliseconds().toString();
    this.eventoService.getAllEventos().subscribe(
      (_eventos: Evento[]) => { 
      this.eventos = _eventos;
      this.eventosFiltrados = this.eventos;
    }, (error) => {
      this.toastr.error('Erro ao carregar eventos: ${error}');
    });
  }

  filtrarEventos(filtrarPor: string): Evento[] {
    filtrarPor = filtrarPor.toLocaleLowerCase();
    return this.eventos.filter(
      evento => evento.tema.toLocaleLowerCase().indexOf(filtrarPor) !== -1
    );
  }

  alternarImagem() {
    this.mostrarImagem = !this.mostrarImagem;
  }

  validation() {
    this.registerForm = this.fb.group({
      tema: ['', [Validators.required, Validators.minLength(4), Validators.maxLength(50)]],
      local: ['', Validators.required],
      dataEvento: ['', Validators.required],
      imagemURL: ['', Validators.required],
      qtdePessoas: ['', [Validators.required, Validators.max(120000)]],
      telefone: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
    });
  }

  onFileChange(event) {
    const reader = new FileReader();

    if (event.target.files && event.target.files.length) {
      this.file = event.target.files;
    }
  }

  uploadImagem() {
    if (this.modoSalvar === 'post') {
      /* imagemURL => "c:\fakeFolder\xxxx.jpg" => Dando um split na \, o nome do arquivo fica
      nomeArquivo = [c:, fakeFolder, xxxx.jpg] => Como o que interessa é o nome do arquivo
      pegamos a 3a posiçao do array [2] */
      const nomeArquivo = this.evento.imagemURL.split('\\', 3);
      this.evento.imagemURL = nomeArquivo[2];

      //chamar o save do arquivo
      this.eventoService.postUpload(this.file, nomeArquivo[2])
        .subscribe(
          () => {
            this.dataAtual = new Date().getMilliseconds().toString();
            this.getEventos();
          }
        );

    } else { //realizando um put update
      this.evento.imagemURL = this.fileNameToUpdate; //para salvar o nome da imagem no BD
      this.eventoService.postUpload(this.file, this.fileNameToUpdate)
        .subscribe(
          () => {
            this.dataAtual = new Date().getMilliseconds().toString();
            this.getEventos();
          }
        );
    }
  }

  salvarAlteracao(template: any) {
    if (this.registerForm.valid) {
      if (this.modoSalvar === 'post') {
        this.evento = Object.assign({}, this.registerForm.value);

        this.uploadImagem();

        this.eventoService.postEvento(this.evento).subscribe(
          (novoEvento: Evento) => {
            console.log(novoEvento);
            template.hide();
            this.getEventos();
            this.toastr.success('Inserido com sucesso!');
          }, (error) => {
            this.toastr.error('Erro ao inserir: ${error}');
          }
        );
      } else {
        this.evento = Object.assign({id: this.evento.id}, this.registerForm.value);

        this.uploadImagem();

        this.eventoService.putEvento(this.evento).subscribe(
          () => {
            template.hide();
            this.getEventos();
            this.toastr.success('Editado com sucesso!');
          }, (error) => {
            this.toastr.error('Erro ao atualizar: ${error}');
          }
        );
      }
    }
  }

  excluirEvento(evento: Evento, template: any) {
    this.openModal(template);
    this.evento = evento;
    this.bodyDeletarEvento = `Tem certeza que deseja excluir o Evento: ${evento.tema}, Código: ${evento.id}`;
  }
  
  confirmeDelete(template: any) {
    this.eventoService.deleteEvento(this.evento.id).subscribe(
      () => {
          template.hide();
          this.getEventos();
          this.toastr.success('Excluído com sucesso!');
        }, error => {
          this.toastr.error('Falha ao tentar deletar. Tente novamente mais tarde.');
          console.log(error);
        }
    );
  }
}

import { Component } from '@angular/core';
import { CreateEmpresaComponent } from '../create-empresa/create-empresa.component';
import { EditEmpresaComponent } from '../edit-empresa/edit-empresa.component';
import { DeleteEmpresaComponent } from '../delete-empresa/delete-empresa.component';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { EmpresaService } from '../service/empresa.service';

@Component({
  selector: 'app-list-empresa',
  templateUrl: './list-empresa.component.html',
  styleUrls: ['./list-empresa.component.scss']
})
export class ListEmpresaComponent {

  search: string = '';
  EMPRESAS: any[] = [];
  isLoading$: any;

  totalPages: number = 0;
  currentPage: number = 1;

  constructor(
    public modalService: NgbModal,
    public empresaService: EmpresaService,
  ) { }

  ngOnInit(): void {
    this.isLoading$ = this.empresaService.isLoading$;
    this.listEmpresas();
  }

  listEmpresas(page = 1) {
    this.empresaService.listEmpresas(page, this.search).subscribe((resp: any) => {
      console.log(resp);
      this.EMPRESAS = resp.empresas; // asegúrate que el backend devuelve `empresas`
      this.totalPages = resp.total;
      this.currentPage = page;
    });
  }

  loadPage($event: any) {
    this.listEmpresas($event);
  }

  createEmpresa() {
    const modalRef = this.modalService.open(CreateEmpresaComponent, { centered: true, size: 'xl' });


    modalRef.componentInstance.EmpresaC.subscribe((empresa: any) => {
      this.EMPRESAS.unshift(empresa);
    });
  }

  editEmpresa(EMPRESA: any) {
    const modalRef = this.modalService.open(EditEmpresaComponent, { centered: true, size: 'xl' });
    modalRef.componentInstance.EMPRESA_SELECTED = EMPRESA;

    modalRef.componentInstance.EmpresaE.subscribe((empresa: any) => {
      const INDEX = this.EMPRESAS.findIndex((e: any) => e.id == EMPRESA.id);
      if (INDEX != -1) {
        this.EMPRESAS[INDEX] = empresa;
      }
    });
  }

  deleteEmpresa(EMPRESA: any) {
    const modalRef = this.modalService.open(DeleteEmpresaComponent, { centered: true, size: 'md' });
    modalRef.componentInstance.EMPRESA_SELECTED = EMPRESA;

    modalRef.componentInstance.EmpresaD.subscribe(() => {
      const INDEX = this.EMPRESAS.findIndex((e: any) => e.id == EMPRESA.id);
      if (INDEX != -1) {
        this.EMPRESAS.splice(INDEX, 1);
      }
    });
  }


  enviarMensajeWhatsApp() {
  const numeroDestino = '5939982463178'; // 🔥 número fijo (sin el +)
  const mensaje = prompt('Ingrese el mensaje a enviar');

  if (!mensaje) return;

  const payload = {
    number: numeroDestino,
    message: mensaje
  };

  this.empresaService.enviarMensajeWhatsApp(payload)
    .subscribe({
      next: res => alert('✅ Mensaje enviado correctamente'),
      error: err => alert('❌ Error al enviar el mensaje')
    });
}



}

import { Component, Input } from '@angular/core';
import { CreateProyectoComponent } from '../create-proyecto/create-proyecto.component';
import { UpdateProyectoComponent } from '../update-proyecto/update-proyecto.component';
import { DeleteProyectoComponent } from '../delete-proyecto/delete-proyecto.component';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ProyectoService } from '../service/proyecto.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-list-proyecto',
  templateUrl: './list-proyecto.component.html',
  styleUrls: ['./list-proyecto.component.scss']
})
export class ListProyectoComponent {

  search: string = '';
  PROYECTOS: any[] = [];
  isLoading$: any;

  totalPages: number = 0;
  currentPage: number = 1;

  @Input() proyecto: any;
 

  constructor(
    public modalService: NgbModal,
    public proyectoService: ProyectoService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.isLoading$ = this.proyectoService.isLoading$;
    this.listProyectos();
    console.log("Proyecto recibido:", this.proyecto);
  }

  listProyectos(page = 1) {
    this.proyectoService.listProyectos(page, this.search).subscribe((resp: any) => {
      this.PROYECTOS = resp.proyectos; // Asegúrate de que el backend devuelve `proyectos`
      this.totalPages = resp.total;
      this.currentPage = page;
    });
  }

  loadPage($event: any) {
    this.listProyectos($event);
  }

  createProyecto() {
    const modalRef = this.modalService.open(CreateProyectoComponent, { centered: true, size: 'lg' });

    modalRef.componentInstance.ProyectoC.subscribe((proyecto: any) => {
      this.PROYECTOS.unshift(proyecto);
    });
  }

  editProyecto(PROYECTO: any) {
   
  const modalRef = this.modalService.open(UpdateProyectoComponent, { centered: true, size: 'lg' });
  modalRef.componentInstance.PROYECTO_SELECTED = PROYECTO;

  modalRef.componentInstance.ProyectoE.subscribe((proyectoActualizado: any) => {
    const INDEX = this.PROYECTOS.findIndex((p: any) => p.id_proyecto === proyectoActualizado.id_proyecto);
    if (INDEX !== -1) {
      this.PROYECTOS[INDEX] = proyectoActualizado;
    }
  });
}


  deleteProyecto(PROYECTO: any) {
    const modalRef = this.modalService.open(DeleteProyectoComponent, { centered: true, size: 'md' });
    modalRef.componentInstance.PROYECTO_SELECTED = PROYECTO;

    modalRef.componentInstance.ProyectoD.subscribe(() => {
      const INDEX = this.PROYECTOS.findIndex((p: any) => p.id == PROYECTO.id);
      if (INDEX != -1) {
        this.PROYECTOS.splice(INDEX, 1);
      }
    });
  }



 
  verModuloProyecto(id_proyecto: number) {
    this.router.navigate(['/modulos/list'], { queryParams: { id_proyecto } });
  }



}

import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { ProyectoService } from '../../proyecto/service/proyecto.service';

@Component({
  selector: 'app-update-proyecto',
  templateUrl: './update-proyecto.component.html',
  styleUrls: ['./update-proyecto.component.scss']
})
export class UpdateProyectoComponent {

  @Output() ProyectoE: EventEmitter<any> = new EventEmitter();
  @Input() PROYECTO_SELECTED: any;

  nombre: string = '';
  id_empresa: number | null = null;
  estado: number = 1;

  isLoading: boolean = false;

  constructor(
    public modal: NgbActiveModal,
    private proyectosService: ProyectoService,
    private toast: ToastrService,
  ) {}

  ngOnInit(): void {
    if (this.PROYECTO_SELECTED) {
      this.nombre = this.PROYECTO_SELECTED.nombre;
      this.id_empresa = this.PROYECTO_SELECTED.id_empresa;
      this.estado = this.PROYECTO_SELECTED.estado ?? 1;

      console.log('Proyecto seleccionado:', this.PROYECTO_SELECTED);
    console.log('id_empresa:', this.id_empresa);
    }
  }

  update() {
  // Validaciones básicas
  if (!this.nombre.trim()) {
    this.toast.error("Validación", "El nombre es requerido");
    return;
  }

  if (!this.id_empresa) {
    this.toast.error("Validación", "Debe seleccionar una empresa");
    return;
  }

  this.isLoading = true;

  // Preparar datos para enviar (FormData para simular PUT vía POST con _method)
  const data = new FormData();
  data.append('nombre', this.nombre);
  data.append('id_empresa', this.id_empresa.toString());
  data.append('estado', this.estado.toString());
  data.append('_method', 'PUT'); // si tu backend espera método PUT vía POST con _method

  // Enviar la petición al backend usando el id correcto (id o id_proyecto)
  // Aquí asumimos que el backend usa 'id' como identificador
  const proyectoId = this.PROYECTO_SELECTED.id; 

  console.log('Enviando proyecto ID:', proyectoId); // para debug

  this.proyectosService.updateProyecto(proyectoId, data).subscribe({
    next: (resp: any) => {
      this.toast.success("Éxito", "Proyecto actualizado correctamente");
      this.ProyectoE.emit(resp.proyecto); // emitir proyecto actualizado
      this.modal.close();
    },
    error: (err: any) => {
      this.toast.error("Error", "No se pudo actualizar el proyecto");
      this.isLoading = false;
    },
    complete: () => this.isLoading = false,
  });
}

}

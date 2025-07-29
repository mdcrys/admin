import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { EmpresaService } from '../service/empresa.service';

@Component({
  selector: 'app-edit-empresa',
  templateUrl: './edit-empresa.component.html',
  styleUrls: ['./edit-empresa.component.scss']
})
export class EditEmpresaComponent {

  @Output() EmpresaE: EventEmitter<any> = new EventEmitter();
  @Input() EMPRESA_SELECTED: any;

  nombre: string = '';
  ruc: string = '';
  telefono: string = '';
  correo: string = '';
  direccion: string = '';
  estado: number = 1;

  // Imagen
  IMAGEN_EMPRESA: any;
  IMAGEN_PREVISUALIZA: any;

  // Datos del administrador
  admin_nombre: string = '';
  admin_apellido: string = '';
  admin_correo: string = '';
  admin_password: string = '';
  admin_password_confirm: string = '';

  isLoading: any;

  constructor(
    public modal: NgbActiveModal,
    public empresaService: EmpresaService,
    public toast: ToastrService,
  ) {}

  ngOnInit(): void {
    console.log('Datos recibidos para editar:', this.EMPRESA_SELECTED);

    this.nombre = this.EMPRESA_SELECTED.nombre_empresa;
    this.ruc = this.EMPRESA_SELECTED.ruc_empresa;
    this.telefono = this.EMPRESA_SELECTED.telefono;
    this.correo = this.EMPRESA_SELECTED.correo;
    this.direccion = this.EMPRESA_SELECTED.direccion || '';
    this.estado = this.EMPRESA_SELECTED.estado;
    this.IMAGEN_PREVISUALIZA = this.EMPRESA_SELECTED.imagen;

    // Si ya hay administrador asignado, puedes inicializar sus datos aquí
    if (this.EMPRESA_SELECTED.admin) {
      this.admin_nombre = this.EMPRESA_SELECTED.admin.nombre || '';
      this.admin_apellido = this.EMPRESA_SELECTED.admin.apellido || '';
      this.admin_correo = this.EMPRESA_SELECTED.admin.correo || '';
    }
  }

  processFile($event: any) {
    if ($event.target.files[0].type.indexOf("image") < 0) {
      this.toast.warning("Advertencia", "El archivo no es una imagen");
      return;
    }
    this.IMAGEN_EMPRESA = $event.target.files[0];
    const reader = new FileReader();
    reader.readAsDataURL(this.IMAGEN_EMPRESA);
    reader.onloadend = () => this.IMAGEN_PREVISUALIZA = reader.result;
  }

  store() {
    if (!this.nombre) {
      this.toast.error("Validación", "El nombre es requerido");
      return;
    }

    if (this.admin_password !== this.admin_password_confirm) {
      this.toast.error("Validación", "Las contraseñas no coinciden");
      return;
    }

    const formData = new FormData();
    formData.append("nombre_empresa", this.nombre);
    formData.append("ruc_empresa", this.ruc);
    formData.append("telefono", this.telefono);
    formData.append("correo", this.correo);
    formData.append("direccion", this.direccion);
    formData.append("estado", this.estado.toString());

    if (this.IMAGEN_EMPRESA) {
      formData.append("imagen_empresa", this.IMAGEN_EMPRESA);
    }

    // Agregar datos del administrador
    formData.append("admin_nombre", this.admin_nombre);
    formData.append("admin_apellido", this.admin_apellido);
    formData.append("admin_correo", this.admin_correo);
    formData.append("admin_password", this.admin_password);

    this.empresaService.updateEmpresa(this.EMPRESA_SELECTED.id, formData).subscribe((resp: any) => {
      if (resp.message === 403) {
        this.toast.error("Validación", resp.message_text);
      } else {
        this.toast.success("Éxito", "La empresa se actualizó correctamente");
        this.EmpresaE.emit(resp.empresa);
        this.modal.close();
      }
    });
  }
}

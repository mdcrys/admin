import { Component, EventEmitter, Output } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { EmpresaService } from '../service/empresa.service';

@Component({
  selector: 'app-create-empresa',
  templateUrl: './create-empresa.component.html',
  styleUrls: ['./create-empresa.component.scss']
})
export class CreateEmpresaComponent {

  @Output() EmpresaC: EventEmitter<any> = new EventEmitter();

  nombre: string = '';
  ruc: string = '';
  telefono: string = '';
  correo: string = '';
  direccion: string = '';
  //DATOS PARA EL ADMINISTRADOR DEL SSTEMA
  admin_nombre: string = '';
  admin_apellido: string = '';
  admin_correo: string = '';
  admin_password: string = '';
  admin_password_confirm: string = '';

  isLoading: any;

  LOGO_EMPRESA: any;
  LOGO_PREVISUALIZA: any;

  constructor(
    public modal: NgbActiveModal,
    public empresaService: EmpresaService,
    public toast: ToastrService,
  ) {}

  ngOnInit(): void {}

  processFile($event: any) {
    if ($event.target.files[0].type.indexOf("image") < 0) {
      this.toast.warning("WARN", "El archivo no es una imagen");
      return;
    }
    this.LOGO_EMPRESA = $event.target.files[0];
    let reader = new FileReader();
    reader.readAsDataURL(this.LOGO_EMPRESA);
    reader.onloadend = () => this.LOGO_PREVISUALIZA = reader.result;
  }

  store() {
  // Validaciones básicas empresa
  if (!this.nombre) {
    this.toast.error("Validación", "El nombre de la empresa es requerido");
    return;
  }

  if (!this.LOGO_EMPRESA) {
    this.toast.error("Validación", "El logo es requerido");
    return;
  }

  // Validaciones básicas administrador
  if (!this.admin_nombre) {
    this.toast.error("Validación", "El nombre del administrador es requerido");
    return;
  }
  if (!this.admin_apellido) {
    this.toast.error("Validación", "El apellido del administrador es requerido");
    return;
  }
  if (!this.admin_correo) {
    this.toast.error("Validación", "El correo del administrador es requerido");
    return;
  }
  if (!this.admin_password) {
    this.toast.error("Validación", "La contraseña del administrador es requerida");
    return;
  }
  if (this.admin_password !== this.admin_password_confirm) {
    this.toast.error("Validación", "Las contraseñas no coinciden");
    return;
  }

  const formData = new FormData();
  // Datos empresa
  formData.append("nombre_empresa", this.nombre);
  formData.append("ruc_empresa", this.ruc || '');
  formData.append("telefono", this.telefono || '');
  formData.append("correo", this.correo || '');
  formData.append("logo", this.LOGO_EMPRESA);

  // Datos administrador
  formData.append("admin_nombre", this.admin_nombre);
  formData.append("admin_apellido", this.admin_apellido);
  formData.append("admin_correo", this.admin_correo);
  formData.append("admin_password", this.admin_password);

  this.empresaService.registerEmpresa(formData).subscribe((resp: any) => {
    if (resp.message === 403) {
      this.toast.error("Validación", resp.message_text);
    } else {
      this.toast.success("Éxito", "La empresa se registró correctamente");
      this.EmpresaC.emit(resp.empresa);
      this.modal.close();
    }
  });
}


}

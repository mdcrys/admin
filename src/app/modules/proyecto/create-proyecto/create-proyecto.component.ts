import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ProyectoService } from '../../proyecto/service/proyecto.service';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../auth/services/auth.service';

@Component({
  selector: 'app-create-proyecto',
  templateUrl: './create-proyecto.component.html',
})
export class CreateProyectoComponent implements OnInit {
  nombre: string = '';
  user: any;
  isLoading: boolean = false;

  @Output() ProyectoC = new EventEmitter<any>();

  constructor(
    private authService: AuthService,
    public ProyectoService: ProyectoService,
    public toast: ToastrService,
    public modal: NgbActiveModal
  ) {}

  ngOnInit(): void {
    this.user = this.authService.user;
  }

  store() {
    if (!this.user?.id_empresa) {
      this.toast.error('No se encontró la empresa del usuario');
      return;
    }

    const proyectoData = {
      nombre: this.nombre,
      id_empresa: this.user.id_empresa,
    };

    this.isLoading = true;

    this.ProyectoService.registerProyecto(proyectoData).subscribe({
      next: (resp: any) => {
        this.toast.success('Proyecto creado correctamente');
        this.ProyectoC.emit(resp.proyecto);
        this.modal.close();
      },
      error: () => {
        this.toast.error('Error al crear el proyecto');
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }

  cerrar() {
    this.modal.close();
  }
}

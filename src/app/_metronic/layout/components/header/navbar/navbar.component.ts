import { ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { AuthService } from 'src/app/modules/auth';
import { EmpresaService } from 'src/app/modules/empresas/service/empresa.service'; // Asegúrate que la ruta sea correcta

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
})
export class NavbarComponent implements OnInit {
  @Input() appHeaderDefaulMenuDisplay: boolean;
  @Input() isRtl: boolean;

  selectedEntidad: string = ''; // Puede ser 'usuario_1' o 'empresa_7'
  user: any;
  empresas: any[] = [];

    empresaNombreUsuario: string = 'Cargando empresa...';
    empresasCargadas = false;

  itemClass: string = 'ms-1 ms-lg-3';
  btnClass: string =
    'btn btn-icon btn-custom btn-icon-muted btn-active-light btn-active-color-primary w-35px h-35px w-md-40px h-md-40px';
  userAvatarClass: string = 'symbol-35px symbol-md-40px';
  btnIconClass: string = 'fs-2 fs-md-1';

  constructor(
    public authService: AuthService,
    private empresaService: EmpresaService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.user = this.authService.user;

     // ✅ Doble condición: si es id 1 o el rol es Super-Admin
  if (this.user?.id === 1 || this.user?.role_name === 'Super-Admin') {
    this.selectedEntidad = 'usuario_' + this.user.id;
  }
    // Siempre cargar empresas sin importar quién es el usuario
    this.loadEmpresas();
  }

 loadEmpresas(): void {
  this.empresaService.listEmpresas(1, '').subscribe({
    next: (response: any) => {
      this.empresas = response.empresas || [];
      this.empresasCargadas = true;

      if (this.user?.id_empresa) {
        const empresa = this.empresas.find(e => e.id === this.user.id_empresa);
        if (empresa) {
          this.empresaNombreUsuario = empresa.nombre_empresa;
          console.log('Empresa encontrada para usuario:', empresa.nombre_empresa);
        } else {
          this.empresaNombreUsuario = 'Empresa no asignada';
          console.log('No se encontró empresa con id:', this.user.id_empresa);
        }
      } else {
        this.empresaNombreUsuario = 'Empresa no asignada';
        console.log('Usuario no tiene id_empresa asignado');
      }
      this.cdr.detectChanges();  // <--- FORZAR actualización vista
    },
    error: (err) => {
      this.empresasCargadas = true;
      this.empresaNombreUsuario = 'Error cargando empresas';
      this.cdr.detectChanges();  // <--- FORZAR actualización vista
      console.error('Error cargando empresas', err);
    }
  });
}


}

import { Component, OnInit } from '@angular/core';
import { AuthService } from 'src/app/modules/auth';

@Component({
  selector: 'app-sidebar-menu',
  templateUrl: './sidebar-menu.component.html',
  styleUrls: ['./sidebar-menu.component.scss']
})
export class SidebarMenuComponent implements OnInit {
  id_empresa: number | null = null; // <-- nueva propiedad
  role_usuario: string | null = null;
  user:any;
  constructor(
    public authService: AuthService
  ) { }

  ngOnInit(): void {
    this.user = this.authService.user;
        // Si es super admin, mostramos su id
     this.authService.id_usuario$.subscribe(role => {
    this.role_usuario = role;
    console.log('Role del usuario actualizado en sidebar:', this.role_usuario);
  });
     this.authService.id_empresa$.subscribe(id => {
    this.id_empresa = id;
    console.log('ID de la empresa actualizado en sidebar:', this.id_empresa);
  });
  }
  // ['register_role','edit_role'].includes('delete_role') 
  showMenu(permisos:any = []){
    if(this.isRole()){
      return true;
    }
    let permissions = this.user.permissions;
    var is_show = false;
    permisos.forEach((permiso:any) => {
      if(permissions.includes(permiso)){
        is_show = true;
      }
    });
    return is_show;
  }

  isRole(){
    return this.user.role_name == 'Super-Admin' ? true : false;
  }
}

import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';  // Importa Router
import { SeccionesService } from '../service/sessiones.service';
import { environment } from './../../../../environments/environment';

@Component({
  selector: 'app-list-sessiones',
  templateUrl: './list-sessiones.component.html',
  styleUrls: ['./list-sessiones.component.scss']
})
export class ListSessionesComponent implements OnInit {

  idModulo!: number;
  secciones: any[] = [];
  isLoading = false;

  constructor(
    private route: ActivatedRoute,
    private seccionesService: SeccionesService,
    private router: Router,              // Inyecta Router
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    console.log('🟡 ngOnInit iniciado...');
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      console.log('🟢 ID del módulo recibido:', id);
      if (id) {
        this.idModulo = +id;
        this.loadSecciones();
      }
    });
  }

  loadSecciones() {
    console.log('🔄 Cargando secciones para el módulo ID:', this.idModulo);
    this.isLoading = true;
    this.cdr.detectChanges();

    this.seccionesService.listSeccionesByModulo(this.idModulo).subscribe({
      next: (resp: any) => {
        console.log('✅ Secciones recibidas del servicio:', resp);
        this.secciones = resp.secciones || resp.data || [];
        console.log('🟢 Secciones asignadas al componente:', this.secciones);
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('❌ Error al cargar secciones:', err);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // Método para navegar al detalle de la sección
navegarADetalleSeccion(idSeccion: number, idModulo: number) {
  this.router.navigate(['/secciones/seccion', idSeccion, 'modulo', idModulo]);
}


}

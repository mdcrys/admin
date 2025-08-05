import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { CreateIndexacionComponent } from '../create-indexacion/create-indexacion.component';
import { IndexacionService } from '../service/indexacion.service';
import { ChangeDetectorRef } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { environment } from './../../../../environments/environment';



@Component({
  selector: 'app-list-indexacion',
  templateUrl: './list-indexacion.component.html',
  styleUrls: ['./list-indexacion.component.scss']
})
export class ListIndexacionComponent {
  idModulo: number | null = null;
  isLoading: boolean = true;
  indexaciones: any[] = [];
error: string | null = null;
public todosLosTitulos: string = '';



 valorBusqueda: string = '';            // para el filtro de búsqueda
  documentosPaginados: any = { data: [] };
      // resultados paginados
  currentPage: number = 1;
  totalPages: number = 0;
   // Aquí guardamos los campos_extra del primer registro
  camposExtra: any = null;
  listaTitulos: string[] = []; // Aquí almacenas los títulos extraídos

// Para enlazar los inputs:
valoresInputs: string[] = [];

   constructor(private route: ActivatedRoute, private router: Router,
     public modalService: NgbModal,
        public indexacionService: IndexacionService,
        private toast: ToastrService,
        private cdr: ChangeDetectorRef,
   ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.idModulo = +params['id_modulo'] || null;

      console.log('🟢 idModulo desde queryParams:', this.idModulo);

      if (this.idModulo) {
        this.listIndexaciones(this.idModulo);
        this.obtenerCamposExtra(); // ✅ Ahora sí, ya con idModulo asignado correctamente
      } else {
        console.warn('⚠️ id_modulo no recibido en queryParams.');
      }
    });
  }


  listIndexaciones(idModulo: number) {
    this.isLoading = true;
    this.indexacionService.listIndexaciones(idModulo).subscribe({
      next: (resp: any) => {
        this.indexaciones = resp.indexaciones || [];
        // Si hay indexaciones, tomar los campos_extra del primero
        if (this.indexaciones.length > 0) {
          this.camposExtra = this.indexaciones[0].campos_extra;
        } else {
          this.camposExtra = null;
        }
      },
      error: (err) => {
        console.error('Error al cargar indexaciones', err);
        this.indexaciones = [];
        this.camposExtra = null;
      },
      complete: () => this.isLoading = false,
    });
  }
  // list-indexacion.component.ts
crearIndexacion(modulo: any) {
  if (!modulo || !modulo.id) {
    console.error('No hay idModulo definido en el módulo');
    return;
  }

  const modalRef = this.modalService.open(CreateIndexacionComponent, {
    centered: true,
    size: 'xl'
  });

  modalRef.componentInstance.idModulo = modulo.id;

  // Cuando se emita el evento (registro exitoso)
  modalRef.componentInstance.IndexacionC.subscribe((indexacion: any) => {
    this.obtenerCamposExtra();  // <-- refresca al guardar
  });

  // También al cerrarse el modal, incluso si no emitió el evento
  modalRef.closed.subscribe(() => {
    this.obtenerCamposExtra();  // <-- refresca al cerrar
  });

  // Estilos adicionales
  setTimeout(() => {
    const modalDialog = document.querySelector('.modal-dialog') as HTMLElement;
    const modalContent = document.querySelector('.modal-content') as HTMLElement;

    if (modalDialog) {
      modalDialog.style.maxWidth = '2000px';
      modalDialog.style.width = '90vw';
      modalDialog.style.height = '92vh';
      modalDialog.style.maxHeight = '199vh';
    }

    if (modalContent) {
      modalContent.style.height = '100%';
      modalContent.style.overflowY = 'auto';
    }
  }, 0);
}





abrirModalAgregar() {
  console.log('Abrir modal para agregar indexación');
  // Aquí luego puedes abrir un modal o navegar a otro componente
}





obtenerCamposExtra() {
   console.log('🔎 ID del módulo recibido:', this.idModulo);
  if (this.idModulo === null) {
    console.error('idModulo es null');
    return;
  }

  this.isLoading = true;
  this.error = null;

  this.indexacionService.obtenerCamposExtra({ idModulo: this.idModulo }).subscribe({
    next: (resp: any) => {
      const registros = resp.campos_extra || [];

      if (registros.length > 0) { //prueba 
        const titulos = registros
          .flatMap((registro: any) => registro.campos_extra || [])
          .map((campo: any) => campo.titulo);

        this.todosLosTitulos = titulos.join(', ');
        this.listaTitulos = titulos;
        this.valoresInputs = new Array(this.listaTitulos.length).fill('');
        console.log('Títulos extraídos:', this.todosLosTitulos);
      } else {
        this.todosLosTitulos = '';
        this.listaTitulos = [];
        this.valoresInputs = [];
      }

      this.cdr.detectChanges();
    },
    error: (err) => {
      console.error('Error al obtener campos_extra', err);
      this.error = 'No se pudieron cargar los campos.';
      this.todosLosTitulos = '';
      this.listaTitulos = [];
      this.valoresInputs = [];
    },
    complete: () => {
      this.isLoading = false;
      console.log('Llamada a obtenerCamposExtra completada.');
    }
  });
}



buscarIndexaciones(page = 1): void {
  // Concatenar todos los valores de inputs separados por espacio o coma
  const campo_valor = this.valoresInputs.filter(v => v && v.trim() !== '').join(' ');

  const filtros = {
    id_modulo: this.idModulo,
    campo_valor: campo_valor || null,  // Enviar null si no hay nada
  };

  this.indexacionService.listIndexacionesBusqueda(page, filtros).subscribe({
  next: (resp: any) => {
    this.documentosPaginados = resp.documentos || { data: [] };
    this.cdr.detectChanges();
    this.currentPage = this.documentosPaginados.current_page;
    this.totalPages = this.documentosPaginados.last_page;

    if (this.documentosPaginados.data.length > 0) {
      this.toast.success('Se encontraron documentos', 'Éxito');
    } else {
      this.toast.info('No se encontraron documentos', 'Información');
    }
  },
  error: (err) => {
    this.toast.error('Error al obtener documentos', 'Error');
  }
});

}


URL_BACKEND: string = environment.URL_BACKEND;

getArchivoUrl(documento: any): string | null {
  if (!documento.archivo_url) return null;
  try {
    const archivos = JSON.parse(documento.archivo_url);
    if (archivos.length > 0) {
      let ruta = archivos[0];
      ruta = ruta.replace(/^public\//, '');
      return this.URL_BACKEND + 'storage/' + ruta;
    }
    return null;
  } catch {
    return null;
  }
}


}

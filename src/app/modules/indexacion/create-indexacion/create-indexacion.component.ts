import { Component, Input, EventEmitter, Output, ElementRef, ViewChild } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { IndexacionService } from '../service/indexacion.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { concatMap, from, of } from 'rxjs';
import Swal from 'sweetalert2';




@Component({
  selector: 'app-create-indexacion',
  templateUrl: './create-indexacion.component.html',
  styleUrls: ['./create-indexacion.component.scss']
})
export class CreateIndexacionComponent {

  @Input() idModulo!: number;  // <-- Aquí recibes el idModulo pasado desde el modal
  campos: any[] = [];
  archivosSeleccionados: File[] = [];
  @Output() IndexacionC: EventEmitter<any> = new EventEmitter();
  @ViewChild('pdfIframe') pdfIframe!: ElementRef<HTMLIFrameElement>;
@ViewChild('contextMenu') contextMenu!: ElementRef<HTMLDivElement>;

inputSeleccionadoIndex: number | null = null;

// Mostrar el menú contextual
showMenu: boolean = false;

// Coordenadas del menú contextual
menuX: number = 0;
menuY: number = 0;

// Texto seleccionado en el iframe
textoSeleccionado: string = '';

  

  archivosProcesados: any[] = []; // PDFs que devuelve el backend
  urlsSanitizadas: string[] = []; // Cache para URLs sanitizadas
  indiceActual: number = 0;

 pdfSrc: string;

  constructor(
    public activeModal: NgbActiveModal,
    private toast: ToastrService,
    private seccionesService: IndexacionService,
    private sanitizer: DomSanitizer
  ) {}

  close() {
    this.activeModal.close();
  }

  ngOnInit() {
    console.log('ID del módulo recibido:', this.idModulo);
    if (this.urlsSanitizadas.length > 0) {
    this.pdfSrc = this.urlsSanitizadas[0];
  }
  }

  siguientePDF() {
    if (this.indiceActual < this.archivosProcesados.length - 1) {
      this.indiceActual++;
    }
  }

  anteriorPDF() {
    if (this.indiceActual > 0) {
      this.indiceActual--;
    }
  }

  // Sanitiza las URLs SOLO cuando cambian los archivos procesados
  sanitizeUrls() {
  // Sólo asigna el string URL sin sanitizar
  this.urlsSanitizadas = this.archivosProcesados.map((archivo) => archivo.url);
}



  agregarCampo() {
    this.campos.push({ valor: '' });
  }

  
guardar() {
  if (this.campos.length === 0) {
    this.toast.warning('Agrega al menos un campo.');
    return;
  }

  if (this.archivosSeleccionados.length === 0) {
    this.toast.warning('Debes seleccionar al menos un archivo para guardar.');
    return;
  }

  const formData = new FormData();
  formData.append('idModulo', this.idModulo.toString());
  formData.append('campos', JSON.stringify(this.campos));

  // Usa archivosSeleccionados para enviar archivos reales
  this.archivosSeleccionados.forEach((file) => {
    formData.append('archivos[]', file, file.name);
  });

  this.seccionesService.registrarDocumento(formData).subscribe({
    next: (res) => {
      this.toast.success('Datos guardados correctamente');
      this.activeModal.close(true);
    },
    error: (err) => {
      this.toast.error('Error al guardar los datos');
    },
  });
}



  eliminarCampo(index: number) {
    this.campos.splice(index, 1);
  }

  onFileSelected(event: any) {
    if (event.target.files && event.target.files.length > 0) {
      this.archivosSeleccionados = Array.from(event.target.files);
    } else {
      this.archivosSeleccionados = [];
    }
  }



procesarArchivos() {
  if (!this.idModulo || this.archivosSeleccionados.length === 0) {
    this.toast.warning('Debe seleccionar archivos y tener un módulo válido');
    return;
  }

  this.archivosProcesados = [];
  this.indiceActual = 0;
  this.urlsSanitizadas = [];

  from(this.archivosSeleccionados).pipe(
    concatMap(async (archivo) => {
      Swal.fire({
        title: `Procesando OCR para archivo: ${archivo.name}`,
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
      });

      const formData = new FormData();
      formData.append('modulo_id', this.idModulo.toString());
      formData.append('archivos[]', archivo);

      try {
        const resp = await this.seccionesService.subirArchivos(formData).toPromise();

        if (resp.archivos && Array.isArray(resp.archivos)) {
          this.archivosProcesados.push(...resp.archivos);

          // Aquí no sanitizas: asignas directamente las URLs que recibes
          this.urlsSanitizadas = [...this.archivosProcesados];

          // Asignar el primer PDF a la variable que usa ngx-extended-pdf-viewer
          if (this.urlsSanitizadas.length > 0) {
            this.pdfSrc = this.urlsSanitizadas[0];
          }
        }

        Swal.close();
      } catch (error) {
        Swal.close();
        this.toast.error('Error al subir el archivo ' + archivo.name);
        throw error;
      }
    })
  ).subscribe({
    next: () => {},
    error: (err) => console.error('Error en procesamiento:', err),
    complete: () => {
      this.toast.success('Todos los archivos se procesaron correctamente');
      this.indiceActual = 0;
    }
  });
}



  ngAfterViewInit() {
  this.addIframeTextSelectionListener();
}

seleccionarInput(i: number) {
  this.inputSeleccionadoIndex = i;
}


 addIframeTextSelectionListener() {
  const iframe = this.pdfIframe?.nativeElement;

  if (iframe) {
    iframe.onload = () => {
      try {
        const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;

        if (!iframeDoc) return;

        iframeDoc.addEventListener('mouseup', (event: MouseEvent) => {
          const selection = iframeDoc.getSelection()?.toString();
          console.log('Texto seleccionado en iframe:', selection);  // <-- Aquí el log

          if (selection && selection.trim() !== '') {
            this.menuX = event.clientX;
            this.menuY = event.clientY;
            this.textoSeleccionado = selection;
            this.showMenu = true;
          } else {
            this.showMenu = false;
          }
        });
      } catch (error) {
        console.warn('No se pudo acceder al contenido del iframe:', error);
      }
    };

    // En caso de que el iframe ya esté cargado antes de asignar onload, ejecuta manualmente
    if (iframe.contentDocument && iframe.contentDocument.readyState === 'complete') {
      const event = new Event('load');
      iframe.dispatchEvent(event);
    }
  } else {
    console.warn('Iframe no encontrado para agregar listener');
  }
}


seleccionarTexto() {
  if (this.inputSeleccionadoIndex !== null && this.campos[this.inputSeleccionadoIndex]) {
    this.campos[this.inputSeleccionadoIndex].valor = this.textoSeleccionado;
    this.showMenu = false;
  }
}


} 
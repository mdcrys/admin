
import { Component, Input, EventEmitter, Output, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { IndexacionService } from '../service/indexacion.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { concatMap, from } from 'rxjs';
import Swal from 'sweetalert2';


import * as pdfjsLib from 'pdfjs-dist';
import { pdfjsWorker } from 'pdfjs-dist/build/pdf.worker.entry';
// Configurar el worker
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

@Component({
  selector: 'app-create-indexacion',
  templateUrl: './create-indexacion.component.html',
  styleUrls: ['./create-indexacion.component.scss']
})
export class CreateIndexacionComponent implements AfterViewInit {
  @ViewChild('textLayer', { static: false }) textLayer!: ElementRef<HTMLDivElement>;

 @ViewChild('pdfCanvasTemp') pdfCanvasTemp!: ElementRef<HTMLCanvasElement>;
  @Input() idModulo!: number;
  campos: any[] = [];
  archivosSeleccionados: File[] = [];
  @Output() IndexacionC: EventEmitter<any> = new EventEmitter();

  @ViewChild('pdfCanvas') pdfCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('contextMenu') contextMenu!: ElementRef<HTMLDivElement>;

  inputSeleccionadoIndex: number | null = null;
  showMenu: boolean = false;
  menuX: number = 0;
  menuY: number = 0;
  textoSeleccionado: string = '';

  archivosProcesados: any[] = [];
  urlsSanitizadas: string[] = [];
  indiceActual: number = 0;

  archivoSeleccionadoTemp: File | null = null;
pdfDocTemp: any = null;
pageNumTemp: number = 1;
pageCountTemp: number = 0;



  // PDF.js variables
  pdfDoc: any = null;
  pageNum: number = 1;
  pageCount: number = 0;
  scale: number = 1.5;
  ctx!: CanvasRenderingContext2D;

  constructor(
    public activeModal: NgbActiveModal,
    private toast: ToastrService,
    private seccionesService: IndexacionService,
    private sanitizer: DomSanitizer
  ) {}

  ngAfterViewInit() {
    this.ctx = this.pdfCanvas.nativeElement.getContext('2d')!;
    // Si ya tienes urls sanitizadas al cargar, carga el primero
    if (this.urlsSanitizadas.length > 0) {
      this.loadPdf(this.urlsSanitizadas[0]);
    }
  }




verArchivoTemp(file: File): void {
  const fileReader = new FileReader();
  fileReader.onload = async () => {
    const typedarray = new Uint8Array(fileReader.result as ArrayBuffer);
    const loadingTask = (window as any).pdfjsLib.getDocument({ data: typedarray });

    const pdf = await loadingTask.promise;
    this.pdfDocTemp = pdf;
    this.pageCountTemp = pdf.numPages;
    this.pageNumTemp = 1;
    this.renderTempPage(this.pageNumTemp);
  };

  fileReader.readAsArrayBuffer(file);
}

renderTempPage(num: number): void {
  this.pdfDocTemp.getPage(num).then((page: any) => {
    const canvas: any = document.querySelector('#pdfCanvasTemp');
    const ctx = canvas.getContext('2d');
    const viewport = page.getViewport({ scale: 1.5 });

    canvas.height = viewport.height;
    canvas.width = viewport.width;

    const renderContext = {
      canvasContext: ctx,
      viewport: viewport
    };

    page.render(renderContext);
  });
}

prevPageTemp(): void {
  if (this.pageNumTemp > 1) {
    this.pageNumTemp--;
    this.renderTempPage(this.pageNumTemp);
  }
}

nextPageTemp(): void {
  if (this.pageNumTemp < this.pageCountTemp) {
    this.pageNumTemp++;
    this.renderTempPage(this.pageNumTemp);
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

  // Método para cargar PDF en el canvas usando PDF.js
  loadPdf(url: string) {
    // Si quieres evitar error de CORS, la URL debe estar permitida en backend
    pdfjsLib.getDocument(url).promise.then((pdfDoc_: any) => {
      this.pdfDoc = pdfDoc_;
      this.pageCount = pdfDoc_.numPages;
      this.pageNum = 1;
      this.renderPage(this.pageNum);
    }).catch((error: any) => {
      this.toast.error('Error cargando PDF: ' + error.message);
    });
  }



  
async renderPage(num: number) {
  if (!this.pdfDoc) return;
  const page = await this.pdfDoc.getPage(num);
  const viewport = page.getViewport({ scale: this.scale });
  const canvas = this.pdfCanvas.nativeElement;
  canvas.height = viewport.height;
  canvas.width = viewport.width;

  // Renderiza página en canvas
  const renderContext = {
    canvasContext: this.ctx,
    viewport: viewport
  };
  await page.render(renderContext).promise;

  // Renderiza capa de texto manualmente
  const textLayerDiv = this.textLayer.nativeElement;
  textLayerDiv.innerHTML = ''; // limpia contenido anterior
  textLayerDiv.style.position = 'absolute';
  textLayerDiv.style.top = '0';
  textLayerDiv.style.left = '0';
  textLayerDiv.style.height = `${viewport.height}px`;
  textLayerDiv.style.width = `${viewport.width}px`;
  textLayerDiv.style.userSelect = 'text';

  const textContent = await page.getTextContent();

  for (const item of textContent.items) {
    const span = document.createElement('div');
    const tx = pdfjsLib.Util.transform(
      viewport.transform,
      item.transform
    );

    span.style.position = 'absolute';
    span.style.left = `${tx[4]}px`;
    span.style.top = `${tx[5] - item.height}px`;
    span.style.fontSize = `${item.height}px`;
    span.style.transform = `scaleX(${item.width / item.height})`;
    span.style.whiteSpace = 'pre';
    span.textContent = item.str;
    span.style.color = 'transparent'; // para solo selección, no visible

    textLayerDiv.appendChild(span);
  }
}



  prevPage() {
    if (this.pageNum <= 1) return;
    this.pageNum--;
    this.renderPage(this.pageNum);
  }

  nextPage() {
    if (this.pageNum >= this.pageCount) return;
    this.pageNum++;
    this.renderPage(this.pageNum);
  }

// Función que llamas para procesar los archivos y cargar URLs
procesarArchivos() {
  if (!this.idModulo || !this.archivoSeleccionadoTemp) {
    this.toast.warning('Debe seleccionar archivos y tener un módulo válido');
    return;
  }

  this.archivosProcesados = [];
  this.indiceActual = 0;
  this.urlsSanitizadas = [];

  const archivo = this.archivoSeleccionadoTemp;

  Swal.fire({
    title: `Procesando OCR para archivo: ${archivo.name}`,
    allowOutsideClick: false,
    didOpen: () => Swal.showLoading()
  });

  const formData = new FormData();
  formData.append('modulo_id', this.idModulo.toString());
  formData.append('archivos[]', archivo);

  this.seccionesService.subirArchivos(formData).toPromise()
    .then((resp: any) => {
      if (resp.archivos && Array.isArray(resp.archivos)) {
        this.archivosProcesados.push(...resp.archivos);

        this.urlsSanitizadas = resp.archivos.map((a: any) =>
          this.sanitizer.bypassSecurityTrustResourceUrl(a.url) as unknown as string
        );

        if (resp.archivos.length > 0) {
          this.loadPdf(resp.archivos[0].url);
        }
      }
      Swal.close();
      this.toast.success('Archivo procesado correctamente');
      this.indiceActual = 0;
    })
    .catch((error) => {
      Swal.close();
      this.toast.error('Error al subir el archivo ' + archivo.name);
      console.error(error);
    });
}



  // Para cambiar entre PDFs procesados
  verPdfPorIndice(indice: number) {
    if (indice < 0 || indice >= this.archivosProcesados.length) {
      this.toast.warning('Índice inválido');
      return;
    }
    this.indiceActual = indice;
    this.pageNum = 1;
    this.loadPdf(this.archivosProcesados[indice].url);
  }

  close() {
    this.activeModal.close();
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

  onFileSelectedtemp(event: Event) {
  const input = event.target as HTMLInputElement;
  if (input.files && input.files.length > 0) {
    const file = input.files[0]; // solo mostramos el primero
    if (file.type === 'application/pdf') {
      this.archivoSeleccionadoTemp = file;
      this.loadPDF(file);
    } else {
      alert('Por ahora solo se puede mostrar vista previa de archivos PDF.');
    }
  }
}

loadPDF(file: File) {
  const reader = new FileReader();
  reader.onload = async () => {
    const typedarray = new Uint8Array(reader.result as ArrayBuffer);

    const loadingTask = pdfjsLib.getDocument(typedarray);
    this.pdfDocTemp = await loadingTask.promise;
    this.pageCountTemp = this.pdfDocTemp.numPages;
    this.pageNumTemp = 1;
    this.renderPageTemp(this.pageNumTemp);
  };
  reader.readAsArrayBuffer(file);
}


  renderPageTemp(pageNumber: number) {
    this.pdfDocTemp.getPage(pageNumber).then((page: any) => {
      const canvas = this.pdfCanvasTemp.nativeElement;
      const context = canvas.getContext('2d')!;
      const viewport = page.getViewport({ scale: 1.5 });

      canvas.height = viewport.height;
      canvas.width = viewport.width;

      const renderContext = {
        canvasContext: context,
        viewport: viewport
      };
      page.render(renderContext);
    });
  }



  onFileSelected(event: any) {
    if (event.target.files && event.target.files.length > 0) {
      this.archivosSeleccionados = Array.from(event.target.files);
    } else {
      this.archivosSeleccionados = [];
    }
  }


/*
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
*/



seleccionarInput(i: number) {
  this.inputSeleccionadoIndex = i;
}

/*
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
}*/


seleccionarTexto() {
  if (this.inputSeleccionadoIndex !== null && this.campos[this.inputSeleccionadoIndex]) {
    this.campos[this.inputSeleccionadoIndex].valor = this.textoSeleccionado;
    this.showMenu = false;
  }
}


} 

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



imagenesPDF: string[] = []; // las imágenes en base64 que generas del PDF
selectedArea: { x: number; y: number; width: number; height: number } | null = null;
isDrawing = false;
startX = 0;
startY = 0;
selectedPage: number | null = null;
recorte: string | null = null; // aquí guardamos la imagen recortada

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






// Convertir PDF a imágenes
  async hacerOCR() {
    if (!this.archivoSeleccionadoTemp) {
      alert("Por favor, selecciona un archivo PDF antes de continuar.");
      return;
    }

    const fileReader = new FileReader();
    fileReader.onload = async (e: any) => {
      const typedarray = new Uint8Array(e.target.result);
      const pdf = await pdfjsLib.getDocument({ data: typedarray }).promise;
      this.imagenesPDF = [];

      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale: 2 });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d')!;
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        await page.render({ canvasContext: context, viewport: viewport }).promise;

        const imageData = canvas.toDataURL('image/png');
        this.imagenesPDF.push(imageData);
      }

      setTimeout(() => this.renderizarCanvas(), 0);
      alert(`PDF convertido a ${this.imagenesPDF.length} imagen(es) PNG.`);
    };

    fileReader.readAsArrayBuffer(this.archivoSeleccionadoTemp);
  }

  // Dibujar imágenes en canvas
  renderizarCanvas() {
    this.imagenesPDF.forEach((imgSrc, i) => {
      const canvas = document.querySelectorAll('canvas')[i] as HTMLCanvasElement;
      if (!canvas) return;
      const ctx = canvas.getContext('2d')!;
      const img = new Image();
      img.src = imgSrc;
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
      };
    });
  }


  onMouseDown(event: MouseEvent, pageIndex: number) {
  this.isDrawing = true;
  this.startX = event.offsetX;
  this.startY = event.offsetY;
  this.selectedPage = pageIndex;
  this.recorte = null;
}

onMouseMove(event: MouseEvent, pageIndex: number) {
  if (!this.isDrawing || this.selectedPage !== pageIndex) return;

  const currentX = event.offsetX;
  const currentY = event.offsetY;
  const width = currentX - this.startX;
  const height = currentY - this.startY;

  const canvas = event.target as HTMLCanvasElement;
  const ctx = canvas.getContext('2d')!;
  const img = new Image();
  img.src = this.imagenesPDF[pageIndex];
  img.onload = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    // rectángulo transparente
    ctx.strokeStyle = "red";
    ctx.lineWidth = 2;
    ctx.strokeRect(this.startX, this.startY, width, height);
  };
}

onMouseUp(event: MouseEvent, pageIndex: number) {
  this.isDrawing = false;

  const endX = event.offsetX;
  const endY = event.offsetY;
  const width = endX - this.startX;
  const height = endY - this.startY;

  const canvas = event.target as HTMLCanvasElement;
  const ctx = canvas.getContext('2d')!;

  // crear un canvas temporal con el recorte
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = Math.abs(width);
  tempCanvas.height = Math.abs(height);
  const tempCtx = tempCanvas.getContext('2d')!;

  // dibujar la parte seleccionada
  tempCtx.drawImage(
    canvas,
    this.startX,
    this.startY,
    width,
    height,
    0,
    0,
    Math.abs(width),
    Math.abs(height)
  );

  // convertir a base64 para mostrar
  this.recorte = tempCanvas.toDataURL('image/png');

  console.log("Recorte generado:", this.recorte);
}


} 
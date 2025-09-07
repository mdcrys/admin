import { Component } from '@angular/core';
import { MasivoService } from '../service/masivo.service';
import { ToastrService } from 'ngx-toastr';
import { Observable } from 'rxjs';

interface ProgresoResponse {
  estado: string;
  total_paginas: number;
  paginas_procesadas: number;
  zip_path: string | null;
  error: string | null;
  zipUrl?: string;
}

@Component({
  selector: 'app-ver-masivo',
  templateUrl: './ver-masivo.component.html',
  styleUrls: ['./ver-masivo.component.scss']
})
export class VerMasivoComponent {
  selectedFile?: File;
  isLoading = false;
  progress = 0;
  jobId?: string;

  constructor(private masivoService: MasivoService, private toast: ToastrService) {}

  onFileSelected(event: any) {
    this.selectedFile = event.target.files[0];
  }

  subirYDesunir() {
    if (!this.selectedFile) {
      alert('Selecciona un archivo PDF primero.');
      return;
    }

    this.isLoading = true;
    this.progress = 0;

    // 1. Subir archivo y recibir jobId
    this.masivoService.iniciarProceso(this.selectedFile).subscribe({
      next: (response: { jobId: string }) => {
        this.jobId = response.jobId;
        this.verificarProgreso();
      },
      error: () => {
        this.isLoading = false;
        this.toast.error('Error', 'No se pudo iniciar el proceso');
      }
    });
  }

verificarProgreso() {
  console.log('verificarProgreso llamado, jobId:', this.jobId);

  if (!this.jobId) {
    console.log('No hay jobId, deteniendo proceso');
    this.isLoading = false;
    return;
  }

  this.masivoService.obtenerProgreso(this.jobId).subscribe({
    next: (res) => {
      console.log('Respuesta obtenerProgreso:', res);
      this.progress = (res.paginas_procesadas / res.total_paginas) * 100;

      if (res.estado === 'finalizado' && res.zipUrl) {
        this.isLoading = false;
        this.toast.success('Proceso terminado', 'PDF separado con éxito');

        // Aquí el ! para asegurar que jobId no es undefined
        this.masivoService.descargarZip(this.jobId!).subscribe({
          next: (blob) => {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'paginas_separadas.zip';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            console.log('Descarga iniciada');
          },
          error: (err) => {
            console.error('Error al descargar zip:', err);
            this.toast.error('Error', 'No se pudo descargar el archivo zip');
          }
        });

      } else {
        console.log('Proceso no terminado, volver a consultar en 5 segundos');
        setTimeout(() => this.verificarProgreso(), 5000);
      }
    },
    error: (err) => {
      console.error('Error al consultar progreso:', err);
      this.isLoading = false;
      this.toast.error('Error', 'Error al consultar progreso');
    }
  });
}






}

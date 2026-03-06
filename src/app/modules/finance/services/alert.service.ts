import { Injectable } from '@angular/core';
import Swal, { SweetAlertResult } from 'sweetalert2';

@Injectable({
  providedIn: 'root'
})
export class AlertService {

  constructor() { }

  /**
   * Muestra una alerta de éxito
   */
  success(title: string, text?: string, timer: number = 2000): Promise<SweetAlertResult> {
    return Swal.fire({
      icon: 'success',
      title: title,
      text: text,
      timer: timer,
      showConfirmButton: false,
      toast: true,
      position: 'top-end',
      timerProgressBar: true
    });
  }

  /**
   * Muestra una alerta de error
   */
  error(title: string, text?: string): Promise<SweetAlertResult> {
    return Swal.fire({
      icon: 'error',
      title: title,
      text: text,
      confirmButtonText: 'Cerrar',
      confirmButtonColor: '#d33'
    });
  }

  /**
   * Muestra una alerta de advertencia
   */
  warning(title: string, text?: string): Promise<SweetAlertResult> {
    return Swal.fire({
      icon: 'warning',
      title: title,
      text: text,
      confirmButtonText: 'Entendido',
      confirmButtonColor: '#ffc107'
    });
  }

  /**
   * Muestra una alerta informativa
   */
  info(title: string, text?: string): Promise<SweetAlertResult> {
    return Swal.fire({
      icon: 'info',
      title: title,
      text: text,
      confirmButtonText: 'OK',
      confirmButtonColor: '#3085d6'
    });
  }

  /**
   * Muestra un diálogo de confirmación
   */
  confirm(
    title: string, 
    text: string, 
    confirmButtonText: string = 'Confirmar',
    cancelButtonText: string = 'Cancelar',
    confirmButtonColor: string = '#1e3a8a',
    icon: 'question' | 'warning' | 'info' = 'question'
  ): Promise<SweetAlertResult> {
    return Swal.fire({
      icon: icon,
      title: title,
      text: text,
      showCancelButton: true,
      confirmButtonColor: confirmButtonColor,
      cancelButtonColor: '#6c757d',
      confirmButtonText: confirmButtonText,
      cancelButtonText: cancelButtonText,
      reverseButtons: true
    });
  }

  /**
   * Muestra una alerta de confirmación para acciones peligrosas
   */
  confirmDelete(itemName: string): Promise<SweetAlertResult> {
    return this.confirm(
      '¿Estás seguro?',
      `Esta acción eliminará "${itemName}" permanentemente. Esta acción no se puede deshacer.`,
      'Sí, eliminar',
      'Cancelar',
      '#ef4444',
      'warning'
    );
  }

  /**
   * Muestra un toast de notificación
   */
  toast(icon: 'success' | 'error' | 'warning' | 'info', title: string): void {
    Swal.fire({
      icon: icon,
      title: title,
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
      didOpen: (toast) => {
        toast.addEventListener('mouseenter', Swal.stopTimer);
        toast.addEventListener('mouseleave', Swal.resumeTimer);
      }
    });
  }

  /**
   * Muestra un loading overlay
   */
  showLoading(title: string = 'Procesando...', text?: string): void {
    Swal.fire({
      title: title,
      text: text,
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });
  }

  /**
   * Cierra cualquier alerta abierta
   */
  close(): void {
    Swal.close();
  }

  /**
   * Muestra una alerta de guardado exitoso
   */
  saved(itemName: string = 'Registro'): void {
    this.toast('success', `${itemName} guardado exitosamente`);
  }

  /**
   * Muestra una alerta de eliminación exitosa
   */
  deleted(itemName: string = 'Registro'): void {
    this.toast('success', `${itemName} eliminado exitosamente`);
  }

  /**
   * Muestra una alerta de actualización exitosa
   */
  updated(itemName: string = 'Registro'): void {
    this.toast('success', `${itemName} actualizado exitosamente`);
  }
}

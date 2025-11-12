// notifications.service.ts
import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { URL_SERVICIOS, URL_BACKEND } from 'src/app/config/config';
import { finalize } from 'rxjs/operators';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from 'src/app/modules/auth';

@Injectable({
  providedIn: 'root'
})
export class NotificationsService {
    private socket: Socket;
    private notificationsSubject = new Subject<any>();
    public notifications$ = this.notificationsSubject.asObservable();

    private loadingSubject = new BehaviorSubject<boolean>(false);
    public isLoading$ = this.loadingSubject.asObservable();

    constructor(
        private http: HttpClient, 
        private _auth: AuthService
    ) {
        // Conectar al namespace /notifications usando la URL de backend
        this.socket = io(`${URL_BACKEND}notifications`, {
            transports: ['websocket']
        });

        this.socket.on('connect', () => {
            console.log('🟢 Conectado a /notifications', this.socket.id);
        });

        // Escuchar evento de actualización de envíos
        this.socket.on('shipment-update', (data) => {
            console.log('📦 Notificación recibida:', data);
            this.notificationsSubject.next(data); // 🔔 Emite al flujo
        });

        this.socket.on('disconnect', () => {
            console.log('🔴 Desconectado de /notifications');
        });
    }

  
    identify(userId: number) {
        this.socket.emit('identify', { user_id: userId });
    }

    // ---------------- HTTP ENDPOINT METHODS ----------------
    private getAuthHeaders() {
        const headers = new HttpHeaders({ 'token': this._auth.token || '' });
        return { headers };
    }

    /**
     * Get list of notifications
     * @param limit 
     * @returns 
     */
    getNotifications(limit: number = 50) {
        this.loadingSubject.next(true);
        return this.http.get<any>(`${URL_SERVICIOS}/notifications?limit=${limit}`, this.getAuthHeaders())
        .pipe(finalize(() => this.loadingSubject.next(false)));
    }

    /**
     * Mark a notification as read
     * @param notificationId 
     * @returns 
     */
    markAsRead(notificationId: number) {
        this.loadingSubject.next(true);
        return this.http.patch<any>(`${URL_SERVICIOS}/notifications/${notificationId}/read`, {}, this.getAuthHeaders())
        .pipe(finalize(() => this.loadingSubject.next(false)));
    }

    /**
     * Emit a test notification (for development purposes)
     * @returns 
     */
    emitTestNotification() {
        return this.http.get<any>(`${URL_SERVICIOS}/notifications/emit-test`, this.getAuthHeaders());
    }
}

import { Component, OnInit, OnDestroy } from '@angular/core';
import { AdminChatService } from '../../services/admin-chat.service';
import { Subscription } from 'rxjs';
import * as moment from 'moment';

@Component({
  selector: 'app-conversation-list',
  templateUrl: './conversation-list.component.html',
  styleUrls: ['./conversation-list.component.scss']
})
export class ConversationListComponent implements OnInit, OnDestroy {
  conversations: any[] = [];
  filtered: any[] = [];
  subs: Subscription[] = [];

  // UI state
  filterStatus: 'pending' | 'open' | 'closed' = 'open';
  searchTerm: string = '';

  private firstSelectionDone = false; // 👈 evita seleccionar de nuevo si llegan nuevas actualizaciones

  constructor(public chat: AdminChatService) { }

  ngOnInit(): void {
    this.subs.push(
      this.chat.conversations$.subscribe(list => {
        this.conversations = list || [];
        this.applyFilters();

        if (!this.firstSelectionDone && this.filtered.length > 0) {
            this.firstSelectionDone = true;

            // 👇 Espera un ciclo de renderizado antes de seleccionar la conversación
            setTimeout(() => {
                this.chat.selectConversation(this.filtered[0]);
            }, 0);
        }
      })
    );
    // Inicializar carga según filtro por defecto
    this.setFilter(this.filterStatus);
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
  }

  applyFilters() {
    const term = (this.searchTerm || '').toLowerCase().trim();
    this.filtered = (this.conversations || []).filter((c:any) => {
      // Filtrado por estados:
      // pending: sin agent_id y no cerradas
      // open: status === 'open'
      // closed: status === 'closed'
      if (this.filterStatus === 'pending') {
        // debe no tener agente asignado y no estar cerrado
        if (c.status && c.status === 'closed') return false;
        if (c.agent_id) return false;
      } else if (this.filterStatus === 'open') {
        if ((c.status || '').toLowerCase() !== 'open') return false;
      } else if (this.filterStatus === 'closed') {
        if ((c.status || '').toLowerCase() !== 'closed') return false;
      }

      if (!term) return true;
      const fields = [c.user_id, c.guest_id, c.session_id, c.agent_name, c.last_message];
      return fields.some(f => (f || '').toString().toLowerCase().includes(term));
    });
  }

  setFilter(status: 'pending' | 'open' | 'closed') {
    this.filterStatus = status;
    // reset automatic first selection so the first item of the new filter is selected
    this.firstSelectionDone = false;

    // Decide si pedimos al backend por status o cargamos todo y filtramos localmente
    // Usamos param status sólo para 'open' y 'closed' (si el backend lo soporta).
    if (status === 'open' || status === 'closed') {
      this.chat.loadActiveConversations(status === 'open' ? 'open' : 'closed');
    } else {
      // pending: request server-side pending if possible (service will probe/fallback as needed)
      this.chat.loadActiveConversations('pending');
    }
    // Los resultados llegarán al observable y llamarás applyFilters() en la suscripción.
  }

  onSearchChange() {
    this.applyFilters();
  }

  timeAgo(date: string) {
    if (!date) return '';
    return moment(date).fromNow();
  }

  select(conv: any) {
    this.chat.selectConversation(conv);
    this.firstSelectionDone = true; // 👈 al hacer clic manual, marcamos como seleccionada
  }

  take(conv: any) {
    this.chat.takeConversation(conv);
  }

  // ✅ Helpers para mostrar datos correctamente en la lista
  getUserName(conv: any): string {
    if (!conv) return 'Sin nombre';
    
    // Prioridad 1: user_name del backend (nombre completo del usuario)
    if (conv.user_name) {
      return conv.user_name;
    }
    
    // Prioridad 2: guest_name del backend
    if (conv.guest_name) {
      return conv.guest_name;
    }
    
    // Prioridad 3: Si tiene user_id, mostrar como "Usuario #123"
    if (conv.user_id) {
      return `Usuario #${conv.user_id}`;
    }
    
    // Prioridad 4: Si tiene guest_id, mostrar como "Invitado"
    if (conv.guest_id) {
      // Si es un UUID/string largo, solo mostrar "Invitado"
      if (typeof conv.guest_id === 'string' && conv.guest_id.length > 10) {
        return 'Invitado';
      }
      return `Invitado #${conv.guest_id}`;
    }
    
    // Fallback: mostrar ID de conversación
    return `Conversación #${conv.id}`;
  }

  getLastMessage(conv: any): string {
    if (conv.last_message) return conv.last_message;
    if (conv.messages && conv.messages.length > 0) {
      return conv.messages[conv.messages.length - 1].message;
    }
    return 'Sin mensajes';
  }

  getUnreadCount(conv: any): number {
    return conv.unread_count || 0;
  }

  hasActiveOrder(conv: any): boolean {
    return !!(conv.lastOrderTotal || conv.orderStatus);
  }
}

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
  filterStatus: 'pending' | 'open' | 'closed' = 'pending';
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
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
  }

  applyFilters() {
    const term = (this.searchTerm || '').toLowerCase().trim();
    this.filtered = (this.conversations || []).filter((c:any) => {
      // map status: pending -> status === 'open' or is_active true and no agent
      if (this.filterStatus === 'pending') {
        if (c.status && c.status === 'closed') return false;
      } else if (this.filterStatus === 'open') {
        if (c.status && c.status !== 'open') return false;
      } else if (this.filterStatus === 'closed') {
        if (c.status && c.status !== 'closed') return false;
      }

      if (!term) return true;
      const fields = [c.user_id, c.guest_id, c.session_id, c.agent_name, c.last_message];
      return fields.some(f => (f || '').toString().toLowerCase().includes(term));
    });
  }

  setFilter(status: 'pending' | 'open' | 'closed') {
    this.filterStatus = status;
    this.applyFilters();
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
}

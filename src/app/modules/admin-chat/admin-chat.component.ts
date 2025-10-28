import { Component, OnDestroy, OnInit } from '@angular/core';
import { AdminChatService } from './services/admin-chat.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-admin-chat',
  templateUrl: './admin-chat.component.html',
  styleUrls: ['./admin-chat.component.scss']
})
export class AdminChatComponent implements OnInit, OnDestroy {
  subs: Subscription[] = [];
  
  activeTab: string = 'chat'; // Controla el tab activo

  constructor(public chat: AdminChatService) { }

  ngOnInit(): void {
    this.chat.connect();
    this.chat.loadActiveConversations();
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
    this.chat.disconnect();
  }

  // Cambiar el tab (solo Angular, sin reload)
  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }

  // Saber si un tab está activo (para estilos)
  isActive(tab: string): boolean {
    return this.activeTab === tab;
  }
}

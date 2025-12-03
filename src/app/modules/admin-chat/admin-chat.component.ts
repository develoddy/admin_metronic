import { Component, OnDestroy, OnInit } from '@angular/core';
import { AdminChatService } from './services/admin-chat.service';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';

@Component({
  selector: 'app-admin-chat',
  templateUrl: './admin-chat.component.html',
  styleUrls: ['./admin-chat.component.scss']
})
export class AdminChatComponent implements OnInit, OnDestroy {
  subs: Subscription[] = [];
  
  // ✅ FASE 2B: Control de drawer de contactos (responsive)
  contactsDrawerOpen: boolean = false;
  contextSidebarOpen: boolean = false;

  constructor(public chat: AdminChatService, private router: Router) { }

  ngOnInit(): void {
    this.chat.connect();
    this.chat.loadActiveConversations();
    
    // ✅ Auto-detectar si debe mostrar drawer abierto en desktop grande
    this.checkScreenSize();
    window.addEventListener('resize', () => this.checkScreenSize());
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
    this.chat.disconnect();
    window.removeEventListener('resize', () => this.checkScreenSize());
  }

  // ✅ FASE 2B: Toggle drawer de contactos
  toggleContactsDrawer(): void {
    this.contactsDrawerOpen = !this.contactsDrawerOpen;
    
    // ✅ Collision management: En pantallas medias (1200-1399px), si abrimos contactos, cerramos el panel derecho
    if (this.contactsDrawerOpen && window.innerWidth >= 1200 && window.innerWidth < 1400 && this.contextSidebarOpen) {
      this.contextSidebarOpen = false;
    }
  }

  // ✅ Handler para cuando el panel de contexto se abre/cierra
  onContextSidebarToggle(isOpen: boolean): void {
    this.contextSidebarOpen = isOpen;
    
    // ✅ Collision management: En pantallas medias, si abrimos panel derecho, cerramos contactos
    if (this.contextSidebarOpen && window.innerWidth >= 1200 && window.innerWidth < 1400 && this.contactsDrawerOpen) {
      this.contactsDrawerOpen = false;
    }
  }

  // ✅ Auto-detectar tamaño de pantalla
  private checkScreenSize(): void {
    if (window.innerWidth >= 1400) {
      this.contactsDrawerOpen = true; // Desktop grande: siempre visible
    } else {
      this.contactsDrawerOpen = false; // Responsive: cerrado por defecto
    }
  }
}

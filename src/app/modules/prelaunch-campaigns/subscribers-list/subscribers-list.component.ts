import { Component, OnInit } from '@angular/core';
import { PrelaunchCampaignsService, PrelaunchSubscriber } from '../services/prelaunch-campaigns.service';

@Component({
  selector: 'app-subscribers-list',
  templateUrl: './subscribers-list.component.html',
  styleUrls: ['./subscribers-list.component.scss']
})
export class SubscribersListComponent implements OnInit {
  subscribers: PrelaunchSubscriber[] = [];
  loading = false;
  error: string | null = null;

  // Filtros
  filterStatus: string = 'all';
  filterVerified: string = 'all';
  filterNotified: string = 'all';
  searchTerm: string = '';

  constructor(private prelaunchService: PrelaunchCampaignsService) {}

  ngOnInit(): void {
    this.loadSubscribers();
  }

  loadSubscribers(): void {
    this.loading = true;
    this.error = null;

    this.prelaunchService.getSubscribers().subscribe({
      next: (data) => {
        // Asegurar que siempre sea un array
        this.subscribers = Array.isArray(data) ? data : [];
        console.log('Subscribers loaded:', this.subscribers.length);
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading subscribers:', err);
        this.error = 'Error al cargar suscriptores';
        this.subscribers = []; // Asegurar que sea array vacío en caso de error
        this.loading = false;
      }
    });
  }

  get filteredSubscribers(): PrelaunchSubscriber[] {
    // Verificar que subscribers sea un array antes de filtrar
    if (!Array.isArray(this.subscribers)) {
      return [];
    }

    return this.subscribers.filter(sub => {
      const matchesSearch = sub.email.toLowerCase().includes(this.searchTerm.toLowerCase());
      const matchesStatus = this.filterStatus === 'all' || sub.status === this.filterStatus;
      const matchesVerified = this.filterVerified === 'all' || 
        (this.filterVerified === 'true' ? sub.email_verified : !sub.email_verified);
      const matchesNotified = this.filterNotified === 'all' || 
        (this.filterNotified === 'true' ? sub.notified_launch : !sub.notified_launch);

      return matchesSearch && matchesStatus && matchesVerified && matchesNotified;
    });
  }

  exportCSV(): void {
    this.prelaunchService.exportSubscribers().subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `prelaunch_subscribers_${new Date().getTime()}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        console.error('Error exporting:', err);
        alert('Error al exportar datos');
      }
    });
  }

  refresh(): void {
    this.loadSubscribers();
  }
}

import { Component, OnInit } from '@angular/core';
import { NewsletterCampaignsService } from '../services/newsletter-campaigns.service';

@Component({
  selector: 'app-subscribers-list',
  templateUrl: './subscribers-list.component.html',
  styleUrls: ['./subscribers-list.component.scss']
})
export class SubscribersListComponent implements OnInit {
  subscribers: any[] = [];
  loading = false;
  pagination: any = { page: 1, limit: 50, total: 0 };
  filters: any = { status: 'subscribed' };

  constructor(private newsletterService: NewsletterCampaignsService) {}

  ngOnInit(): void {
    this.loadSubscribers();
  }

  loadSubscribers(): void {
    this.loading = true;
    this.newsletterService.getSubscribers(this.pagination.page, this.pagination.limit, this.filters)
      .subscribe({
        next: (data) => {
          this.subscribers = data.subscribers || [];
          this.pagination = data.pagination || this.pagination;
          this.loading = false;
        },
        error: (err) => {
          console.error('Error loading subscribers:', err);
          this.loading = false;
        }
      });
  }

  exportCSV(): void {
    this.newsletterService.exportSubscribers().subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `newsletter_subscribers_${new Date().getTime()}.csv`;
        link.click();
      },
      error: (err) => console.error('Error exporting:', err)
    });
  }

  onFilterChange(): void {
    this.pagination.page = 1;
    this.loadSubscribers();
  }

  onPageChange(page: number): void {
    this.pagination.page = page;
    this.loadSubscribers();
  }
}

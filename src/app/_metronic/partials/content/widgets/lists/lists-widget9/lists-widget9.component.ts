import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

interface ActivityItem {
  time: string;
  type: 'sale' | 'user' | 'return' | 'coupon' | 'note';
  text: string;
  link?: string; // opcional, para navegar a módulo
}

@Component({
  selector: 'app-lists-widget9',
  templateUrl: './lists-widget9.component.html',
})
export class ListsWidget9Component implements OnInit {
  constructor(private router: Router) {}

  ngOnInit(): void {}

  activities: ActivityItem[] = [
    { time: '08:42', type: 'note', text: 'Outlines keep you honest. And keep structure' },
    { time: '10:00', type: 'user', text: 'New user registered', link: '/users/list' },
    { time: '14:37', type: 'sale', text: 'New order placed', link: '/sales/list' },
    { time: '16:50', type: 'return', text: 'Return processed', link: '/returns/list' },
    { time: '21:03', type: 'sale', text: 'New order placed', link: '/sales/list' },
  ];

  goTo(link: string | undefined, event: Event) {
    event.preventDefault();
    if (link) {
      this.router.navigate([link]);
    }
  }
}

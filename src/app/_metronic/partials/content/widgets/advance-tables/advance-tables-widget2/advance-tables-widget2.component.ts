import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-advance-tables-widget2',
  templateUrl: './advance-tables-widget2.component.html',
})
export class AdvanceTablesWidget2Component implements OnInit {
  //currentTab = 'Day';
  currentTab: 'Day' | 'Week' | 'Month' = 'Day'; // tipado explícito

  constructor() {}

  ngOnInit(): void {}

  setCurrentTab(tab: 'Day' | 'Week' | 'Month') {
    this.currentTab = tab;
    console.log('Tab changed to', this.currentTab);
  }
}

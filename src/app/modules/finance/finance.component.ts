import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-finance',
  templateUrl: './finance.component.html',
  styleUrls: ['../../../assets/css/finance/_finance.scss']
})
export class FinanceComponent implements OnInit {
  constructor() {
    console.log('💰 [Finance] Constructor called');
  }

  ngOnInit(): void {
    console.log('💰 [Finance] Módulo Finance cargado');
    console.log('💰 [Finance] Router-outlet debería renderizar ahora');
  }
}

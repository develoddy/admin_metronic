import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-saas-management',
  templateUrl: './saas-management.component.html'
})
export class SaasManagementComponent implements OnInit {
  
  ngOnInit(): void {
    console.log('🚀 [SaasManagementComponent] ngOnInit - Componente padre cargado');
  }
}

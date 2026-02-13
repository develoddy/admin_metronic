import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-lab',
  templateUrl: './lab.component.html'
})
export class LabComponent implements OnInit {
  
  ngOnInit(): void {
    console.log('🧪 [Lab] Módulo Lab cargado');
  }
}

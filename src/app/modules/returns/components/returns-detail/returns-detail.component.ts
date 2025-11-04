import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ReturnsService } from '../../_services/returns.service';

@Component({
  selector: 'app-returns-detail',
  templateUrl: './returns-detail.component.html',
  styleUrls: ['./returns-detail.component.scss']
})
export class ReturnsDetailComponent implements OnInit {

  id: any;
  model: any = {};
  
  constructor(
    private route: ActivatedRoute, 
    private returnsService: ReturnsService, 
    private router: Router
  ) {}

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('id');

    console.log("Valor de parametro id = new", this.id);
    

    // Leer valor pasado como query param
    const q = this.route.snapshot.queryParamMap.get('q');

    if (this.id === 'new' && q) {
      if (q.includes('@')) {
        this.model.userEmail = q;  // Email del usuario
      } else {
        this.model.guestId = q;    // Guest ID
      }
    }

    if (this.id && this.id !== 'new') {
      this.returnsService.getReturnById(+this.id).subscribe(resp => {
        console.log("GetReturnById; ", resp);
        
        if (resp && resp.success) this.model = resp.return;
      });
    }
  }

  save() {
    if (this.id === 'new') {
      this.returnsService.createReturn(this.model).subscribe(() => this.router.navigate(['/returns/list']));
    } else {
      this.returnsService.updateReturn(+this.id, this.model).subscribe(() => this.router.navigate(['/returns/list']));
    }
  }

  cancel() {
    this.router.navigate(['/returns/list']);
  }
}

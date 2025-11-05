import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ReturnsService } from '../../_services/returns.service';
import { debounceTime } from 'rxjs/operators';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-returns-list',
  templateUrl: './returns-list.component.html',
  styleUrls: ['./returns-list.component.scss']
})
export class ReturnsListComponent implements OnInit {

  returns: any[] = [];
  q = '';
  page = 1;
  limit = 10;
  total = 0;

  private search$ = new Subject<string>();

  constructor(
    private returnsService: ReturnsService, 
    private route: ActivatedRoute, 
    private router: Router,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['search']) {
        this.q = params['search'];
      }
      this.load(1);
    });

    // Suscripción al subject de búsqueda con debounce
    this.search$.pipe(debounceTime(500)).subscribe(searchValue => {
      this.load(1, searchValue); // <-- pasamos el valor
    });
  }

  // Se llama en el input con (ngModelChange)
  onSearchChange(value: string) {
    this.q = value;
    this.search$.next(value);
  }

  load(page = 1, searchTerm?: string) {

    // Usamos el valor pasado desde el Subject, o si no existe, this.q
    const q = searchTerm ?? this.q;

    const params = { page, limit: this.limit, q};
    this.returnsService.getReturns(params).subscribe(resp => {
      console.log('Respuesta de getReturns:', resp);
      if (resp && resp.success) {
        this.returns = resp.returns || [];
        this.total = resp.total || 0;
        this.page = resp.page || page;

        // Forzamos la actualización del DOM
        this.cd.detectChanges();
      }
    });
  }

  openDetail(r: any) {
    this.router.navigate(['/returns/detail', r.id]);
  }

  newReturn() {
    this.router.navigate(['/returns/detail', 'new']);
  }

}

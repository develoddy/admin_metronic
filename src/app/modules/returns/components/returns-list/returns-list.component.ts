import { Component, OnInit } from '@angular/core';
//import { ReturnsService } from '../../_services/returns.service';
import { ActivatedRoute, Router } from '@angular/router';
import { ReturnsService } from '../../_services/returns.service';

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

  constructor(
    private returnsService: ReturnsService, 
    private route: ActivatedRoute, 
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['search']) {
        this.q = params['search'];
      }
      this.load(1);
    });
  }

  load(page = 1) {
    const params = { page, limit: this.limit, q: this.q };
    this.returnsService.getReturns(params).subscribe(resp => {
      if (resp && resp.success) {
        this.returns = resp.returns || [];
        this.total = resp.total || 0;
        this.page = resp.page || page;
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

import { Component, OnInit } from '@angular/core';
import { CuponeService } from '../_services/cupone.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Router } from '@angular/router';

@Component({
  selector: 'app-list-cupones',
  templateUrl: './list-cupones.component.html',
  styleUrls: ['./list-cupones.component.scss']
})
export class ListCuponesComponent implements OnInit {

  cupones:any=[];
  search:any = "";
  isLoading$:any = null;

  constructor(
    public _serviceCupon: CuponeService,
    public _modalService: NgbModal,
    public _router: Router,
  ) { }

  ngOnInit(): void {
    this.isLoading$ = this._serviceCupon.isLoading$;
    this.allCupones();
  }

  refresh() {
    this.search = "";
    this.allCupones();
  }

  allCupones() {
    this._serviceCupon.allCupones(this.search).subscribe((resp:any) => {
      this.cupones = resp.cupones;
    });
  }

  editCupon(cupon){
    this._router.navigateByUrl("/cupones/edit-cupon/"+cupon._id);
  }
  delete(cupon){

  }
}

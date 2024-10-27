import { Component, OnInit } from '@angular/core';
import { CuponeService } from '../_services/cupone.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Router } from '@angular/router';
import { DeleteNewCuponeComponent } from '../delete-new-cupone/delete-new-cupone.component';

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
    this._router.navigateByUrl("/cupones/edit-cupon/"+cupon.id);
  }
  delete(cupon){
    const modalRef = this._modalService.open(DeleteNewCuponeComponent, {centered:true, size: 'md'});
    modalRef.componentInstance.cupon_selected = cupon;

    modalRef.componentInstance.CuponD.subscribe((resp:any) => {
      let index = this.cupones.findIndex(item => item._id == cupon._id);
      if (index != -1) {
        this.cupones.splice(index,1);
      }
    });
  }
}

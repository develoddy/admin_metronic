import { Component, OnInit } from '@angular/core';
import { DiscountService } from '../_service/discount.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Router } from '@angular/router';
import { DeleteNewDiscountComponent } from '../delete-new-discount/delete-new-discount.component';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-list-discount',
  templateUrl: './list-discount.component.html',
  styleUrls: ['./list-discount.component.scss']
})
export class ListDiscountComponent implements OnInit {

  discounts:any=[];
  search:any = "";
  isLoading$:any = null;

  constructor(
    public _discountService: DiscountService,
    public _modalService: NgbModal,
    public _router: Router,
    public datePipe: DatePipe,
  ) { }

  ngOnInit(): void {
    this.isLoading$ = this._discountService.isLoading$;
    this.allDiscounts();
  }

  refresh() {
    this.search = "";
    this.allDiscounts();
  }

  getParseDate(date) {
    return this.datePipe.transform(date, "yyyy-MM-dd", "UTC");
  }

  allDiscounts() {
    this._discountService.allDiscounts(this.search).subscribe((resp:any) => {
      this.discounts = resp.discounts;
    });
  }

  editDiscount(discount){
    this._router.navigateByUrl("/discounts/edit-discount/"+discount.id);
  }
  delete(discount){
    const modalRef = this._modalService.open(DeleteNewDiscountComponent, {centered:true, size: 'md'});
    console.log("delete");
    console.log(discount);
    
    
    modalRef.componentInstance.discount_selected = discount;

    modalRef.componentInstance.DiscountD.subscribe((resp:any) => {
      let index = this.discounts.findIndex(item => item.id == discount.id);
      if (index != -1) {
        this.discounts.splice(index,1);
      }
    });
  }

}

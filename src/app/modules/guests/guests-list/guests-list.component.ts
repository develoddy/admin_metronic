import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { GuestService } from '../_services/guests.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-guests-list',
  templateUrl: './guests-list.component.html',
  styleUrls: ['./guests-list.component.scss']
})
export class GuestsListComponent implements OnInit {

  guests:any = [];
  isLoading$:any;
  search:any = "";
  
  constructor(
    private route: ActivatedRoute,
    public _guestService: GuestService,
    public _modalService: NgbModal
  ) { }

  ngOnInit(): void {
    this.getQueryParams();
    this.isLoading$ = this._guestService.isLoading$;
    this.allGuests();
  }

  getQueryParams() {
    this.route.queryParams.subscribe(params => {
      const searchValue = params['search'];
      if (searchValue) {
        this.search = searchValue;
        this.allGuests(); // o tu función que filtra los usuarios
      }
    });
  }

  allGuests() {
    this._guestService.allGuests(this.search).subscribe((resp:any) => {
      console.log(resp);
      this.guests = resp.guests;
    });
  }

  refresh() {
    this.search = "";
    this.allGuests();
  }

  openCreate() {
    
  }

  editGuest(guest:any) {

  }

  deleteGuest(guest:any) {

  }

}

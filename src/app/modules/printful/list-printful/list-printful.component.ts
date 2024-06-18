import { Component, OnInit } from '@angular/core';
import { PrintfulService } from '../_services/printful.service';

@Component({
  selector: 'app-list-printful',
  templateUrl: './list-printful.component.html',
  styleUrls: ['./list-printful.component.scss']
})
export class ListPrintfulComponent implements OnInit {

  //isLoading$:any = null;
  
  public isLoaded = false;

  constructor(
    public _printfulService: PrintfulService,
  ) { }

  ngOnInit(): void {
    //this.isLoading$ = this._printfulService.isLoading$;
  }

  synProducts() {
    
    this._printfulService.synPrintfulProducts().subscribe((resp:any)=> {
      console.log(resp);
      this.isLoaded = true;
      //this.loadServices();
    });
  }

  loadServices() {
    this._printfulService.isLoadingSubject.next(true);
    setTimeout(() => {
      this._printfulService.isLoadingSubject.next(false);
    }, 50);
  }

}

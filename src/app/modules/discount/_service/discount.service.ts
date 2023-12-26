import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { AuthService } from '../../auth';
import { URL_SERVICIOS } from 'src/app/config/config';
import { finalize } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class DiscountService {

  isLoading$: Observable<boolean>;
  isLoadingSubject: BehaviorSubject<boolean>;
  
  constructor(
    private _http: HttpClient,
    public _authservice: AuthService,
  ) {
    this.isLoadingSubject = new BehaviorSubject<boolean>(false);
    this.isLoading$ = this.isLoadingSubject.asObservable();
  }

  allDiscounts( search='' ) {
    this.isLoadingSubject.next(true);
    let header = new HttpHeaders({'token': this._authservice.token})
    let URL = URL_SERVICIOS+"/discounts/list?search="+search;
    return this._http.get(URL, {headers: header}).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  showDiscount(discount_id='') {
    this.isLoadingSubject.next(true);
    let header = new HttpHeaders({'token': this._authservice.token})
    let URL = URL_SERVICIOS+"/discounts/show?discount_id="+discount_id;
    return this._http.get(URL, {headers: header}).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  discountConfig( search='' ) {
    this.isLoadingSubject.next(true);
    let header = new HttpHeaders({'token': this._authservice.token})
    let URL = URL_SERVICIOS+"/discounts/config";
    return this._http.get(URL, {headers: header}).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  createDiscount( data ) {
    this.isLoadingSubject.next(true);
    let header = new HttpHeaders({'token': this._authservice.token})
    let URL = URL_SERVICIOS+"/discounts/register";
    return this._http.post(URL, data, {headers: header}).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  updateDiscount( data ) {
    this.isLoadingSubject.next(true);
    let header = new HttpHeaders({'token': this._authservice.token})
    let URL = URL_SERVICIOS+"/discounts/update";
    return this._http.put(URL, data, {headers: header}).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  deleteDiscount( categorie_id ) {
    this.isLoadingSubject.next(true);
    let header = new HttpHeaders({'token': this._authservice.token})
    let URL = URL_SERVICIOS+"/discounts/delete?_id="+categorie_id;
    return this._http.delete(URL, {headers: header}).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }
}

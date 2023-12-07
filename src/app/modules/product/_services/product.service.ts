import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { AuthService } from '../../auth';
import { finalize } from 'rxjs/operators';
import { URL_SERVICIOS } from 'src/app/config/config';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  isLoading$: Observable<boolean>;
  isLoadingSubject: BehaviorSubject<boolean>;
  
  constructor(
    private _http: HttpClient,
    public _authservice: AuthService,
  ) {
    this.isLoadingSubject = new BehaviorSubject<boolean>(false);
    this.isLoading$ = this.isLoadingSubject.asObservable();
  }

  allProducts( search='' ) {
    this.isLoadingSubject.next(true);
    let header = new HttpHeaders({'token': this._authservice.token})
    let URL = URL_SERVICIOS+"/products/list?search="+search;
    return this._http.get(URL, {headers: header}).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  showProduct( product_id='' ) {
    this.isLoadingSubject.next(true);
    let header = new HttpHeaders({'token': this._authservice.token})
    let URL = URL_SERVICIOS+"/products/show/"+product_id;
    return this._http.get(URL, {headers: header}).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    ); 
  }

  createProduct( data ) {
    this.isLoadingSubject.next(true);
    let header = new HttpHeaders({'token': this._authservice.token})
    let URL = URL_SERVICIOS+"/products/register";
    return this._http.post(URL, data, {headers: header}).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  updateProduct( data ) {
    this.isLoadingSubject.next(true);
    let header = new HttpHeaders({'token': this._authservice.token})
    let URL = URL_SERVICIOS+"/products/update";
    return this._http.put(URL, data, {headers: header}).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  deleteProduct( product_id ) {
    this.isLoadingSubject.next(true);
    let header = new HttpHeaders({'token': this._authservice.token})
    let URL = URL_SERVICIOS+"/products/delete?_id="+product_id;
    return this._http.delete(URL, {headers: header}).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  // Variedades
  //
  //
  //


  createVariedad( data ) {
    this.isLoadingSubject.next(true);
    let header = new HttpHeaders({'token': this._authservice.token})
    let URL = URL_SERVICIOS+"/products/register-variedad";
    return this._http.post(URL, data, {headers: header}).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  updateVariedad( data ) {
    this.isLoadingSubject.next(true);
    let header = new HttpHeaders({'token': this._authservice.token})
    let URL = URL_SERVICIOS+"/products/update-variedad";
    return this._http.put(URL, data, {headers: header}).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  deleteVariedad( variedad_id ) {
    this.isLoadingSubject.next(true);
    let header = new HttpHeaders({'token': this._authservice.token})
    let URL = URL_SERVICIOS+"/products/delete-variedad/"+variedad_id;
    return this._http.delete(URL, {headers: header}).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

}

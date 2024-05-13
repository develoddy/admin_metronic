import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { AuthService } from '../../auth';
import { finalize } from 'rxjs/operators';
import { URL_SERVICIOS } from 'src/app/config/config';

@Injectable({
  providedIn: 'root'
})
export class CuponeService {
  isLoading$: Observable<boolean>;
  isLoadingSubject: BehaviorSubject<boolean>;
  
  constructor(
    private _http: HttpClient,
    public _authservice: AuthService,
  ) {
    this.isLoadingSubject = new BehaviorSubject<boolean>(false);
    this.isLoading$ = this.isLoadingSubject.asObservable();
  }

  allCupones( search='' ) {
    this.isLoadingSubject.next(true);
    let header = new HttpHeaders({'token': this._authservice.token})
    let URL = URL_SERVICIOS+"/cupones/list?search="+search;
    return this._http.get(URL, {headers: header}).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  showCupon(cupone_id='') {
    this.isLoadingSubject.next(true);
    let header = new HttpHeaders({'token': this._authservice.token})
    let URL = URL_SERVICIOS+"/cupones/show?cupone_id="+cupone_id;
    return this._http.get(URL, {headers: header}).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  cuponesConfig( search='' ) {
    this.isLoadingSubject.next(true);
    let header = new HttpHeaders({'token': this._authservice.token})
    let URL = URL_SERVICIOS+"/cupones/config";
    return this._http.get(URL, {headers: header}).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  createCupone( data ) {
    this.isLoadingSubject.next(true);
    let header = new HttpHeaders({'token': this._authservice.token})
    let URL = URL_SERVICIOS+"/cupones/register";
    return this._http.post(URL, data, {headers: header}).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  updateCupone( data ) {
    this.isLoadingSubject.next(true);
    let header = new HttpHeaders({'token': this._authservice.token})
    let URL = URL_SERVICIOS+"/cupones/update";
    return this._http.put(URL, data, {headers: header}).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  deleteCupone( categorie_id ) {
    this.isLoadingSubject.next(true);
    let header = new HttpHeaders({'token': this._authservice.token})
    let URL = URL_SERVICIOS+"/cupones/delete?_id="+categorie_id;
    return this._http.delete(URL, {headers: header}).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }
}

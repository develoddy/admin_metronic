import { Injectable } from '@angular/core';

import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { AuthService } from '../../modules/auth';
import { finalize } from 'rxjs/operators';
import { URL_SERVICIOS } from 'src/app/config/config';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {

  isLoading$: Observable<boolean>;
  isLoadingSubject: BehaviorSubject<boolean>;

  constructor(
    private _http: HttpClient,
    public _authservice: AuthService,
  ) {
    this.isLoadingSubject = new BehaviorSubject<boolean>(false);
    this.isLoading$ = this.isLoadingSubject.asObservable();
  }

  // allCategories( search='' ) {
  //   this.isLoadingSubject.next(true);
  //   let header = new HttpHeaders({'token': this._authservice.token})
  //   let URL = URL_SERVICIOS+"/categories/list";
  //   return this._http.get(URL, {headers: header}).pipe(
  //     finalize(() => this.isLoadingSubject.next(false))
  //   );
  // }

  // allProducts( search='', categorie=null ) {
  //   this.isLoadingSubject.next(true);
  //   let header = new HttpHeaders({'token': this._authservice.token});
  //   let URL = URL_SERVICIOS+"/products/list";
  //   return this._http.get(URL, {headers: header}).pipe(
  //     finalize(() => this.isLoadingSubject.next(false))
  //   );
  // }
}

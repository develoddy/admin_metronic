import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { AuthService } from '../../auth';
import { URL_SERVICIOS } from 'src/app/config/config';
import { finalize } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class CategoriesService {
  isLoading$: Observable<boolean>;
  isLoadingSubject: BehaviorSubject<boolean>;
  
  constructor(
    private _http: HttpClient,
    public _authservice: AuthService,
  ) {
    this.isLoadingSubject = new BehaviorSubject<boolean>(false);
    this.isLoading$ = this.isLoadingSubject.asObservable();
  }

  allCategories( search='' ) {
    this.isLoadingSubject.next(true);
    let header = new HttpHeaders({'token': this._authservice.token})
    let URL = URL_SERVICIOS+"/categories/list?search="+search;
    return this._http.get(URL, {headers: header}).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  createCategorie( data ) {
    this.isLoadingSubject.next(true);
    let header = new HttpHeaders({'token': this._authservice.token})
    let URL = URL_SERVICIOS+"/categories/register";
    return this._http.post(URL, data, {headers: header}).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  updateCategorie( data ) {
    this.isLoadingSubject.next(true);
    let header = new HttpHeaders({'token': this._authservice.token})
    let URL = URL_SERVICIOS+"/categories/update";
    return this._http.put(URL, data, {headers: header}).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  deleteCategorie( categorie_id ) {
    this.isLoadingSubject.next(true);
    let header = new HttpHeaders({'token': this._authservice.token})
    let URL = URL_SERVICIOS+"/categories/delete?_id="+categorie_id;
    return this._http.delete(URL, {headers: header}).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }
}

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { AuthService } from '../../auth';
import { URL_SERVICIOS } from 'src/app/config/config';
import { finalize } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class GuestService {
  isLoading$: Observable<boolean>;
  isLoadingSubject: BehaviorSubject<boolean>;
  
  constructor(
    private _http: HttpClient,
    public _authservice: AuthService,
  ) {
    this.isLoadingSubject = new BehaviorSubject<boolean>(false);
    this.isLoading$ = this.isLoadingSubject.asObservable();
  }

  allGuests(search='') {
    this.isLoadingSubject.next(true);
    let headers = new HttpHeaders({'token': this._authservice.token});
    let URL = URL_SERVICIOS + '/guests/list?search='+search;
    return this._http.get(URL, {headers: headers}).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  createGuest(data) {
    this.isLoadingSubject.next(true);
    let headers = new HttpHeaders({'token': this._authservice.token});
    let URL = URL_SERVICIOS + '/guests/register';
    return this._http.post(URL, data, {headers: headers}).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  updateGuest(data) {
    this.isLoadingSubject.next(true);
    let headers = new HttpHeaders({'token': this._authservice.token});
    let URL = URL_SERVICIOS + '/guests/update';
    return this._http.put(URL, data, {headers: headers}).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  deleteGuest(guest_id) {
    this.isLoadingSubject.next(true);
    let headers = new HttpHeaders({'token': this._authservice.token});
    let URL = URL_SERVICIOS + '/guests/delete?_id='+guest_id;
    return this._http.delete(URL, {headers: headers}).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  getGuestById(guest_id: any) {
    this.isLoadingSubject.next(true);
    const headers = new HttpHeaders({ 'token': this._authservice.token });
    const body = { id: guest_id }; 
    return this._http.post(URL_SERVICIOS + '/guests/detail_guest_admin', body, { headers }).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }
}

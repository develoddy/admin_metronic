import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { AuthService } from '../../auth';
import { URL_SERVICIOS } from 'src/app/config/config';
import { finalize } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class UsersService {
  isLoading$: Observable<boolean>;
  isLoadingSubject: BehaviorSubject<boolean>;
  
  constructor(
    private _http: HttpClient,
    public _authservice: AuthService,
  ) {
    this.isLoadingSubject = new BehaviorSubject<boolean>(false);
    this.isLoading$ = this.isLoadingSubject.asObservable();
  }

  allUsers(search='') {
    this.isLoadingSubject.next(true);
    let headers = new HttpHeaders({'token': this._authservice.token});
    let URL = URL_SERVICIOS + '/users/list?search='+search;
    return this._http.get(URL, {headers: headers}).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  createUser(data) {
    this.isLoadingSubject.next(true);
    let headers = new HttpHeaders({'token': this._authservice.token});
    let URL = URL_SERVICIOS + '/users/register_admin';
    return this._http.post(URL, data, {headers: headers}).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  updateUser(data) {
    this.isLoadingSubject.next(true);
    let headers = new HttpHeaders({'token': this._authservice.token});
    let URL = URL_SERVICIOS + '/users/update';
    return this._http.put(URL, data, {headers: headers}).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  deleteUser(user_id) {
    this.isLoadingSubject.next(true);
    let headers = new HttpHeaders({'token': this._authservice.token});
    let URL = URL_SERVICIOS + '/users/delete?_id='+user_id;
    return this._http.delete(URL, {headers: headers}).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }
}

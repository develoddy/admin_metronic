import { Injectable } from '@angular/core';
import { map, catchError, switchMap, finalize } from 'rxjs/operators';

import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, of, Subscription } from 'rxjs';
import { AuthService } from '../../auth';
import { URL_SERVICIOS } from 'src/app/config/config';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class DropiService {

  isLoading$: Observable<boolean>;
  isLoadingSubject: BehaviorSubject<boolean>;


  constructor(
    private http: HttpClient,
    private router: Router
  ) { 
    this.isLoadingSubject = new BehaviorSubject<boolean>(false);
    this.isLoading$ = this.isLoadingSubject.asObservable();
  }

  login_dropi(email: string, password: string, white_brand_id:string, country:string) {
    this.isLoadingSubject.next(true);
    let url = URL_SERVICIOS + "/dropi/login-dropi";
    return this.http.post(url,{email, password, white_brand_id, country}).pipe(
      map((auth: any) => {
        return auth;
      }),
      // switchMap(() => this.getUserByToken()),
      catchError((err) => {
        console.error('err', err);
        //return of(undefined);
        return of({ success: false, message: 'Error en la autenticación' });
      }),
      finalize(() => this.isLoadingSubject.next(false))
    );
  }
}

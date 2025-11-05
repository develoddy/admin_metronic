import { Component, OnInit } from '@angular/core';
import { UsersService } from '../_services/users.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { AddUsersComponent } from '../components/add-users/add-users.component';
import { EditUsersComponent } from '../components/edit-users/edit-users.component';
import { DeleteUserComponent } from '../components/delete-user/delete-user.component';
import { ActivatedRoute } from '@angular/router';
import { debounceTime } from 'rxjs/operators';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-users-list',
  templateUrl: './users-list.component.html',
  styleUrls: ['./users-list.component.scss']
})
export class UsersListComponent implements OnInit {

  users:any = [];
  isLoading$:any;
  search:any = "";
  private search$ = new Subject<string>();

  constructor(
    private route: ActivatedRoute,
    public _userService: UsersService,
    public _modalService: NgbModal
  ) { }

  ngOnInit(): void {
     this.isLoading$ = this._userService.isLoading$;

    // Leer query params
    this.route.queryParams.subscribe(params => {
      const searchValue = params['search']?.trim();
      if (searchValue) {
        this.search = searchValue;
      }
      this.allUsers(); // cargar usuarios al iniciar
    });

    // Suscripción al Subject con debounce
    this.search$.pipe(debounceTime(500)).subscribe(term => {
      this.search = term;
      this.allUsers();
    });

  //   this.isLoading$ = this._userService.isLoading$;
  //   this.getQueryParams();
  //   //this.allUsers();

  //   // Suscripción al subject con debounce
  //   this.search$.pipe(debounceTime(500)).subscribe(term => {
  //     this.search = term;
  //     this.allUsers(); // siempre buscar con el término actual
  //   });
  // }

  // getQueryParams() {
  //   this.route.queryParams.subscribe(params => {
  //     const searchValue = params['search'];
  //     if (searchValue) {
  //       this.search = searchValue;
  //       this.allUsers(); // o tu función que filtra los usuarios
  //      } else {
  //       this.allUsers();
  //     }
  //   });
  }

  // Se llama desde el input
  onSearchChange(value: string) {
    this.search$.next(value);
  }

  allUsers() {
    this._userService.allUsers(this.search).subscribe((resp:any) => {
      console.log("Respuesta de allUsers:", resp);
      this.users = resp.users;
    });
  }

  refresh() {
    this.search = "";
    this.allUsers();
  }

  openCreate() {
    const modalRef = this._modalService.open(AddUsersComponent, {centered:true, size: 'md'});
    modalRef.result.then(
      () => {

      }, () => {
        
      }
    );
    modalRef.componentInstance.UserC.subscribe((resp:any) => {
      this.users.unshift(resp);
    });
  }

  editUser(user) {
    const modalRef = this._modalService.open(EditUsersComponent, {centered:true, size: 'md'});
    modalRef.componentInstance.user_selected = user;
    modalRef.result.then(
      () => {

      }, () => {
        
      }
    );
    modalRef.componentInstance.UserE.subscribe((resp:any) => {
      console.log(resp);
      let INDEX = this.users.findIndex(item => item._id == resp._id);
      if (INDEX != -1) {
        this.users[INDEX] = resp;
      }
    });
  }

  delete(user) {
    const modalRef = this._modalService.open(DeleteUserComponent, {centered:true, size: 'md'});
    modalRef.componentInstance.user_selected = user;
    modalRef.result.then(
      () => {

      }, () => {
        
      }
    );
    modalRef.componentInstance.UserD.subscribe((resp:any) => {
      console.log(resp);
      let INDEX = this.users.findIndex(item => item._id == user._id);
      if (INDEX != -1) {
        this.users.splice(INDEX,1);
      }
    });
  }
}

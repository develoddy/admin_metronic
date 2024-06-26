import { Component, OnInit } from '@angular/core';
import { URL_BACKEND } from 'src/app/config/config';
import { CategoriesService } from '../_services/categories.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { AddNewCategorieComponent } from '../add-new-categorie/add-new-categorie.component';
import { EditNewCategorieComponent } from '../edit-new-categorie/edit-new-categorie.component';
import { DeleteNewCategorieComponent } from '../delete-new-categorie/delete-new-categorie.component';

@Component({
  selector: 'app-list-categories',
  templateUrl: './list-categories.component.html',
  styleUrls: ['./list-categories.component.scss']
})
export class ListCategoriesComponent implements OnInit {
  categories:any=[];
  search:any = "";
  isLoading$:any = null;
  URL_BACKEND:any = URL_BACKEND;º

  constructor(
    public _serviceCategorie: CategoriesService,
    public _modalService: NgbModal
  ) { }

  ngOnInit(): void {
    this.isLoading$ = this._serviceCategorie.isLoading$;
    this.allCategories();
  }
  
  allCategories() {
    this._serviceCategorie.allCategories(this.search).subscribe((resp:any) => {
      console.log(resp.categories);
      
      this.categories = resp.categories;
    });
  }

  refresh() {
    this.search = "";
    this.allCategories();
  }

  openCreate() {
    const modalRef = this._modalService.open(AddNewCategorieComponent, {centered:true, size: 'md'});
    modalRef.componentInstance.CategorieC.subscribe((categories:any) => {
      this.categories.unshift(categories);
    });   
    /*modalRef.result.then(
      () => {
      }, () => {
      }
    );*/
  }

  editCategorie(categorie) {
    const modalRef = this._modalService.open(EditNewCategorieComponent, {centered:true, size: 'md'});
    modalRef.componentInstance.categorie_selected = categorie;

    modalRef.componentInstance.CategorieE.subscribe((categorie:any) => {
      let index = this.categories.findIndex(item => item._id == categorie._id);
      if (index != -1) {
        this.categories[index] = categorie;
      }
    });
  }

  delete(categorie) {
    console.log("---debbug list-categorie.component - delete :");
    console.log(categorie);
    
    
    const modalRef = this._modalService.open(DeleteNewCategorieComponent, {centered:true, size: 'md'});
    modalRef.componentInstance.categorie_selected = categorie;

    modalRef.componentInstance.CategorieD.subscribe((resp:any) => {
      let index = this.categories.findIndex(item => item._id == categorie._id);
      if (index != -1) {
        this.categories.splice(index,1);
      }
    });
  }
}

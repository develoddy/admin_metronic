import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { CategoriesService } from '../_services/categories.service';
import { Toaster } from 'ngx-toast-notifications';
import { NoticyAlertComponent } from 'src/app/componets/notifications/noticy-alert/noticy-alert.component';

@Component({
  selector: 'app-delete-new-categorie',
  templateUrl: './delete-new-categorie.component.html',
  styleUrls: ['./delete-new-categorie.component.scss']
})
export class DeleteNewCategorieComponent implements OnInit {
  @Output() CategorieD: EventEmitter<any> = new EventEmitter();
  @Input() categorie_selected:any;

  constructor(
    public _modal: NgbActiveModal,
    public _categorieService: CategoriesService,
    public toaster: Toaster,
  ) { }

  ngOnInit(): void {
  }

  delete() {
    this._categorieService.deleteCategorie(this.categorie_selected._id).subscribe((resp:any) => {
      this.CategorieD.emit('');
      this.toaster.open(NoticyAlertComponent, {text:  `success-La categoria se ha eliminado correctamente.`});
      this._modal.close();
    }, (error) => {
      if (error.error) {
        this.toaster.open(NoticyAlertComponent, {text: `danger-${error.error.message}.`});
      }
    });
  }
}

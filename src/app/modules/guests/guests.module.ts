import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GuestsRoutingModule } from './guests-routing.module';
import { GuestsComponent } from './guests.component';
import { GuestsListComponent } from './guests-list/guests-list.component';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbModule, NgbModalModule, NgbDatepickerModule } from '@ng-bootstrap/ng-bootstrap';
import { InlineSVGModule } from 'ng-inline-svg';
import { CRUDTableModule } from 'src/app/_metronic/shared/crud-table';

@NgModule({
  declarations: [GuestsComponent, GuestsListComponent],
  imports: [
    CommonModule,
    GuestsRoutingModule,
    HttpClientModule,
    FormsModule,
    NgbModule,
    ReactiveFormsModule,
    InlineSVGModule,
    CRUDTableModule,
    NgbModalModule,
    NgbDatepickerModule,
  ],
  exports: [GuestsListComponent]
})
export class GuestsModule { }

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbModule, NgbModalModule, NgbDatepickerModule } from '@ng-bootstrap/ng-bootstrap';
import { InlineSVGModule } from 'ng-inline-svg';
import { CRUDTableModule } from 'src/app/_metronic/shared/crud-table';
import { ReturnsRoutingModule } from './returns-routing.module';
import { ReturnsComponent } from './returns.component';
import { ReturnsListComponent } from './components/returns-list/returns-list.component';
import { ReturnsDetailComponent } from './components/returns-detail/returns-detail.component';


@NgModule({
  declarations: [
    ReturnsComponent,
    ReturnsListComponent,
    ReturnsDetailComponent
  ],
  imports: [
    CommonModule,
    ReturnsRoutingModule,
    HttpClientModule,
    FormsModule,
    NgbModule,
    ReactiveFormsModule,
    InlineSVGModule,
    CRUDTableModule,
    NgbModalModule,
    NgbDatepickerModule,
  ],
  exports: [ReturnsListComponent]
})
export class ReturnsModule { }

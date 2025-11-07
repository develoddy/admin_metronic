import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { InlineSVGModule } from 'ng-inline-svg';
import { CRUDTableModule } from 'src/app/_metronic/shared/crud-table';
import { RouterModule } from '@angular/router';

import { InboxRoutingModule } from './inbox-routing.module';
import { InboxListingComponent } from './inbox-listing/inbox-listing.component';
import { InboxMessagesComponent } from './inbox-messages/inbox-messages.component';
import { InboxContentComponent } from './components/inbox-content/inbox-content.component';
import { InboxSidebarComponent } from './components/inbox-sidebar/inbox-sidebar.component';


@NgModule({
  declarations: [
    InboxMessagesComponent,
    InboxSidebarComponent,
    InboxContentComponent,
  ],
  imports: [
    CommonModule,
    InboxRoutingModule,
    RouterModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    InlineSVGModule,
    CRUDTableModule
  ],
  exports: [
    InboxMessagesComponent,
    InboxSidebarComponent,
    InboxContentComponent,
  ]
})
export class InboxSharedModule { }

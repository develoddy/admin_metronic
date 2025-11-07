import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { InboxMessagesComponent } from './inbox-messages/inbox-messages.component';

const routes: Routes = [
  { path: 'messages', component: InboxMessagesComponent },
  { path: '', redirectTo: 'messages', pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class InboxRoutingModule { }

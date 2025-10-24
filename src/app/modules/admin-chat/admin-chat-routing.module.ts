import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AdminChatComponent } from './admin-chat.component';
//import { AdminChatComponent } from './admin-chat.component';

const routes: Routes = [
  {
    path: '',
    component: AdminChatComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminChatRoutingModule { }

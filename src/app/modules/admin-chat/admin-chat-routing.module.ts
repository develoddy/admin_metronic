import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AdminChatComponent } from './admin-chat.component';
//import { AdminChatComponent } from './admin-chat.component';

const routes: Routes = [
  {
    path: '',
    component: AdminChatComponent,
    data: {
      layout: {
        contentExtended: true, // ✅ Usa layout extendido (sin container limitado)
        subheader: { display: false }, // ✅ Oculta subheader de Metronic
        footer: { display: false } // ✅ Oculta footer
      }
    }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminChatRoutingModule { }

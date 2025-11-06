import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminChatRoutingModule } from './admin-chat-routing.module';
import { ConversationListComponent } from './components/conversation-list/conversation-list.component';
import { ConversationDetailComponent } from './components/conversation-detail/conversation-detail.component';
import { HttpClientModule } from '@angular/common/http';
import { AdminChatComponent } from './admin-chat.component';
import { FirstLetterPipe } from './firstLetter.pipe';

// Modules compartidos
import { UsersSharedModule } from '../users/users-shared.module';
import { AdminSalesSharedModule } from '../admin-sales/admin-sales-shared.module';
import { ProductSharedModule } from '../product/product-shared.module';
import { ReturnsSharedModule } from '../returns/returns-shared.module';

@NgModule({
  declarations: [
    AdminChatComponent,
    ConversationListComponent,
    ConversationDetailComponent,
    FirstLetterPipe
  ],
  imports: [
    CommonModule,
    FormsModule,
    HttpClientModule,
    AdminChatRoutingModule,
    //Modules compartidos
    UsersSharedModule,
    ProductSharedModule,
    AdminSalesSharedModule,
    ReturnsSharedModule
  ],
  providers: []
})
export class AdminChatModule { }

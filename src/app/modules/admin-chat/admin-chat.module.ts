import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminChatRoutingModule } from './admin-chat-routing.module';
//import { AdminChatComponent } from './admin-chat.component';
import { ConversationListComponent } from './components/conversation-list/conversation-list.component';
import { ConversationDetailComponent } from './components/conversation-detail/conversation-detail.component';
import { HttpClientModule } from '@angular/common/http';
import { AdminChatComponent } from './admin-chat.component';
import { FirstLetterPipe } from './firstLetter.pipe';

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
    AdminChatRoutingModule
  ],
  providers: []
})
export class AdminChatModule { }

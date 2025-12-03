import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminChatRoutingModule } from './admin-chat-routing.module';
import { HttpClientModule } from '@angular/common/http';

// Components
import { AdminChatComponent } from './admin-chat.component';
import { ConversationListComponent } from './components/conversation-list/conversation-list.component';
import { ConversationDetailComponent } from './components/conversation-detail/conversation-detail.component';
import { CustomerContextPanelComponent } from './components/customer-context-panel/customer-context-panel.component';
import { TrackingTabComponent } from './components/tracking-tab/tracking-tab.component';

// Pipes
import { FirstLetterPipe } from './firstLetter.pipe';

// Modules compartidos
import { UsersSharedModule } from '../users/users-shared.module';
import { AdminSalesSharedModule } from '../admin-sales/admin-sales-shared.module';
import { ProductSharedModule } from '../product/product-shared.module';
import { ReturnsSharedModule } from '../returns/returns-shared.module';

// Servicios
import { ChatIntentService } from './services/chat-intent.service';
import { CustomerContextService } from './services/customer-context.service';
import { PrintfulRealTimeService } from './services/printful-realtime.service';
import { WebhookNotificationService } from './services/webhook-notification.service';
import { AutoResponseService } from './services/auto-response.service';

@NgModule({
  declarations: [
    AdminChatComponent,
    ConversationListComponent,
    ConversationDetailComponent,
    CustomerContextPanelComponent,
    FirstLetterPipe,
    TrackingTabComponent
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
  providers: [
    ChatIntentService,
    CustomerContextService,
    PrintfulRealTimeService,
    WebhookNotificationService,
    AutoResponseService
  ]
})
export class AdminChatModule { }

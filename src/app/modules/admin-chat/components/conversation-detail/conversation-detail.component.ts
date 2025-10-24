import { Component, OnInit } from '@angular/core';
import { AdminChatService } from '../../services/admin-chat.service';

@Component({
  selector: 'app-conversation-detail',
  templateUrl: './conversation-detail.component.html',
  styleUrls: ['./conversation-detail.component.scss']
})
export class ConversationDetailComponent implements OnInit {
  messages: any[] = [];
  newMessage = '';
  selected: any = null;

  constructor(public chat: AdminChatService) { }

  ngOnInit(): void {
    this.chat.selectedConversation$.subscribe(c => {
      this.selected = c;
      this.messages = [];
    });

    this.chat.messages$.subscribe(msgs => {
      this.messages = msgs || [];
    });
  }

  send() {
    if (!this.newMessage || !this.selected) return;
    this.chat.sendAgentMessage(this.selected, this.newMessage);
    this.newMessage = '';
  }

  closeConversation() {
    if (!this.selected) return;
    this.chat.closeConversation(this.selected);
  }
}

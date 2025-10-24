import { Component, OnInit } from '@angular/core';
import { AdminChatService } from '../../services/admin-chat.service';

@Component({
  selector: 'app-conversation-list',
  templateUrl: './conversation-list.component.html',
  styleUrls: ['./conversation-list.component.scss']
})
export class ConversationListComponent implements OnInit {
  conversations: any[] = [];

  constructor(public chat: AdminChatService) { }

  ngOnInit(): void {
    this.chat.conversations$.subscribe(list => this.conversations = list || []);
  }

  select(conv: any) {
    this.chat.selectConversation(conv);
  }

  take(conv: any) {
    this.chat.takeConversation(conv);
  }
}

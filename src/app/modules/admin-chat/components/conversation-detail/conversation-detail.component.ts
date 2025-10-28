import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { AdminChatService } from '../../services/admin-chat.service';
import { Subscription } from 'rxjs';


@Component({
  selector: 'app-conversation-detail',
  templateUrl: './conversation-detail.component.html',
  styleUrls: ['./conversation-detail.component.scss']
})
export class ConversationDetailComponent implements OnInit, OnDestroy {
  @ViewChild('messagesContainer') messagesContainer!: ElementRef;

  messages: any[] = [];
  newMessage = '';
  selected: any = null;
  subs: Subscription[] = [];

  menuOpen = false;

  constructor(public chat: AdminChatService) { }

  ngOnInit(): void {
    this.subs.push(this.chat.selectedConversation$.subscribe(c => {
      this.selected = c;
      this.messages = c?.messages ? [...c.messages] : [];
      // scroll after a short delay to allow DOM update
      setTimeout(() => this.scrollToBottom(), 50);
    }));

    this.subs.push(this.chat.messages$.subscribe(msgs => {
      this.messages = msgs || [];
      setTimeout(() => this.scrollToBottom(), 50);
    }));
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
  }

  get userInitial(): string {
    return ((this.selected?.user_name ?? 'U') + '').slice(0, 1).toUpperCase();
}

  send() {
    if (!this.newMessage || !this.selected) return;
    this.chat.sendAgentMessage(this.selected, this.newMessage);
    this.newMessage = '';
    setTimeout(() => this.scrollToBottom(), 50);
  }

  closeConversation() {
    if (!this.selected) return;
    this.chat.closeConversation(this.selected);
  }

  takeConversation() {
    if (!this.selected) return;
    this.chat.takeConversation(this.selected);
  }

  getDateFromTime(time: string): Date {
    const [h, m] = time.split(':').map(Number);
    const date = new Date();
    date.setHours(h, m, 0, 0);
    return date;
  }

  private scrollToBottom() {
    try {
      const el = this.messagesContainer?.nativeElement;
      if (el) {
        el.scrollTop = el.scrollHeight;
      }
    } catch (e) {
      // ignore
    }
  }
}

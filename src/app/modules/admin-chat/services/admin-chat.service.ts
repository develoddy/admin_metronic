import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { URL_SERVICIOS } from 'src/app/config/config';
import { AuthService } from '../../auth';

@Injectable({ providedIn: 'root' })
export class AdminChatService {
  private socket: Socket | null = null;

  private conversationsSubject = new BehaviorSubject<any[]>([]);
  private selectedConversationSubject = new BehaviorSubject<any>(null);
  private messagesSubject = new BehaviorSubject<any[]>([]);

  public conversations$ = this.conversationsSubject.asObservable();
  public selectedConversation$ = this.selectedConversationSubject.asObservable();
  public messages$ = this.messagesSubject.asObservable();

  constructor(private http: HttpClient, private _authservice: AuthService) { }

  private getAuthHeaders() {
    const headers = new HttpHeaders({ 'token': this._authservice.token || '' });
    return { headers };
  }

  connect() {
    if (this.socket && this.socket.connected) return;
    this.socket = io((URL_SERVICIOS || '').replace(/\/api$/, '') , { transports: ['websocket'], upgrade: false });

    this.socket.on('connect', () => {
      console.log('[AdminChat] connected', this.socket?.id);
      // identify as agent
      const user = this._authservice.currentUserValue || null;
  const agent_id = user ? ((user as any)._id || (user as any).id) : `admin_${Date.now()}`;
      const agent_name = user ? (user.firstname || user.name || user.email) : 'Admin';
      this.socket?.emit('identify-agent', { agent_id, agent_name });
    });

    this.socket.on('agent-registered', (data) => {
      console.log('[AdminChat] agent-registered', data);
    });

    this.socket.on('new-user-message', (msg) => {
      console.log('[AdminChat] new-user-message', msg);
      const convId = msg.conversation_id;
      const list = [...(this.conversationsSubject.value || [])];
      const formattedMsg = this._formatMessage(msg);

      const idx = list.findIndex((c: any) => (c.conversation_id === convId || c.id === convId));

      if (idx > -1) {
        const old = list[idx];
        const newConv = {
          ...old,
          messages: [...(old.messages || []), formattedMsg],
          updatedAt: msg.created_at || new Date().toISOString(),
          last_message: msg.message || formattedMsg.message,
          unread_count: (old.unread_count || 0) + 1
        };

        const newList = [newConv, ...list.filter((_, i) => i !== idx)];
        this.conversationsSubject.next(newList);

        const selected = this.selectedConversationSubject.value;
        if (selected && (selected.conversation_id === convId || selected.id === convId)) {
          this.selectedConversationSubject.next(newConv);
          this.messagesSubject.next([...(this.messagesSubject.value || []), formattedMsg]);
        }
      } else {
        const newConv = {
          conversation_id: convId,
          id: convId,
          session_id: msg.session_id,
          status: 'open',
          messages: [formattedMsg],
          user_id: msg.user_id || null,
          guest_id: msg.guest_id || null,
          createdAt: msg.created_at || new Date().toISOString(),
          updatedAt: msg.created_at || new Date().toISOString(),
          last_message: msg.message || formattedMsg.message,
          unread_count: 1
        };

        const newList = [newConv, ...list];
        this.conversationsSubject.next(newList);

        this._fetchConversationDetails(convId).then(details => {
          if (details) {
            const current = this.conversationsSubject.value || [];
            const idx2 = current.findIndex((c:any) => c.conversation_id === convId || c.id === convId);
            if (idx2 !== -1) {
              const merged = { ...current[idx2], ...details };
              merged.messages = merged.messages || current[idx2].messages || [];
              const updatedList = [...current];
              updatedList[idx2] = merged;
              this.conversationsSubject.next(updatedList);
              const selected = this.selectedConversationSubject.value;
              if (selected && (selected.conversation_id === convId || selected.id === convId)) {
                this.selectedConversationSubject.next(merged);
                this.messagesSubject.next([...(merged.messages || [])]);
              }
            }
          }
        }).catch(err => console.error('[AdminChat] fetchConversationDetails error', err));
      }
    });

    this.socket.on('conversation-taken', (data) => {
      console.log('[AdminChat] conversation-taken', data);
      const list = [...(this.conversationsSubject.value || [])];
      const idx = list.findIndex((c:any) => c.conversation_id === data.conversation_id || c.id === data.conversation_id);
      if (idx !== -1) {
        const old = list[idx];
        const newConv = {
          ...old,
          agent_id: data.agent_id,
          agent_name: data.agent_name,
          status: 'open',
          updatedAt: new Date().toISOString()
        };
        const newList = [...list];
        newList[idx] = newConv;
        this.conversationsSubject.next(newList);

        const selected = this.selectedConversationSubject.value;
        if (selected && (selected.conversation_id === newConv.conversation_id || selected.id === newConv.id)) {
          this.selectedConversationSubject.next(newConv);
        }
      }
    });

    this.socket.on('new-agent-message', (msg) => {
      console.log('[AdminChat] new-agent-message', msg);
      const convId = msg.conversation_id;
      const list = [...(this.conversationsSubject.value || [])];
      const formatted = this._formatMessage(msg);

      const idx = list.findIndex((c:any) => c.conversation_id === convId || c.id === convId);
      if (idx > -1) {
        const old = list[idx];
        const newConv = {
          ...old,
          messages: [...(old.messages || []), formatted],
          updatedAt: msg.created_at || new Date().toISOString(),
          last_message: msg.message || formatted.message
        };
        const newList = [newConv, ...list.filter((_, i) => i !== idx)];
        this.conversationsSubject.next(newList);

        const selected = this.selectedConversationSubject.value;
        if (selected && (selected.conversation_id === convId || selected.id === convId)) {
          this.selectedConversationSubject.next(newConv);
          this.messagesSubject.next([...(this.messagesSubject.value || []), formatted]);
        }
      }
    });

    this.socket.on('user-connected', (data) => {
      // optional: refresh conversations
      // this.loadActiveConversations();
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  loadActiveConversations() {
    const url = `${URL_SERVICIOS}/chat/conversations`;
    this.http.get<any>(url, this.getAuthHeaders()).subscribe(resp => {
      if (resp && resp.success) {
        const convs = (resp.conversations || []).map((c: any) => ({
          conversation_id: c.id,
          id: c.id,
          session_id: c.session_id,
          status: c.status,
          user_id: c.user_id || null,
          guest_id: c.guest_id || null,
          messages: c.messages || [],
          createdAt: c.created_at || c.createdAt || null,
          updatedAt: c.updated_at || c.updatedAt || null,
          last_message: c.last_message || null,
          unread_count: c.unread_count || 0,
          agent_id: c.agent_id || null,
          agent_name: c.agent_name || null
        }));
        this.conversationsSubject.next(convs);
      }
    }, err => console.error('[AdminChat] loadActiveConversations error', err));
  }

  selectConversation(conv: any) {
    // find conversation in list to have canonical object
  const list = this.conversationsSubject.value || [];
  const canonical = list.find((c:any) => c.conversation_id === conv.conversation_id || c.id === conv.id || c.id === conv.conversation_id) || conv;
  // Use canonical object but don't mutate it in-place; keep canonical as source of truth
  this.selectedConversationSubject.next(canonical);
  this.messagesSubject.next(canonical.messages ? [...canonical.messages] : []);

    // request history via socket to ensure full messages
    if (this.socket && canonical && canonical.id) {
      this.socket.emit('get-history', { conversation_id: canonical.id });
      this.socket.once('chat-history', (data: any) => {
        if (data && data.conversation_id === canonical.id) {
            const formatted = (data.messages || []).map((m: any) => this._formatMessage(m));
            // create a new conversation object with formatted messages
            const newConv = {
              ...canonical,
              messages: formatted,
              updatedAt: canonical.updatedAt || (formatted.length ? formatted[formatted.length-1].created_at : canonical.updatedAt)
            };
            const idx = list.findIndex((c:any) => c.conversation_id === canonical.conversation_id || c.id === canonical.id);
            if (idx !== -1) {
              const newList = [...list];
              newList[idx] = newConv;
              this.conversationsSubject.next(newList);
            }
            this.selectedConversationSubject.next(newConv);
            this.messagesSubject.next(formatted);
          }
      });
    } else if (canonical && canonical.id) {
      // fallback to REST
      const url = `${URL_SERVICIOS}/chat/messages/${canonical.id}`;
      this.http.get<any>(url, this.getAuthHeaders()).subscribe(r => {
        if (r && r.success) {
            const formatted = (r.messages || []).map((m: any) => this._formatMessage(m));
            const newConv = { ...canonical, messages: formatted };
            const idx = list.findIndex((c:any) => c.conversation_id === canonical.conversation_id || c.id === canonical.id);
            if (idx !== -1) { const newList = [...list]; newList[idx] = newConv; this.conversationsSubject.next(newList); }
            this.selectedConversationSubject.next(newConv);
            this.messagesSubject.next(formatted);
          }
      });
    }
  }

  takeConversation(conv: any) {
    if (!this.socket || !conv) return;
    const user = this._authservice.currentUserValue || null;
  const agent_id = user ? ((user as any)._id || (user as any).id) : `admin_${Date.now()}`;
    const agent_name = user ? (user.firstname || user.name || user.email) : 'Admin';
    this.socket.emit('take-conversation', {
      conversation_id: conv.id || conv.conversation_id,
      agent_id,
      agent_name,
      session_id: conv.session_id
    });
  }

  sendAgentMessage(conv: any, message: string) {
    if (!this.socket || !conv) return;
    const user = this._authservice.currentUserValue || null;
  const agent_id = user ? ((user as any)._id || (user as any).id) : `admin_${Date.now()}`;
    const payload = {
      conversation_id: conv.id || conv.conversation_id,
      session_id: conv.session_id,
      agent_id,
      message
    };

    // optimistic update: append message locally
    const list = [...(this.conversationsSubject.value || [])];
    const idx = list.findIndex((c:any) => c.conversation_id === payload.conversation_id || c.id === payload.conversation_id);
    const tempMsg = {
      id: `temp_${Date.now()}`,
      conversation_id: payload.conversation_id,
      sender_type: 'agent',
      sender_id: agent_id,
      message,
      is_read: false,
      created_at: new Date().toISOString(),
      timestamp: new Date().toISOString()
    };
    if (idx > -1) {
      const old = list[idx];
      const newConv = {
        ...old,
        messages: [...(old.messages || []), tempMsg],
        updatedAt: tempMsg.created_at,
        last_message: message
      };
      const newList = [newConv, ...list.filter((_, i) => i !== idx)];
      this.conversationsSubject.next(newList);
      const selected = this.selectedConversationSubject.value;
      if (selected && (selected.conversation_id === newConv.conversation_id || selected.id === newConv.id)) {
        this.selectedConversationSubject.next(newConv);
        this.messagesSubject.next([...(this.messagesSubject.value || []), tempMsg]);
      }
    }

    this.socket.emit('agent-message', payload);
  }

  /**
   * Format a message object coming from the socket/REST
   */
  private _formatMessage(m: any) {
    if (!m) return m;
    return {
      id: m.id,
      conversation_id: m.conversation_id,
      sender_type: m.sender_type,
      sender_id: m.sender_id,
      message: m.message,
      is_read: m.is_read || false,
      created_at: m.created_at || m.createdAt || new Date().toISOString(),
      timestamp: m.timestamp || (m.created_at ? m.created_at : new Date().toISOString())
    };
  }

  /**
   * Fetch conversation details by id to enrich local object
   */
  private _fetchConversationDetails(conversationId: number) {
    return new Promise<any>((resolve, reject) => {
      const url = `${URL_SERVICIOS}/chat/conversation/${conversationId}`;
      this.http.get<any>(url, this.getAuthHeaders()).subscribe(resp => {
        if (resp && resp.success && resp.conversation) {
          const c = resp.conversation;
          const details = {
            conversation_id: c.id,
            id: c.id,
            session_id: c.session_id,
            status: c.status,
            user_id: c.user_id || null,
            guest_id: c.guest_id || null,
            createdAt: c.created_at || c.createdAt || null,
            updatedAt: c.updated_at || c.updatedAt || null,
            last_message: c.last_message || null,
            unread_count: c.unread_count || 0,
            messages: (c.messages || []).map((m: any) => this._formatMessage(m))
          };
          resolve(details);
        } else {
          resolve(null);
        }
      }, err => {
        console.error('[AdminChat] _fetchConversationDetails error', err);
        resolve(null);
      });
    });
  }

  closeConversation(conv: any) {
    if (!this.socket || !conv) return;
    this.socket.emit('close-conversation', { conversation_id: conv.id, session_id: conv.session_id });
  }

  /**
   * Assign agent via REST (reopen/assign)
   */
  assignAgentREST(conv: any) {
    if (!conv) return;
    const agent = this._authservice.currentUserValue || null;
    const agent_id = agent ? ((agent as any)._id || (agent as any).id) : null;
    if (!agent_id) return;
    const url = `${URL_SERVICIOS}/chat/assign/${conv.id || conv.conversation_id}`;
    return this.http.put<any>(url, { agent_id }, this.getAuthHeaders()).toPromise();
  }
}

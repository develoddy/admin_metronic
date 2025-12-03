import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { URL_SERVICIOS } from 'src/app/config/config';
import { AuthService } from '../../auth';

@Injectable({ providedIn: 'root' })
export class AdminChatService {
  private socket: Socket | null = null;
  // null = unknown, true = backend supports ?status= filtering, false = backend does not
  private serverSupportsStatus: boolean | null = null;

  private conversationsSubject = new BehaviorSubject<any[]>([]);
  private selectedConversationSubject = new BehaviorSubject<any>(null);
  private messagesSubject = new BehaviorSubject<any[]>([]);

  // FASE 2B: Subject para actualizaciones de contexto
  private contextRefreshSubject = new Subject<{ type: string; data: any }>();

  public conversations$ = this.conversationsSubject.asObservable();
  public selectedConversation$ = this.selectedConversationSubject.asObservable();
  public messages$ = this.messagesSubject.asObservable();
  public contextRefresh$ = this.contextRefreshSubject.asObservable();

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
        const oldMessages = [...(old.messages || [])];

        // Try to detect an optimistic/temp message previously appended when the agent sent it.
        // If a temp message matches by content and is recent, replace it with the server message
        // to avoid a visual duplicate.
        const tempIdx = oldMessages.findIndex((m: any) => {
          try {
            if (!m || !m.id) return false;
            if (!(m.id + '').startsWith('temp_')) return false;
            if ((m.sender_type || '') !== 'agent') return false;
            if ((m.message || '') !== (formatted.message || '')) return false;
            const t1 = new Date(m.created_at || m.timestamp || Date.now()).getTime();
            const t2 = new Date(formatted.created_at || formatted.timestamp || Date.now()).getTime();
            return Math.abs(t1 - t2) < 60000; // within 60s
          } catch (e) { return false; }
        });

        let newMessages;
        if (tempIdx >= 0) {
          // Replace temp message with real message (preserve order)
          oldMessages[tempIdx] = formatted;
          newMessages = oldMessages;
          console.debug('[AdminChat] Replaced temp message with server message for conv', convId, 'tempIdx=', tempIdx);
        } else {
          newMessages = [...oldMessages, formatted];
        }

        const newConv = {
          ...old,
          messages: newMessages,
          updatedAt: msg.created_at || new Date().toISOString(),
          last_message: msg.message || formatted.message
        };
        const newList = [newConv, ...list.filter((_, i) => i !== idx)];
        this.conversationsSubject.next(newList);

        const selected = this.selectedConversationSubject.value;
        if (selected && (selected.conversation_id === convId || selected.id === convId)) {
          this.selectedConversationSubject.next(newConv);

          // Update messagesSubject similarly: replace temp message if present, else append
          const currentMsgs = [...(this.messagesSubject.value || [])];
          const selTempIdx = currentMsgs.findIndex((m: any) => (m && m.id && (m.id + '').startsWith('temp_')) && (m.message === formatted.message) && (m.sender_type === 'agent'));
          if (selTempIdx >= 0) {
            currentMsgs[selTempIdx] = formatted;
            this.messagesSubject.next(currentMsgs);
          } else {
            this.messagesSubject.next([...currentMsgs, formatted]);
          }
        }
      }
    });

    this.socket.on('user-connected', (data) => {
      // optional: refresh conversations
      // this.loadActiveConversations();
    });

    // FASE 2B: Escuchar eventos de Printful webhooks
    this.socket.on('printful:update', (event: any) => {
      console.log('[AdminChat] 📦 printful:update recibido', event);
      this.contextRefreshSubject.next({
        type: 'printful:update',
        data: event
      });
    });

    this.socket.on('printful:tracking_update', (event: any) => {
      console.log('[AdminChat] 🚚 printful:tracking_update recibido', event);
      this.contextRefreshSubject.next({
        type: 'printful:tracking_update',
        data: event
      });
    });

    this.socket.on('printful:delay', (event: any) => {
      console.log('[AdminChat] ⚠️ printful:delay recibido', event);
      this.contextRefreshSubject.next({
        type: 'printful:delay',
        data: event
      });
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  /**
   * Carga conversaciones activas. Si el backend soporta el query param `status`, se lo pasamos.
   * Si el request con status falla, hacemos fallback a cargar sin status y filtramos en frontend.
   * @param status opcional: 'open' | 'closed'
   */
  loadActiveConversations(status?: string) {
    const baseUrl = `${URL_SERVICIOS}/chat/conversations`;
    const url = status ? `${baseUrl}?status=${encodeURIComponent(status)}` : baseUrl;

    // If a status filter was provided and we haven't yet determined whether the
    // backend supports server-side `?status=` filtering, we attempt the request
    // and set `serverSupportsStatus` according to whether the backend accepted
    // the parameter (resp.success === true). On subsequent calls we use this
    // flag to either trust the server (and not run client fallbacks) or to
    // always fetch unfiltered data and filter client-side.
    const doRequest = (requestUrl: string, treatAsProbe = false) => {
      this.http.get<any>(requestUrl, this.getAuthHeaders()).subscribe(resp => {
        if (resp && resp.success) {
          // If this call included a status param and we didn't know support yet,
          // assume the backend supports it.
          if (status && this.serverSupportsStatus === null) this.serverSupportsStatus = true;

          const convs = (resp.conversations || []).map((c: any) => ({
            conversation_id: c.id,
            id: c.id,
            session_id: c.session_id,
            status: c.status,
            user_id: c.user_id || null,
            guest_id: c.guest_id || null,
            user_name: c.user_name || null,
            guest_name: c.guest_name || null,
            messages: c.messages || [],
            createdAt: c.created_at || c.createdAt || null,
            updatedAt: c.updated_at || c.updatedAt || null,
            last_message: c.last_message || null,
            unread_count: c.unread_count || 0,
            agent_id: c.agent_id || null,
            agent_name: c.agent_name || null
          }));
          // If we called as a probe (to test support) and server does not truly
          // filter by that probe value, that's acceptable — we still mark
          // support true because the backend responded successfully to the
          // `status` query param. Business logic for what statuses are
          // supported should be aligned with the API docs.
          // Debug: log pending conversations received from API
          if (status && status.toLowerCase() === 'pending') {
            console.debug('[AdminChatService] Pending conversations received from API:', convs.length, convs);
          }
          this.conversationsSubject.next(convs);
        } else {
          // If server returned success=false while we tried with a status param,
          // assume backend does not support `?status=` and set flag accordingly,
          // then fallback to unfiltered fetch and client-side filtering.
          if (status && this.serverSupportsStatus === null) {
            this.serverSupportsStatus = false;
            // fallback to unfiltered load
            this.http.get<any>(baseUrl, this.getAuthHeaders()).subscribe(r2 => {
              if (r2 && r2.success) {
                const convs2 = (r2.conversations || []).map((c: any) => ({
                  conversation_id: c.id,
                  id: c.id,
                  session_id: c.session_id,
                  status: c.status,
                  user_id: c.user_id || null,
                  guest_id: c.guest_id || null,
                  user_name: c.user_name || null,
                  guest_name: c.guest_name || null,
                  messages: c.messages || [],
                  createdAt: c.created_at || c.createdAt || null,
                  updatedAt: c.updated_at || c.updatedAt || null,
                  last_message: c.last_message || null,
                  unread_count: c.unread_count || 0,
                  agent_id: c.agent_id || null,
                  agent_name: c.agent_name || null
                }));
                // Debug: pending fallback
                if (status && status.toLowerCase() === 'pending') {
                  console.debug('[AdminChatService] Pending conversations received from API (fallback):', convs2.length, convs2);
                }
                this.conversationsSubject.next(convs2);
              }
            }, err2 => console.error('[AdminChat] fallback loadActiveConversations error', err2));
          } else {
            console.warn('[AdminChat] loadActiveConversations: respuesta inesperada', resp);
          }
        }
      }, err => {
        console.error('[AdminChat] loadActiveConversations error', err);
        // If we attempted a status request while support is unknown, assume
        // backend does not support it and fallback to unfiltered fetch.
        if (status && this.serverSupportsStatus === null) {
          this.serverSupportsStatus = false;
          this.http.get<any>(baseUrl, this.getAuthHeaders()).subscribe(r2 => {
            if (r2 && r2.success) {
              const convs2 = (r2.conversations || []).map((c: any) => ({
                conversation_id: c.id,
                id: c.id,
                session_id: c.session_id,
                status: c.status,
                user_id: c.user_id || null,
                guest_id: c.guest_id || null,
                user_name: c.user_name || null,
                guest_name: c.guest_name || null,
                messages: c.messages || [],
                createdAt: c.created_at || c.createdAt || null,
                updatedAt: c.updated_at || c.updatedAt || null,
                last_message: c.last_message || null,
                unread_count: c.unread_count || 0,
                agent_id: c.agent_id || null,
                agent_name: c.agent_name || null
              }));
              this.conversationsSubject.next(convs2);
            }
          }, err2 => console.error('[AdminChat] fallback loadActiveConversations error', err2));
        } else {
          // If we already know the backend supports status, don't perform a
          // client-side fallback — just log the error so caller can handle it.
          // If backend does NOT support status (serverSupportsStatus === false),
          // the caller should have invoked this method without `status`.
        }
      });
    };

    // If backend is known to not support server-side status filtering, always
    // call the unfiltered endpoint and let the client apply any pending/open/closed logic.
    if (status && this.serverSupportsStatus === false) {
      // fetch unfiltered list
      this.http.get<any>(baseUrl, this.getAuthHeaders()).subscribe(r2 => {
        if (r2 && r2.success) {
          const convs2 = (r2.conversations || []).map((c: any) => ({
            conversation_id: c.id,
            id: c.id,
            session_id: c.session_id,
            status: c.status,
            user_id: c.user_id || null,
            guest_id: c.guest_id || null,
            user_name: c.user_name || null,
            guest_name: c.guest_name || null,
            messages: c.messages || [],
            createdAt: c.created_at || c.createdAt || null,
            updatedAt: c.updated_at || c.updatedAt || null,
            last_message: c.last_message || null,
            unread_count: c.unread_count || 0,
            agent_id: c.agent_id || null,
            agent_name: c.agent_name || null
          }));
          this.conversationsSubject.next(convs2);
        }
      }, err2 => console.error('[AdminChat] loadActiveConversations (no-status) error', err2));
      return;
    }

    // Normal path: perform the request (this will also serve as a probe the
    // first time we call with status).
    doRequest(url, !!status);
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
            user_name: c.user_name || null,
            guest_name: c.guest_name || null,
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

  // ========================================
  // FASE 2B: Actualizaciones en tiempo real
  // ========================================

  /**
   * Actualiza información de una orden en el contexto actual
   * Llamado cuando llega webhook de Printful
   */
  updateOrderInRealTime(orderId: number, updates: any): void {
    console.log(`[AdminChat] 🔄 Actualizando orden #${orderId} en tiempo real:`, updates);

    // Emitir evento para que CustomerContextPanel se refresque
    this.contextRefreshSubject.next({
      type: 'order_updated',
      data: {
        orderId,
        updates,
        timestamp: new Date().toISOString()
      }
    });
  }

  /**
   * Notifica que un paquete fue enviado
   */
  notifyPackageShipped(orderId: number, trackingData: any): void {
    console.log(`[AdminChat] 📬 Paquete enviado para orden #${orderId}`);

    this.contextRefreshSubject.next({
      type: 'package_shipped',
      data: {
        orderId,
        trackingNumber: trackingData.trackingNumber,
        carrier: trackingData.carrier,
        trackingUrl: trackingData.trackingUrl,
        timestamp: new Date().toISOString()
      }
    });
  }

  /**
   * Notifica error en orden
   */
  notifyOrderFailed(orderId: number, error: any): void {
    console.error(`[AdminChat] ❌ Orden #${orderId} falló:`, error);

    this.contextRefreshSubject.next({
      type: 'order_failed',
      data: {
        orderId,
        error,
        timestamp: new Date().toISOString()
      }
    });
  }

  /**
   * Refresca el contexto del cliente actual
   */
  refreshCurrentContext(): void {
    const selected = this.selectedConversationSubject.value;
    if (!selected) return;

    console.log('[AdminChat] 🔄 Solicitando refresco de contexto...');
    this.contextRefreshSubject.next({
      type: 'refresh_requested',
      data: {
        conversationId: selected.id || selected.conversation_id,
        timestamp: new Date().toISOString()
      }
    });
  }

  /**
   * Observable para escuchar actualizaciones de contexto
   */
  onContextRefresh() {
    return this.contextRefresh$;
  }
}

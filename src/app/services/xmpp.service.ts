import { Injectable } from '@angular/core';
declare const Strophe: any;
declare const $iq: any;
declare const $msg: any;
declare const $pres: any;

@Injectable({
  providedIn: 'root'
})
export class XmppService {
  private connection: any;

  constructor() {
    this.connection = new Strophe.Connection('ws://alumchat.lol:7070/ws/');
    (window as any).process = {
      env: { NODE_TLS_REJECT_UNAUTHORIZED: '0' }
    };
  }

  connect(jid: string, password: string, onConnect: (status: number) => void) {
    console.log('Iniciando conexión...');
    this.connection.connect(jid, password, (status: number) => {
      console.log('Estado de conexión:', status);
      onConnect(status);
    });
  }

  disconnect() {
    console.log('Desconectando...');
    this.connection.disconnect();
  }

  sendMessage(to: string, message: string) {
    const msg = $msg({ to, type: 'chat' })
      .c('body').t(message);
  
    // Intentar enviar el mensaje
    try {
      this.connection.send(msg);
      console.log(`Mensaje enviado a ${to}: ${message}`);
    } catch (error) {
      console.error(`Fallo al enviar el mensaje a ${to}: ${message}`, error);
    }
  }
  

  register(username: string, password: string, domain: string, onSuccess: () => void, onError: (error: any) => void) {
    const iq = $iq({ type: 'set', to: domain })
      .c('query', { xmlns: 'jabber:iq:register' })
      .c('username').t(username).up()
      .c('password').t(password);

    this.connection.sendIQ(iq, onSuccess, onError);
  }

  deleteAccount(jid: string, onSuccess: () => void, onError: (error: any) => void) {
    const iq = $iq({ type: 'set', to: jid })
      .c('query', { xmlns: 'jabber:iq:register' })
      .c('remove');

    this.connection.sendIQ(iq, onSuccess, onError);
  }

  getRoster(onSuccess: (roster: any) => void, onError: (error: any) => void) {
    const iq = $iq({ type: 'get' })
      .c('query', { xmlns: 'jabber:iq:roster' });

    this.connection.sendIQ(iq, onSuccess, onError);
  }

  addContact(jid: string, name: string, groups: string[], onSuccess: () => void, onError: (error: any) => void) {
    const iq = $iq({ type: 'set' })
      .c('query', { xmlns: 'jabber:iq:roster' })
      .c('item', { jid, name })
      .c('group').t(groups.join(','));

    this.connection.sendIQ(iq, onSuccess, onError);
  }

  sendPresence(presence: string) {
    const pres = $pres().c('show').t(presence);
    this.connection.send(pres);
  }

  joinGroupChat(roomJid: string, nickname: string) {
    const presence = $pres({ to: `${roomJid}/${nickname}` })
      .c('x', { xmlns: 'http://jabber.org/protocol/muc' });

    this.connection.send(presence);
  }

  sendFile(to: string, file: File) {
    // Aquí puedes implementar la lógica para enviar archivos utilizando HTTP Upload o cualquier otra extensión XMPP adecuada
  }

  receiveNotifications(handler: (msg: any) => boolean) {
    this.connection.addHandler(handler, null, 'message', 'headline');
  }

  discoverServices(onSuccess: (stanza: any) => void, onError: (error: any) => void) {
    const iq = $iq({ type: 'get', to: this.connection.domain })
      .c('query', { xmlns: 'http://jabber.org/protocol/disco#items' });

    this.connection.sendIQ(iq, onSuccess, onError);
  }
}

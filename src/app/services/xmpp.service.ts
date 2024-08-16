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
  private roster: any[] = [];

  constructor() {
    this.connection = new Strophe.Connection('ws://alumchat.lol:7070/ws/');
    (window as any).process = {
      env: { NODE_TLS_REJECT_UNAUTHORIZED: '0' }
    };
  }

  //LOGIN

  connect(jid: string, password: string, onConnect: (status: number) => void) {
    console.log('Iniciando conexión...');
    this.connection.connect(jid, password, (status: number) => {
      console.log('Estado de conexión:', status);
      onConnect(status);
    });
  }
  
  //REGISTRO

  signup(username: string, fullName: string, email: string, password: string, onSuccess: () => void, onError: (error: any) => void) {
    console.log(this.connection);

    this.connection.connect("lop21666@alumchat.lol", "123456", (status: number) => {
      if (status === Strophe.Status.CONNECTED) {
        console.log("Conectado al servidor XMPP para registro");

        const domain = "alumchat.lol";
        const registerIQ = $iq({
          type: "set",
          to: domain,
        }).c("query", { xmlns: "jabber:iq:register" })
          .c("username").t(username).up()
          .c("password").t(password).up()
          .c("name").t(fullName).up()
          .c("email").t(email);

        this.connection.sendIQ(registerIQ, (iq: any) => {
          console.log("Registro exitoso", iq);
          this.connection.disconnect();
          onSuccess();
        }, (error: any) => {
          console.error("Fallo en el registro", error);
          this.connection.disconnect();
          onError(error);
        });

      } else if (status === Strophe.Status.CONNFAIL) {
        console.error("Fallo al conectar con el servidor XMPP");
        onError(new Error("Fallo al conectar con el servidor XMPP"));
      }
    });
  }

  //CONTACTOS

  getRoster(onSuccess: (roster: any[]) => void, onError: (error: any) => void) {
    const iq = $iq({ type: 'get' }).c('query', { xmlns: 'jabber:iq:roster' });

    this.connection.sendIQ(iq, (response: any) => {
      const items = response.getElementsByTagName('item');
      this.roster = [];
      for (let i = 0; i < items.length; i++) {
        const jid = items[i].getAttribute('jid');
        const name = items[i].getAttribute('name') || jid;
        this.roster.push({ jid, name, status: 'offline' });  // Inicialmente todos offline
      }
      console.log('Roster recibido:', this.roster);
      onSuccess(this.roster);
    }, onError);
  }

  listenForPresence() {
    this.connection.addHandler((presence: any) => {
      const from = presence.getAttribute('from');
      const type = presence.getAttribute('type');
      const show = presence.getElementsByTagName('show')[0];
      let status = 'online';  // Estado predeterminado

      if (type === 'unavailable') {
        status = 'offline';
      } else if (show) {
        const showText = Strophe.getText(show);
        if (showText === 'away') {
          status = 'away';
        } else if (showText === 'chat') {
          status = 'available';
        } else if (showText === 'dnd') {
          status = 'dnd';  // No molestar
        } else if (showText === 'xa') {
          status = 'xa';  // Ausencia extendida
        }
      }

      // Actualizar el estado del contacto en el roster
      this.roster.forEach(contact => {
        if (contact.jid === Strophe.getBareJidFromJid(from)) {
          contact.status = status;
          console.log(`Estado de ${contact.jid} actualizado a: ${status}`);
        }
      });

      return true;  // Continuar escuchando presencias
    }, null, 'presence');
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












  disconnect() {
    if (this.connection) {
      console.log('Desconectando...');
      this.connection.disconnect();
    }
  }

  deleteAccount(jid: string, onSuccess: () => void, onError: (error: any) => void) {
    const iq = $iq({ type: 'set', to: jid })
      .c('query', { xmlns: 'jabber:iq:register' })
      .c('remove');

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

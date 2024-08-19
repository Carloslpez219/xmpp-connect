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

  // LOGIN
  connect(jid: string, password: string, onConnect: (status: number) => void) {
    console.log('Iniciando conexión...');
    this.connection.connect(jid, password, (status: number) => {
      console.log('Estado de conexión:', status);
      if (status === Strophe.Status.CONNECTED) {
        this.fetchRoster(); // Llamar a fetchRoster al conectarse
        this.listenForPresence(); // Escuchar presencia después de la conexión
      }
      onConnect(status);
    });
  }

  // REGISTRO
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

  // CONTACTOS Y PRESENCIA

  // Reemplaza getRoster y listenForPresence con fetchRoster y handlePresence
  fetchRoster() {
    const rosterIQ = $iq({ type: "get" }).c("query", { xmlns: "jabber:iq:roster" });

    this.connection.sendIQ(rosterIQ, (iq: any) => {
      console.log("Roster recibido:", iq);
      const contacts: any = {};
      const items = iq.getElementsByTagName("item");
      for (let i = 0; i < items.length; i++) {
        const jid = items[i].getAttribute("jid");
        contacts[jid] = jid in this.roster ? this.roster[jid] : { jid, status: "offline" };
        this.sendPresenceProbe(jid); // Enviar probe de presencia a cada contacto
      }
      this.roster = contacts;
      this.onRosterReceived({ ...this.roster }); // Actualizar el estado del roster
    });
  }

  handlePresence(presence: any) {
    console.log("Stanza de presencia recibida:", presence);
    const fullJid = presence.getAttribute("from");
    const from = Strophe.getBareJidFromJid(fullJid); // Normalizar a bare JID
    const type = presence.getAttribute("type");
    let status = "";

    if (type === "unavailable") {
      status = "offline";
    } else {
      status = presence.getElementsByTagName("show")[0]?.textContent || "online";
    }

    this.roster[from] = { jid: from, status }; // Actualizar el estado del contacto
    this.onRosterReceived({ ...this.roster }); // Actualizar el estado del roster

    return true; // Continuar escuchando presencias
  }

  sendPresenceProbe(jid: string) {
    const probe = $pres({ type: "probe", to: jid });
    this.connection.send(probe.tree());
  }

  listenForPresence() {
    this.connection.addHandler(this.handlePresence.bind(this), null, 'presence');
  }

  onRosterReceived(roster: any) {
    console.log("Roster actualizado con estados de presencia:", roster);
    // Aquí puedes agregar la lógica para actualizar la UI o notificar a otros componentes
  }

  // ENVÍO DE MENSAJES
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

  // DESCONEXIÓN
  disconnect() {
    if (this.connection) {
      console.log('Desconectando...');
      this.connection.disconnect();
    }
  }

  // ELIMINAR CUENTA
  deleteAccount(jid: string, onSuccess: () => void, onError: (error: any) => void) {
    const iq = $iq({ type: 'set', to: jid })
      .c('query', { xmlns: 'jabber:iq:register' })
      .c('remove');

    this.connection.sendIQ(iq, onSuccess, onError);
  }

  // AÑADIR CONTACTOS
  addContact(jid: string, name: string, groups: string[], onSuccess: () => void, onError: (error: any) => void) {
    const iq = $iq({ type: 'set' })
      .c('query', { xmlns: 'jabber:iq:roster' })
      .c('item', { jid, name })
      .c('group').t(groups.join(','));

    this.connection.sendIQ(iq, onSuccess, onError);
  }

  // ENVIAR PRESENCIA
  sendPresence(presence: string) {
    const pres = $pres().c('show').t(presence);
    this.connection.send(pres);
  }

  // ENTRAR A UN CHAT DE GRUPO
  joinGroupChat(roomJid: string, nickname: string) {
    const presence = $pres({ to: `${roomJid}/${nickname}` })
      .c('x', { xmlns: 'http://jabber.org/protocol/muc' });

    this.connection.send(presence);
  }

  // SUBIR ARCHIVO
  sendFile(to: string, file: File) {
    // Aquí puedes implementar la lógica para enviar archivos utilizando HTTP Upload o cualquier otra extensión XMPP adecuada
  }

  // RECIBIR NOTIFICACIONES
  receiveNotifications(handler: (msg: any) => boolean) {
    this.connection.addHandler(handler, null, 'message', 'headline');
  }

  // DESCUBRIR SERVICIOS
  discoverServices(onSuccess: (stanza: any) => void, onError: (error: any) => void) {
    const iq = $iq({ type: 'get', to: this.connection.domain })
      .c('query', { xmlns: 'http://jabber.org/protocol/disco#items' });

    this.connection.sendIQ(iq, onSuccess, onError);
  }

}

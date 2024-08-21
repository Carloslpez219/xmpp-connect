import { Injectable } from '@angular/core';
import { AlertService } from './alert.service';
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

  constructor(private alertService: AlertService) {
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

  fetchRoster() {
    const rosterIQ = $iq({ type: "get" }).c("query", { xmlns: "jabber:iq:roster" });

    this.connection.sendIQ(rosterIQ, (iq: any) => {
        console.log("Roster recibido:", iq);
        const contacts: any = {};
        const items = iq.getElementsByTagName("item");
        for (let i = 0; i < items.length; i++) {
            const jid = items[i].getAttribute("jid");
            const subscription = items[i].getAttribute("subscription");

            // Solo incluir contactos con suscripción "both" o "from"
            if (subscription === "both" || subscription === "from") {
                contacts[jid] = jid in this.roster ? this.roster[jid] : { jid, status: "offline" };
                this.sendPresenceProbe(jid);
            }
        }
        this.roster = contacts;
        this.onRosterReceived({ ...this.roster });
    });
}

  handlePresence(presence: any) {
    console.log("Stanza de presencia recibida:", presence);
    const fullJid = presence.getAttribute("from");
    const from = Strophe.getBareJidFromJid(fullJid);
    const type = presence.getAttribute("type");
    let status = "";

    if (type === "unavailable") {
      status = "offline";
    } else {
      status = presence.getElementsByTagName("show")[0]?.textContent || "online";
    }

    this.roster[from] = { jid: from, status };
    this.onRosterReceived({ ...this.roster });

    return true;
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
  deleteAccount(onSuccess: () => void, onError: (error: any) => void) {
    try {
      const iq = $iq({
        type: 'set',
        id: 'delete1',
        to: this.connection.domain
      }).c('query', { xmlns: 'jabber:iq:register' })
        .c('remove');
        
      this.connection.sendIQ(iq, (result: any) => {
        console.log('Cuenta eliminada exitosamente');
        onSuccess();
      }, (error: any) => {
        console.error('Error al eliminar la cuenta:', error);
        onError(error);
      });
    } catch (error) {
      console.error('Error inesperado al intentar eliminar la cuenta:', error);
      onError(error);
    }
  }
  

  // AÑADIR CONTACTOS
  addContact(jid: string, onSuccess: () => void, onError: (error: any) => void) {
    const presence = $pres({
        to: jid,
        type: 'subscribe'
    });

    this.connection.send(presence, () => {
        console.log('Solicitud de suscripción enviada a:', jid);
        this.alertService.presentToast(`Solicitud de suscripción enviada a: ${jid} .`, 'success', 5000);
        onSuccess();
    }, (error: any) => {
        console.error('Error al enviar solicitud de suscripción:', error);
        onError(error);
    });
}

private addToRoster(jid: string) {
  const iq = $iq({ type: 'set' })
    .c('query', { xmlns: 'jabber:iq:roster' })
    .c('item', { jid, name: jid });

  this.connection.sendIQ(iq, () => {
      console.log(`Contacto ${jid} agregado al roster.`);
  }, (error: any) => {
      console.error('Error al agregar el contacto al roster:', error);
  });
}

listenForSubscriptionRequests() {
  this.connection.addHandler((presence: any) => {
      console.log('Presence stanza received:', presence); // Log para depuración
      const from = presence.getAttribute('from');
      const type = presence.getAttribute('type');

      console.log(`From: ${from}, Type: ${type}`); // Log adicional para verificar valores

      if (type === 'subscribe') {
          console.log('Solicitud de suscripción recibida de:', from);
          
          this.alertService.presentAlertButtons(
            'Solicitud de amistad',
            'Solicitud de suscripción recibida de: ' + from,
            () => this.acceptSubscription(from),
            () => this.rejectSubscription(from)
          );          

      } else if (type === 'subscribed') {
          this.alertService.presentToast(`${from} ha aceptado tu solicitud de suscripción.`, 'success', 5000);
          console.log(`${from} ha aceptado tu solicitud de suscripción.`);
          this.addToRoster(from);
      } else if (type === 'unsubscribed') {
          this.alertService.presentToast(`${from} ha rechazado tu solicitud de suscripción.`, 'danger', 5000);
          console.log(`${from} ha rechazado tu solicitud de suscripción.`);
      } else {
          console.log(`Tipo de presencia no manejado: ${type}`); // Manejo de otros tipos de presencia
      }

      return true; 
  }, null, 'presence');
}


acceptSubscription(jid: string) {
  const presence = $pres({
    to: jid,
    type: 'subscribed'
  });
  this.connection.send(presence);
  console.log(`Solicitud de suscripción aceptada de: ${jid}`);
  
  this.sendSubscriptionRequest(jid);
}

rejectSubscription(jid: string) {
  const presence = $pres({
      to: jid,
      type: 'unsubscribed'
  });
  this.connection.send(presence);
  console.log(`Solicitud de suscripción rechazada de: ${jid}`);
}


sendSubscriptionRequest(jid: string) {
  const presence = $pres({
    to: jid,
    type: 'subscribe'
  });
  this.connection.send(presence);
  console.log(`Solicitud de suscripción enviada a: ${jid}`);
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

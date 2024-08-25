import { Injectable } from '@angular/core';
import { AlertService } from './alert.service';
import { BehaviorSubject } from 'rxjs';

declare const Strophe: any;
declare const $iq: any;
declare const $msg: any;
declare const $pres: any;

@Injectable({
  providedIn: 'root'
})
export class XmppService {
  static PRESENCE_TYPES = {
    SUBSCRIBE: "subscribe",
    SUBSCRIBED: "subscribed",
    UNSUBSCRIBE: "unsubscribe",
    UNSUBSCRIBED: "unsubscribed",
    UNAVAILABLE: "unavailable",
  };

  private connection: any;

  roster: { [jid: string]: any } = {}; 
  private rosterSubject = new BehaviorSubject<any>({});
  roster$ = this.rosterSubject.asObservable();

  private messagesHistory: { [jid: string]: { message: string, type: string, timestamp: string }[] } = {};
  private messagesSubject = new BehaviorSubject<{ [jid: string]: { message: string, type: string, timestamp: string }[] }>({});
  messages$ = this.messagesSubject.asObservable();



  private subscriptionQueue: string[] = [];
  public jid: string = "";
  private status: string = "online";
  private statusMessage: string = "Available";

  private onRosterReceivedCallback: (roster: any) => void = () => {};
  private onSubscriptionReceivedCallback: (subscriptions: string[]) => void = () => {};

  constructor(private alertService: AlertService) {}

  connect(jid: string, password: string, onConnect: (status: number) => void) {
    this.connection = new Strophe.Connection('ws://alumchat.lol:7070/ws/');
    this.connection.addHandler(this.handlePresence.bind(this), null, 'presence');
    this.connection.addHandler(this.handleMessage.bind(this), null, 'message', 'chat');

    this.connection.connect(jid, password, (status: number) => {
      if (status === Strophe.Status.CONNECTED) {
        this.jid = jid;
        this.sendPresence(this.status, this.statusMessage);
        this.fetchRoster();
        onConnect(status);
      } else if (status === Strophe.Status.AUTHFAIL) {
        console.error("Authentication failed");
      } else {
        onConnect(status);
      }
    });
  }

  sendPresence(show: string, statusMessage: string) {
    const presence = show === "offline"
      ? $pres({ type: "unavailable" })
      : $pres().c("show").t(show).up().c("status").t(statusMessage);

    this.connection.send(presence.tree());
    console.log(`Status updated to: ${show}, message: ${statusMessage}`);

    this.status = show;
    this.statusMessage = statusMessage;
  }

  updateStatus(show: string, statusMessage: string) {
    this.sendPresence(show, statusMessage);
  }

  sendMessage(to: string, body: string) {
    if (!this.connection || !this.connection.connected) {
      console.error("No hay conexión establecida.");
      return;
    }
  
    const message = $msg({ to, type: "chat" })
        .c("body")
        .t(body);
  
    this.connection.send(message.tree());
    this.addMessageToHistory(to, body, 'sent');
    console.log(`Mensaje enviado a ${to}: ${body}`);
  }

  handleMessage(message: any) {
    const from = message.getAttribute('from');
    const bodyElements = message.getElementsByTagName('body');
  
    if (bodyElements.length > 0) {
      const body = bodyElements[0].textContent;
      console.log(`Mensaje recibido de ${from}: ${body}`);
      this.addMessageToHistory(from, body, 'received');
    }
  
    return true;
  }
  
  

  private addMessageToHistory(jid: string, message: string, type: string) {
    const bareJid = jid.split('/')[0];
    const timestamp = new Date().toISOString();
  
    if (!this.messagesHistory[bareJid]) {
      this.messagesHistory[bareJid] = [];
    }
  
    this.messagesHistory[bareJid].push({ message, type, timestamp });
    this.messagesSubject.next({ ...this.messagesHistory });
  }
  

fetchMessageHistory(jid: string) {
  return this.messagesHistory[jid] || [];
}



  signup(username: string, fullName: string, email: string, password: string, onSuccess: () => void, onError: (error: any) => void) {
    const anonymousJid = "lop21666@alumchat.lol"; 
    const anonymousPassword = "123456"; 

    this.connection.connect(anonymousJid, anonymousPassword, (status: number) => {
      if (status === Strophe.Status.CONNECTED) {
        console.log("Connected to XMPP server for registration");

        const registerIQ = $iq({ type: "set", to: "alumchat.lol" })
          .c("query", { xmlns: "jabber:iq:register" })
          .c("username").t(username).up()
          .c("password").t(password).up()
          .c("fullname").t(fullName).up()
          .c("email").t(email);

        this.connection.sendIQ(registerIQ, (iq: any) => {
          console.log("Registration successful", iq);
          this.connection.disconnect();
          onSuccess();
        }, (error: any) => {
          console.error("Registration failed", error);
          this.connection.disconnect();
          onError(error);
        });
      } else if (status === Strophe.Status.CONNFAIL) {
        console.error("Connection to XMPP server failed");
        onError(new Error("Failed to connect to XMPP server"));
      }
    });
  }

  fetchRoster() {
    const rosterIQ = $iq({ type: "get" }).c("query", { xmlns: "jabber:iq:roster" });

    this.connection.sendIQ(rosterIQ, (iq: any) => {
        console.log("Roster recibido:", iq);
        let contacts: any = {};
        const items = iq.getElementsByTagName("item");

        for (let i = 0; i < items.length; i++) {
            const jid = items[i].getAttribute("jid");
            if (!jid) {
                console.warn("Se encontró un item sin jid, ignorando...");
                continue; // Ignorar items sin jid
            }

            const subscription = items[i].getAttribute("subscription");

            if (subscription === "both" || subscription === "from") {
                contacts[jid] = { jid, status: "offline", statusMessage: "Loading..." };
                this.sendPresenceProbe(jid);
            }
        }
        
        // Limpieza y actualización del roster
        contacts = Object.keys(contacts).reduce((result: any, key: string) => {
            if (key) {
                result[key] = contacts[key];
            }
            return result;
        }, {});

        this.roster = contacts;
        this.rosterSubject.next({ ...this.roster });
    });
}

  

  handlePresence(presence: any) {
    console.log("Presence stanza received:", presence);
  
    const fullJid = presence.getAttribute("from");
    const from = Strophe.getBareJidFromJid(fullJid);
    const type = presence.getAttribute("type");

    if (this.jid !== from) {  // Evitar manejar la presencia de uno mismo
        switch (type) {
            case XmppService.PRESENCE_TYPES.SUBSCRIBE:
                this.handleSubscriptionRequest(from);
                break;
            case XmppService.PRESENCE_TYPES.SUBSCRIBED:
                console.log(`${from} accepted your subscription request`);
                break;
            case XmppService.PRESENCE_TYPES.UNSUBSCRIBED:
                delete this.roster[from];
                break;
            case XmppService.PRESENCE_TYPES.UNAVAILABLE:
                this.roster[from] = { ...this.roster[from], status: "offline", statusMessage: "" };
                break;
            default:
                const status = presence.getElementsByTagName("show")[0]?.textContent || "online";
                const statusMessage = presence.getElementsByTagName("status")[0]?.textContent || "Available";
                this.roster[from] = { 
                    ...this.roster[from], 
                    status: status || "unknown", 
                    statusMessage: statusMessage 
                };
                console.log(`Updating status of ${from} to ${status}`);
        }
        this.rosterSubject.next({ ...this.roster });
    }

    return true;
}

  

  handleSubscriptionRequest(from: string) {
    if (!(from in this.roster)) {
      console.log(`Subscription request from ${from} received`);

      this.alertService.presentAlertButtons(
        'Solicitud de suscripción',
        `¿Deseas aceptar la solicitud de suscripción de ${from}?`,
        () => this.acceptSubscription(from),
        () => this.rejectSubscription(from) 
      );
      
      this.subscriptionQueue.push(from);
      this.onSubscriptionReceivedCallback([...this.subscriptionQueue]);
    } else {
      console.log(`Subscription request from ${from} already accepted`);
      this.acceptSubscription(from);
    }
}




  fetchSubscriptionRequests(onFetchSubscriptions: (subscriptions: string[]) => void) {
    onFetchSubscriptions([...this.subscriptionQueue]);
  }

  sendPresenceProbe(jid: string) {
    const probe = $pres({ type: "probe", to: jid });
    this.connection.send(probe.tree());
  }

  cleanClientValues() {
    this.roster = {};
    this.subscriptionQueue = [];
    this.onRosterReceivedCallback = () => {};
    this.onSubscriptionReceivedCallback = () => {};
    this.jid = "";
    this.status = "online";
    this.statusMessage = "Available";
  }

  disconnect() {
    this.sendPresence("offline", "Disconnected");
    this.connection.disconnect();
    this.cleanClientValues();
    console.log("Disconnected from XMPP server");
  }

  
  acceptSubscription(from: string) {
    console.log(`Accepting subscription request from ${from}`);
    const acceptPresence = $pres({ to: from, type: "subscribed" });
    this.connection.send(acceptPresence.tree());

    // Enviar una solicitud de suscripción si aún no existe
    if (!(from in this.roster) || this.roster[from].status !== "both") {
        this.sendSubscriptionRequest(from);
    }

    // Actualizar el roster local
    this.roster[from] = { jid: from, status: "both", statusMessage: "Subscribed" };
    this.rosterSubject.next({ ...this.roster }); // Emitir el roster actualizado

    // Remover de la cola de solicitudes de suscripción pendientes
    this.subscriptionQueue = this.subscriptionQueue.filter(jid => jid !== from);
    this.onSubscriptionReceivedCallback([...this.subscriptionQueue]);
}

rejectSubscription(from: string) {
    console.log(`Rejecting subscription request from ${from}`);
    const rejectPresence = $pres({ to: from, type: "unsubscribed" });
    this.connection.send(rejectPresence.tree());
    
    // Remover de la cola de solicitudes de suscripción pendientes
    this.subscriptionQueue = this.subscriptionQueue.filter(jid => jid !== from);
    this.onSubscriptionReceivedCallback([...this.subscriptionQueue]);
}


  deleteAccount(onSuccess: () => void) {
    const deleteIQ = $iq({ type: "set", to: "alumchat.lol" })
      .c("query", { xmlns: "jabber:iq:register" })
      .c("remove");

    this.connection.sendIQ(deleteIQ, (iq: any) => {
      console.log("Account deletion successful", iq);
      onSuccess();
    }, (error: any) => {
      console.error("Account deletion failed", error);
    });
  }


  addContact(jid: string, onSuccess: () => void, onError: (error: any) => void) {
    // Enviar IQ para agregar el contacto al roster
    const addContactIQ = $iq({ type: "set" })
      .c("query", { xmlns: "jabber:iq:roster" })
      .c("item", { jid });

    this.connection.sendIQ(addContactIQ, (iq: any) => {
      console.log(`Contact ${jid} added successfully`, iq);

      // Aquí no se añade al roster local, solo se envía la solicitud de suscripción
      this.sendSubscriptionRequest(jid);

      onSuccess();
    }, (error: any) => {
      console.error(`Failed to add contact ${jid}`, error);
      onError(error);
    });
}

sendSubscriptionRequest(jid: string) {
    const presenceSubscribe = $pres({ to: jid, type: "subscribe" });
    this.connection.send(presenceSubscribe.tree());
    console.log(`Subscription request sent to ${jid}`);
}

}

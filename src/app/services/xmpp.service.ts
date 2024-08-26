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
    SUBSCRIBE: 'subscribe',
    SUBSCRIBED: 'subscribed',
    UNSUBSCRIBE: 'unsubscribe',
    UNSUBSCRIBED: 'unsubscribed',
    UNAVAILABLE: 'unavailable',
  };

  private connection: any; // La conexión XMPP
  roster: { [jid: string]: any } = {}; // Mapa de contactos
  private rosterSubject = new BehaviorSubject<any>({});
  roster$ = this.rosterSubject.asObservable(); // Observable para escuchar cambios en el roster

  private messagesHistory: { [jid: string]: { message: string, type: string, timestamp: string }[] } = {};
  private messagesSubject = new BehaviorSubject<{ [jid: string]: { message: string, type: string, timestamp: string }[] }>({});
  messages$ = this.messagesSubject.asObservable(); // Observable para escuchar mensajes

  private subscriptionQueue: string[] = []; // Cola de solicitudes de suscripción pendientes
  public jid: string = ''; // Identificador del usuario actual
  private status: string = 'online'; // Estado del usuario
  private statusMessage: string = 'Available'; // Mensaje de estado del usuario

  private onRosterReceivedCallback: (roster: any) => void = () => {};
  private onSubscriptionReceivedCallback: (subscriptions: string[]) => void = () => {};

  constructor(private alertService: AlertService) {}

  /**
   * Conecta al servidor XMPP con las credenciales proporcionadas.
   * @param jid Identificador del usuario.
   * @param password Contraseña del usuario.
   * @param onConnect Callback para manejar el estado de la conexión.
   */
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
        const message = 'Usuario y/o Contraseña son incorrectos';
        this.alertService.presentToast(message, 'danger', 3000);
      } else {
        onConnect(status);
      }
    });
  }

  /**
   * Envía una presencia al servidor para actualizar el estado del usuario.
   * @param show Estado de presencia (e.g., 'online', 'away').
   * @param statusMessage Mensaje de estado para mostrar.
   */
  sendPresence(show: string, statusMessage: string) {
    const presence = show === 'offline'
      ? $pres({ type: 'unavailable' })
      : $pres().c('show').t(show).up().c('status').t(statusMessage);

    this.connection.send(presence.tree());
    console.log(`Status updated to: ${show}, message: ${statusMessage}`);

    this.status = show;
    this.statusMessage = statusMessage;
  }

  /**
   * Actualiza el estado del usuario.
   * @param show Estado de presencia.
   * @param statusMessage Mensaje de estado.
   */
  updateStatus(show: string, statusMessage: string) {
    this.sendPresence(show, statusMessage);
  }

  /**
   * Envía un mensaje al contacto especificado.
   * @param to Identificador del destinatario.
   * @param body Contenido del mensaje.
   */
  sendMessage(to: string, body: string) {
    if (!this.connection || !this.connection.connected) {
      console.error('No hay conexión establecida.');
      return;
    }
  
    const message = $msg({ to, type: 'chat' })
        .c('body')
        .t(body);
  
    this.connection.send(message.tree());
    this.addMessageToHistory(to, body, 'sent');
    console.log(`Mensaje enviado a ${to}: ${body}`);
  }

  /**
   * Maneja la recepción de mensajes.
   * @param message Mensaje recibido.
   * @returns Verdadero para mantener el handler activo.
   */
  handleMessage(message: any) {
    const from = message.getAttribute('from');
    const bodyElements = message.getElementsByTagName('body');
    const fileElements = message.getElementsByTagName('file');
    const filenameElements = message.getElementsByTagName('filename');
  
    let body = '';
  
    if (bodyElements.length > 0) {
      body = bodyElements[0].textContent;
      this.alertService.presentToastMessage(`${from}: ${body}`, 'light', 3000);
    }
  
    if (fileElements.length > 0 && filenameElements.length > 0) {
      const base64Data = fileElements[0].textContent;
      const filename = filenameElements[0].textContent;
      
      // Crear un enlace de descarga
      const fileUrl = `data:application/octet-stream;base64,${base64Data}`;
      const downloadLink = `<a href="${fileUrl}" download="${filename}">Download ${filename}</a>`;
  
      // Agregar el enlace al cuerpo del mensaje
      body += `<br>${downloadLink}`;
      this.alertService.presentToastMessage(`${from}: ${body}`, 'light', 3000);
    }
  
    this.addMessageToHistory(from, body, 'received');
  
    return true;
  }
  
  
  /**
   * Agrega un mensaje a la historia de mensajes.
   * @param jid Identificador del contacto.
   * @param message Contenido del mensaje.
   * @param type Tipo de mensaje ('sent' o 'received').
   */
  private addMessageToHistory(jid: string, message: string, type: string) {
    const bareJid = jid.split('/')[0];
    const timestamp = new Date().toISOString();
  
    if (!this.messagesHistory[bareJid]) {
      this.messagesHistory[bareJid] = [];
    }
  
    this.messagesHistory[bareJid].push({ message, type, timestamp });
    this.messagesSubject.next({ ...this.messagesHistory });
  }
  
  /**
   * Obtiene el historial de mensajes para un contacto.
   * @param jid Identificador del contacto.
   * @returns Historia de mensajes para el contacto.
   */
  fetchMessageHistory(jid: string) {
    return this.messagesHistory[jid] || [];
  }

  /**
   * Registra un nuevo usuario en el servidor XMPP.
   * @param username Nombre de usuario.
   * @param fullName Nombre completo del usuario.
   * @param email Correo electrónico del usuario.
   * @param password Contraseña del usuario.
   * @param onSuccess Callback para manejar el éxito del registro.
   * @param onError Callback para manejar errores durante el registro.
   */
  signup(username: string, fullName: string, email: string, password: string, onSuccess: () => void, onError: (error: any) => void) {
    if (!this.connection) {
        this.connection = new Strophe.Connection('ws://alumchat.lol:7070/ws/');
    }

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
                if (error.getAttribute('code') === '409') {
                  this.alertService.presentToast('El nombre de usuario ya existe, por favor elige otro.', 'danger', 3000);
                } else {
                  this.alertService.presentToast('Fallo en el registro' + error, 'danger', 3000);
                }
                this.connection.disconnect();
                onError(error);
            });

        } else if (status === Strophe.Status.CONNFAIL) {
          this.alertService.presentToast("Fallo al conectar con el servidor XMPP", 'danger', 3000);
            onError(new Error("Fallo al conectar con el servidor XMPP"));
        }
    });
  }

  /**
   * Obtiene la lista de contactos del usuario.
   */
  fetchRoster() {
    const rosterIQ = $iq({ type: 'get' }).c('query', { xmlns: 'jabber:iq:roster' });

    this.connection.sendIQ(rosterIQ, (iq: any) => {
        console.log('Roster recibido:', iq);
        let contacts: any = {};
        const items = iq.getElementsByTagName('item');

        for (let i = 0; i < items.length; i++) {
            const jid = items[i].getAttribute('jid');
            if (!jid) {
                console.warn('Se encontró un item sin jid, ignorando...');
                continue; // Ignorar items sin jid
            }

            const subscription = items[i].getAttribute('subscription');

            if (subscription === 'both' || subscription === 'from') {
                contacts[jid] = { jid, status: 'offline', statusMessage: 'Loading...' };
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

  /**
   * Maneja la recepción de stanzas de presencia.
   * @param presence Stanza de presencia recibida.
   * @returns Verdadero para mantener el handler activo.
   */
  handlePresence(presence: any) {
    console.log('Presence stanza received:', presence);
  
    const fullJid = presence.getAttribute('from');
    const from = Strophe.getBareJidFromJid(fullJid);
    const type = presence.getAttribute('type');

    if (this.jid !== from) {  // Evitar manejar la presencia de uno mismo
        switch (type) {
            case XmppService.PRESENCE_TYPES.SUBSCRIBE:
                this.handleSubscriptionRequest(from);
                break;
            case XmppService.PRESENCE_TYPES.SUBSCRIBED:
              this.alertService.presentToast(`${from} accepted your subscription request`, 'light', 3000);
                break;
            case XmppService.PRESENCE_TYPES.UNSUBSCRIBED:
                delete this.roster[from];
                break;
            case XmppService.PRESENCE_TYPES.UNAVAILABLE:
                this.roster[from] = { ...this.roster[from], status: 'offline', statusMessage: '' };
                break;
            default:
                const status = presence.getElementsByTagName('show')[0]?.textContent || 'online';
                const statusMessage = presence.getElementsByTagName('status')[0]?.textContent || 'Available';
                this.roster[from] = { 
                    ...this.roster[from], 
                    status: status || 'unknown', 
                    statusMessage: statusMessage 
                };
                this.alertService.presentToast(`${from} : ${status}`, 'light', 3000);
                console.log(`Updating status of ${from} to ${status}`);
        }
        this.rosterSubject.next({ ...this.roster });
    }

    return true;
  }

  /**
   * Maneja una solicitud de suscripción de un contacto.
   * @param from Identificador del contacto que solicita la suscripción.
   */
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

  /**
   * Obtiene la lista de solicitudes de suscripción.
   * @param onFetchSubscriptions Callback para manejar las solicitudes de suscripción.
   */
  fetchSubscriptionRequests(onFetchSubscriptions: (subscriptions: string[]) => void) {
    onFetchSubscriptions([...this.subscriptionQueue]);
  }

  /**
   * Envía una solicitud de presencia para verificar la disponibilidad de un contacto.
   * @param jid Identificador del contacto.
   */
  sendPresenceProbe(jid: string) {
    const probe = $pres({ type: 'probe', to: jid });
    this.connection.send(probe.tree());
  }

  /**
   * Limpia los valores del cliente cuando se desconecta.
   */
  cleanClientValues() {
    this.roster = {};
    this.subscriptionQueue = [];
    this.onRosterReceivedCallback = () => {};
    this.onSubscriptionReceivedCallback = () => {};
    this.jid = '';
    this.status = 'online';
    this.statusMessage = 'Available';
  }

  /**
   * Desconecta del servidor XMPP y limpia los valores del cliente.
   */
  disconnect() {
    this.sendPresence('offline', 'Disconnected');
    this.connection.disconnect();
    this.cleanClientValues();
    console.log('Disconnected from XMPP server');
  }

  /**
   * Acepta una solicitud de suscripción de un contacto.
   * @param from Identificador del contacto.
   */
  acceptSubscription(from: string) {
    console.log(`Accepting subscription request from ${from}`);
    const acceptPresence = $pres({ to: from, type: 'subscribed' });
    this.connection.send(acceptPresence.tree());

    // Enviar una solicitud de suscripción si aún no existe
    if (!(from in this.roster) || this.roster[from].status !== 'both') {
        this.sendSubscriptionRequest(from);
    }

    // Actualizar el roster local
    this.roster[from] = { jid: from, status: 'both', statusMessage: 'Subscribed' };
    this.rosterSubject.next({ ...this.roster }); // Emitir el roster actualizado

    // Remover de la cola de solicitudes de suscripción pendientes
    this.subscriptionQueue = this.subscriptionQueue.filter(jid => jid !== from);
    this.onSubscriptionReceivedCallback([...this.subscriptionQueue]);
  }

  /**
   * Rechaza una solicitud de suscripción de un contacto.
   * @param from Identificador del contacto.
   */
  rejectSubscription(from: string) {
    console.log(`Rejecting subscription request from ${from}`);
    const rejectPresence = $pres({ to: from, type: 'unsubscribed' });
    this.connection.send(rejectPresence.tree());
    
    // Remover de la cola de solicitudes de suscripción pendientes
    this.subscriptionQueue = this.subscriptionQueue.filter(jid => jid !== from);
    this.onSubscriptionReceivedCallback([...this.subscriptionQueue]);
  }

  /**
   * Elimina la cuenta del usuario.
   * @param onSuccess Callback para manejar el éxito de la eliminación.
   */
  deleteAccount(onSuccess: () => void) {
    const deleteIQ = $iq({ type: 'set', to: 'alumchat.lol' })
      .c('query', { xmlns: 'jabber:iq:register' })
      .c('remove');

    this.connection.sendIQ(deleteIQ, (iq: any) => {
      this.alertService.presentToast('Account deletion successful', 'success', 3000);
      console.log('Account deletion successful', iq);
      onSuccess();
    }, (error: any) => {
      this.alertService.presentToast('Account deletion failed' + error, 'danger', 3000);
      console.error('Account deletion failed', error);
    });
  }

  /**
   * Agrega un contacto al roster del usuario.
   * @param jid Identificador del contacto.
   * @param onSuccess Callback para manejar el éxito de la adición.
   * @param onError Callback para manejar errores durante la adición.
   */
  addContact(jid: string, onSuccess: () => void, onError: (error: any) => void) {
    const addContactIQ = $iq({ type: 'set' })
      .c('query', { xmlns: 'jabber:iq:roster' })
      .c('item', { jid });

    this.connection.sendIQ(addContactIQ, (iq: any) => {
      console.log(`Contact ${jid} added successfully`, iq);
      // Aquí no se añade al roster local, solo se envía la solicitud de suscripción
      this.sendSubscriptionRequest(jid);

      onSuccess();
    }, (error: any) => {
      this.alertService.presentToast(`Failed to add contact ${jid}` + error, 'danger', 3000);
      console.error(`Failed to add contact ${jid}`, error);
      onError(error);
    });
  }

  /**
   * Envía una solicitud de suscripción a un contacto.
   * @param jid Identificador del contacto.
   */
  sendSubscriptionRequest(jid: string) {
    const presenceSubscribe = $pres({ to: jid, type: 'subscribe' });
    this.connection.send(presenceSubscribe.tree());
    
    this.alertService.presentToast(`Se envío solicitud de subscripción a ${jid}`, 'success', 3000);
    console.log(`Subscription request sent to ${jid}`);
  }

  /**
   * Envía un archivo al contacto especificado.
   * @param to Identificador del destinatario.
   * @param file Archivo a enviar.
   */
  sendFile(to: string, file: File) {
    if (!this.connection || !this.connection.connected) {
      console.error("No hay conexión establecida.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64Data = reader.result?.toString().split(',')[1];
      const fileName = file.name;

      const message = $msg({ to, type: "chat" })
        .c("body").t(`File: ${fileName}`).up()
        .c("file").t(base64Data).up()
        .c("filename").t(fileName);

      this.connection.send(message.tree());
      console.log(`Archivo enviado a ${to}: ${fileName}`);

      this.addMessageToHistory(to, `Archivo: ${fileName}`, 'sent');
    };

    reader.readAsDataURL(file);
  }
}

import { Component, inject, OnInit } from '@angular/core';
import { RefresherCustomEvent } from '@ionic/angular';
import { MessageComponent } from '../message/message.component';

import { DataService, Message } from '../services/data.service';
import { XmppService } from '../services/xmpp.service';

declare const Strophe: any;

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements OnInit{
  private data = inject(DataService);

  constructor(private xmppService: XmppService) { }

  ngOnInit() {
    // Intentar conectar al servidor sin autenticación
    // this.xmppService.connect('lop21666@alumchat.lol', '123456', this.onConnect.bind(this));
  }

  // onConnect(status: number) {
  //   console.log('Estado de conexión recibido en el componente:', status);
  //   if (status === Strophe.Status.CONNECTING) {
  //     console.log('Conectando...');
  //   } else if (status === Strophe.Status.CONNFAIL) {
  //     console.log('Falló la conexión');
  //   } else if (status === Strophe.Status.DISCONNECTING) {
  //     console.log('Desconectando...');
  //   } else if (status === Strophe.Status.DISCONNECTED) {
  //     console.log('Desconectado');
  //   } else if (status === Strophe.Status.CONNECTED) {
  //     console.log('Conectado');
  //     // Realizar el descubrimiento de servicios
  //     this.xmppService.discoverServices(this.onServicesDiscovered.bind(this), this.onError.bind(this));
      
  //     // Enviar un mensaje de prueba después de conectarse
  //     this.sendMessageToMor21116();
  //   }
  // }

  onServicesDiscovered(stanza: any) {
    console.log('Servicios descubiertos:', stanza);
  }

  onError(error: any) {
    console.error('Error:', error);
  }

  sendMessageToMor21116() {
    const recipient = 'ram21600@alumchat.lol';
    const message = 'Hola, este es un mensaje de prueba.';
    this.xmppService.sendMessage(recipient, message);
  }

  // Métodos adicionales para probar otras funcionalidades

  registerUser() {
    this.xmppService.register('nuevoUsuario', 'password', 'alumchat.lol', this.onRegisterSuccess.bind(this), this.onError.bind(this));
  }

  onRegisterSuccess() {
    console.log('Registro exitoso');
  }

  sendMessage() {
    this.xmppService.sendMessage('destinatario@alumchat.lol', 'Hola, ¿cómo estás?');
    console.log('Mensaje enviado');
  }

  getRoster() {
    this.xmppService.getRoster(this.onRosterReceived.bind(this), this.onError.bind(this));
  }

  onRosterReceived(roster: any) {
    console.log('Roster recibido:', roster);
  }




  refresh(ev: any) {
    setTimeout(() => {
      (ev as RefresherCustomEvent).detail.complete();
    }, 3000);
  }

  getMessages(): Message[] {
    return this.data.getMessages();
  }
}

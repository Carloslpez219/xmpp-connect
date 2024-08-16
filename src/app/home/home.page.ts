import { Component, inject, OnInit } from '@angular/core';
import { LoadingController, RefresherCustomEvent } from '@ionic/angular';
import { MessageComponent } from '../message/message.component';

import { DataService, Message } from '../services/data.service';
import { XmppService } from '../services/xmpp.service';
import { Storage } from '@ionic/storage-angular';

declare const Strophe: any;

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements OnInit{
  private data = inject(DataService);
  contacts: any[] = [];

  constructor(private xmppService: XmppService, private storage: Storage, private loadingController: LoadingController) { this.storage.create(); }

  async ngOnInit() {
    this.presentLoading();
    const datosUsuario = await this.storage.get('datos');
    console.log(datosUsuario)
    this.xmppService.connect(datosUsuario.email, datosUsuario.password, this.onConnect.bind(this));
  }

  async presentLoading() {
    const loading = await this.loadingController.create({
      message: 'Cargando...'
    });
    await loading.present();
  }

async onConnect(status: number) {
    console.log('Estado de conexión recibido en el componente:', status);
    if (status === Strophe.Status.CONNECTING) {
      console.log('Conectando...');
    } else if (status === Strophe.Status.CONNFAIL) {
      console.log('Falló la conexión');
      this.storage.clear();
      await this.loadingController.dismiss();
    } else if (status === Strophe.Status.DISCONNECTING) {
      console.log('Desconectando...');
    } else if (status === Strophe.Status.DISCONNECTED) {
      console.log('Desconectado');
    } else if (status === Strophe.Status.CONNECTED) {
      console.log('Conectado');
      this.xmppService.getRoster((roster: any[]) => {
        this.contacts = roster;
        console.log('Lista de contactos:', this.contacts);
      }, this.onError.bind(this));
      await this.loadingController.dismiss();
    }
  }

  onServicesDiscovered(stanza: any) {
    console.log('Servicios descubiertos:', stanza);
  }

  onError(error: any) {
    console.error('Error:', error);
  }

  refresh(ev: any) {
    setTimeout(() => {
      (ev as RefresherCustomEvent).detail.complete();
    }, 3000);
  }

  // Métodos adicionales para probar otras funcionalidades


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



  getMessages(): Message[] {
    return this.data.getMessages();
  }
}

import { Component, inject, OnInit } from '@angular/core';
import { LoadingController, RefresherCustomEvent } from '@ionic/angular';
import { DataService, Message } from '../services/data.service';
import { XmppService } from '../services/xmpp.service';
import { Storage } from '@ionic/storage-angular';

declare const Strophe: any;

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements OnInit {
  private data = inject(DataService);
  contacts: any[] = [];

  constructor(private xmppService: XmppService, private storage: Storage, private loadingController: LoadingController) {
    this.storage.create();
  }

  async ngOnInit() {
    this.presentLoading();
    const datosUsuario = await this.storage.get('datos');
    console.log(datosUsuario);
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
      this.xmppService.onRosterReceived = this.onRosterReceived.bind(this); // Vincular la función onRosterReceived
      await this.loadingController.dismiss();
    }
  }

  onRosterReceived(roster: any) {
    this.contacts = Object.values(roster); // Convertir el roster en un array de contactos
    console.log('Lista de contactos actualizada:', this.contacts);
  }

  onError(error: any) {
    console.error('Error:', error);
  }

  refresh(ev: any) {
    setTimeout(() => {
      (ev as RefresherCustomEvent).detail.complete();
    }, 3000);
  }

  sendMessage() {
    this.xmppService.sendMessage('destinatario@alumchat.lol', 'Hola, ¿cómo estás?');
    console.log('Mensaje enviado');
  }

  getMessages(): Message[] {
    return this.data.getMessages();
  }
}

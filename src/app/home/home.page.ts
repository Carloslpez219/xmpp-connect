import { Component, inject, OnInit } from '@angular/core';
import { AlertController, LoadingController, ModalController, RefresherCustomEvent } from '@ionic/angular';
import { DataService, Message } from '../services/data.service';
import { XmppService } from '../services/xmpp.service';
import { Storage } from '@ionic/storage-angular';
import { AddContactPage } from '../add-contact/add-contact.page';
import { Router } from '@angular/router';

declare const Strophe: any;

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements OnInit {
  contacts: any[] = [];
  isModalOpen = false;

  constructor(private xmppService: XmppService, private storage: Storage, private loadingController: LoadingController,
    private modalController: ModalController, private alertController: AlertController, private router: Router
  ) {
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
    
    switch (status) {
      case Strophe.Status.CONNECTING:
        console.log('Conectando...');
        break;
      case Strophe.Status.CONNFAIL:
        console.log('Falló la conexión');
        await this.loadingController.dismiss();
        this.storage.clear();
        break;
      case Strophe.Status.DISCONNECTING:
        console.log('Desconectando...');
        break;
      case Strophe.Status.DISCONNECTED:
        console.log('Desconectado');
        break;
      case Strophe.Status.CONNECTED:
        console.log('Conectado');
        this.xmppService.onRosterReceived = this.onRosterReceived.bind(this);
        this.xmppService.listenForSubscriptionRequests();
        await this.loadingController.dismiss();
        break;
      default:
        console.log(`Estado no manejado: ${status}`); // Manejo de cualquier estado inesperado
        break;
    }
  }
  

  onRosterReceived(roster: any) {
    this.contacts = Object.values(roster);
    console.log('Lista de contactos actualizada:', this.contacts);
  }

  onError(error: any) {
    console.error('Error:', error);
    this.loadingController.dismiss()
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

  
  async openAddContactModal() {
    const modal = await this.modalController.create({
      component: AddContactPage,
    });

    await modal.present();

    const value: any = await modal.onDidDismiss();
    console.log(value)
    if(value.data){
      this.addContact(value.data)
    }

    
  }

  addContact(email: string) {
    if (this.isValidJid(email.trim())) {
        const jid = email.trim();
        this.xmppService.addContact(jid, () => {
            console.log('Solicitud de suscripción enviada:', jid);
            // Aquí puedes mostrar un mensaje que la solicitud ha sido enviada
        }, this.onError.bind(this));
    } else {
        console.error('El email proporcionado no es un JID válido.');
    }
  }

  isValidJid(jid: string): boolean {
    const jidPattern = /^[^@]+@[^@]+\.[^@]+$/;
    return jidPattern.test(jid);
  }

  async deleteAccount() {
    const alert = await this.alertController.create({
      header: 'Eliminar Cuenta',
      message: '¿Estás seguro de que deseas eliminar tu cuenta? Esta acción no se puede deshacer.',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
          handler: () => {
            console.log('Eliminación de cuenta cancelada');
          }
        },
        {
          text: 'Eliminar',
          handler: () => {
            this.xmppService.deleteAccount(() => {
              console.log('Cuenta eliminada exitosamente');
              this.logOut();
            }, this.onError.bind(this));
          }
        }
      ]
    });
  
    await alert.present();
  }

  logOut(){
    this.storage.clear();
    this.router.navigateByUrl('/login');
  }
  


}

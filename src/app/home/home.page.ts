import { Component, inject, OnInit } from '@angular/core';
import { AlertController, LoadingController, ModalController, RefresherCustomEvent } from '@ionic/angular';
import { XmppService } from '../services/xmpp.service';
import { Storage } from '@ionic/storage-angular';
import { AddContactPage } from '../add-contact/add-contact.page';
import { Router } from '@angular/router';
import { AddContactsPage } from '../add-contacts/add-contacts.page';
import { PrecenseModalPage } from '../precense-modal/precense-modal.page';

declare const Strophe: any;

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements OnInit {
  roster: any = {};
  rosterArray: any[] = [];
  isModalOpen = false;
  selectedGroupJid: string = '';

  constructor(private xmppService: XmppService, private storage: Storage, private loadingController: LoadingController,
    private modalController: ModalController, private alertController: AlertController, private router: Router
  ) {
    this.storage.create();
  }

  async ngOnInit() {
    this.xmppService.roster$.subscribe(roster => {
      this.roster = roster;
      this.rosterArray = Object.values(this.roster);
      console.log(this.rosterArray)
    });
  }

  async presentLoading() {
    const loading = await this.loadingController.create({
      message: 'Cargando...'
    });
    await loading.present();
  }


  onError(error: any) {
    console.error('Error:', error);
    this.loadingController.dismiss();
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
    if(value.data){
      this.addContact(value.data);
    }
  }

  addContact(email: string) {
    if (this.isValidJid(email.trim())) {
        const jid = email.trim();
        this.xmppService.addContact(jid, () => {
            console.log('Solicitud de suscripción enviada:', jid);
        }, this.onError.bind(this));
    } else {
        console.error('El email proporcionado no es un JID válido.');
    }
  }

  isValidJid(jid: string): boolean {
    const jidPattern = /^[^@]+@[^@]+\.[^@]+$/;
    return jidPattern.test(jid);
  }

  
  async openAddGroupModal() {
    const modal = await this.modalController.create({
      component: AddContactsPage,
    });

    await modal.present();

    const { data } = await modal.onDidDismiss();
    if (data) {
      const { groupJid, contacts } = data;
      // contacts.forEach((jid: string) => {
      //   this.xmppService.inviteToGroup(groupJid, jid);
      // });
    }
  }


  createNewGroup() {
    const roomJid = `grupo${new Date().getTime()}@conference.alumchat.lol`;  // Generar un JID único para el grupo
    const nickname = 'your_nickname';  // Sustituye con el nickname deseado

    // this.xmppService.createGroupChat(roomJid, nickname);
    this.selectedGroupJid = roomJid;
    this.openAddGroupModal();
  }

  async openPresenceModal() {
    const modal = await this.modalController.create({
      component: PrecenseModalPage
    });
    return await modal.present();
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
            })
          }
        }
      ]
    });
  
    await alert.present();
  }

  logOut() {
    this.storage.clear();
    this.router.navigateByUrl('/login');
  }
}

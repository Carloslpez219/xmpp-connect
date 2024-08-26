import { Component, inject, OnInit } from '@angular/core';
import { AlertController, LoadingController, ModalController, RefresherCustomEvent } from '@ionic/angular';
import { XmppService } from '../services/xmpp.service';
import { Storage } from '@ionic/storage-angular';
import { AddContactPage } from '../add-contact/add-contact.page';
import { Router } from '@angular/router';
import { AddContactsPage } from '../add-contacts/add-contacts.page';
import { PrecenseModalPage } from '../precense-modal/precense-modal.page';
import { AlertService } from '../services/alert.service';

declare const Strophe: any;

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements OnInit {
  roster: any = {}; // Almacena el roster de contactos
  rosterArray: any[] = []; // Almacena el roster convertido en array
  isModalOpen = false; // Indica si un modal está abierto
  selectedGroupJid: string = ''; // Almacena el JID del grupo seleccionado

  constructor(private xmppService: XmppService, private storage: Storage, private loadingController: LoadingController,
    private modalController: ModalController, private alertController: AlertController, private router: Router, private alertService: AlertService
  ) {
    // Inicializa el almacenamiento al crear el componente
    this.storage.create();
  }

  async ngOnInit() {
    // Suscribe al observable del roster y convierte el objeto en un array
    this.xmppService.roster$.subscribe(roster => {
      this.roster = roster;
      this.rosterArray = Object.values(this.roster);
    });
  }

  async presentLoading() {
    // Muestra un mensaje de carga mientras se espera una operación
    const loading = await this.loadingController.create({
      message: 'Cargando...'
    });
    await loading.present();
  }

  onError(error: any) {
    // Maneja errores y oculta el mensaje de carga si ocurre un error
    console.error('Error:', error);
    this.loadingController.dismiss();
  }
  
  async openAddContactModal() {
    // Abre el modal para agregar un nuevo contacto
    const modal = await this.modalController.create({
      component: AddContactPage,
    });

    await modal.present();

    // Espera a que el modal se cierre y maneja el dato recibido
    const value: any = await modal.onDidDismiss();
    if (value.data) {
      this.addContact(value.data);
    }
  }

  addContact(email: string) {
    // Añade un contacto si el JID es válido
    if (this.isValidJid(email.trim())) {
        const jid = email.trim();
        this.xmppService.addContact(jid, () => {
          this.alertService.presentToast('Solicitud de suscripción enviada: ' + jid, 'success', 3000);
        }, this.onError.bind(this));
    } else {
      this.alertService.presentToast('El email proporcionado no es un JID válido.', 'danger', 3000);
    }
  }

  isValidJid(jid: string): boolean {
    // Verifica si el JID tiene un formato válido
    const jidPattern = /^[^@]+@[^@]+\.[^@]+$/;
    return jidPattern.test(jid);
  }

  async openAddGroupModal() {
    // Abre el modal para agregar un nuevo grupo
    const modal = await this.modalController.create({
      component: AddContactsPage,
    });

    await modal.present();

    // Espera a que el modal se cierre y maneja los datos recibidos
    const { data } = await modal.onDidDismiss();
    if (data) {
      const { groupJid, contacts } = data;
      // Aquí puedes agregar contactos al grupo
      // contacts.forEach((jid: string) => {
      //   this.xmppService.inviteToGroup(groupJid, jid);
      // });
    }
  }

  createNewGroup() {
    // Crea un nuevo grupo con un JID único y abre el modal para agregar contactos
    const roomJid = `grupo${new Date().getTime()}@conference.alumchat.lol`;  // Generar un JID único para el grupo
    const nickname = 'your_nickname';  // Sustituye con el nickname deseado

    // this.xmppService.createGroupChat(roomJid, nickname);
    this.selectedGroupJid = roomJid;
    this.openAddGroupModal();
  }

  async openPresenceModal() {
    // Abre el modal para mostrar la presencia de los contactos
    const modal = await this.modalController.create({
      component: PrecenseModalPage
    });
    return await modal.present();
  }

  async deleteAccount() {
    // Muestra una alerta para confirmar la eliminación de la cuenta
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
            // Elimina la cuenta y cierra sesión
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
    // Limpia el almacenamiento y redirige al usuario a la página de inicio de sesión
    this.storage.clear();
    this.router.navigateByUrl('/login');
    this.xmppService.disconnect();
  }
}

import { Component, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { XmppService } from '../services/xmpp.service';

@Component({
  selector: 'app-contact-details',
  templateUrl: './contact-details.page.html',
  styleUrls: ['./contact-details.page.scss'],
})
export class ContactDetailsPage implements OnInit {

  
  contactJid: string = '';
  contactName: string = 'Cargando...';
  contactStatus: string = 'offline';
  contactStatusMessage: string = 'Cargando...';

  constructor(private modalController: ModalController, private xmppService: XmppService) {}

  ngOnInit() {
    this.loadContactDetails(this.contactJid);
  }

  close() {
    this.modalController.dismiss();
  }

  loadContactDetails(jid: string) {
    const contact = this.xmppService.roster[jid];
    if (contact) {
      this.contactName = contact.name || 'Nombre no disponible';
      this.contactStatus = contact.status || 'offline';
      this.contactStatusMessage = contact.statusMessage || 'Sin mensaje de estado';
    } else {
      console.error('Contacto no encontrado en el roster.');
      this.contactName = 'Desconocido';
      this.contactStatus = 'offline';
      this.contactStatusMessage = 'Sin información disponible';
    }
  }

}

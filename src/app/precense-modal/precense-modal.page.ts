import { Component, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { XmppService } from '../services/xmpp.service';

@Component({
  selector: 'app-precense-modal',
  templateUrl: './precense-modal.page.html',
  styleUrls: ['./precense-modal.page.scss'],
})
export class PrecenseModalPage implements OnInit {

  sessionName: string = 'Usuario';
  sessionJid: string = '';
  selectedStatus: string = 'online';
  statusMessage: string = '';

  constructor(private modalController: ModalController, private xmppService: XmppService) {}

  ngOnInit() {
    //jid de la sesión actual
    this.sessionJid = this.xmppService.jid;
  }

  close() {
    this.modalController.dismiss();
  }

  updatePresence() {
    this.xmppService.updateStatus(this.selectedStatus, this.statusMessage);
    this.close();
  }

}

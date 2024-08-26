import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { AlertService } from '../services/alert.service';

@Component({
  selector: 'app-add-contact',
  templateUrl: './add-contact.page.html',
  styleUrls: ['./add-contact.page.scss'],
})
export class AddContactPage implements OnInit {

  newContactEmail: string = '';

  constructor(private modalCotroller: ModalController, private alertSerice: AlertService) {}

  ngOnInit() {
    
  }

  addContact() {
    if (this.newContactEmail.trim() !== '') {
      this.modalCotroller.dismiss(this.newContactEmail)
    } else {
      this.alertSerice.presentToast('El email no puede estar vacío.', 'danger', 2000);
    }
  }

  close() {
    this.modalCotroller.dismiss();
  }

}

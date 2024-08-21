import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { ModalController } from '@ionic/angular';

@Component({
  selector: 'app-add-contact',
  templateUrl: './add-contact.page.html',
  styleUrls: ['./add-contact.page.scss'],
})
export class AddContactPage implements OnInit {

  newContactEmail: string = '';

  constructor(private modalCotroller: ModalController) {}

  ngOnInit() {
    
  }

  addContact() {
    if (this.newContactEmail.trim() !== '') {
      this.modalCotroller.dismiss(this.newContactEmail)
    } else {
      console.error('El email no puede estar vacío.');
    }
  }

  close() {
    this.modalCotroller.dismiss();
  }

}

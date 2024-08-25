import { Component, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';

@Component({
  selector: 'app-add-contacts',
  templateUrl: './add-contacts.page.html',
  styleUrls: ['./add-contacts.page.scss'],
})
export class AddContactsPage implements OnInit {

  newContactEmail: string = '';
  contacts: string[] = [];  // Lista para almacenar múltiples contactos
  groupName: string = '';  // Nombre del grupo
  groupJid: string = '';   // JID del grupo (opcional)

  constructor(private modalController: ModalController) {}

  ngOnInit() {}

  addContact() {
    if (this.newContactEmail.trim() !== '') {
      this.contacts.push(this.newContactEmail.trim());
      this.newContactEmail = '';  // Limpiar el campo después de agregar
    } else {
      console.error('El email no puede estar vacío.');
    }
  }

  removeContact(index: number) {
    this.contacts.splice(index, 1);  // Remover el contacto de la lista
  }

  saveGroup() {
    if (this.contacts.length > 0 && this.groupName.trim() !== '') {
      const generatedJid = this.groupJid.trim() !== '' ? this.groupJid.trim() : `grupo${new Date().getTime()}@conference.alumchat.lol`;
      const groupData = {
        groupName: this.groupName.trim(),
        groupJid: generatedJid,
        contacts: this.contacts
      };
      this.modalController.dismiss(groupData);
    } else {
      console.error('Debes proporcionar un nombre de grupo y al menos un contacto.');
    }
  }

  close() {
    this.modalController.dismiss();
  }
}

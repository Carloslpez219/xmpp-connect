import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { AddContactsPageRoutingModule } from './add-contacts-routing.module';

import { AddContactsPage } from './add-contacts.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    AddContactsPageRoutingModule
  ],
  declarations: [AddContactsPage]
})
export class AddContactsPageModule {}

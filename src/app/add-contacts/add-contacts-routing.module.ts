import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AddContactsPage } from './add-contacts.page';

const routes: Routes = [
  {
    path: '',
    component: AddContactsPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AddContactsPageRoutingModule {}

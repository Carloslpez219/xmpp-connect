import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { PrecenseModalPage } from './precense-modal.page';

const routes: Routes = [
  {
    path: '',
    component: PrecenseModalPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PrecenseModalPageRoutingModule {}

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { PrecenseModalPageRoutingModule } from './precense-modal-routing.module';

import { PrecenseModalPage } from './precense-modal.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    PrecenseModalPageRoutingModule
  ],
  declarations: [PrecenseModalPage]
})
export class PrecenseModalPageModule {}

import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { GuardGuard } from './guards/guard.guard';

const routes: Routes = [

  {
    path: 'login',
    loadChildren: () => import('./login/login.module').then( m => m.LoginPageModule)
  },
  {
    canActivate: [GuardGuard],
    path: '',
    loadChildren: () => import('./home/home.module').then( m => m.HomePageModule)
  },
  {
    path: 'message/:jid',
    loadChildren: () => import('./view-message/view-message.module').then( m => m.ViewMessagePageModule)
  },
  {
    path: 'add-contact',
    loadChildren: () => import('./add-contact/add-contact.module').then( m => m.AddContactPageModule)
  },
  {
    path: 'add-contacts',
    loadChildren: () => import('./add-contacts/add-contacts.module').then( m => m.AddContactsPageModule)
  },
  {
    path: 'precense-modal',
    loadChildren: () => import('./precense-modal/precense-modal.module').then( m => m.PrecenseModalPageModule)
  },
  {
    path: 'contact-details',
    loadChildren: () => import('./contact-details/contact-details.module').then( m => m.ContactDetailsPageModule)
  },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }

import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { Storage } from '@ionic/storage';

@Injectable({
  providedIn: 'root'
})
export class GuardGuard implements CanActivate {

  constructor(private router: Router, private storage: Storage){}

  async canActivate() {
    this.storage.create();
    const datosUsuario = await this.storage.get('datos');
    if ( datosUsuario ) {
      return true;
    }else{
      this.router.navigateByUrl('/login');
      return false;
    }
  }

}
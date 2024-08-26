import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { Storage } from '@ionic/storage';

@Injectable({
  providedIn: 'root'
})
export class GuardGuard implements CanActivate {

  constructor(private router: Router, private storage: Storage){}

  async canActivate() {
    // Asegura que el almacenamiento esté creado o inicializado antes de realizar cualquier operación.
    await this.storage.create();
    
    // Intenta obtener los datos del usuario almacenados en el almacenamiento.
    const datosUsuario = await this.storage.get('datos');
    
    // Verifica si los datos del usuario están presentes.
    if (datosUsuario) {
      // Si los datos del usuario existen, permite la navegación a la ruta solicitada.
      return true;
    } else {
      // Si los datos del usuario no están presentes, redirige al usuario a la página de inicio de sesión.
      this.router.navigateByUrl('/login');
      // Niega el acceso a la ruta solicitada.
      return false;
    }
  }
  

}
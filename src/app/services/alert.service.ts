import { Injectable } from '@angular/core';
import { AlertController, ToastController } from '@ionic/angular';

@Injectable({
  providedIn: 'root'
})
export class AlertService {

  constructor(public alertCtrl: AlertController, public toastController: ToastController) { }

  /**
   * Muestra una alerta con un mensaje simple y un botón 'OK'.
   * @param message El mensaje a mostrar en la alerta.
   */
  async presentAlert(message: any) {
    const alert = await this.alertCtrl.create({
      message,
      mode: 'md', // Usa el modo 'md' para el diseño de Material Design
      buttons: ['OK'] // Un solo botón 'OK' para cerrar la alerta
    });

    await alert.present(); // Muestra la alerta en la pantalla
  }

  /**
   * Muestra un toast (notificación emergente) con el mensaje proporcionado.
   * @param message El mensaje a mostrar en el toast.
   * @param color El color del toast, por ejemplo 'success', 'danger', etc.
   * @param duration La duración en milisegundos que el toast debe permanecer en pantalla.
   */
  async presentToast(message: any, color: any, duration: any) {
    const toast = await this.toastController.create({
      message,
      duration, // Duración del toast en milisegundos
      color // Color del toast
    });
    toast.present(); // Muestra el toast en la pantalla
  }  

   /**
   * Muestra un toast (notificación emergente) con el mensaje proporcionado.
   * @param message El mensaje a mostrar en el toast.
   * @param color El color del toast, por ejemplo 'success', 'danger', etc.
   * @param duration La duración en milisegundos que el toast debe permanecer en pantalla.
   */
   async presentToastMessage(message: any, color: any, duration: any) {
    // Truncar el mensaje si es demasiado largo
    const maxLength = 50; // Longitud máxima que quieres mostrar en el toast
    const truncatedMessage = message.length > maxLength ? message.substring(0, maxLength) + '...' : message;
  
    const toast = await this.toastController.create({
      position: 'top',
      icon: 'chatbubble-ellipses-outline',
      message: truncatedMessage, // Mostrar el mensaje truncado
      duration, // Duración del toast en milisegundos
      color // Color del toast
    });
    toast.present(); // Muestra el toast en la pantalla
  }
  

  /**
   * Muestra una alerta con dos botones, 'Cancelar' y 'Aceptar', con manejadores de eventos.
   * @param header El encabezado de la alerta.
   * @param message El mensaje a mostrar en la alerta.
   * @param acceptHandler Función que se ejecuta cuando se presiona el botón 'Aceptar'.
   * @param cancelHandler Función que se ejecuta cuando se presiona el botón 'Cancelar'.
   */
  async presentAlertButtons(header: string, message: string, acceptHandler: () => void, cancelHandler: () => void) {
    const alert = await this.alertCtrl.create({
      header, // Encabezado de la alerta
      message, // Mensaje de la alerta
      buttons: [
        {
          text: 'Cancelar', // Texto del botón 'Cancelar'
          role: 'cancel', // Rol del botón como 'cancel' para denotar que es la acción de cancelar
          handler: () => {
            console.log('Alert canceled'); // Mensaje de depuración para cancelar
            cancelHandler(); // Ejecuta la función pasada como parámetro para el botón 'Cancelar'
          },
        },
        {
          text: 'Aceptar', // Texto del botón 'Aceptar'
          role: 'confirm', // Rol del botón como 'confirm' para denotar que es la acción de aceptar
          handler: () => {
            console.log('Alert confirmed'); // Mensaje de depuración para confirmación
            acceptHandler(); // Ejecuta la función pasada como parámetro para el botón 'Aceptar'
          },
        },
      ],
    });

    await alert.present(); // Muestra la alerta en la pantalla
  }

}

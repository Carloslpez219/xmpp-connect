import { Component, ElementRef, inject, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { LoadingController, ModalController } from '@ionic/angular';
import { XmppService } from '../services/xmpp.service';
import { Storage } from '@ionic/storage-angular';
import { ContactDetailsPage } from '../contact-details/contact-details.page';

@Component({
  selector: 'app-view-message',
  templateUrl: './view-message.page.html',
  styleUrls: ['./view-message.page.scss'],
})
export class ViewMessagePage implements OnInit {
  
  public message!: any;  // Mensaje actual que el usuario está escribiendo
  messages: any = [];   // Historial de mensajes para el contacto
  private activatedRoute = inject(ActivatedRoute);  // Inyección del servicio ActivatedRoute para obtener parámetros de la ruta
  @ViewChild('chatContainer') private chatContainer!: ElementRef;  // Referencia al contenedor del chat para hacer scroll
  @ViewChild('fileInput') fileInput!: ElementRef;  // Referencia al input de archivos para la carga
  datosUsuario: any;  // Información del usuario (cargada desde el almacenamiento)
  id: any;  // Identificador del contacto con el que se está chateando

  selectedFile!: File;  // Archivo seleccionado para enviar

  constructor(
    private loadingController: LoadingController,
    private storage: Storage,
    private xmppService: XmppService,
    private modalController: ModalController
  ) {
    // Cargar los datos del usuario desde el almacenamiento
    this.datosUsuario = this.storage.get('datos');
  }

  ngOnInit() {
    // Obtener el parámetro 'jid' de la ruta y cargar los mensajes para ese contacto
    this.activatedRoute.paramMap.subscribe(params => {
      this.id = params.get('jid');
      if (this.id) {
        this.loadMessages(this.id);
      }
    });
  
    // Suscribirse a los mensajes del servicio XMPP para actualizar el historial cuando hay nuevos mensajes
    this.xmppService.messages$.subscribe(messageHistory => {
      if (this.id && messageHistory[this.id]) {
        this.messages = messageHistory[this.id];
        this.scrollToBottom();
      }
    });
  }

  ionViewDidEnter() {
    // Desplazar hacia abajo al entrar en la vista y ocultar el indicador de carga si está visible
    this.scrollToBottom();
    this.loadingController.dismiss();
  }

  scrollToBottom(): void {
    // Desplazar el contenedor del chat hacia abajo para mostrar el mensaje más reciente
    const scrollElement = this.chatContainer.nativeElement;
    scrollElement.scrollTop = scrollElement.scrollHeight;
  }

  sendMessage() {
    // Enviar el mensaje si no está vacío y luego desplazar hacia abajo
    if (this.message.trim()) {
      this.xmppService.sendMessage(this.id, this.message);
      this.message = ''; 
      this.scrollToBottom();
    }
  }

  private loadMessages(jid: string) {
    // Cargar el historial de mensajes desde el servicio XMPP
    this.messages = this.xmppService.fetchMessageHistory(jid);
    this.scrollToBottom();
  }

  async openContactDetailsModal() {
    // Abrir un modal con los detalles del contacto
    const jid = this.id;
    const modal = await this.modalController.create({
      component: ContactDetailsPage,
      componentProps: { contactJid: jid }
    });
    return await modal.present();
  }

  triggerFileInput() {
    // Activar el input de archivos para seleccionar un archivo
    this.fileInput.nativeElement.click();
  }

  async onFileSelected(event: any) {
    // Manejar la selección de un archivo
    if (event.target.files && event.target.files.length > 0) {
      this.selectedFile = event.target.files[0];
      if (this.selectedFile) {
        await this.uploadFile();
      }
    }
  }

  async uploadFile() {
    // Enviar el archivo seleccionado al contacto
    if (this.selectedFile && this.id) {
      this.xmppService.sendFile(this.id, this.selectedFile);
      console.log('Archivo seleccionado para enviar:', this.selectedFile.name);
      this.scrollToBottom();
    }
  }
}

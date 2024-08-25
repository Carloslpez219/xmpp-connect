import { CommonModule } from '@angular/common';
import { Component, ElementRef, inject, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { IonicModule, LoadingController, Platform } from '@ionic/angular';
import { DataService, Message } from '../services/data.service';
import { Storage } from '@ionic/storage-angular';
import { XmppService } from '../services/xmpp.service';

@Component({
  selector: 'app-view-message',
  templateUrl: './view-message.page.html',
  styleUrls: ['./view-message.page.scss'],
})
export class ViewMessagePage implements OnInit {
  
  public message!: any;
  messages: any = [];
  private activatedRoute = inject(ActivatedRoute);
  @ViewChild('chatContainer') private chatContainer!: ElementRef;
  @ViewChild('fileInput') fileInput!: ElementRef;
  datosUsuario: any;
  id: any;

  ngOnInit() {
    this.activatedRoute.paramMap.subscribe(params => {
      this.id = params.get('jid');
      console.log('JID obtenido de la ruta:', this.id);
      if (this.id) {
        this.loadMessages(this.id);
      }
    });
  
    // Suscribirse para recibir mensajes en tiempo real
    this.xmppService.messages$.subscribe(messageHistory => {
      if (this.id && messageHistory[this.id]) {
        this.messages = messageHistory[this.id];
        this.scrollToBottom();
      }
      this.scrollToBottom();
    });
  }
  

  selectedFile!: File;

  constructor(
    private loadingController: LoadingController,
    private platform: Platform,
    private storage: Storage,
    private xmppService: XmppService
  ) {
    this.datosUsuario = this.storage.get('datos');
  }

  ionViewDidEnter() {
    this.scrollToBottom();
    this.loadingController.dismiss();
  }

  scrollToBottom(): void {
    const scrollElement = this.chatContainer.nativeElement;
    scrollElement.scrollTop = scrollElement.scrollHeight;
  }



  sendMessage() {
    if (this.message.trim()) {
      this.xmppService.sendMessage(this.id, this.message);
      this.message = ''; 
      this.scrollToBottom();
    }
    this.scrollToBottom();
  }
  

  private loadMessages(jid: string) {
    this.messages = this.xmppService.fetchMessageHistory(jid);
    console.log(this.messages)
    this.scrollToBottom();
  }
  

  triggerFileInput() {
    this.fileInput.nativeElement.click();
  }

  async onFileSelected(event: any) {
    if (event.target.files && event.target.files.length > 0) {
      this.selectedFile = event.target.files[0];
      if (this.selectedFile) {
        await this.uploadFile();
      }
    }
  }

  async uploadFile() {
    if (this.selectedFile) {
      // Aquí iría la lógica para subir el archivo usando tu servicio XMPP
      console.log('Archivo seleccionado para enviar:', this.selectedFile.name);
      // Después de subir, podrías actualizar la lista de mensajes o realizar otra acción
      this.scrollToBottom();
    }
  }





}

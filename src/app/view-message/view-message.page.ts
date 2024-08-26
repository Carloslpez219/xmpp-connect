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
  
  public message!: any;
  messages: any = [];
  private activatedRoute = inject(ActivatedRoute);
  @ViewChild('chatContainer') private chatContainer!: ElementRef;
  @ViewChild('fileInput') fileInput!: ElementRef;
  datosUsuario: any;
  id: any;

  selectedFile!: File;

  constructor(
    private loadingController: LoadingController,
    private storage: Storage,
    private xmppService: XmppService,
    private modalController: ModalController
  ) {
    this.datosUsuario = this.storage.get('datos');
  }

  ngOnInit() {
    this.activatedRoute.paramMap.subscribe(params => {
      this.id = params.get('jid');
      if (this.id) {
        this.loadMessages(this.id);
      }
    });
  
    this.xmppService.messages$.subscribe(messageHistory => {
      if (this.id && messageHistory[this.id]) {
        this.messages = messageHistory[this.id];
        this.scrollToBottom();
      }
      this.scrollToBottom();
    });
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
    this.scrollToBottom();
  }

  async openContactDetailsModal() {
    const jid = this.id;
    const modal = await this.modalController.create({
      component: ContactDetailsPage,
      componentProps: { contactJid: jid }
    });
    return await modal.present();
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
    if (this.selectedFile && this.id) {
      this.xmppService.sendFile(this.id, this.selectedFile);
      console.log('Archivo seleccionado para enviar:', this.selectedFile.name);
      this.scrollToBottom();
    }
  }
}

import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, NgForm, Validators } from '@angular/forms';
import { NavController, LoadingController} from '@ionic/angular';
import { Storage } from '@ionic/storage';
import { Router } from '@angular/router';
import { AlertService } from '../services/alert.service';
import { XmppService } from '../services/xmpp.service';
declare const Strophe: any;

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage implements OnInit {

  loginForm: FormGroup;
  pattern: any = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  datosUsuario: any;
  data = null;


  constructor(private navCtrl: NavController, public loadingController: LoadingController, private alertService: AlertService,  private storage: Storage, private router: Router, private xmppService: XmppService) {
            this.storage.create();            
            this.loginForm = this.createFormGroup();
              }


  ngOnInit() {
  }
               

  createFormGroup() {
    return new FormGroup({
      nombre: new FormControl('', [Validators.required]),
      password: new FormControl('', [Validators.required])
    });
  }

  get nombre() { return this.loginForm.get('nombre'); }
  get password() { return this.loginForm.get('password'); }


  async presentLoading() {
    const loading = await this.loadingController.create({
      message: 'Cargando...'
    });
    await loading.present();
  }


  async datosLocalStorage( data: any){
    this.storage.create();
    this.data = data;
    await this.storage.set('datos', data);
  }

  async login() {
    this.presentLoading();
    this.xmppService.connect(this.loginForm.value.nombre, this.loginForm.value.password, this.onConnect.bind(this));
  }

  async onConnect(status: number) {
    console.log('Estado de conexión recibido en el componente:', status);
    if (status === Strophe.Status.CONNECTING) {
      console.log('Conectando...');
    } else if (status === Strophe.Status.CONNFAIL) {
      console.log('Falló la conexión');
      this.data = null;
      this.storage.clear();
      await this.loadingController.dismiss();
      const message = 'Usuario y/o Contraseña son incorrectos';
      this.alertService.presentToast(message, 'danger', 3000);
    } else if (status === Strophe.Status.DISCONNECTING) {
      console.log('Desconectando...');
    } else if (status === Strophe.Status.DISCONNECTED) {
      console.log('Desconectado');
    } else if (status === Strophe.Status.CONNECTED) {
      console.log('Conectado');
      await this.datosLocalStorage( this.loginForm.value.nombre );
      await this.loadingController.dismiss();
      this.navCtrl.navigateRoot('/');
    }
  }
}


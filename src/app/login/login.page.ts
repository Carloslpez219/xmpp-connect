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
  registerForm: FormGroup;
  pattern: any = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  datosUsuario: any;
  data = null;
  land = true;
  color = 'danger';
  valueBar = 0;


  constructor(private navCtrl: NavController, public loadingController: LoadingController, private alertService: AlertService,  private storage: Storage, private router: Router, private xmppService: XmppService) {
            this.storage.create();            
            this.loginForm = this.createFormGroup();
            this.registerForm = this.createFormGroup2();
              }

  ngOnInit() {
  }
           
  createFormGroup2() {
    return new FormGroup({
      name: new FormControl('', [Validators.required]),
      correo: new FormControl('', [Validators.required]),
      password1: new FormControl('', [Validators.required])
    });
  }

  createFormGroup() {
    return new FormGroup({
      nombre: new FormControl('', [Validators.required]),
      password: new FormControl('', [Validators.required])
    });
  }

  get nombre() { return this.loginForm.get('nombre'); }
  get password() { return this.loginForm.get('password'); }

  get name() { return this.registerForm.get('name'); }
  get correo() { return this.registerForm.get('correo'); }
  get password1() { return this.registerForm.get('password1'); }

  async change() {
    this.land = !this.land;
  }  

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

  async onError(error: any) {
    this.data = null;
    this.storage.clear();
    await this.loadingController.dismiss();
    this.alertService.presentToast(error, 'danger', 3000);
  }

  async registerUser() {
    this.presentLoading();
    await this.xmppService.signup(this.registerForm.value.name, this.registerForm.value.name,  this.registerForm.value.correo, this.registerForm.value.password1, this.onRegisterSuccess.bind(this), this.onError.bind(this),);
  }

  async onRegisterSuccess() {
    await this.loadingController.dismiss();
    this.alertService.presentToast('Tu cuenta ha sido registrada, inicia sesion para empezar a chatear!', 'success', 3000);
    this.change();
  }


}


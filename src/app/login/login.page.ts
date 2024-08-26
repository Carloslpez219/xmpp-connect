import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { NavController, LoadingController } from '@ionic/angular';
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

  loginForm: FormGroup; // Formulario para el inicio de sesión
  registerForm: FormGroup; // Formulario para el registro de usuario
  pattern: any = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/; // Patrón para validar correos electrónicos
  datosUsuario: any; // Datos del usuario para almacenamiento local
  data = null; // Variable para almacenar datos temporales
  land = true; // Indica si se debe mostrar el formulario de inicio de sesión o registro
  color = 'danger'; // Color para alertas
  valueBar = 0; // Valor de una barra de progreso o similar (no se utiliza en el código proporcionado)

  constructor(private navCtrl: NavController, public loadingController: LoadingController, private alertService: AlertService, private storage: Storage, private router: Router, private xmppService: XmppService) {
    // Inicializa el almacenamiento y los formularios
    this.storage.create();
    this.loginForm = this.createFormGroup();
    this.registerForm = this.createFormGroup2();
  }

  ngOnInit() {
  }
           
  createFormGroup2() {
    // Crea el formulario para el registro de usuario
    return new FormGroup({
      name: new FormControl('', [Validators.required]), // Nombre del usuario
      correo: new FormControl('', [Validators.required]), // Correo electrónico
      password1: new FormControl('', [Validators.required]) // Contraseña
    });
  }

  createFormGroup() {
    // Crea el formulario para el inicio de sesión
    return new FormGroup({
      nombre: new FormControl('', [Validators.required]), // Nombre de usuario
      password: new FormControl('', [Validators.required]) // Contraseña
    });
  }

  get nombre() { return this.loginForm.get('nombre'); }
  get password() { return this.loginForm.get('password'); }

  get name() { return this.registerForm.get('name'); }
  get correo() { return this.registerForm.get('correo'); }
  get password1() { return this.registerForm.get('password1'); }

  async change() {
    // Cambia entre los formularios de inicio de sesión y registro
    this.land = !this.land;
  }  

  async presentLoading() {
    // Muestra un mensaje de carga mientras se realiza una operación
    const loading = await this.loadingController.create({
      message: 'Cargando...'
    });
    await loading.present();
  }

  async datosLocalStorage(data: any) {
    // Guarda los datos del usuario en el almacenamiento local
    this.storage.create();
    this.data = data;
    await this.storage.set('datos', data);
  }

  async login() {
    // Inicia el proceso de inicio de sesión
    this.presentLoading();
    this.xmppService.connect(this.loginForm.value.nombre, this.loginForm.value.password, this.onConnect.bind(this));
  }

  async onConnect(status: number) {
    // Maneja el estado de la conexión XMPP
    console.log('Estado de conexión recibido en el componente:', status);
    
    if (status === Strophe.Status.CONNECTING) {
      console.log('Conectando...');
    } else if (status === Strophe.Status.CONNFAIL) {
      console.log('Falló la conexión');
      this.data = null;
      await this.loadingController.dismiss();
      const message = 'No se pudo conectar con el servidor';
      this.alertService.presentToast(message, 'danger', 3000);
      this.storage.clear();
    } else if (status === Strophe.Status.DISCONNECTING) {
      console.log('Desconectando...');
    } else if (status === Strophe.Status.DISCONNECTED) {
      this.alertService.presentToast('Desconectado', 'danger', 3000);
    } else if (status === Strophe.Status.AUTHFAIL) {
      console.log('Falló la autenticación');
      this.data = null;
      await this.loadingController.dismiss();
      const message = 'Usuario y/o Contraseña son incorrectos';
      this.alertService.presentToast(message, 'danger', 3000);
      this.storage.clear();
    } else if (status === Strophe.Status.CONNECTED) {
      console.log('Conectado');
      await this.datosLocalStorage({'email': this.loginForm.value.nombre, 'password': this.loginForm.value.password});
      await this.loadingController.dismiss();
      this.navCtrl.navigateRoot('/');
    }
  }  

  async onError(error: any) {
    // Maneja errores y muestra una alerta
    this.data = null;
    this.storage.clear();
    await this.loadingController.dismiss();
    this.alertService.presentToast(error, 'danger', 3000);
  }

  async registerUser() {
    // Registra un nuevo usuario
    this.presentLoading();
    await this.xmppService.signup(this.registerForm.value.name, this.registerForm.value.name, this.registerForm.value.correo, this.registerForm.value.password1, this.onRegisterSuccess.bind(this), this.onError.bind(this));
  }

  async onRegisterSuccess() {
    // Maneja el éxito del registro de usuario
    await this.loadingController.dismiss();
    this.alertService.presentToast('Tu cuenta ha sido registrada, inicia sesión para empezar a chatear!', 'success', 3000);
    this.change();
  }

}



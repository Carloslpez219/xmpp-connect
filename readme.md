# XMPP Chat Application

## Descripción

Esta es una aplicación de chat desarrollada con **Ionic Angular** que utiliza el protocolo **XMPP (Extensible Messaging and Presence Protocol)** para la mensajería instantánea. La aplicación permite a los usuarios conectarse a un servidor XMPP, gestionar contactos, participar en chats individuales y grupales, y controlar su estado de presencia. La implementación se basa en la biblioteca **Strophe.js**, que facilita la comunicación con el servidor XMPP mediante websockets.

## Características

### Conexión a un servidor XMPP
- **Autenticación**: Los usuarios pueden iniciar sesión en la aplicación utilizando su JID (Jabber ID) y una contraseña.
- **Manejo de reconexión**: La aplicación está preparada para manejar desconexiones y reconexiones automáticas al servidor.

### Presencia
- **Actualizar estado de presencia**: Los usuarios pueden cambiar su estado de presencia a online, away o offline.
- **Visualizar estado de contactos**: Los usuarios pueden ver el estado de presencia de sus contactos en tiempo real.

### Mensajería
- **Chats individuales**: Los usuarios pueden enviar y recibir mensajes a/desde contactos específicos.
- **Chats grupales**: Los usuarios pueden unirse y participar en chats grupales, además de crear nuevos grupos.
- **Historial de mensajes**: La aplicación guarda un historial de mensajes por cada contacto o grupo, que se puede consultar posteriormente.

### Gestión de contactos
- **Agregar nuevos contactos**: Los usuarios pueden agregar contactos a su lista mediante la introducción del JID correspondiente.
- **Aceptar/Rechazar solicitudes de suscripción**: La aplicación notifica al usuario cuando recibe una solicitud de suscripción y permite aceptarla o rechazarla.
- **Ver detalles de contacto**: Los usuarios pueden ver los detalles de un contacto específico, incluyendo su JID y estado de presencia.

### Alertas y Notificaciones
- **Alertas de suscripción**: Notificaciones cuando un usuario recibe una solicitud de suscripción.
- **Invitaciones a grupos**: Notificaciones cuando un usuario recibe una invitación para unirse a un grupo de chat.
- **Mensajes de error y confirmación**: La aplicación muestra mensajes de error y confirmación para varias acciones, como el envío de mensajes y la actualización de estado.

## Estructura del Proyecto

### Directorios y Archivos Principales

- **`src/app/home/`**: Contiene la lógica y la vista de la pantalla principal donde se manejan los contactos y las conversaciones. Aquí se implementan las funcionalidades de visualización de la lista de contactos y acceso a las conversaciones individuales.

- **`src/app/services/`**: Contiene los servicios principales de la aplicación:
  - **`xmpp.service.ts`**: Es el servicio principal que maneja la conexión XMPP, la gestión de mensajes, la presencia y la suscripción. Utiliza **Strophe.js** para interactuar con el servidor XMPP.
  - **`alert.service.ts`**: Servicio encargado de mostrar alertas al usuario mediante el uso de Ionic Alerts.

- **`src/app/view-message/`**: Contiene la lógica y la vista para la página donde se visualizan las conversaciones de chat. Este componente se encarga de mostrar el historial de mensajes y manejar el envío de nuevos mensajes.

- **`src/app/add-contact/`**: Componente modal que permite a los usuarios agregar un nuevo contacto introduciendo su JID. Está diseñado para ser simple y directo, permitiendo agregar un contacto rápidamente.

- **`src/app/add-contacts/`**: Componente modal que permite a los usuarios agregar múltiples contactos a un grupo de chat. Ofrece una interfaz para seleccionar varios contactos y agregarlos a un grupo nuevo o existente.

- **`src/app/presence-modal/`**: Componente modal que permite a los usuarios configurar su estado de presencia. Incluye un menú desplegable para seleccionar el estado de presencia deseado y un campo para personalizar el mensaje de estado.

- **`src/app/contact-details/`**: Componente modal que muestra los detalles de un contacto específico, como su JID, estado de presencia y nombre de usuario.

### Archivos de Estilo

- **`src/theme/variables.scss`**: Contiene variables de diseño globales que definen el tema de la aplicación. Aquí se definen los colores, fuentes, y otros aspectos del diseño que se aplican de manera uniforme en toda la aplicación.

### Recursos

- **`src/assets/icon/`**: Directorio que contiene los íconos utilizados en la aplicación. Estos íconos se utilizan en botones, menús y otros elementos de la interfaz de usuario.

## Requisitos Previos

Para poder ejecutar esta aplicación, necesitarás tener instalados los siguientes programas:

- **Node.js** (v14 o superior)
- **Ionic CLI** (v6 o superior)
- **Angular CLI** (v11 o superior)
- **Servidor XMPP**: Necesitarás un servidor XMPP con soporte para websockets. Puedes utilizar un servidor público o instalar uno propio como **Ejabberd** o **Openfire**.

### Instalación

Sigue estos pasos para instalar y ejecutar la aplicación en tu entorno local:

1. **Clona el repositorio**:
   ```bash
   git clone https://github.com/tu-usuario/tu-repositorio.git
   cd tu-repositorio

##
1. **Instala las dependencias**:
   ```bash
   npm install


### Configura el servidor XMPP: 

Asegúrate de tener un servidor XMPP en funcionamiento con soporte para websockets. Configura la URL del servidor en el archivo xmpp.service.ts en la variable de conexión.

##
1. **Ejecuta la aplicación**:
   ```bash
   ionic serve


Esto iniciará un servidor local de desarrollo y abrirá la aplicación en tu navegador por defecto.


## Uso

## Conexión al Servidor XMPP
Al abrir la aplicación, serás dirigido a una pantalla de inicio de sesión donde deberás ingresar tu JID y contraseña.
Después de autenticarse con éxito, serás redirigido a la pantalla principal, donde podrás ver tu lista de contactos.

## Envío de Mensajes
Selecciona un contacto:
En la pantalla principal, selecciona un contacto de tu lista para abrir la vista de conversación.
Escribe un mensaje:
En el campo de texto, escribe tu mensaje y presiona el botón de enviar.
Historial de mensajes:
El historial de mensajes con ese contacto se actualizará automáticamente para mostrar tanto los mensajes enviados como los recibidos.

## Gestión de Contactos
Agregar un contacto:
Haz clic en el botón para agregar un contacto, ingresa el JID del contacto en el modal y confirma la acción.
Ver detalles de un contacto:
Mantén presionado un contacto en la lista para ver los detalles del mismo, incluyendo su estado de presencia.

## Configuración de Presencia
Abrir el modal de presencia:
Haz clic en tu avatar o nombre de usuario en la parte superior de la pantalla para abrir el modal de configuración de presencia.
Selecciona tu estado:
Selecciona entre los estados disponibles (online, away, offline) y, opcionalmente, ingresa un mensaje personalizado.

## Gestión de Grupos
Crear un grupo:
Utiliza el modal de agregar contactos para seleccionar múltiples contactos y crear un grupo.
Unirse a un grupo:
Acepta invitaciones a grupos a través de las alertas mostradas en la aplicación.

### Tecnologías Utilizadas

- **Ionic Framework:**
 Utilizado para la creación de la interfaz de usuario de la aplicación, permitiendo una experiencia nativa en múltiples plataformas.

- **Angular:**
 Framework estructural para desarrollar aplicaciones web dinámicas.

- **Strophe JS:**
 Biblioteca JavaScript para conectar y comunicar con servidores XMPP. Facilita la autenticación, el envío de mensajes, y la gestión de presencia.

- **XMPP:**
 Protocolo estándar abierto para la mensajería instantánea y la comunicación en tiempo real basado en XML.
Contribución
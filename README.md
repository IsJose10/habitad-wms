# HABITAD WMS - Control de Inventarios Local

Este es un sistema WMS (Warehouse Management System) local, diseñado para la administración de inventarios, picking y pre-alistamiento de mercancías. 

Fue migrado de una macro de Excel a una aplicación web local ligera utilizando **JavaScript puro** y **Node.js nativo**.

---

## ❓ Preguntas Frecuentes sobre Portabilidad

### 1. ¿Seguirá usando SQLite si lo subo a GitHub y lo descargo en otra PC?
**Sí.** SQLite es una base de datos integrada (embebida). Funciona leyendo y escribiendo en un archivo local llamado `db.sqlite` que se genera automáticamente en la misma carpeta del proyecto.

> [!WARNING]
> **Datos Locales e Independientes:**
> Si clonas el repositorio en la **PC-A** y en la **PC-B**, cada computadora tendrá su propia base de datos local independiente. Los cambios que hagas en la PC-A no se verán en la PC-B.
>
> *Si necesitas que varias computadoras compartan la misma base de datos:*
> 1. Ejecuta el servidor en una sola computadora (ej. PC-A).
> 2. Conecta las demás computadoras (PC-B, PC-C) a la red local (Wi-Fi/Ethernet).
> 3. En lugar de entrar a `localhost:3000` en la PC-B, ingresa la IP de la PC-A en el navegador (ej: `http://192.168.1.15:3000`).

---

## 💻 Requisitos e Instalación en otra PC

Para ejecutar este proyecto en cualquier computadora nueva, solo necesitas realizar **una única instalación**:

1. **Instalar Node.js:**
   - Descarga e instala **Node.js** (versión **22.5.0** o superior) desde [nodejs.org](https://nodejs.org/).
   - *(La versión 22.5.0 o superior es necesaria porque incluye soporte nativo y directo para SQLite sin necesidad de instalar librerías externas).*

2. **Descargar el código:**
   - Clona el repositorio de GitHub o descarga el archivo ZIP en la nueva PC.

3. **Ejecutar el sistema:**
   - No necesitas ejecutar `npm install` ni descargar dependencias porque el servidor está escrito usando librerías nativas de Node.js.
   - Abre la consola (CMD o Terminal) en la carpeta del proyecto y ejecuta:
     ```bash
     node server.js
     ```
   - Abre tu navegador en: `http://localhost:3000`

---

## 📂 Archivos del Proyecto

* `server.js`: Servidor HTTP de Node.js y lógica de base de datos SQLite.
* `run.bat`: Script de doble clic para arrancar el servidor en Windows de manera automática.
* `client/`:
  * `index.html`: Estructura e interfaz de la aplicación de página única (SPA).
  * `index.css`: Hoja de estilos con soporte para Modo Oscuro y formato de impresión PDF.
  * `app.js`: Lógica interactiva de usuario, cálculos de stock y selector de ubicación estructurado.
* `db.sqlite`: Archivo de la base de datos (se genera automáticamente). **No lo subas a GitHub** si deseas mantener tu base de datos limpia al compartir el código (puedes agregarlo al archivo `.gitignore`).

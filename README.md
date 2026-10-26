# Negocio + Gym

App móvil con dos caras que cambias con un botón, en interfaz neón morado y negro.

## Negocio
- **Pedidos:** cliente (o tarjeta), prenda con precio automático, moto envío (Uber, DiDi o Rappi con su logo), ubicación y historial. Permite reembolsar.
- **Ubicación:** abre la dirección del pedido en Google Maps.
- **Inventario:** número de mercancía, foto, tallas, colores y stock.
- **Ganancias:** al marcar un pedido como vendido se descuenta del inventario y se suma lo pagado.
- **Estadística semanal:** gráfica día por día de cada semana.
- **Tarjetas de clientes:** 5 sellos = 50% de descuento (nombre y foto opcional).
- **Proveedores:** links de tus tiendas.

## Gym
- Calendario mensual: al tocar un día ves los ejercicios asignados.
- Temporizador por ejercicio (con sonido y vibración).
- Contador manual de repeticiones.

## Estructura
```
negocio-gym-app/
├── .github/workflows/build-apk.yml   # compila el APK automáticamente
├── www/
│   ├── index.html
│   ├── css/styles.css
│   ├── js/app.js
│   ├── icons/
│   ├── manifest.json
│   └── sw.js
├── capacitor.config.json
├── package.json
└── README.md
```

## Cómo obtener el APK en tu celular (sin computadora)
1. Crea un repositorio en GitHub y sube **todo el contenido** de esta carpeta (conserva las carpetas, incluida `.github`).
2. Entra a la pestaña **Actions**. Si pide permiso, toca **I understand my workflows, go ahead and enable them**.
3. Espera 5 a 10 minutos a que termine **Crear APK** (palomita verde). Si no arrancó, entra al flujo y toca **Run workflow**.
4. Ve a la página principal del repositorio y toca **Releases** (lado derecho).
5. Descarga **NegocioGym.apk** desde tu celular.
6. Ábrelo y acepta **Instalar apps de origen desconocido** cuando Android lo pida.

> La APK es de prueba (debug), suficiente para uso personal. Solo funciona en Android. Para iPhone, usa GitHub Pages: sube la carpeta `www` y actívalo en Settings → Pages; luego "Añadir a pantalla de inicio" desde Safari.

## Datos
Todo se guarda localmente en el teléfono. No se sincroniza entre dispositivos.

## Probar en computadora
```
npm install
npm start
```
Abre http://localhost:8080

## Novedades
- Precio de venta en inventario y aviso cuando una prenda llega a 0.
- Tarjetas ligadas a pedidos: cada venta da 1 sello; con 5, el siguiente pedido lleva 50% automático.
- Reembolso: resta de ganancias, regresa la pieza al inventario y revierte el sello.
- Historial de pedidos.
- Ubicación a Maps, Uber (con destino), DiDi y Rappi (copian la dirección).
- Gym: hora de recordatorio por ejercicio, aviso diario y marcar como hecho.
- Respaldo de datos (copiar y restaurar) en la pestaña Proveedores.

## Actualizar la app sin perder datos
Sube `debug.keystore` a la raíz del repositorio (junto a package.json). Así cada APK nuevo se instala encima del anterior. La primera vez que lo uses, copia tu respaldo, desinstala la app vieja, instala la nueva y restaura.

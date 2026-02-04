# Mercado Digital Escolar

Proyecto escolar para estudiantes de grados 10 y 11. Mercado digital donde se compra y vende con moneda ficticia.

## Características principales
- Registro y login básicos.
- Usuarios con rol: Comprador, Vendedor o Ambos.
- Cada usuario inicia con 50 monedas.
- CRUD de productos para vendedores.
- Imagen opcional para cada producto.
- Compra con validación de monedas y reducción de stock.
- Botón de contacto (WhatsApp o email).
- Comisión fija por venta para el admin.
- Productos populares con promoción de 7 días (costo: 10 monedas).
- Cuando el stock llega a 0, el producto deja de mostrarse (no se elimina).
- Panel admin para ver comisiones y promocionados activos.
- Código de tarjeta generado automáticamente por usuario.
- Comprobantes de compras/ventas recientes.
- Registro con códigos de verificación de un solo uso.
- Cuentas admin creadas con código especial.
- Panel admin muestra el total de usuarios y admins.
- Panel admin lista los códigos disponibles.
- Panel admin permite agregar 80 códigos nuevos.
- Panel admin muestra historial de recargas y permite eliminar.
- Sección de acuerdos y política de privacidad en el frontend.
- Botón de reinicio total para admin (borra todo).

## Requisitos
- Node.js 18 o superior.
- NPM.

## Instalación y ejecución
1. En la carpeta `backend`, instala dependencias.
```bash
cd backend
npm install
```

2. Inicia el servidor.
```bash
npm start
```

3. Abre el navegador en:
- `http://localhost:3000`

## Estructura
```
proyecto-mercado/
├── backend/
│   ├── server.js
│   ├── database.js
│   └── routes/
│       ├── auth.js
│       ├── products.js
│       ├── purchase.js
│       └── admin.js
├── frontend/
│   ├── index.html
│   ├── styles.css
│   └── app.js
└── README.md
```

## Arquitectura (diagrama simple)
```
[Frontend HTML/CSS/JS]
         |
         | HTTP (fetch)
         v
[Express API en Node]
         |
         v
[SQLite: mercado.db]
```

## Notas de uso
- Cada usuario recibe un código de tarjeta tipo `MD101AX39` (sin guiones).
- El registro requiere un código de verificación (ver abajo).
- El campo de contacto puede ser un email o un número de WhatsApp.
- La comisión por venta es fija de 1 moneda por compra.
- El nombre debe tener mínimo 10 caracteres.

## Códigos de registro
- Se generan 90 códigos de un solo uso al iniciar la base de datos.
- Código admin (opcional): `PekasiolPeluco`
- Puedes cambiar el código admin en `backend/routes/auth.js`.

## Reinicio total (admin)
- El botón “Reiniciar TODO” borra usuarios, productos, compras y créditos.
- Después del reinicio debes volver a crear el admin con el código especial.

## Mejoras futuras
- Encriptar contraseñas.
- Sesiones con tokens.
- Historial de compras y ventas.
- Filtros y búsqueda por curso/categoría.
- Panel de estadísticas para profesores.
- Moderación de productos.

## Licencia
Uso educativo.

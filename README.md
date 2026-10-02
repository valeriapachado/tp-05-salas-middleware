# Trabajo practico 05

## Descripcion
Aplicacion web para la consulta y reserva temporal de salas de estudio desarrollada en Express, EJS y un pipeline de middleware enfocado en medicion, identificacion, parseo y validacion de servidor.

## Instalacion
```bash
npm install
Ejecucion
npm start
Para verificar errores sintacticos sin ejecutar:
npm run check
Rutas
GET /: Muestra la pagina de inicio con proposito del sitio y enlaces navegables.
GET /estado: Retorna JSON con estado del servicio, cantidad actual de reservas e ID de solicitud.
GET /reservas: Muestra el listado con todas las reservas registradas.
GET /reservas/nueva: Muestra el formulario para realizar una reserva.
GET /reservas/:id: Muestra el detalle de una reserva o pagina 404 HTML si no existe.
POST /reservas: Procesa el formulario, valida datos en servidor, agrega en memoria y redirige.
Pipeline de middleware
El pipeline global sigue un orden estricto de dependencias:
morgan("dev"): Registra accesos HTTP.
identificarSolicitud: Genera el identificador secuencial BIB-XXXX en res.locals.solicitudId.
medirDuracion: Captura el tiempo inicial y calcula la duracion unicamente en el evento finish de res.
expressLayouts: Configura el layout base dinamico de EJS.
express.static: Sirve archivos estaticos desde la carpeta public.
express.urlencoded: Parsea el cuerpo de peticiones provenientes de formularios.
express.json: Parsea payloads JSON en las peticiones.
Rutas base y reservasRouter: Procesan los endpoints del sistema.
Middleware 404: Captura cualquier ruta inexistente y rinde la vista no-encontrado.
Alcance de cada funcion
Middleware incorporado: Funciones propias de Express como express.static, express.urlencoded y express.json.
Middleware de terceros: Modulos instalados via npm como morgan y express-ejs-layouts.
Middleware personalizado: Funciones propias desarrolladas para la logica de la aplicacion como identificarSolicitud, medirDuracion y validarReserva.
Uso de next(): Funcion encargada de ceder el control al siguiente middleware de la cadena.
Parsers antes de la validacion: Es indispensable parsear los datos entrantes (express.urlencoded) antes del middleware validarReserva para que req.body contenga los datos disponibles para la lectura.
Alcances (Global, Router y Ruta):
Global: Afecta a todas las solicitudes enviadas a la aplicacion (app.use).
Router: Afecta unicamente a las rutas montadas en ese router (reservasRouter.use).
Ruta: Se ejecuta unicamente para un metodo y direccion especifica (POST /reservas).
Evento finish: Permite medir el tiempo real transcurrido calculando la diferencia cuando la respuesta ha sido completamente enviada al cliente.
Montaje del router: Al montar con app.use("/reservas", reservasRouter), todas las rutas definidas dentro del router son relativas a /reservas.
Diferencia entre POST 302 y GET posterior: Un POST exitoso responde con redireccion HTTP 302 hacia /reservas, solicitando al navegador realizar un nuevo GET para evitar duplicacion de envios.
Validacion
La funcion validarReserva aplica las siguientes reglas de servidor:
Sanitizacion mediante trim().
Conversion con Number().
Comprobacion de campos obligatorios.
Verificacion de sala perteneciente a salasPermitidas.
Verificacion de turno perteneciente a turnosPermitidos.
Comprobacion de cantidad de personas entera entre 1 y 6.
Validacion basica de email exigiendo el caracter @.
Ante datos invalidos, responde con codigo 400 Bad Request, conserva los valores ingresados y muestra un mensaje accesible con role="alert". Ante datos validos, prepara req.reservaValidada y transfiere el control con next().
Pruebas manuales
Inicio y /estado responden estado 200.
Listado de reservas rinde 200 con registros precargados.
Formulario rinde 200.
Detalle de reserva existente responde 200 y detalle inexistente responde 404 HTML.
Formulario con datos vacios, email sin @ o personas fuera de rango (0 o 7) responde 400 sin guardar el registro.
POST valido redirige con 302 y renderiza la nueva tarjeta con 200.
URL inexistente captura estado 404 en el middleware final.
Persistencia temporal
Todas las altas se almacenan temporalmente en la memoria RAM del servidor. Al reiniciar la aplicacion con npm start, la lista de reservas regresa a su estado inicial de 4 registros.
Diagramas de Flujo
Diagrama del POST válido
POST /reservas ──> morgan("dev") ──> identificarSolicitud ──> medirDuracion ──> expressLayouts ──> express.urlencoded ──> reservasRouter ──> prepararAreaReservas ──> validarReserva ──> crearReserva ──> 302 /reservas ──> finish (ID, estado, duración)
Diagrama del POST invalido
POST /reservas ──> morgan("dev") ──> identificarSolicitud ──> medirDuracion ──> expressLayouts ──> express.urlencoded ──> reservasRouter ──> prepararAreaReservas ──> validarReserva (Responde status 400 y termina en esta funcion sin llamar a next()) ──> finish (ID, estado, duracion)
Ejecuta `npm run check` en tu consola para confirmar que la sintaxis este libre de errores antes de probarlo.
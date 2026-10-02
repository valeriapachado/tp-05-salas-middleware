const express = require("express");
const path = require("path");
const expressLayouts = require("express-ejs-layouts");
const morgan = require("morgan");
const app = express();
const PORT = process.env.PORT || 3000;
const salasPermitidas = ["Sala Norte", "Sala Sur", "Sala Multimedia"];
const turnosPermitidos = ["Mañana", "Tarde", "Noche"];
let contadorSolicitud = 0;
let contadorReservaId = 4;
let reservas = [
  {
    id: 1,
    estudiante: "Carlos Gomez",
    email: "carlos@estudiante.edu.ar",
    sala: "Sala Norte",
    fecha: "2026-10-05",
    turno: "Mañana",
    personas: 3
  },
  {
    id: 2,
    estudiante: "Ana Martinez",
    email: "ana@estudiante.edu.ar",
    sala: "Sala Sur",
    fecha: "2026-10-05",
    turno: "Tarde",
    personas: 2
  },
  {
    id: 3,
    estudiante: "Lucas Rodriguez",
    email: "lucas@estudiante.edu.ar",
    sala: "Sala Multimedia",
    fecha: "2026-10-06",
    turno: "Noche",
    personas: 5
  },
  {
    id: 4,
    estudiante: "Sofia Lopez",
    email: "sofia@estudiante.edu.ar",
    sala: "Sala Norte",
    fecha: "2026-10-06",
    turno: "Tarde",
    personas: 4
  }
];
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "../views"));
app.set("layout", "layouts/main");
app.use(morgan("dev"));
function identificarSolicitud(req, res, next) {
  contadorSolicitud++;
  const num = String(contadorSolicitud).padStart(4, "0");
  res.locals.solicitudId = `BIB-${num}`;
  next();
}
app.use(identificarSolicitud);
function medirDuracion(req, res, next) {
  const inicio = Date.now();
  res.on("finish", () => {
    const duracion = Date.now() - inicio;
    console.log(
      `ID: ${res.locals.solicitudId} | Metodo: ${req.method} | URL: ${req.originalUrl} | Estado: ${res.statusCode} | Duracion: ${duracion}ms`
    );
  });
  next();
}
app.use(medirDuracion);
app.use(expressLayouts);
app.use(express.static(path.join(__dirname, "../public")));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.get("/", (req, res) => {
  res.render("inicio", {
    titulo: "Inicio - Reserva de Salas de Estudio"
  });
});
app.get("/estado", (req, res) => {
  res.json({
    servicio: "activo",
    reservas: reservas.length,
    solicitudId: res.locals.solicitudId
  });
});
const reservasRouter = express.Router();

function prepararAreaReservas(req, res, next) {
  res.locals.seccion = "Reservas de salas";
  next();
}
reservasRouter.use(prepararAreaReservas);
reservasRouter.get("/", (req, res) => {
  res.render("reservas/lista", {
    titulo: "Listado de Reservas",
    reservas
  });
});
reservasRouter.get("/nueva", (req, res) => {
  res.render("reservas/nueva", {
    titulo: "Nueva Reserva de Sala",
    error: null,
    valores: {},
    salasPermitidas,
    turnosPermitidos
  });
});
reservasRouter.get("/:id", (req, res) => {
  const idNum = Number(req.params.id);
  const reserva = reservas.find((r) => r.id === idNum);
  if (!reserva) {
    return res.status(404).render("no-encontrado", {
      titulo: "Pagina no encontrada",
      mensaje: `No existe ninguna reserva con el ID ${req.params.id}.`
    });
  }
  res.render("reservas/detalle", {
    titulo: `Detalle de Reserva #${reserva.id}`,
    reserva
  });
});
function validarReserva(req, res, next) {
  let { estudiante, email, sala, fecha, turno, personas } = req.body;
  estudiante = estudiante ? estudiante.trim() : "";
  email = email ? email.trim() : "";
  sala = sala ? sala.trim() : "";
  fecha = fecha ? fecha.trim() : "";
  turno = turno ? turno.trim() : "";
  const personasNum = Number(personas);
  const valores = { estudiante, email, sala, fecha, turno, personas };
  if (!estudiante || !email || !sala || !fecha || !turno || !personas) {
    return res.status(400).render("reservas/nueva", {
      titulo: "Nueva Reserva de Sala",
      error: "Todos los campos son obligatorios.",
      valores,
      salasPermitidas,
      turnosPermitidos
    });
  }
  if (!salasPermitidas.includes(sala)) {
    return res.status(400).render("reservas/nueva", {
      titulo: "Nueva Reserva de Sala",
      error: "La sala seleccionada no pertenece a las salas permitidas.",
      valores,
      salasPermitidas,
      turnosPermitidos
    });
  }
  if (!turnosPermitidos.includes(turno)) {
    return res.status(400).render("reservas/nueva", {
      titulo: "Nueva Reserva de Sala",
      error: "El turno seleccionado no es valido.",
      valores,
      salasPermitidas,
      turnosPermitidos
    });
  }
  if (isNaN(personasNum) || !Number.isInteger(personasNum) || personasNum < 1 || personasNum > 6) {
    return res.status(400).render("reservas/nueva", {
      titulo: "Nueva Reserva de Sala",
      error: "La cantidad de personas debe ser un entero entre 1 y 6.",
      valores,
      salasPermitidas,
      turnosPermitidos
    });
  }
  if (!email.includes("@")) {
    return res.status(400).render("reservas/nueva", {
      titulo: "Nueva Reserva de Sala",
      error: "El email debe contener al menos un caracter @.",
      valores,
      salasPermitidas,
      turnosPermitidos
    });
  }
  req.reservaValidada = {
    estudiante,
    email,
    sala,
    fecha,
    turno,
    personas: personasNum
  };
  next();
}
function crearReserva(req, res) {
  contadorReservaId++;
  const nuevaReserva = {
    id: contadorReservaId,
    ...req.reservaValidada
  };
  reservas.push(nuevaReserva);
  res.redirect("/reservas");
}
reservasRouter.post("/", validarReserva, crearReserva);
app.use("/reservas", reservasRouter);
app.use((req, res) => {
  res.status(404).render("no-encontrado", {
    titulo: "Pagina no encontrada",
    mensaje: "La direccion solicitada no existe."
  });
});
app.listen(PORT, () => {
  console.log(`Servidor iniciado en http://localhost:${PORT}`);
});
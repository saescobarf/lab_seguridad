const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = 8080;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Inicializar Base de Datos SQLite
const db = new sqlite3.Database('./usuarios.db', (err) => {
  if (err) console.error('Error al conectar a SQLite:', err.message);
  else console.log('Conectado a la base de datos SQLite.');
});

// Crear tabla e insertar usuario semilla por defecto
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL
  )`);

  // Usuario por defecto para pruebas
  const sqlInsert = `INSERT OR IGNORE INTO usuarios (nombre, email, password) VALUES (?, ?, ?)`;
  db.run(sqlInsert, ['Usuario Admin', 'sergioescobar@gmail.com', 'Mexico123'], (err) => {
    if (!err) console.log('Usuario por defecto disponible: sergioescobar@gmail.com / Mexico123');
  });
});


// ----------------------------------------------------
// RUTA 1: LOGIN (Módulo de Autenticación)
// ----------------------------------------------------
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Debes proporcionar correo y contraseña' });
  }

  // Búsqueda del usuario con contraseña en texto plano (Ideal para captura con Wireshark)
  const sql = `SELECT id, nombre, email FROM usuarios WHERE email = ? AND password = ?`;
  db.get(sql, [email, password], (err, row) => {
    if (err) {
      return res.status(500).json({ error: 'Error en el servidor' });
    }
    if (!row) {
      return res.status(401).json({ error: 'Credenciales inválidas (Correo o contraseña incorrectos)' });
    }
    // Login exitoso
    res.json({ mensaje: 'Inicio de sesión exitoso', usuario: row });
  });
});

// ----------------------------------------------------
// RUTA 2: ALTA DE USUARIOS
// ----------------------------------------------------
app.post('/api/usuarios', (req, res) => {
  const { nombre, email, password } = req.body;

  if (!nombre || !email || !password) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios' });
  }

  const sql = `INSERT INTO usuarios (nombre, email, password) VALUES (?, ?, ?)`;
  db.run(sql, [nombre, email, password], function (err) {
    if (err) {
      return res.status(400).json({ error: 'El correo ya está registrado.' });
    }
    res.json({ mensaje: 'Usuario registrado exitosamente', id: this.lastID });
  });
});

// ----------------------------------------------------
// RUTA 3: LISTADO DE USUARIOS
// ----------------------------------------------------
app.get('/api/usuarios', (req, res) => {
  const sql = `SELECT id, nombre, email, password FROM usuarios`;
  db.all(sql, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor con Login corriendo en http://localhost:${PORT}`);
});

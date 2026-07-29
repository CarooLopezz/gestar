# GESTAR+

Migración del prototipo HTML/JS original a **React (frontend)** + **Flask (backend API)**.

## Estructura

```
gestar/
├── backend/          # API Flask
│   ├── app.py
│   └── requirements.txt
└── frontend/          # React + Vite + Tailwind
    ├── src/
    │   ├── api/client.js         # cliente HTTP hacia el backend
    │   ├── components/           # un componente .jsx por pantalla/sección
    │   ├── hooks/useToast.js
    │   ├── App.jsx
    │   └── main.jsx
    ├── index.html
    └── package.json
```

## Backend (Flask)

```bash
cd backend
python -m venv venv
source venv/bin/activate      # en Windows: venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

Levanta en `http://localhost:5000`. Endpoints disponibles:

| Método | Ruta                      | Descripción                          |
|--------|---------------------------|---------------------------------------|
| GET    | /api/patients             | Lista de embarazadas                  |
| POST   | /api/patients             | Registrar embarazada                  |
| GET    | /api/bp                   | Historial de presión arterial         |
| POST   | /api/bp                   | Registrar presión arterial            |
| POST   | /api/login                | Login de paciente (email + DNI)       |
| GET    | /api/symptoms/<dni>       | Historial de síntomas de una paciente |
| POST   | /api/symptoms             | Registrar síntomas                    |

Los datos se guardan **en memoria** (listas de Python), igual que el prototipo original — se pierden al reiniciar el servidor. Para producción, reemplazar por una base de datos (SQLite/PostgreSQL + SQLAlchemy).

## Frontend (React)

```bash
cd frontend
npm install
cp .env.example .env    # opcional, ya apunta a localhost:5000
npm run dev
```

Levanta en `http://localhost:5173`.

## Notas de la migración

- La contraseña del login de paciente sigue siendo el **DNI**, tal cual el prototipo original (es solo una demo, no usar así en producción).
- Las validaciones que antes vivían en el JS del HTML (rangos de presión arterial, formato de email, DNI duplicado, síntomas obligatorios) ahora se validan **en el backend**, y el frontend muestra los errores que la API devuelve.
- Cada vista quedó separada en su propio componente (`RegisterPatientForm`, `PatientListTable`, `BloodPressureForm`, `PatientLoginForm`, `SymptomsForm`) en vez de un único archivo con `showScreen()`.

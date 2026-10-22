# HU14 · Mapa de Centros de Salud — pruebas de aceptación

Perfil: embarazada. Datos: 53 centros del Gran Mendoza (OpenStreetMap), en
`backend/data/centros_mendoza.json`.

## Automáticas

Correr antes de integrar:

- Backend, desde `backend/`: `python -m unittest discover tests` (5 pruebas)
- Frontend, desde `frontend/`: `npm test` (6 pruebas)

| Tarea | Qué se prueba | Resultado |
| --- | --- | --- |
| GT-147 | La lista de centros es pública y trae los 53 | OK |
| GT-147 | Cada centro tiene nombre, tipo válido y ubicación dentro del Gran Mendoza | OK |
| GT-147 | Hay centros de los tres tipos (hospital, centro de salud, clínica) | OK |
| GT-147 | La carga inicial no duplica centros ni pisa correcciones del equipo | OK |
| GT-148 | La distancia se calcula y se muestra bien (m / km) | OK |
| GT-148 | Con ubicación, del más cercano al más lejano; sin ella, por nombre | OK |
| GT-148 | El filtro por tipo deja solo ese tipo | OK |

## Manuales (en el navegador y en el celular)

| Tarea | Pasos | Resultado esperado |
| --- | --- | --- |
| GT-145 | Entrar como embarazada y tocar "Centros de salud" en el menú | Se abre el mapa centrado en Mendoza |
| GT-145 | En el celular, abrir el menú con el mapa en pantalla | El menú queda por encima del mapa |
| GT-146 | Entrar a la pantalla por primera vez | El navegador pide permiso de ubicación |
| GT-146 | Permitir la ubicación | El mapa se centra en la paciente y aparece el punto azul |
| GT-147 | Mirar el mapa | Cada centro tiene su ícono y color según el tipo, y hay leyenda |
| GT-147 | Tocar un ícono del mapa | Aparece una tarjeta con tipo, nombre, dirección, horario, teléfono y "Cómo llegar"; se cierra con ✕ |
| GT-148 | Con ubicación permitida | Indica cuál es el centro más cercano y a qué distancia; "Ver" abre su tarjeta |
| GT-148 | Elegir un tipo arriba del mapa (Hospital, Centro de salud...) | Quedan solo los centros de ese tipo |
| GT-148 | Tocar "Cómo llegar" | Abre el recorrido en Google Maps |
| GT-149 | Bloquear el permiso de ubicación | Aviso "No tenemos permiso..." con cómo activarlo y "Reintentar" |
| GT-149 | Apagar el GPS del celular y reintentar | Aviso "No pudimos encontrar tu ubicación" |
| GT-149 | Cortar internet con la pantalla abierta | Aviso "Estás sin conexión"; al volver, se actualiza solo |
| GT-149 | Entrar una vez con internet, después sin internet | Muestra la última lista guardada con aviso |
| GT-149 | Entrar por primera vez sin internet | Aviso "No pudimos cargar los centros" con "Reintentar" |

# HU15 · Chatbot — pruebas de aceptación y evidencias

Perfil: embarazada. El asistente se abre con el botón "💬 Asistente", abajo a
la derecha del portal. Responde con IA (Claude, modelo `claude-opus-5-5`).

## Configuración necesaria

- Variable de entorno `ANTHROPIC_API_KEY` en el backend (Render → Environment).
  Sin ella el asistente responde "El asistente no está configurado" y sugiere
  escribirle a la enfermera; el resto de la app funciona igual.
- Cada consulta tiene costo. Para acotarlo: respuestas cortas, esfuerzo bajo y
  un límite de 30 consultas por hora por paciente.

## Criterios de aceptación

| Tarea | Criterio | Cómo se cumple |
| --- | --- | --- |
| GT-152 | La usuaria tiene una interfaz de chat | Botón flotante y ventana con conversación, campo de texto y "Enviar"; en el celular ocupa toda la pantalla |
| GT-153 | Al abrir, recibe un mensaje de bienvenida con los horarios de atención | Saluda por el nombre, muestra "lunes a viernes de 8 a 20 h", dice si enfermería está atendiendo y qué hacer ante una urgencia (107) |
| GT-154 | Puede enviar mensajes y ver la conversación | Sus mensajes a la derecha, las respuestas a la izquierda, "Escribiendo..." mientras espera y un aviso si falla |
| GT-155 | Responde consultas generales y sobre horarios | La IA conoce el horario, cómo usar la app y los datos de la paciente (semana, turnos, estudios); ante señales de alarma indica llamar al 107; no diagnostica ni indica medicación |
| GT-156 | La bienvenida no se repite en la misma sesión | La conversación se guarda en la sesión del navegador; al recargar o cambiar de sección se retoma sin saludar de nuevo; al salir se borra |

## Pruebas automáticas

Correr antes de integrar:

- Backend, desde `backend/`: `python -m unittest discover tests` → 15 pruebas (10 de la HU15)
- Frontend, desde `frontend/`: `npm test` → 15 pruebas (9 de la HU15)

Las del backend usan un cliente falso de Claude: no llaman a la API ni generan costo.

| Tarea | Qué se prueba | Resultado |
| --- | --- | --- |
| GT-153 | Dentro y fuera del horario (días y horas límite) | OK |
| GT-153 | La bienvenida saluda por el nombre, muestra el horario y el 107 | OK |
| GT-154 | Responde a la usuaria y manda la conversación sin la bienvenida | OK |
| GT-154 | Rechaza conversaciones inválidas, mensajes de más de 500 caracteres y DNI inexistente | OK |
| GT-154 | Límite de 30 consultas por hora, por paciente | OK |
| GT-154 | Sin clave de la API avisa que no está disponible | OK |
| GT-155 | Usa `claude-opus-5-5` con respaldo automático ante rechazos | OK |
| GT-155 | Las instrucciones incluyen el horario, el 107 y la prohibición de diagnosticar | OK |
| GT-155 | El contexto dice si enfermería atiende y trae semana, turnos y estudios pendientes | OK |
| GT-155 | Si la IA rechaza una consulta, deriva a Mensajes y al 107 | OK |
| GT-156 | Primera vez: bienvenida; misma sesión: se retoma sin repetirla | OK |
| GT-156 | Al salir se borra; cada paciente tiene su propia conversación | OK |

## Pruebas manuales (con la clave configurada)

Completar la columna "Resultado" y adjuntar una captura de cada una como evidencia.

| Tarea | Pasos | Resultado esperado | Resultado |
| --- | --- | --- | --- |
| GT-152 | Entrar como embarazada y tocar "💬 Asistente" | Se abre la ventana del chat; en el celular, a pantalla completa | |
| GT-153 | Abrirlo por primera vez en un día hábil entre 8 y 20 h | Bienvenida con el horario y "Ahora enfermería está atendiendo" | |
| GT-153 | Abrirlo un sábado o después de las 20 h | Dice que está fuera de horario | |
| GT-154 | Escribir "Hola" y enviar | Aparece "Escribiendo..." y después la respuesta | |
| GT-155 | Tocar "¿Cuál es el horario de atención?" | Responde lunes a viernes de 8 a 20 h | |
| GT-155 | Preguntar "¿Cuándo es mi próximo turno?" teniendo un turno agendado | Responde con el turno correcto | |
| GT-155 | Preguntar "¿Cómo cargo mi peso?" | Explica la sección Peso | |
| GT-155 | Escribir "Tengo sangrado" | Lo primero que dice es llamar al 107 o ir a la guardia | |
| GT-155 | Preguntar "¿Puedo tomar ibuprofeno?" | No indica medicación; sugiere consultar a su enfermera o médico | |
| GT-156 | Escribir algo, recargar la página y abrir el chat | Sigue la conversación, sin bienvenida nueva | |
| GT-156 | Tocar "Salir", volver a entrar y abrir el chat | Vuelve a aparecer la bienvenida | |
| GT-154 | Cortar internet y enviar un mensaje | Aviso de que no se pudo enviar; el mensaje escrito no se pierde | |

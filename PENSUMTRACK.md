# PensumTrack — Descripción de la aplicación

## ¿Qué es PensumTrack?

PensumTrack es una aplicación web para estudiantes universitarios que permite llevar el control de su carrera académica: saber qué materias han aprobado, cuáles pueden cursar, cómo van avanzando en su pensum y consultar información sobre los profesores de su universidad.

---

## Acceso y cuenta

### Registro
El estudiante crea su cuenta ingresando nombre, usuario, correo electrónico y contraseña. Al registrarse se le envía un código de 6 dígitos al correo para verificar su cuenta antes de poder entrar.

### Inicio de sesión
Puede entrar con su correo o nombre de usuario y contraseña. Si aún no ha verificado su correo, se le redirige automáticamente a la pantalla de verificación.

### Verificación de correo
Pantalla con 6 casillas donde el estudiante ingresa el código recibido. Puede reenviar el código si no le llegó (con espera de 60 segundos entre intentos).

### Onboarding (primera vez)
Después de verificar el correo, el estudiante elige su universidad y su carrera, e indica en qué cuatrimestre/semestre se encuentra actualmente. Este paso configura su pensum de seguimiento.

### Perfil
El estudiante puede cambiar su nombre y contraseña, y ver las carreras que tiene registradas. También puede agregar una segunda carrera si está cursando dos a la vez.

---

## Seguimiento académico

### Dashboard (Inicio)
La pantalla principal muestra de un vistazo:
- Porcentaje de avance en la carrera
- Cuántas materias ha aprobado, están en curso, disponibles para cursar o pendientes
- Promedio ponderado e índice académico
- Las materias que está cursando actualmente, con opción de marcarlas como aprobadas directamente desde ahí

### Pensum completo
Muestra todas las materias del plan de estudios organizadas por cuatrimestre. Cada materia tiene un color según su estado:
- **Aprobada** — verde
- **En curso** — amarillo
- **Disponible** (puede cursarla) — azul
- **Bloqueada** (le faltan prerrequisitos) — gris/naranja
- **Fallida** — rojo

Al tocar cualquier materia se abre un panel con los detalles: código, créditos, prerrequisitos, y botones para cambiar el estado (aprobar, marcar en curso, registrar nota y período).

Se puede buscar una materia por nombre o código, y filtrar por estado.

### Mapa de prerrequisitos
Vista visual del pensum donde las materias están conectadas por flechas según sus dependencias. Permite entender de un vistazo cómo están encadenadas las materias y qué se necesita para llegar a las más avanzadas.

### Desbloqueo
Lista de materias bloqueadas indicando exactamente qué prerrequisitos le faltan a cada una. También muestra las materias que ya están disponibles para cursar.

### Preselección
Permite organizar los períodos académicos (cuatrimestres, semestres). El flujo es:
1. **Crear un período** con nombre y fechas (ej: "Enero–Mayo 2025")
2. **Agregar materias** al período (solo las que están disponibles)
3. **Confirmar** el período para marcarlo como en curso
4. Al terminar, **cerrar el período** registrando el resultado de cada materia (aprobada/fallida y nota)

Los períodos cerrados quedan como historial.

---

## Profesores

### Listado de profesores
Muestra todos los profesores registrados en la plataforma. Se puede buscar por nombre y filtrar por universidad o materia. Cada tarjeta muestra la calificación promedio del profesor, las universidades donde da clase y las materias que imparte.

### Detalle del profesor
Al entrar al perfil de un profesor se puede ver:
- Calificación promedio en 6 dimensiones: **Puntualidad, Explicación, Dominio, Exigencia, Personalidad y Apoyo**
- Las materias que imparte, en qué universidad y en qué horario (mañana/tarde/noche)
- Calificaciones y promedios específicos por materia
- Comentarios de otros estudiantes (pueden ser anónimos)

Desde esta pantalla el estudiante puede:
- **Calificar al profesor** en una o varias de las materias que imparte (del 1 al 10 en cada dimensión). Si ya calificó antes, puede actualizar su nota.
- **Dejar un comentario** eligiendo si quiere que aparezca su nombre o de forma anónima.
- **Solicitar una actualización** de la información del profesor si nota que hay algo incorrecto o desactualizado.

### Solicitar agregar un profesor
Si un profesor no está en la plataforma, el estudiante puede sugerir agregarlo indicando su nombre, universidad, las materias que imparte (seleccionadas del listado de materias de esa universidad), horario habitual y una descripción opcional. Un administrador revisa y aprueba la solicitud, y el estudiante recibe un correo con el resultado.

---

## Solicitar nueva carrera o pensum
Si la carrera del estudiante no está en la plataforma, puede enviar una solicitud indicando la universidad, el nombre de la carrera, el año del plan de estudios y un enlace de referencia. El equipo lo revisa y notifica por correo cuando se agrega.

---

## Notificaciones por correo

La aplicación envía correos en los siguientes casos:
- Al registrarse o iniciar sesión sin verificar: **código OTP de verificación**
- Al cambiar contraseña (el usuario mismo o el admin): **aviso de cambio de contraseña**
- Cuando el admin aprueba o rechaza una solicitud de carrera/pensum: **notificación de resultado**
- Cuando el admin aprueba o rechaza una solicitud de profesor: **notificación de resultado**
- Cuando el admin aprueba o rechaza una solicitud de actualización de profesor: **notificación de resultado**

---

## Tema visual
La aplicación tiene modo claro y modo oscuro. El usuario puede cambiar entre los dos en cualquier momento desde la barra de navegación.

---

## Panel de administración

Solo accesible para usuarios administradores.

### Usuarios
Lista de todos los usuarios registrados. El admin puede:
- Buscar por nombre o correo
- Ver el rol, estado (activo/inactivo) y plan asignado de cada usuario
- Activar o desactivar cuentas
- Dar o quitar permisos de administrador
- Asignar un plan a un usuario
- Restablecer la contraseña de un usuario (se le notifica por correo)
- Eliminar usuarios
- Realizar acciones en masa (activar, desactivar, eliminar, asignar plan a varios a la vez)

### Planes
Creación de planes de acceso con diferentes características o funcionalidades (ej: plan gratuito, plan premium). Se pueden asignar a usuarios.

### Solicitudes de pensum
Lista de solicitudes enviadas por estudiantes para agregar carreras o pensums. El admin puede cambiar el estado: pendiente, en revisión, completada o rechazada. Al resolverla se notifica al estudiante.

### Pensums
Gestión de los planes de estudio cargados en la plataforma. El admin puede importar un pensum desde un archivo CSV con los datos de las materias (código, nombre, créditos, semestre, prerrequisitos). Hay una vista previa antes de confirmar la importación. También puede activar o desactivar versiones de pensum.

### Carreras
Crear, editar y eliminar carreras asociadas a universidades.

### Universidades
Crear, editar y eliminar universidades con nombre, abreviatura, país y logo.

### Profesores
Gestión completa del módulo de profesores:
- **Profesores:** crear profesores manualmente y agregar las materias que imparte (con selección desde el listado de materias de la universidad)
- **Solicitudes:** aprobar o rechazar solicitudes de nuevos profesores enviadas por estudiantes. Al aprobar una solicitud con universidad conocida, el profesor se crea automáticamente.
- **Actualizaciones:** aprobar o rechazar solicitudes de corrección de información de profesores existentes.

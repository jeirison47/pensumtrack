# PensumTrack — Descripción de la aplicación

## ¿Qué es PensumTrack?

PensumTrack es una aplicación web para estudiantes universitarios que permite llevar el control de su carrera académica: saber qué materias han aprobado, cuáles pueden cursar, cómo van avanzando en su pensum y consultar información sobre los profesores de su universidad.

---

## Página de inicio (Landing)

Página pública de presentación a la que llegan los visitantes que no han iniciado sesión (y a la que el usuario puede volver desde su perfil). Incluye:
- **Características** de la aplicación (visualizar pensum, mapa de prerrequisitos, preselección, desbloqueo, seguimiento de progreso, profesores y reseñas, múltiples universidades, solicitar pensum).
- **Planes y precios**, cargados dinámicamente desde la configuración real: cada plan muestra su nombre, descripción, precio en **USD y su equivalente en pesos dominicanos (RD$)** según la tasa configurada, y la lista de funciones incluidas. Siempre se mantiene sincronizada con los planes que defina el administrador.
- **Contacto:** correo (pensumtrackapp@gmail.com) y WhatsApp (809-980-9245) para soporte y activación de planes.
- Botones para registrarse o iniciar sesión.

---

## Acceso y cuenta

### Registro
El estudiante crea su cuenta ingresando nombre, usuario, correo electrónico y contraseña. Al registrarse se le envía un código de 6 dígitos al correo para verificar su cuenta antes de poder entrar.

El formulario está protegido con una **verificación anti-bot (CAPTCHA de Cloudflare Turnstile)**, normalmente invisible para el usuario. Antes de crear la cuenta o enviar el correo, el servidor valida esa verificación; así se evita que bots creen cuentas masivamente y agoten el envío de correos.

### Inicio de sesión
Puede entrar con su correo o nombre de usuario y contraseña. Si aún no ha verificado su correo, se le redirige automáticamente a la pantalla de verificación.

### Verificación de correo
Pantalla con 6 casillas donde el estudiante ingresa el código recibido. Puede reenviar el código si no le llegó (con espera de 60 segundos entre intentos).

### Onboarding (primera vez)
Después de verificar el correo, el estudiante elige su universidad y su carrera, e indica en qué cuatrimestre/semestre se encuentra actualmente. Este paso configura su pensum de seguimiento.

### Perfil
El estudiante puede cambiar su nombre y contraseña, y ver las carreras que tiene registradas. La **primera carrera es gratuita**; agregar una segunda carrera (o más) requiere un plan de pago con la función de múltiples carreras.

Desde el perfil también puede:
- Ver su **plan actual** y, si es de pago, la **fecha de vencimiento** (con avisos cuando está por vencer o ya venció).
- Consultar todos los planes disponibles, **solicitar un plan** o **renovar** el actual.
- Ir a la **página principal** (landing) de la aplicación.
- Cerrar sesión.

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

## Planes, funciones premium y pagos

### Cómo funcionan los planes
La aplicación funciona con un modelo de **plan gratuito + planes de pago**. Cada plan tiene un nombre personalizable, un precio y una lista de **funciones (features)** que habilita. El acceso a las pantallas y acciones avanzadas se controla según las funciones del plan del usuario.

Funciones que se pueden incluir en un plan:
- **Marcar materias** (en curso, aprobadas, fallidas)
- **Registrar notas** numéricas
- **Estadísticas de progreso** (porcentaje de avance, promedios e índice académico)
- **Preselección de materias** (períodos académicos)
- **Vista de desbloqueo**
- **Múltiples carreras** (más de una carrera a la vez; la primera siempre es gratis)
- **Detalle de profesores**
- **Calificar profesores**
- **Solicitar agregar profesor**
- **Solicitar agregar pensum**

### Bloqueo de funciones (feature gating)
Cuando el usuario intenta usar una función que su plan no incluye, ve un **candado** y un aviso ("Función no disponible en tu plan") con un botón para **ver los planes disponibles**. Las pantallas completas que requieren plan muestran un estado bloqueado en lugar del contenido.

### Solicitar o renovar un plan
Desde el perfil, al elegir un plan, el usuario:
1. Selecciona el **método de pago**: transferencia bancaria o PayPal/tarjeta.
2. Indica cómo enviará el comprobante: **subirlo en la app** o enviarlo por **correo/WhatsApp**.
3. Si lo sube en la app, el comprobante (solo **imágenes**) se **optimiza automáticamente** en el dispositivo para reducir su peso y se guarda de forma segura y **privada** en la nube.
4. Se crea una **solicitud de plan** que el administrador revisa.

El comprobante solo es visible para el administrador (a través de un acceso autenticado) y se **elimina automáticamente** cuando la solicitud se aprueba o rechaza, para no acumular archivos.

Un usuario con plan de pago vigente puede **renovar** el mismo plan; si renueva antes de vencer, los días se **acumulan** desde su fecha de vencimiento.

### Vencimiento mensual
Los planes de pago duran **30 días**. El plan gratuito no vence. La aplicación gestiona el vencimiento automáticamente:
- Cuando un plan vence, el usuario vuelve al plan gratuito y se pausan las funciones premium (su información se conserva).
- Se envían **recordatorios por correo** cuando faltan 3 días y 1 día para vencer, y un aviso cuando ya venció.
- Un **proceso automático diario** (cron) baja a los usuarios vencidos al plan gratuito y dispara esos correos.

### Tasa de cambio USD/DOP
Los precios se definen en dólares (USD) y se muestran también convertidos a pesos dominicanos (RD$). El administrador configura la tasa de cambio: puede **consultar la tasa actual** desde una fuente externa y **guardarla**, o **ingresarla manualmente**. La tasa guardada se usa en toda la app (landing, perfil y panel admin).

---

## Notificaciones por correo

La aplicación envía correos en los siguientes casos:
- Al registrarse o iniciar sesión sin verificar: **código OTP de verificación**
- Al cambiar contraseña (el usuario mismo o el admin): **aviso de cambio de contraseña**
- Cuando el admin aprueba o rechaza una solicitud de carrera/pensum: **notificación de resultado**
- Cuando el admin aprueba o rechaza una solicitud de profesor: **notificación de resultado**
- Cuando el admin aprueba o rechaza una solicitud de actualización de profesor: **notificación de resultado**
- Cuando el admin aprueba o rechaza una **solicitud de plan**: **notificación de resultado**
- Cuando un plan de pago **está por vencer** (3 días y 1 día antes): **recordatorio de renovación**
- Cuando un plan de pago **vence**: **aviso de vencimiento** (la cuenta vuelve al plan gratuito)

---

## Tema visual
La aplicación tiene modo claro y modo oscuro. El usuario puede cambiar entre los dos en cualquier momento desde la barra de navegación.

---

## Navegación

La aplicación se adapta al dispositivo:
- **En computadora:** barra de navegación superior con acceso a Inicio, Pensum, Preselección, Profesores, Mapa (y Admin para administradores).
- **En móvil:** barra inferior fija con los mismos accesos directos y un encabezado superior con el logo. Hasta que el estudiante no configura su carrera (onboarding), solo se muestra el acceso a Inicio.

---

## Aplicación instalable (PWA)
PensumTrack es una **aplicación web progresiva (PWA)**: se puede **instalar en el teléfono o la computadora** como si fuera una app nativa, con su propio ícono, y abrirse en pantalla completa sin la barra del navegador.

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
Gestión de los planes de acceso. El admin puede:
- **Crear y editar planes** (cada uno en su propia pantalla) con nombre, descripción, precio en USD, marcar cuál es el plan por defecto (gratuito) y seleccionar qué **funciones** habilita mediante casillas.
- **Eliminar** planes.
- Ver cada plan con su precio en USD y su equivalente en RD$ según la tasa configurada.

### Tasa de cambio
Configuración de la tasa USD→DOP usada para mostrar los precios en pesos. El admin puede **obtener la tasa actual** desde una fuente externa para previsualizarla, **ajustarla manualmente** y **guardarla**. Se muestra la fecha de la última actualización.

### Pagos / Solicitudes de plan
Lista de solicitudes de plan enviadas por los usuarios, con el método de pago, el comprobante (si lo subieron) y el estado. El admin puede ver el comprobante mediante un acceso autenticado, y **aprobar** (activa el plan y, si es de pago, fija su vencimiento a 30 días) o **rechazar** la solicitud. En ambos casos el usuario recibe un correo con el resultado y el comprobante se elimina del almacenamiento.

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

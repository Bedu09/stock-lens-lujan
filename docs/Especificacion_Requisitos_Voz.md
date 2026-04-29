# Especificación de Requisitos de Software (ERS)
## Módulo: Búsqueda por Voz y Respuestas Auditivas

### 1. Introducción
**Propósito:**
El propósito de este documento es definir los requisitos del sistema para la nueva funcionalidad de "Búsqueda de artículos por voz", implementada en la aplicación StockMLuján. Esta funcionalidad permite a los usuarios consultar el stock y la ubicación de las piezas utilizando comandos de lenguaje natural, agilizando el uso en entornos de depósito.

### 2. Descripción General
La funcionalidad se integra directamente en la vista principal (`Index.tsx`) de la aplicación junto a los controles de búsqueda tradicionales. Utiliza las interfaces nativas del navegador Web Speech API (tanto `SpeechRecognition` para la transcripción como `SpeechSynthesis` para la lectura de respuestas).

---

### 3. Requisitos Funcionales (RF)

- **RF-01: Interfaz de Usuario (Micrófono)**
  El sistema debe disponer de un botón con un ícono identificable (ej. micrófono) posicionado junto al botón principal de "Buscar". Este botón iniciará la escucha interactiva.

- **RF-02: Captura de Audio y Permisos**
  El sistema debe solicitar permisos de uso de micrófono e invocar `window.SpeechRecognition` configurado en idioma Español (`es-AR`). Mientras esté escuchando, el botón deberá aplicar una animación para darle indicaciones visuales al usuario.

- **RF-03: Procesamiento de Lenguaje Natural Simplificado**
  El sistema debe transcribir la voz a texto y poseer una lógica deductiva para omitir palabras conectivas o que hagan mella textual (ej. "dónde", "están", "charly", "como").

- **RF-04: Ejecución de Búsqueda Flexible**
  Tras extraer la consulta, el sistema ejecutará un filtro combinado sobre el catálogo interno de productos buscando coincidencias de la descripción transcrita y devolviendo los artículos que empaten.

- **RF-05: Síntesis de Voz Asistida (Respuesta Spoken)**
  Si la búsqueda tiene variaciones exitosas, la aplicación deberá emitir una respuesta hablada en un lenguaje natural al usuario, avisando cuántos productos/cuál producto encontró y su ubicación.

- **RF-06: Parseo de Ubicaciones Semánticas**
  Para su fácil comprensión auditiva, el sistema deberá transcribir un código de ubicación técnica (`Dep X-YY-Z`) a un dictado verbal y humano.
  *Ejemplo de entrada:* `Dep D-23-2`
  *Ejemplo hablado:* `"Depósito D, estantería 23, fila 2"`.

- **RF-07: Manejo de Carencia de Resultados**
  Si el intérprete de sistema omite resultados frente a la consulta vocal de un producto inexistente, informará visible y auditivamente: *"No encontré ningún artículo que coincida con tu búsqueda"*.

---

### 4. Requisitos No Funcionales (RNF)

- **RNF-01: Compatibilidad de Navegadores**
  La funcionalidad exige compatibilidad con cualquier entorno que provea la interfaz Experimental de Safari o la Standard de Chrome (`window.webkitSpeechRecognition` o `window.SpeechRecognition`). De no haber soporte, se bloqueará la ejecución del script indicándolo mediante una alerta visual tipo "toast".
  
- **RNF-02: Accesibilidad**
  El estado del botón (actividad o reposo de escucha) debe estar acompañado de indicadores textuales visuales en pantalla para evitar frustraciones al usuario.

- **RNF-03: Respuesta Local Inmediata**
  La carga de la respuesta y la evaluación del texto transcrito contra en el IndexedDB (`db.ts`) debe generarse localmente de manera asíncrona pero sin dependencia real a latencia de red, garantizando fluidez.

---
*Documento generado tras la integración de la rama funcional de Speech-to-Text.*

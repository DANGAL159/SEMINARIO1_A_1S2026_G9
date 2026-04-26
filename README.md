# Manual Técnico

## Descripción de la Arquitectura

La aplicación web se construyó sobre **Amazon Web Services (AWS)** utilizando una arquitectura distribuida y escalable:

- **Frontend**: Aplicación web que consume servicios mediante API Gateway.
- **Backend**: Dos instancias **EC2** (Node.js/Python) detrás de un **Application Load Balancer (ELB)** para alta disponibilidad y distribución de tráfico.
- **Base de Datos**: **Amazon RDS (MySQL/PostgreSQL)** para persistencia de usuarios, publicaciones, comentarios y relaciones de amistad.
- **Almacenamiento de Imágenes**: **Amazon S3** (bucket `semi1proyecto-g#`) para fotos de perfil y publicaciones.
- **Autenticación y Registro**: **Amazon Cognito** para manejo de usuarios, login con credenciales y login con reconocimiento facial.
- **Reconocimiento Facial y Etiquetas**: **Amazon Rekognition** para login por foto y generación de etiquetas de imágenes para filtros.
- **Traducción de Contenido**: **Amazon Translate** para traducción de publicaciones y comentarios en varios idiomas.
- **Carga de Imágenes**: **API Gateway + Lambda** para subir imágenes al bucket S3 de forma segura.
- **Chat en Tiempo Real**: Comunicación entre amigos mediante **WebSockets** en el backend.
- **Chatbot Informativo**: **Amazon Lex** integrado para consultas sobre la facultad de ingeniería, con soporte de **Lambda** para respuestas dinámicas.
- **Seguridad y Control de Acceso**: Configuración de **IAM** con roles y políticas específicas para cada servicio.

---

## Usuarios IAM, Permisos y Roles

Se definieron los siguientes usuarios y roles en **AWS IAM** para garantizar seguridad y separación de responsabilidades:

### Roles Principales
- **Role-EC2-Backend**
  - Permite a las instancias EC2 comunicarse con RDS, S3 y enviar logs a CloudWatch.
  - Políticas: `AmazonRDSFullAccess`, `AmazonS3ReadOnlyAccess`, `CloudWatchAgentServerPolicy`.

- **Role-Lambda-ImageUpload**
  - Permite a las funciones Lambda procesar y almacenar imágenes en S3.
  - Políticas: `AmazonS3FullAccess`, `AWSLambdaBasicExecutionRole`.

- **Role-Cognito-Auth**
  - Permite a Cognito gestionar usuarios y enviar correos de verificación.
  - Políticas: `AmazonCognitoPowerUser`.

- **Role-Rekognition**
  - Permite a la aplicación usar Rekognition para login facial y etiquetas de imágenes.
  - Políticas: `AmazonRekognitionReadOnlyAccess`.

- **Role-Translate**
  - Permite a la aplicación traducir publicaciones y comentarios.
  - Políticas: `TranslateReadOnly`.

- **Role-LexBot**
  - Permite al bot de Amazon Lex responder consultas y ejecutar funciones Lambda.
  - Políticas: `AmazonLexFullAccess`, `AWSLambdaRole`.

### Usuarios IAM
- **AdminUser**
  - Acceso completo a todos los servicios para configuración inicial.
  - Políticas: `AdministratorAccess`.

- **DevUser**
  - Acceso limitado a EC2, RDS y S3 para desarrollo y pruebas.
  - Políticas: `AmazonEC2FullAccess`, `AmazonRDSFullAccess`, `AmazonS3FullAccess`.

- **ReadOnlyUser**
  - Acceso de solo lectura para auditorías y monitoreo.
  - Políticas: `ReadOnlyAccess`.

---

## Seguridad

- **Security Groups** configurados para:
  - Permitir tráfico HTTP/HTTPS al Load Balancer.
  - Restringir acceso a RDS únicamente desde las instancias EC2.
  - Permitir comunicación interna entre EC2 y Lambda.
- **Contraseñas encriptadas** en Cognito.
- **Verificación por correo electrónico** obligatoria para nuevos registros.
- **Buckets S3** con políticas de acceso restringido (solo mediante Lambda/API Gateway).  


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

# Caputras de pantalla  
<img width="1907" height="896" alt="alb" src="https://github.com/user-attachments/assets/0d047f62-098e-4478-b67f-34d818b46e62" />  
<br>
<img width="1919" height="679" alt="api-gateway" src="https://github.com/user-attachments/assets/6d2fca91-2d3a-4da5-a720-45343e5b4f78" /> 
<br>
<img width="1913" height="900" alt="bucket-s3" src="https://github.com/user-attachments/assets/cd735fde-8c96-4a4a-a5f1-7ea97bced42e" /> 
<br>
<img width="1919" height="903" alt="cloudfront" src="https://github.com/user-attachments/assets/3d92ff7e-957f-403b-9bc4-f014939e447f" /> 
<br>
<img width="1907" height="567" alt="cognito" src="https://github.com/user-attachments/assets/26ec729c-2a47-4b80-906f-8b545e9c0355" /> 
<br>
<img width="1906" height="367" alt="ec2" src="https://github.com/user-attachments/assets/5f4c1f9e-1119-4753-801c-c3f566641bc7" />  
<br>
<img width="1919" height="846" alt="IAM-roles" src="https://github.com/user-attachments/assets/5e9408c5-5ea8-4d0c-9c0f-4e2b4b6b6250" /> 
<br>
<img width="1917" height="712" alt="IAM-users" src="https://github.com/user-attachments/assets/ba6e3ead-8c75-4504-9963-d4a394183750" /> 
<br>
<img width="1919" height="801" alt="lambda" src="https://github.com/user-attachments/assets/dae7ca14-28c5-44f7-a3f2-f47064629a96" /> 
<br>
<img width="1889" height="897" alt="lex" src="https://github.com/user-attachments/assets/435322ca-c624-47a8-869c-d5967c921550" />
<br>
<img width="1891" height="389" alt="rds" src="https://github.com/user-attachments/assets/7eb75055-bfa5-46a5-a20b-b79e975865ff" /> 
<br>
<img width="1917" height="536" alt="vpc" src="https://github.com/user-attachments/assets/f283900a-a380-4f0e-8c68-f15caf70d3ef" />  
<br>
<img width="1545" height="757" alt="WhatsApp Image 2026-04-23 at 2 36 21 PM" src="https://github.com/user-attachments/assets/5a719f29-b3a8-4eff-b51a-bd79ff428be4" />  
<br>  

# Diagrama de Arquitectura Utilizada

                          ┌───────────────────────────┐
                          │       Usuarios Web        │
                          └─────────────┬─────────────┘
                                        │
                                        ▼
                          ┌───────────────────────────┐
                          │   Application Load Balancer│
                          └─────────────┬─────────────┘
                                        │
                ┌───────────────────────┴───────────────────────┐
                │                                               │
                ▼                                               ▼
   ┌───────────────────────────┐                 ┌───────────────────────────┐
   │         EC2 #1            │                 │         EC2 #2            │
   │  (Backend Node.js/Python) │                 │  (Backend Node.js/Python) │
   └─────────────┬─────────────┘                 └─────────────┬─────────────┘
                 │                                               │
                 └───────────────────────┬───────────────────────┘
                                         │
                                         ▼
                          ┌───────────────────────────┐
                          │           RDS             │
                          │ (MySQL/PostgreSQL DB)     │
                          └───────────────────────────┘

                                         │
                                         ▼
                          ┌───────────────────────────┐
                          │           S3              │
                          │ (Bucket semi1proyecto-g#) │
                          └───────────────────────────┘
                                         ▲
                                         │
                          ┌───────────────────────────┐
                          │   API Gateway + Lambda    │
                          │ (Carga de imágenes)       │
                          └───────────────────────────┘  

   
Servicios adicionales:
───────────────────────────────────────────────────────────────
- Cognito: Registro/Login de usuarios (credenciales y facial).
- Rekognition: Login facial y etiquetas de imágenes.
- Translate: Traducción de publicaciones y comentarios.
- Lex + Lambda: Chatbot informativo sobre la facultad.
- WebSockets: Chat en tiempo real entre amigos.
- IAM: Roles y permisos para seguridad y acceso controlado.


















# Verificación de Café Nube con cookies

Erian Badilla Fallas · 5 de noviembre de 2026

| Comprobación ejecutada | Resultado                                                                         |
| ---------------------- | --------------------------------------------------------------------------------- |
| Motor real             | MySQL 8.0.46, InnoDB                                                              |
| Runtime y ORM          | Node.js 24.22.1 y Sequelize 6.37.8                                                |
| API HTTP               | 28 pruebas aprobadas, 0 fallidas                                                  |
| React en Chromium      | 14 recorridos aprobados, sin errores JavaScript ni de recursos                    |
| Colección Postman      | 51 casos, 79 peticiones incluyendo preparación CSRF y 54 comprobaciones aprobadas |
| Sesión del navegador   | Cookie HttpOnly, SameSite=Lax, sin JWT en Web Storage                             |
| Logout                 | El servidor elimina ambas cookies con el mismo alcance                            |
| CSRF                   | Escritura sin token, alterada, de otra sesión o de origen ajeno rechazada         |
| Informe                | Word y PDF de 3 páginas inspeccionados                                            |
| Modelo                 | Siete entidades y SequelizeMeta; sin cambios de esquema por cookies               |

Se conservan las pruebas CRUD, precios históricos, DECIMAL, fechas, concurrencia, migración no destructiva, validación, 404 y 409. La autenticación comprueba JWT vencido, alterado, sin exp, de otro algoritmo/audiencia o con usuario inexistente. Se probaron registro/login con CSRF y valores de cookies no textuales sin producir un 500.

En Chromium se verificaron registro, login, recarga, seis módulos, confirmación/cancelación del cierre, desaparición de la cookie al cerrar y regreso al login con una cookie inválida. El atributo HttpOnly se inspeccionó con la API del navegador y se comprobó que no hay JWT en sessionStorage. El flujo real usó frontend y API en puertos distintos con credenciales CORS.

Todas las pruebas se realizaron en instancias MySQL aisladas con datos ficticios. No se accedió a la base del usuario. No se desplegó HTTPS real de producción; Secure está configurado para ese entorno. La eliminación de cookies no revoca copias externas de un JWT. Los informes crudos de Postman y capturas no se distribuyen para evitar incluir cookies o credenciales de prueba.

# Verificación de Café Nube Día 2

Erian Badilla Fallas · 5 de noviembre de 2026

| Comprobación ejecutada  | Resultado                                                                 |
| ----------------------- | ------------------------------------------------------------------------- |
| Motor real              | MySQL 8.0.46, InnoDB                                                      |
| Runtime y ORM           | Node.js 24.22.1 y Sequelize 6.37.8                                        |
| API HTTP contra MySQL   | 24 pruebas aprobadas, 0 fallidas                                          |
| React en Chromium       | 14 recorridos aprobados, sin errores JavaScript ni errores de recursos    |
| Postman mediante Newman | 47 peticiones y 49 comprobaciones aprobadas, 0 fallidas                   |
| Login y Registro        | Inspección adicional en escritorio y móvil sin desbordamiento             |
| Compilación de React    | Correcta, 57 módulos                                                      |
| Prettier                | Comprobación final correcta; configuración de formato al guardar incluida |
| Modelo MySQL            | 7 entidades, 5 FKs y SequelizeMeta como tabla técnica                     |
| Informe de tokens       | 3 páginas, Word/PDF renderizados e inspeccionados                         |

Se probaron registro, correo duplicado, validación de contraseñas, hash bcrypt real, ausencia de password en respuestas, login, perfil, vencimiento y todos los métodos CRUD sin token. También se comprobaron tokens alterados, sin exp, con algoritmo o audiencia incorrectos y con usuario inexistente. Se conservaron las pruebas de precios exactos, historial, rollback y concurrencia.

La migración se ejecutó sobre una base ficticia que reproducía las seis tablas del Día 1, se repitió y se verificaron los IDs, importes y filas. Una estructura con tablas ajenas se rechazó antes de modificarla. Los recorridos de React probaron acceso directo protegido, registro, login incorrecto/correcto, recarga, seis módulos, móvil, cancelación/confirmación del cierre y limpieza ante un 401.

Las pruebas usaron instancias MySQL aisladas y datos ficticios; no se accedió a la instalación del usuario. Las evidencias textuales están en Pruebas_API_MySQL.txt y Resumen_Pruebas.json. Los informes crudos de Postman y capturas del navegador no se incluyen para evitar distribuir tokens de prueba.

La aplicación se entrega para ejecución local. No se ha desplegado ni publicado un repositorio remoto. El cierre de sesión elimina el token del navegador; una copia externa conserva validez hasta su expiración. sessionStorage mantiene riesgo de XSS, explicado en la investigación. No hay roles ni refresh tokens, conforme al alcance del Día 2.

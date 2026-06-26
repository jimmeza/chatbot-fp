# Ejemplo de aprovisionamiento en Azure (Bicep) y despliegue con Github Actions (CI/CD)

## Contexto:
Se crearón una aplicación Frontend y un servicio backend (con ayuda de Open Code y Claude Sonet 4.6) que simularán un chatbot, para desplegarlos en Azure (Basta con recursos de tier gratuito), un Static Web App para el FE y una Web Application para el BE.

Con ayuda del agente, se planificó el despliegue y se generarón los scripts de aprovisionamiento en Bicep y de despliegue para Github Actions, los que se corrigieron y adaptaron manualmente (La IA no es del todo mágica y se equivoca o necesita má contexto).

Se ejecutarón los scripts ajustados hasta que se obtuvo el aprovisionamiento correcto y despliegue fluido.

El FE es un SPA hecho usando Vite + Typescript, el BE es una API REST hecha con Python + FastAPI (usa CORS para filtrar las peticiones), se pude ver detalle de como ejecutar las pruebas localmente en el archivo AGENTS.md

## Siguientes pasos:
Conectar el BE a una base de datos Vectorial ingestada con articulos sobre el futbol peruano, usando un Agente RAG, donde le puedas indicar el proveedor de inteferencia y tu API Key para que la use al generar tus respuestas (Con un plan gratuito de Google debería ser suficiente para un par de respuestas por minuto).

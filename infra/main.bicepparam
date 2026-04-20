// infra/main.bicepparam — Valores de parámetros para el entorno dev
//
// Flujo de dos pasadas:
//   1ª pasada: desplegar con allowedOrigins vacío → obtener swaHostname del output.
//   2ª pasada: actualizar allowedOrigins con el hostname real y re-desplegar (idempotente).
//
// Ejemplo tras la 1ª pasada:
//   param allowedOrigins = 'https://black-xxx-yyy.azurestaticapps.net'

using './main.bicep'

param swaLocation = 'centralus'
param appLocation = 'canadacentral'
param swaName  = 'swa-cbfp-dev-02'
param aspName  = 'asp-cbfp-dev-free-01'
param webAppName = 'app-cbfp-api-dev-01'

// Hostname del SWA obtenido del output del despliegue vigente.
param allowedOrigins = 'https://jolly-sky-0078c0310.7.azurestaticapps.net'

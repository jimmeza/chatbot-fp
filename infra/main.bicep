// infra/main.bicep — Infraestructura chatbot-fp (free tier)
// Recursos: Static Web App, App Service Plan F1 Linux, Web App Python 3.13
//
// Uso (idempotente):
//   az deployment group create \
//     --resource-group rg-cbfp-dev-cac-01 \
//     --template-file infra/main.bicep \
//     --parameters infra/main.bicepparam
//
// NOTA DE DESPLIEGUE:
//   El backend usa uv (sin requirements.txt). El zip de despliegue debe incluir
//   el entorno virtual (.venv) o un startup script que instale uv y las dependencias.
//   Se desactiva Oryx build (SCM_DO_BUILD_DURING_DEPLOYMENT=false) para evitar fallos.

@description('Región Azure para el Static Web App.')
param swaLocation string = 'centralus'

@description('Región Azure para App Service Plan y Web App backend.')
param appLocation string = 'canadacentral'

@description('Nombre del Static Web App.')
param swaName string

@description('Nombre del App Service Plan.')
param aspName string

@description('Nombre del Web App (API backend).')
param webAppName string

@description('Orígenes permitidos para CORS (hostname del SWA). Vacío en el primer despliegue; actualizar con el hostname real y re-desplegar.')
param allowedOrigins string = ''

// ─── Static Web App — Free ────────────────────────────────────────────────────

resource swa 'Microsoft.Web/staticSites@2023-01-01' = {
  name: swaName
  location: swaLocation
  sku: {
    name: 'Free'
    tier: 'Free'
  }
  properties: {}
}

// ─── App Service Plan — F1 Free Linux ────────────────────────────────────────

resource asp 'Microsoft.Web/serverfarms@2023-01-01' = {
  name: aspName
  location: appLocation
  kind: 'linux'
  sku: {
    name: 'F1'
    tier: 'Free'
  }
  properties: {
    reserved: true // obligatorio para Linux
  }
}

// ─── Web App — Python 3.13 ───────────────────────────────────────────────────

resource webApp 'Microsoft.Web/sites@2023-01-01' = {
  name: webAppName
  location: appLocation
  kind: 'app,linux'
  properties: {
    serverFarmId: asp.id
    httpsOnly: true
    siteConfig: {
      linuxFxVersion: 'PYTHON|3.13'
      // El zip de despliegue debe incluir el .venv o instalar uvicorn por otro medio.
      appCommandLine: 'uvicorn app.main:app --host 0.0.0.0 --port 8000'
      appSettings: [
        {
          name: 'ALLOWED_ORIGINS'
          value: allowedOrigins
        }
        {
          // Habilitar Oryx build: instala requirements.txt en el contenedor Linux
          name: 'SCM_DO_BUILD_DURING_DEPLOYMENT'
          value: 'true'
        }
      ]
    }
  }
}

// ─── Outputs ──────────────────────────────────────────────────────────────────

@description('Hostname del Static Web App (usar como valor de allowedOrigins en el segundo despliegue).')
output swaHostname string = swa.properties.defaultHostname

@description('URL del Web App backend.')
output webAppUrl string = 'https://${webApp.properties.defaultHostName}'

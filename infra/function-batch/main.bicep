@description('Location for all resources (should match the existing backend App Service region)')
param location string = resourceGroup().location

@description('Base URL of the existing deployed share-story backend (App Service)')
param backendBaseUrl string

@description('Name prefix for the new batch-function resources')
param namePrefix string = 'sharestory-batch'

@description('Node.js version for the Function App runtime (LinuxFxVersion)')
param nodeVersion string = '24'

var resourceToken = uniqueString(resourceGroup().id, namePrefix)
var storageAccountName = toLower('st${take(replace(namePrefix, '-', ''), 10)}${take(resourceToken, 6)}')
var hostingPlanName = '${namePrefix}-plan'
var functionAppName = '${namePrefix}-func-${take(resourceToken, 6)}'
var appInsightsName = '${namePrefix}-appi'
var logAnalyticsName = '${namePrefix}-law'

// Storage account required by the Azure Functions runtime (AzureWebJobsStorage)
resource storageAccount 'Microsoft.Storage/storageAccounts@2023-01-01' = {
  name: storageAccountName
  location: location
  sku: { name: 'Standard_LRS' }
  kind: 'StorageV2'
  properties: {
    minimumTlsVersion: 'TLS1_2'
    allowBlobPublicAccess: false
    supportsHttpsTrafficOnly: true
    // Managed identity auth only; no shared key exposed to the app settings.
    allowSharedKeyAccess: true
  }
}

resource logAnalytics 'Microsoft.OperationalInsights/workspaces@2022-10-01' = {
  name: logAnalyticsName
  location: location
  properties: {
    sku: { name: 'PerGB2018' }
    retentionInDays: 30
  }
}

resource appInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: appInsightsName
  location: location
  kind: 'web'
  properties: {
    Application_Type: 'web'
    WorkspaceResourceId: logAnalytics.id
  }
}

// Classic Consumption (Y1) plan — simplest/cheapest option for 3 lightweight daily timer calls.
resource hostingPlan 'Microsoft.Web/serverfarms@2023-01-01' = {
  name: hostingPlanName
  location: location
  sku: {
    name: 'Y1'
    tier: 'Dynamic'
  }
  kind: 'functionapp'
  properties: {
    reserved: true
  }
}

resource functionApp 'Microsoft.Web/sites@2023-01-01' = {
  name: functionAppName
  location: location
  kind: 'functionapp,linux'
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    serverFarmId: hostingPlan.id
    httpsOnly: true
    siteConfig: {
      linuxFxVersion: 'Node|${nodeVersion}'
      ftpsState: 'Disabled'
      minTlsVersion: '1.2'
      appSettings: [
        { name: 'FUNCTIONS_EXTENSION_VERSION', value: '~4' }
        { name: 'FUNCTIONS_WORKER_RUNTIME', value: 'node' }
        { name: 'WEBSITE_NODE_DEFAULT_VERSION', value: '~${nodeVersion}' }
        { name: 'WEBSITE_RUN_FROM_PACKAGE', value: '1' }
        { name: 'WEBSITE_TIME_ZONE', value: 'Korea Standard Time' }
        { name: 'BACKEND_BASE_URL', value: backendBaseUrl }
        // Managed identity auth for the Functions runtime storage (no connection string/shared key in app settings).
        { name: 'AzureWebJobsStorage__credential', value: 'managedidentity' }
        { name: 'AzureWebJobsStorage__blobServiceUri', value: storageAccount.properties.primaryEndpoints.blob }
        { name: 'AzureWebJobsStorage__queueServiceUri', value: storageAccount.properties.primaryEndpoints.queue }
        { name: 'AzureWebJobsStorage__tableServiceUri', value: storageAccount.properties.primaryEndpoints.table }
        { name: 'APPLICATIONINSIGHTS_CONNECTION_STRING', value: appInsights.properties.ConnectionString }
      ]
    }
  }
}

// Storage Blob/Queue/Table Data Contributor roles for the Function App's managed identity
// (same role pattern as the official Azure Functions timer-trigger AZD template's rbac.bicep).
var storageBlobRoleId = 'ba92f5b4-2d11-453d-a403-e96b0029c9fe' // Storage Blob Data Contributor
var storageQueueRoleId = '974c5e8b-45b9-4653-ba55-5f855dd0fb88' // Storage Queue Data Contributor
var storageTableRoleId = '0a9a7e1f-b9d0-4cc4-a60d-0319b160aaa3' // Storage Table Data Contributor

resource blobRoleAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(storageAccount.id, functionApp.id, storageBlobRoleId)
  scope: storageAccount
  properties: {
    roleDefinitionId: resourceId('Microsoft.Authorization/roleDefinitions', storageBlobRoleId)
    principalId: functionApp.identity.principalId
    principalType: 'ServicePrincipal'
  }
}

resource queueRoleAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(storageAccount.id, functionApp.id, storageQueueRoleId)
  scope: storageAccount
  properties: {
    roleDefinitionId: resourceId('Microsoft.Authorization/roleDefinitions', storageQueueRoleId)
    principalId: functionApp.identity.principalId
    principalType: 'ServicePrincipal'
  }
}

resource tableRoleAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(storageAccount.id, functionApp.id, storageTableRoleId)
  scope: storageAccount
  properties: {
    roleDefinitionId: resourceId('Microsoft.Authorization/roleDefinitions', storageTableRoleId)
    principalId: functionApp.identity.principalId
    principalType: 'ServicePrincipal'
  }
}

output functionAppName string = functionApp.name
output functionAppHostName string = functionApp.properties.defaultHostName

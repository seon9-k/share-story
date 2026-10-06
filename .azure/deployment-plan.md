# Deployment Plan

Status: Ready for Validation (Phase 2 artifacts generated, Bicep validated via build + what-if; awaiting user approval to deploy)

## Goal
Run the three existing batch jobs in `be/src/modules/session/` on a schedule using Azure Functions Timer Triggers, instead of relying on manual/external HTTP calls to the already-deployed backend.

## Mode
MODIFY — existing application. Confirmed via Azure CLI (`az webapp list`):
- Existing App Service: `be-sharestory122` (resource group `be-sharestory122_group`, region `Korea Central`)
- Hostname: `https://be-sharestory122-aybeekcnfbd7fzac.koreacentral-01.azurewebsites.net`
- Runtime: `NODE|24-lts`
- Note: the GitHub Actions workflow (`.github/workflows/main_sharestory-be.yml`) references app name `sharestory-be`, which does not match the actual deployed app name `be-sharestory122`. Flagging this mismatch; not changing the existing workflow as part of this plan.

This plan adds a **new** Azure Function App (Consumption plan) alongside the existing App Service. No changes to the existing App Service or its deployment pipeline.

## Confirmed Requirements (from user)
- Scope: convert all 3 batch endpoints to Timer Triggers
- Implementation approach: Function timers call the existing deployed App Service's HTTP endpoints (no DB credential duplication, minimal code change)
- IaC approach: Bicep only, scoped to the new Function resources (no azd)
- Schedules (Korea Standard Time):
  | Job | Existing endpoint | Schedule (KST) |
  |---|---|---|
  | 회차 완료 자동 배치 | `POST /session/close` | 매일 07:00 |
  | Zoom 안내 메일 | `POST /session/zoom-mail` | 매일 08:00 |
  | 로그북 제출 안내 메일 | `POST /session/logbook-mail` | 매일 09:00 |
- Timer cron expressions will use local KST time via `WEBSITE_TIME_ZONE=Korea Standard Time` app setting (avoids manual UTC conversion).

## Architecture / Resources to Create
- 1x Storage Account (required by Azure Functions runtime)
- 1x Consumption (Y1) hosting plan
- 1x Function App (Node.js v4 programming model, 3 timer-triggered functions)
- 1x Application Insights (for monitoring/logs)
- App setting: `BACKEND_BASE_URL=https://be-sharestory122-aybeekcnfbd7fzac.koreacentral-01.azurewebsites.net`
- App setting: `WEBSITE_TIME_ZONE=Korea Standard Time`

## Files to be generated
- `infra/function-batch/main.bicep` — Storage, Plan, Function App, App Insights
- `functions-batch/` — new Node.js Function App project
  - `src/functions/closeSessions.js` (timer: `0 0 7 * * *`)
  - `src/functions/zoomMail.js` (timer: `0 0 8 * * *`)
  - `src/functions/logbookMail.js` (timer: `0 0 9 * * *`)
  - `host.json`, `package.json`, `local.settings.json` (gitignored)

## Target Azure Context
- Subscription: Azure in Open (`0cc9004b-4fd2-4923-92c1-a4bf09031ad8`)
- Resource Group: `be-sharestory122_group` (existing, reused)
- Region: Korea Central (matches existing App Service)

## Status Log
- Phase 1 plan drafted and presented to user for approval.
- User approved. Phase 2 artifacts generated:
  - Function code (Node.js v4 model, base pattern from official `timer-trigger-javascript-azd` MCP template): `functions-batch/`
  - Bicep (adapted from the same template's `app/api.bicep` + `app/rbac.bicep` patterns, trimmed to resource-group scope, Consumption plan, no VNet — per user's "Bicep only, no azd" choice): `infra/function-batch/main.bicep`
  - `az bicep build` — succeeded (exit 0)
  - `az deployment group what-if` against `be-sharestory122_group` — succeeded, clean `Create` plan for all resources, no errors
- Deployment (`az deployment group create`) has NOT been run yet — pending explicit user approval (creates real, billable Azure resources).



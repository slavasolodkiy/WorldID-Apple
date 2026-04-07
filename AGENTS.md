# AGENTS.md

## Mission
This repository is an Apple app replication project inspired by the World ID / Worldcoin product direction.

Your role is to evaluate and improve it as a reusable iOS-grade product foundation, not merely as a UI imitation.

## Priority goals
- assess whether this is a real app foundation or a clickable/demo shell
- improve architectural clarity
- improve separation between UI, state, services, and data
- identify missing product flows
- make the codebase easier to hand off and reuse

## What good looks like
A strong result should move this repo toward:
- a credible iOS application structure
- reusable screen/view architecture
- coherent navigation
- clear state management
- realistic user flows
- safe configuration and secret handling
- maintainable services and data boundaries

## Audit rules
When auditing this repository:
- evaluate what is actually implemented in code
- cite exact files, classes, structs, views, services, models, and managers
- classify findings into:
  - implemented
  - partially implemented
  - missing
  - mocked / stubbed
  - unclear
- do not confuse polished screens with product completeness

## Apple/iOS-specific review focus
Pay special attention to:
- app structure and entry points
- navigation model
- screen hierarchy and flow consistency
- state management
- model / view / service separation
- networking layer quality
- local persistence assumptions
- auth/session assumptions
- onboarding flow completeness
- permissions handling
- loading / empty / error / retry states
- validation and user feedback
- asset organization
- environment/config separation
- test readiness

## Reuse expectations
Prefer:
- reusable views/components
- clear models and view models
- isolated service layer
- centralized configuration
- environment-based setup
- minimal duplication
- clear naming and project organization

Avoid:
- hidden global state
- hardcoded credentials
- hardcoded endpoints in UI code
- fake backend assumptions
- shallow placeholder flows presented as completed product work

## Secrets and safety
Never expose or preserve:
- database URLs with credentials
- tokens
- secret keys
- unsafe defaults
- plaintext passwords
- production config in source

If found:
- flag immediately
- move to env/config strategy
- recommend `.env.example` or equivalent config template
- recommend rotating exposed secrets

## Product-maturity judgment
Always infer the current maturity level:
- static mockup
- clickable prototype
- MVP skeleton
- partial product
- near-production foundation

Justify the rating with concrete evidence.

## Output format
When asked to review or improve this repo, structure the output as:
1. Executive summary
2. App architecture summary
3. iOS replication depth assessment
4. Implemented vs partial vs missing
5. Mocked / stubbed / hardcoded areas
6. UX/product-flow gaps
7. Reuse blockers
8. Production-readiness blockers
9. Prioritized backlog:
   - critical
   - important
   - nice-to-have
10. Best next prompt for Replit

## Editing rules
Unless explicitly asked:
- do not rebuild the app from scratch
- do not add major dependencies without need
- do not over-engineer

When editing:
- prefer the smallest high-leverage changes
- preserve structure where possible
- improve maintainability and clarity
- make code easier for another engineer to continue
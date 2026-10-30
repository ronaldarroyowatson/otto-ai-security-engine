# Otto Repository Copilot Instructions

## Purpose

This repository is responsible for Otto AI Security Engine evaluates permissions, approval records, and policy boundaries for AI-driven actions.

## Repository Boundaries

Keep this repository scoped to policies, approvals, replay protection, grant checks, and audit decisions.

## Ecosystem Relationships

This repository fits into Otto by Protects Maestro and sandboxed agents from unauthorized actions, bypass attempts, and privilege escalation.

## Pragmatic Programmer Rules

- DRY: avoid duplicated logic and policy definitions.
- Orthogonality: each feature owns a single responsibility.
- Loose coupling: use contracts and adapters instead of hidden dependencies.
- High cohesion: keep feature logic colocated with tests and docs.
- Explicit contracts: prefer named interfaces, DTOs, and registry boundaries.
- Simplicity first: prefer clear code over clever abstractions.
- Traceability: every important decision should be captured in docs and ADRs.

Avoid:
- hidden dependencies
- duplicated logic
- framework lock-in
- circular references
- magic values
- tight coupling

## Feature-first Organization

Organize by feature, not by global service buckets.

## Command-Service Requirement

All executable actions must be routed through the Otto Command Service. Do not register ad-hoc CLI/API behavior outside the command model.

## Service and Event Registration

- Register services through the Otto service registry.
- Register internal events through the Otto event service.
- Keep configuration centralized and environment-aware.

## Testing

Every change must be backed by unit, contract, integration, and security regression coverage where applicable.

## Extensibility

Design for replaceable implementations and explicit extension points.

## Dependency Policy

Before adding a new dependency, verify whether Otto already owns the capability, whether it belongs in an existing shared repo, and whether a new shared capability should be promoted instead.

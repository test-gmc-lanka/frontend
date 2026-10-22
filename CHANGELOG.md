# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses
[Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added

- GitHub Actions CI/CD pipeline: lint and format check, build, unit tests with coverage, integration
  tests, dependency security scan, staging and production deploys.
- ESLint (Airbnb-aligned) and Prettier configuration.
- Vitest and Testing Library with first unit and integration tests.
- Dockerfile and nginx config for staging and production.
- Dependabot for npm and GitHub Actions updates.

### Changed

- Repository layout: the CI/CD pipeline, Dockerfile and nginx config moved to the `infra` repository
  (`.github/workflows/ci.yml` now calls the shared pipeline there), and the integration tests
  (`*.int.test.js`) moved to the `tests` repository. Behaviour of every stage is unchanged.
- Upgraded Vite 5 to Vite 8 to clear a high-severity advisory.

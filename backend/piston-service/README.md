# Piston Service for Google Cloud Run

This directory contains the custom Docker image configuration for deploying the Piston code execution service to Google Cloud Run.

## Overview

The custom image extends the base `ghcr.io/engineer-man/piston:latest` image and automatically installs language packages when the container starts. This addresses Cloud Run's limitations:
- **No privileged containers**: The image works without privileged mode
- **No persistent volumes**: Languages are installed on each container start (in the background)

## Files

- `Dockerfile.piston`: Custom Dockerfile that extends the base piston image
- `entrypoint.sh`: Entrypoint script that starts piston and triggers language installation
- `init-languages.sh`: Script that installs all required language packages via the Piston API

## Language Packages

The following languages are automatically installed:
- Python
- Node.js
- Java
- GCC (C/C++)
- Go
- Rust
- TypeScript
- PHP
- Ruby
- Mono (C#)
- Swift
- Kotlin
- Scala

## Building and Deploying

The image is automatically built and pushed when you run:

```bash
./scripts/build-and-push.sh <project-id> <region>
```

The image will be pushed to: `<region>-docker.pkg.dev/<project-id>/docker-repo/piston-api:latest`

## How It Works

1. Container starts and runs `entrypoint.sh`
2. Piston API server starts in the background
3. Entrypoint waits for Piston API to be ready (health check)
4. Language installation script runs in the background (non-blocking)
5. Container continues running with Piston API serving requests

## Notes

- Language installation happens in the background, so the container is ready to serve requests quickly
- First code execution requests may be slower if languages are still installing
- Languages are installed on each container start (no persistence between restarts)
- This is acceptable for Cloud Run's serverless model where containers can scale to zero


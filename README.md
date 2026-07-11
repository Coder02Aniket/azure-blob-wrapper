# Azure Blob Storage Integration Application

This repository contains both the frontend interface and the wrapper API for interacting with Azure Blob Storage.

## Repository Structure

- **[azure-blob-frontend](./azure-blob-frontend)**: A modern web interface built with React, TypeScript, and Vite for managing files/blobs.
- **[azure-blob-wrapper](./azure-blob-wrapper)**: A Spring Boot API wrapper built in Java for securely communicating with Azure Blob Storage services.

## Getting Started

### 1. Backend Wrapper (`azure-blob-wrapper`)
The backend provides a wrapper service for Azure Storage.

- **Prerequisites**: Java 17+, Maven.
- **Run locally**:
  ```bash
  cd azure-blob-wrapper
  ./mvnw spring-boot:run
  ```

### 2. Frontend Application (`azure-blob-frontend`)
The frontend client talks to the backend wrapper.

- **Prerequisites**: Node.js (v18+ recommended), npm or yarn.
- **Run locally**:
  ```bash
  cd azure-blob-frontend
  npm install
  npm run dev
  ```

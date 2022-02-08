# api

HexLab's new backend API with multiple services and a custom API gateway

## Getting Started

The packages in this repo are linked via Yarn Workspaces, so you only need to run `yarn install` once in the main root folder.

1. Copy `.env.example` to `.env` in the config folder
2. In the root folder, run `yarn install` to install all packages
3. Run `yarn start:all` to start all the services and gateway

## Overview

### Config

This packages handles the configuration for all the gateway and services. It specifies port numbers, database URLs, rate limiting, etc. Use this to setup and add new services.

### Gateway

The gateway handles all incoming requests. Based on the url format, it will forward the request to the appropriate service to handle it. For example, all requests starting with `/profiles` will be sent to the profile service.

### Services

Each of the services in this folder has a unique and distinct job. They each are setup with their own database and have their own routing system.

## Attribution

This project was inspired by [HackIllinois API repository](https://github.com/HackIllinois/api).

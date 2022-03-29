# api

HexLab's new backend API with multiple services and a custom API gateway

## Overview

Here's a breakdown of the major folders you'll interact with and what each one does.

### Config

This packages handles the configuration for all the gateway and services. It specifies port numbers,
database URLs, rate limiting, etc. Use this to setup and add new services.

### Gateway

The gateway handles all incoming requests. Based on the url format, it will forward the request to
the appropriate service to handle it. For example, all requests starting with `/users` will be sent
to the profile service.

### Services

Each of the services in this folder has a unique and distinct job. They each are setup with their
own database and have their own routing system.

## Getting Started

The packages in this repo are linked via Yarn Workspaces, so you only need to run `yarn install`
once in the main root folder.

1. Copy `.env.example` to `.env` in the `config` folder
2. Ask a team member for the secrets to fill in the `.env` file
3. Retrieve the `google-cloud-credentials.json` file from a team member and place in the `config`
   folder as well
4. In the root folder, run `yarn install` to install all packages
5. Run `yarn start:all` to start all the services and gateway

## Development Guide

Each service will be hosted on its own port, which will be printed to the console. So for example,
if you want to access the checkin service, this service is on port 8003, so you would make a request
to `localhost:8003` an access the appropriate path.

### Authentication

This project uses authentication via
[Google Cloud Identity Platform](https://cloud.google.com/identity-platform) that allows us to
easily manage user authentication with JWT. To login, visit
[login.hexlabs.org](https://login.hexlabs.org). Then, open the developer tools. On login, you will
see your user profile printed in the console tab. Your access token can be found under the
`accessToken` field. You can then use that with Bearer Authentication to authenticate against these
services. We recommend using Postman when doing local development. Thus, you would set your
authentication to `Beaer [accessToken]`.

**Note that these tokens expire very quickly after an hour, so you will often have to retrieve a new
token if you receive an unauthenticated error.**

## Attribution

This project was inspired by [HackIllinois API repository](https://github.com/HackIllinois/api).

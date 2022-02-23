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

1. Copy `.env.example` to `.env` in the config folder
2. In the root folder, run `yarn install` to install all packages
3. Run `yarn start:all` to start all the services and gateway

## Development Guide

When you start your services and gateway, you will get messages from the proxy in the console saying
"proxy created" and "proxy started". What this does is essentially forward your requests to the
appropriate service. All the requests you make should be through the URL and port of the gateway
(hosted locally at port 8000).

So for example, if you want to access the profile service, you would make a request to
`localhost:8000/users`. And the gateway will forward this request to the profile service. When the
service receives the request, it receivies it without the `/users`. So `/users/id` will become `/id`
for example.

### Authentication

This project uses authentication via
[Google Cloud Identity Platform](https://cloud.google.com/identity-platform) that allows us to
easily manage user authentication with JWT. To login, visit
[login.hexlabs.org](https://login.hexlabs.org). Once you retrieve your ID token, you can use that
with Bearer Authentication to authenticate against these services. We recommend using Postman when
doing local development.

Note that these tokens expire very quickly after an hour, so you will often have to retrieve a new
token.

## Attribution

This project was inspired by [HackIllinois API repository](https://github.com/HackIllinois/api).

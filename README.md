# api

HexLab's new backend API with multiple services and a custom API gateway.

## Motivation

Before this repo and initiative was started in early 2022, all of HexLab's projects existed with
their own separate client/server systems. Each individual project (ex. registration, prizes,
check-in, etc.) had their own repo with a server folder holding the backend code and the frontend
folder with a react client. On top of this, each server had their own individual authentication
code, and as such, a user would have to login each time individually they switched to use a
different tool.

As HexLab's services and offerings began to grow, we saw an increased need for service-to-service
communication (ex. prizes wanting to check if a user was registered for an event, timber wanting to
give participants points for submitting a project, etc.). As each server handled authentication
separately and their authentication methods weren't consistent, it was often tough or "jank" to
faciliate this communication.

Eventually, after months of research, we decided on the system you see today. All of our backend
services exist in a monorepo, but each server is deployed and managed differently through a
microservices architecture. This organization allows all the code to live in one repo where
service-to-service communication can be easily handled and common libraries can be easily shared.

Additionally, before this project started, all of HexLab's services were deployed through a
[Kubernetes](https://kubernetes.io/) cluster in Google Cloud through
[beekeeper](https://github.com/HackGT/beekeeper) and [beehive](https://github.com/HackGT/beehive).
This system provided an extremely robust and scaleable approach to managing our various servers.
However, as the people responsible for this development began to leave our organization, the system
fell out of development and it became extremely tough to manage our infrastructure. After all,
Kubernetes is a very powerful platform, but has a steep learning curve and requires an extensive
amount of management. After tough deliberation, we have worked to sunset this platform, and move
towards a simpler approach with [Google Cloud Run](https://cloud.google.com/run) and
[Cloudflare Pages](https://pages.cloudflare.com/).

## Background

To understand our services, you'll need to understand the following terminology:

- **monorepo**: a single repository that stores all of your code and assets for every project
- **microservices**: an architectural approach where software is composed of small, independent
  services that communicate over well-defined APIs

Essentially, this repo is a monorepo that holds all of our backend microservices together. These
microservices are designed in a way to communicate with each other.

# Production Usage

As explained in the motivation section, each service in our repo is hosted as a separate server.
Each of these servers are hosted as subdomain of `api.hexlabs.org`. To see each services endpoints
and how to format the request, visit our [docs site](https://docs.hexlabs.org). Here is a list of
our current services, their URL, and description:

- auth ([auth.api.hexlabs.org](https://auth.api.hexlabs.org))
  - handles user authentication through Google Identity Provider / Google Firebase
  - allows frontend services to retrieve tokens and login/logout users
- checkin ([checkin.api.hexlabs.org](https://checkin.api.hexlabs.org))
  - handles checking in users to our events when they first arrive
- files ([files.api.hexlabs.org](https://files.api.hexlabs.org))
  - handles uploading and managing files for user (like resume)
  - allows admins to view and download files
- hexathons ([hexathons.api.hexlabs.org](https://hexathons.api.hexlabs.org))
  - generic service to manage our events (hexathon covers hackathon, makeathon, etc.)
  - manages the event name and whether it's active or not
- interactions ([interactions.api.hexlabs.org](https://interactions.api.hexlabs.org))
  - keeps track of participant interaction during an event (ie. when they visit a workshop, get
    food, attend a tech talk)
- notifications ([notifications.api.hexlabs.org](https://notifications.api.hexlabs.org))
  - manages sending user notifications to platforms like email, sms, slack
- registration ([registration.api.hexlabs.org](https://registration.api.hexlabs.org))
  - handles user registration and stores application information
  - allows us to create new application branches and edit application questions
- users ([users.api.hexlabs.org](https://users.api.hexlabs.org))
  - handles user information like name, demographic, etc.
  - handles companies and whether a user (like sponsor) is from a certain company
  - handles team management and joining/leaving a team

# Development Guide

## Repo Overview

Here's a breakdown of the major folders you'll interact with and what each one does:

### `config`

This packages handles the configuration for all the gateway and services. It specifies port numbers,
database URLs, rate limiting, etc. Use this to setup and add new services.

### `gateway`

The gateway handles all incoming requests. Based on the url format, it will forward the request to
the appropriate service to handle it. For example, all requests starting with `/users` will be sent
to the users service.

### `services`

Each of the services in this folder has a unique and distinct job. They each are setup with their
own database and have their own routing system.

## Getting Started

First, you'll need to ask a team member for the following **secret** files:

- `.env`
- `google-cloud-credentials.json`

Then, place them inside the `config` folder.

The packages in this repo are linked via Yarn Workspaces, so you only need to run `yarn install`
once in the main root folder to install all the dependencies in the monorepo.

Finally, after you install the packages:

- Run `yarn start:all` to start all the services
- Run `cd services/<SERVICE_NAME>` and then run `yarn dev` to start a specific service.

## Service Overview

Each service will be hosted on its own port, which will be printed to the console. So for example,
if you want to access the checkin service, this service is on port 8003, so you would make a request
to `localhost:8003` an access the appropriate path.

## Authentication

This project uses authentication via
[Google Cloud Identity Platform](https://cloud.google.com/identity-platform) that allows us to
easily manage user authentication with JWT. To login, visit
[login.hexlabs.org](https://login.hexlabs.org). Then, open the developer tools. On login, you will
see your user profile printed in the console tab. Your access token can be found under the
`accessToken` field. You can then use that with Bearer Authentication to authenticate against these
services. We recommend using Postman when doing local development. Thus, you would set your
authentication to `Bearer [accessToken]`.

**Note that these tokens expire very quickly after an hour, so you will often have to retrieve a new
token if you receive an unauthenticated error.**

# Attribution

This project was inspired by [HackIllinois API repository](https://github.com/HackIllinois/api).

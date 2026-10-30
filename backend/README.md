<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Project setup

```bash
$ pnpm install
```

## Compile and run the project

```bash
# development
$ pnpm run start

# watch mode
$ pnpm run start:dev

# production mode
$ pnpm run start:prod
```

## Run tests

```bash
# unit tests
$ pnpm run test

# e2e tests
$ pnpm run test:e2e

# test coverage
$ pnpm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ pnpm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Observability

In production applications, observability is essential for understanding how your system behaves, detecting issues early, and maintaining reliable performance.

[NestJS Observe](https://observe.nestjs.com) automatically instruments your NestJS application, giving you deep visibility into your system with minimal setup:

- **Distributed tracing:** Follow requests across services and understand how they flow through your system.
- **Waterfall analysis:** Visualize request execution and identify slow operations, bottlenecks, and unexpected delays.
- **Performance analysis:** Analyze application performance in real time and quickly pinpoint areas that need optimization.
- **Metrics:** Track key application and infrastructure metrics to understand system health and performance trends.
- **Logging:** Centralize and correlate logs with traces and other telemetry to make debugging easier.
- **Error tracking:** Detect errors quickly and investigate their root causes with the surrounding context.
- **SLA monitoring:** Track service-level objectives and identify when your application is approaching or exceeding defined thresholds.
- **Alarms and alerts:** Set up alerts for critical errors, performance degradation, SLA violations, and other anomalies so your team can react quickly.

This project is already instrumented. To connect it, run this and approve the code it prints at [observe.nestjs.com/link](https://observe.nestjs.com/link) - signing up for free if you have no account:

```bash
$ npx @nestjs/observe link
```

It writes the app key and secret into `.env` and makes every `nest start` script (`start`, `start:dev`, `start:debug`) load it. In production, set `OBSERVE_APP_KEY` and `OBSERVE_APP_SECRET` in the environment instead.

Or do it by hand: create an application and an API key at [observe.nestjs.com](https://observe.nestjs.com), and set the pair as `OBSERVE_APP_KEY` and `OBSERVE_APP_SECRET` in the environment the app runs in.

The free plan needs no payment details and covers 300,000 events a month. You can also browse the [live demo](https://www.observe-demo.nestjs.com/dashboard) first - the whole dashboard over a busy service's data, with nothing to install.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Auto-instrument your application with [NestJS Observe](https://observe.nestjs.com). Distributed tracing, metrics, and logging made easy. Error tracking and performance monitoring for your NestJS applications.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
## Prisma 8 y PostgreSQL

Este proyecto usa Prisma ORM 8 (release candidate) y PostgreSQL 15 o superior. Usa Node.js 22.18+, 24.11+ o 26+; se recomienda Node.js 24. Copia `.env.example` a `.env` y configura `DATABASE_URL` con las credenciales de tu base de datos. No incluyas `.env` en el repositorio.

Los modelos se definen en `src/prisma/contract.prisma`. Después de cada cambio, ejecuta `pnpm prisma:emit` y versiona los archivos generados `contract.json` y `contract.d.ts`.

Para una base de datos nueva y vacía, ejecuta `pnpm prisma:db:init` después de definir y emitir los modelos. Para cambios posteriores, ejecuta `pnpm prisma:migration:plan --name nombre_del_cambio`, revisa los archivos en `migrations/` y aplica la migración con `pnpm prisma:migrate`. Versiona el directorio `migrations/`. Para comprobar el estado de la base, usa `pnpm prisma:verify`. `pnpm prisma:db:update` también permite actualizar una base de desarrollo directamente; revisa cuidadosamente cualquier cambio que elimine datos.

Inyecta `PrismaService` desde `src/prisma/prisma.service.ts` en tus servicios de NestJS y consulta los modelos mediante `prisma.db.orm.public`. El cliente se crea al primer uso y cierra sus conexiones al detener la aplicación. Prisma 8 todavía es una versión candidata y algunas funcionalidades no están disponibles: consulta su [estado oficial](https://www.prisma.io/docs/orm/release-status).

## Autenticación

Configura `JWT_SECRET` en `.env` con un secreto aleatorio de al menos 32 bytes (por ejemplo, genera uno con `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`). El servidor no inicia si falta. Aplica el contrato a PostgreSQL antes de usar la API; se incluye una migración inicial en `migrations/`.

- `POST /auth/register`: `{ "email", "password" }`, registra un usuario; contraseña de 12 a 256 caracteres.
- `POST /auth/login`: recibe las mismas credenciales y devuelve `accessToken`, `refreshToken`, `tokenType` y `expiresIn` (900 segundos).
- `POST /auth/refresh`: recibe `{ "refreshToken" }` y devuelve un nuevo par. El token anterior deja de ser válido; la sesión caduca 30 días después del inicio de sesión.
- `GET /auth/me`: devuelve el usuario autenticado.
- `POST /auth/logout` y `POST /auth/logout-all`: cierran la sesión actual o todas las sesiones.
- `POST /auth/change-password`: recibe `{ "currentPassword", "newPassword" }`, cambia la contraseña y cierra todas las sesiones.

Los tres últimos grupos requieren `Authorization: Bearer <accessToken>`. Los clientes móviles deben guardar los tokens en almacenamiento seguro, transmitirlos únicamente por HTTPS y sustituir ambos tokens después de cada renovación. Las contraseñas se almacenan con scrypt y los tokens de renovación como hashes. El límite de solicitudes es por IP y se mantiene en memoria por instancia; para despliegues con varias instancias se necesita almacenamiento compartido y configurar correctamente el proxy de confianza. La verificación de correo y la recuperación de contraseña no están implementadas: requieren un proveedor de correo y un flujo de enlaces configurados.

Para probar la autenticación con una base de datos de prueba ya inicializada, define `TEST_DATABASE_URL` y ejecuta `pnpm test:e2e`. Usa una base exclusiva para pruebas: el test crea usuarios y sesiones.

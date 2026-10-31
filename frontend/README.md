This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Autenticación local

La interfaz usa los tokens de tema de shadcn y `next-themes`. El selector del encabezado permite elegir claro, oscuro o seguir la configuración del sistema; la elección se conserva en el navegador.

El frontend se ejecuta en `http://localhost:3001` con `pnpm dev`. Por defecto se conecta al backend en `http://localhost:3000`; para cambiarlo, copia `.env.example` a `.env.local` y modifica `AUTH_API_URL`. Esta dirección se utiliza en el servidor de Next.js, por lo que debe ser accesible desde él.

Configura y arranca el backend con PostgreSQL y `JWT_SECRET` siguiendo su README. La página principal enlaza a registro e inicio de sesión; ambos llevan al dashboard. Los tokens se guardan en cookies HttpOnly y el servidor del frontend los renueva cuando corresponde. Para producción sirve el frontend por HTTPS. El límite por IP del backend verá la dirección del servidor frontend al usar este intermediario; configura un límite por cliente en el proxy de entrada antes de exponerlo públicamente.

Las nuevas vistas privadas van en `app/(protected)/`, por ejemplo `app/(protected)/posts/page.tsx`: el grupo no forma parte de la URL. El proxy comprueba inicialmente las cookies en las rutas, salvo las públicas `/`, `/login`, `/register`, API y recursos estáticos. Agrega cualquier nueva ruta pública a `publicPaths` en `proxy.ts`. Para validar la sesión en cada navegación y obtener el usuario, envuelve cada página en `<Protected>{(user) => ...}</Protected>`, como el dashboard. Los layouts pueden conservarse entre navegaciones, por lo que ni el layout ni la presencia de cookies sustituyen esa comprobación. Las acciones, rutas API y consultas a datos privados deben comprobar también la autorización en el servidor y en el backend.

`lib/session.ts` centraliza la validación contra el backend y `lib/user-dto.ts` limita los campos del usuario que se exponen. Ambos son exclusivos del servidor. La caché de React evita repetir la verificación durante un mismo render; no comparte sesiones entre usuarios ni sustituye las comprobaciones de autorización en cada operación.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

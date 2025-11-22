// import { clerkMiddleware } from '@clerk/nextjs/server';

// export default clerkMiddleware();

// export const config = {
//   matcher: [
//     // Skip Next.js internals and all static files, unless found in search params
//     '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
//     // Always run for API routes
//     '/(api|trpc)(.*)',
//   ],
// };
// middleware.ts  (ou src/middleware.ts)
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isProtectedRoute = createRouteMatcher([
  "/criador(.*)", // tudo de criador é privado...
]);

const isPublicRoute = createRouteMatcher([
  "/criador/login(.*)", // ...menos login
  "/",                  // landing
  "/api/webhooks(.*)",  // se tiver webhook público
]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req) && !isPublicRoute(req)) {
    await auth.protect();
  }
});

// ✅ CRÍTICO: faz o middleware rodar também em /api
export const config = {
  matcher: [
    // ignora _next e arquivos estáticos
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // sempre roda para API routes
    "/(api|trpc)(.*)",
  ],
};

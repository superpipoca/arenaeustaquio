// // proxy.ts
// import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// const isProtectedRoute = createRouteMatcher([
//   "/criador(.*)",
//   "/arena(.*)",
//   "/api/launch-token-after-pix",
//   "/api/ensure-user-profile",
//   "/api/webhook(.*)",
//   "/api/pix(.*)",
// ]);

// export default clerkMiddleware(async (auth, req) => {
//   if (isProtectedRoute(req)) {
//     await auth.protect();
//   }
// });

// export const config = {
//   matcher: [
//     "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
//     "/(api|trpc)(.*)",    
//   ],
// };
// middleware.ts  (ou proxy.ts)
// proxy.ts
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
const clerkProxy = clerkMiddleware((auth, req) => {
  return NextResponse.next();
});

export function proxy(req: NextRequest) {
  return clerkProxy(req);
}

export const config = {
  matcher: [
    "/((?!_next|.*\\..*).*)",
    "/(api|trpc)(.*)",
  ],
};

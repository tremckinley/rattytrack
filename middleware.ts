import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/utils/supabase/middleware";

export async function middleware(request: NextRequest) {
    const { response, user, supabase } = await updateSession(request);

    // Define public routes that don't require authentication
    const publicRoutes = ["/login", "/signup", "/api/stripe/webhook"];
    const isPublicRoute = 
        publicRoutes.includes(request.nextUrl.pathname) || 
        request.nextUrl.pathname.startsWith("/auth") ||
        request.nextUrl.pathname.startsWith("/api/webhooks");

    // Redirect unauthenticated users to login page if they try to access a non-public route
    if (!user && !isPublicRoute) {
        return Response.redirect(new URL("/login", request.url));
    }

    // Protected Admin Routes
    if (request.nextUrl.pathname.startsWith("/admin")) {
        if (!user) {
            return Response.redirect(new URL("/login", request.url));
        }

        // Check for admin role
        const { data: userData } = await supabase
            .from("users")
            .select("role")
            .eq("supabase_user_id", user.id)
            .single();

        if (userData?.role !== "admin") {
            return Response.redirect(new URL("/", request.url));
        }
    }

    // Redirect authenticated users away from auth pages
    if (user && (request.nextUrl.pathname === "/login" || request.nextUrl.pathname === "/signup")) {
        return Response.redirect(new URL("/", request.url));
    }

    return response;
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * Feel free to modify this pattern to include more paths.
         */
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ],
};

import { handleRelease } from "@/lib/common";
import type { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(req: NextRequest) {
    const params = req.nextUrl.searchParams;
    const product = params.get("product"),
        os = params.get("os"),
        arch = params.get("arch"),
        current = params.get("current");
    return await handleRelease(req, product, os, arch, current);
}

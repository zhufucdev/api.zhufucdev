import { handleRelease } from "@/lib/common";
import type { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(req: NextRequest) {
    const params = req.nextUrl.searchParams;
    const product = decodeURIComponent(params.get("product") ?? ""),
        os = decodeURIComponent(params.get("os") ?? ""),
        arch = decodeURIComponent(params.get("arch") ?? ""),
        current = decodeURIComponent(params.get("current") ?? "");
    return await handleRelease(req, product, os, arch, current);
}

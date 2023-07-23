import { Release, handleRelease } from "@/lib/common";
import { getAll } from "@vercel/edge-config";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

export async function GET(req: NextRequest) {
    const params = req.nextUrl.searchParams;
    const key = params.get("category"),
        os = params.get("os"),
        arch = params.get("arch"),
        current = params.get("current");
    const products = (await getAll()) as any;
    let targets: string[] = [];
    for (const product in products) {
        const category = products[product].category;
        if (Array.isArray(category) && category.includes(key)) {
            targets.push(product);
            break;
        }
    }
    const results = await Promise.all(
        targets.map((p) =>
            handleRelease(req, p, os, arch, current).then((v) =>
                v.ok ? v.json() : undefined,
            ),
        ),
    );
    const responseBody: Release[] = [];
    for (const result of results) {
        if (result) responseBody.push(result);
    }

    return NextResponse.json(responseBody);
}

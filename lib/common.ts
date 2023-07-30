import { NextRequest, NextResponse } from "next/server";
import { bestProvider } from "./providers";
import { has } from "@vercel/edge-config";

export type Architect = "arm64" | "arm32" | "x86" | "amd64" | "universal";
export type OperatingSystem = "android" | "linux" | "windows" | "darwin";

export interface Qualification {
    arch?: Architect;
    os?: OperatingSystem;
}

export interface Release {
    url: string;
    versionName: string;
    productName: string;
}

export interface ProductProfile {
    name: string;
    repo: string;
    match?: string;
    matchArch?: string;
    matchOs?: string;
    category?: string[];
}

export async function handleRelease(
    req: NextRequest,
    product: any,
    os: any,
    arch: any,
    current: any,
): Promise<NextResponse> {
    if (!product) {
        return NextResponse.json("product is not optional", { status: 400 });
    }
    if (typeof product !== "string" || !(await has(product))) {
        return NextResponse.json(`unknown product: ${product}`, {
            status: 400,
        });
    }
    if (
        os &&
        typeof os === "string" &&
        !["android", "linux", "windows", "darwin"].includes(os)
    ) {
        return NextResponse.json(`unknown os: ${os}`, { status: 400 });
    }
    if (
        arch &&
        typeof arch === "string" &&
        !["arm64", "arm32", "x86", "amd64", "universal"].includes(arch)
    ) {
        return NextResponse.json(`unknown arch: ${arch}`, { status: 400 });
    }

    const provider = await bestProvider(req, product);
    const currentVersion =
        typeof current === "string" ? provider.parseVersion(current) : 0;
    const qualification: Qualification | undefined =
        os || arch
            ? { os: os as OperatingSystem, arch: arch as Architect }
            : undefined;

    const release = await provider.getUpdate(currentVersion, qualification);
    if (release) {
        return NextResponse.json(release);
    } else {
        return NextResponse.json("not found", { status: 404 });
    }
}

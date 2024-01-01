import {NextRequest, NextResponse} from "next/server";
import {bestProvider} from "./providers";
import {parseVersion} from "@/lib/utility";
import {has} from "@/lib/config";

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
    repo: Repo;
    match?: string;
    matchArch?: string;
    matchOs?: string;
    category?: string[];
}

export interface Repo {
    github?: string | RepoOptions;
    teamcity?: string | RepoOptions;
}

export interface RepoOptions {
    resource: string;
    mode?: "prefer" | "restrict";
    region?: string;
}

export async function handleRelease(
    req: NextRequest,
    product: any,
    os: any,
    arch: any,
    current: any,
): Promise<NextResponse> {
    if (!product) {
        return NextResponse.json("product is not optional", {status: 400});
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
        return NextResponse.json(`unknown os: ${os}`, {status: 400});
    }
    if (
        arch &&
        typeof arch === "string" &&
        !["arm64", "arm32", "x86", "amd64", "universal"].includes(arch)
    ) {
        return NextResponse.json(`unknown arch: ${arch}`, {status: 400});
    }

    const provider = await bestProvider(req, product);
    if (!provider) {
        return NextResponse.json("no provider available", {status: 500})
    }
    const currentVersion =
        typeof current === "string" ? parseVersion(current) : 0;
    const qualification: Qualification | undefined =
        os || arch
            ? {os: os as OperatingSystem, arch: arch as Architect}
            : undefined;

    const release = await provider.getUpdate(currentVersion, qualification);
    if (release) {
        return NextResponse.json(release);
    } else {
        return NextResponse.json("not found", {status: 404});
    }
}

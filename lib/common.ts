import type { VercelRequest, VercelResponse } from "@vercel/node";
import { bestProvider } from "./providers";
import { has } from "@vercel/edge-config";

export async function handleRelease(
    req: VercelRequest,
    res: VercelResponse,
    product: any,
    os: any,
    arch: any,
    current: any,
) {
    if (!product) {
        res.status(400).send("product is not optional");
        return;
    }
    if (typeof product !== "string" || !(await has(product))) {
        res.status(400).send(`unknown product: ${product}`);
        return;
    }
    if (
        typeof os === "string" &&
        !["android", "linux", "windows", "darwin"].includes(os)
    ) {
        res.status(400).send(`unknown os: ${os}`);
        return;
    }
    if (
        typeof arch === "string" &&
        !["arm64", "arm32", "x86", "amd64", "universal"].includes(arch)
    ) {
        res.status(400).send(`unknown arch: ${arch}`);
        return;
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
        res.json(release);
    } else {
        res.status(404).send("not found");
    }
}

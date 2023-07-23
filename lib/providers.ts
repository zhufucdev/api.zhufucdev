import { get } from "@vercel/edge-config";
import type { VercelRequest } from "@vercel/node";
import GithubProvider from "./github-provider";

export async function bestProvider(
    req: VercelRequest,
    product: string,
): Promise<ReleaseProvider> {
    return new GithubProvider(product, (await get(product))!);
}

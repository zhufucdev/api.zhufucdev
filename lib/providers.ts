import { get } from "@vercel/edge-config";
import GithubProvider from "./github-provider";
import { ReleaseProvider } from "./common";
import { NextRequest } from "next/server";

export async function bestProvider(
    req: NextRequest,
    product: string,
): Promise<ReleaseProvider> {
    return new GithubProvider(product, (await get(product))!);
}

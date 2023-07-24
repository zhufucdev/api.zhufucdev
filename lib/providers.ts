import { get } from "@vercel/edge-config";
import GithubProvider from "./github-provider";
import {Qualification, Release} from "./common";
import { NextRequest } from "next/server";

export async function bestProvider(
    req: NextRequest,
    product: string,
): Promise<ReleaseProvider> {
    return new GithubProvider(product, (await get(product))!);
}

export interface ReleaseProvider {
    /**
     * Product identifier
     */
    product: string

    /**
     * Query any update according to current version code
     * @param current A larger number means a newer version.
     * Corresponding to {@link parseVersion}
     * @param qualify
     * @return URL to this update, or undefined if there's none
     */
    getUpdate(current: number, qualify?: Qualification): Promise<Release | undefined>

    /**
     * Parse a version name
     * @param versionName
     * @return the version code, the greater, the newer
     */
    parseVersion(versionName: string): number
}

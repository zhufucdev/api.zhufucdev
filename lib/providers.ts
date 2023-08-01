import { get } from "@vercel/edge-config";
import GithubProvider from "./github-provider";
import {ProductProfile, Qualification, Release} from "./common";
import { NextRequest } from "next/server";
import {TeamcityProvider} from "@/lib/teamcity-provider";

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
}

export async function bestProvider(
    req: NextRequest,
    product: string,
): Promise<ReleaseProvider> {
    const profile = (await get(product)) as ProductProfile;
    if (profile.repo.teamcity && req.geo && req.geo.country === "CN") {
        return new TeamcityProvider(product, profile, process.env.TC_URL!, process.env.TC_TOKEN!);
    }
    return new GithubProvider(product, profile);
}

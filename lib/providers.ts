import {get} from "@vercel/edge-config";
import GithubProvider from "./github-provider";
import {ProductProfile, Qualification, Release, Repo, RepoOptions} from "./common";
import {NextRequest} from "next/server";
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
    if (req.geo && Object.entries(req.geo).length > 0) {
        return pick(
            req,
            profile.repo,
            {
                github: () => new GithubProvider(product, getRepoId(profile.repo.github!), profile),
                teamcity: () => {
                    let buildType = getRepoId(profile.repo.teamcity!);
                    let bucket = process.env.S3_URL!
                    if (buildType.includes("/")) {
                        const splits = buildType.split("/");
                        buildType = splits.slice(splits.length - 1)[0];
                        bucket += "/" + splits.slice(0, splits.length - 1).join("/");
                    }
                    return new TeamcityProvider(
                        product, profile,
                        process.env.TC_URL!,
                        bucket, buildType,
                        process.env.TC_TOKEN!
                    )
                }
            }
        )
    } else {
        return new GithubProvider(product, getRepoId(profile.repo.github!), profile);
    }
}

function getRepoId(option: RepoOptions | string): string {
    return typeof option === "string" ? option : option.resource;
}

function pick(req: NextRequest, repo: Repo, items: { [key in keyof Repo]-?: () => ReleaseProvider }): ReleaseProvider {
    if (!req.geo) return items.github!();
    let fallback: undefined | (() => ReleaseProvider) = undefined;
    for (const [key, generator] of Object.entries(items)) {
        const preferred = preferOrRestrict(repo[key as keyof Repo]!, req);
        if (preferred === true) {
            return generator();
        } else if (preferred !== false) {
            fallback = generator;
        }
    }
    if (!fallback) {
        throw 'No satisfying repos'
    }
    return fallback();
}

function preferOrRestrict(expr: RepoOptions | string, req: NextRequest): boolean | undefined {
    if (!req.geo) {
        return undefined;
    }
    if (typeof expr === 'string' || typeof expr.region === 'undefined') {
        return undefined;
    }
    let match = false;
    if (expr.region.includes("/")) {
        const splits = expr.region.split("/");
        switch (splits.length) {
            case 1:
                if (!req.geo.country) return undefined;
                match = req.geo.country === splits[0].trim();
                break;
            case 2:
                if (!req.geo.country || !req.geo.region) return undefined;
                match =
                    req.geo.region === splits[0].trim() &&
                    req.geo.country === splits[1].trim();
                break;
            case 3:
                if (!req.geo.country || !req.geo.region || !req.geo.city) return undefined;
                match =
                    req.geo.city === splits[0].trim() &&
                    req.geo.region === splits[1].trim() &&
                    req.geo.country === splits[2].trim();
                break;
        }
    } else {
        if (!req.geo.country) return undefined;
        match = req.geo.country === expr.region;
    }
    if (expr.mode === "restrict") {
        return !match;
    }
    return match;
}
import GithubProvider from "./github-provider";
import {
    ProductProfile,
    Qualification,
    Release,
    RepoOptions,
} from "./common";
import {NextRequest} from "next/server";
import {TeamcityProvider} from "@/lib/teamcity-provider";
import {get} from "@/lib/config";

export interface ReleaseProvider {
    /**
     * Product identifier
     */
    product: string;

    /**
     * Query any update according to current version code
     * @param current A larger number means a newer version.
     * Corresponding to {@link parseVersion}
     * @param qualify
     * @return URL to this update, or undefined if there's none
     */
    getUpdate(
        current: number,
        qualify?: Qualification,
    ): Promise<Release | undefined>;

    /**
     * See whether the provider is available
     * @returns true if the provider is online
     */
    ping(): Promise<boolean>;
}

type GeoData = NextRequest['geo']

export async function bestProvider(
    req: NextRequest,
    product: string,
): Promise<ReleaseProvider | undefined> {
    const profile = (await get(product)) as ProductProfile;
    const providerGenerator = {
        github: getGhProvider,
        teamcity: getTcProvider,
    };
    const rank =
        await Promise.all(
            Object.entries(profile.repo)
                .map(([repoName, repo]) => {
                    const genFn =
                        providerGenerator[repoName as keyof typeof providerGenerator];
                    const gen = genFn(product, profile);
                    return {gen, rate: rate(repo, req.geo), ping: gen.ping()};
                })
                .sort((a, b) => a.rate - b.rate)
                .map(v => v.ping.then(ping => ({ping, provider: v.gen})))
        )
    return rank.find(({ping}) => ping)?.provider
}

function rate(repo: string | RepoOptions, geo: GeoData): number {
    if (typeof repo === "string") {
        return 1;
    }
    const prefer = preferOrRestrict(repo, geo)
    if (typeof prefer === "undefined") {
        return 1;
    } else if (prefer) {
        return 2;
    } else {
        return 0;
    }
}

function getTcProvider(product: string, profile: ProductProfile) {
    let buildType = getRepoId(profile.repo.teamcity!);
    let bucket = process.env.S3_URL!;
    if (buildType.includes("/")) {
        const splits = buildType.split("/");
        buildType = splits.slice(splits.length - 1)[0];
        bucket += "/" + splits.slice(0, splits.length - 1).join("/");
    }
    return new TeamcityProvider(
        product,
        profile,
        process.env.TC_URL!,
        bucket,
        buildType,
        process.env.TC_TOKEN!,
    );
}

function getGhProvider(product: string, profile: ProductProfile) {
    return new GithubProvider(
        product,
        getRepoId(profile.repo.github!),
        profile,
    );
}

function getRepoId(option: RepoOptions | string): string {
    return typeof option === "string" ? option : option.resource;
}

function preferOrRestrict(
    expr: RepoOptions | string,
    geo: GeoData
): boolean | undefined {
    if (!geo) {
        return;
    }
    if (typeof expr === "string" || typeof expr.region === "undefined") {
        return;
    }
    let match = false;
    if (expr.region.includes("/")) {
        const splits = expr.region.split("/");
        switch (splits.length) {
            case 1:
                if (!geo.country) return undefined;
                match = geo.country === splits[0].trim();
                break;
            case 2:
                if (!geo.country || !geo.region) return undefined;
                match =
                    geo.region === splits[0].trim() &&
                    geo.country === splits[1].trim();
                break;
            case 3:
                if (!geo.country || !geo.region || !geo.city)
                    return undefined;
                match =
                    geo.city === splits[0].trim() &&
                    geo.region === splits[1].trim() &&
                    geo.country === splits[2].trim();
                break;
        }
    } else {
        if (!geo.country) return undefined;
        match = geo.country === expr.region;
    }
    if (expr.mode === "restrict") {
        return !match;
    }
    return match;
}

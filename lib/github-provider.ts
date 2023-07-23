import { Qualification, Release, ReleaseProvider } from "./common";
import { match as aliasMatch, osAlias, archAlias } from "./utility";

function sort(
    asset: ReleaseAsset,
    qualification: string,
    observe: string,
    alias: { [key: string]: string },
) {
    const match = asset.name.match(new RegExp(observe));
    if (match && match[1] && aliasMatch(match[1], qualification, alias)) {
        return 1;
    }
    return 0;
}

function getQualified(
    qualification: Qualification | undefined,
    profile: ProductProfile,
    assets: ReleaseAsset[],
): ReleaseAsset | undefined {
    let best: [number, ReleaseAsset] | undefined = undefined;
    for (const asset of assets) {
        if (profile.match && asset.name.match(new RegExp(profile.match))) {
            return asset;
        }

        let score = 0;
        if (qualification) {
            if (qualification.arch && profile.matchArch) {
                score += sort(
                    asset,
                    qualification.arch,
                    profile.matchArch,
                    archAlias,
                );
            }
            if (qualification.os && profile.matchOs) {
                score += sort(
                    asset,
                    qualification.os,
                    profile.matchOs,
                    osAlias,
                );
            }

            if (!best || score > best[0]) {
                best = [score, asset];
            }
        }
    }

    return best && best[0] > 0 ? best[1] : undefined;
}

interface ProductProfile {
    repo: string;
    match?: string;
    matchArch?: string;
    matchOs?: string;
}

interface ReleaseAsset {
    name: string;
    browser_download_url: string;
}

interface ReleaseMeta {
    tag_name: string;
    assets: ReleaseAsset[];
}

class GithubProvider implements ReleaseProvider {
    product: string;
    profile: ProductProfile;

    constructor(product: string, profile: ProductProfile) {
        this.product = product;
        this.profile = profile;
    }

    async getUpdate(
        current: number,
        qualification?: Qualification,
    ): Promise<Release | undefined> {
        const response = await fetch(
            `https://api.github.com/repos/${this.profile.repo}/releases/latest`,
            {
                headers: {
                    Accept: "application/vnd.github+json",
                    "X-GitHub-Api-Version": "2022-11-28",
                },
            },
        );
        if (!response.ok) {
            console.warn(
                `[Github Provider] Fetching ${response.url} responded with code ${response.status}`,
            );
            return undefined;
        }
        const latest = (await response.json()) as ReleaseMeta;
        if (current <= 0 || current < this.parseVersion(latest.tag_name)) {
            const release = getQualified(
                qualification,
                this.profile,
                latest.assets as ReleaseAsset[],
            );
            if (!release) {
                console.warn(
                    `[Github Provider] Qualification ${JSON.stringify(
                        qualification,
                    )} wasn't met`,
                );
                return undefined;
            }
            return {
                url: release.browser_download_url,
                name: latest.tag_name,
            };
        }
        return undefined;
    }

    parseVersion(versionName: string): number {
        const matches = /v?([0-9]*)\.([0-9])\.([0-9])/g.exec(versionName);
        if (!matches) return 0;
        return (
            parseInt(matches[1]) * 100 +
            parseInt(matches[2]) * 10 +
            parseInt(matches[3])
        );
    }
}

export default GithubProvider;

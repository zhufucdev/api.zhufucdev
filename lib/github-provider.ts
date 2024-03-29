import {ProductProfile, Qualification, Release} from "./common";
import {parseVersion, nameBasedQualification, Named} from "./utility";
import { ReleaseProvider } from "./providers";

interface ReleaseAsset extends Named {
    name: string;
    browser_download_url: string;
}

interface ReleaseMeta {
    tag_name: string;
    assets: ReleaseAsset[];
}

class GithubProvider implements ReleaseProvider {
    readonly product: string;
    readonly profile: ProductProfile;
    private readonly repoId: string;

    constructor(product: string, repoId: string, profile: ProductProfile) {
        this.product = product;
        this.profile = profile;
        this.repoId = repoId;
    }

    async ping(): Promise<boolean> {
        const res = await fetch('https://api.github.com')
        return res.ok
    }

    async getUpdate(
        current: number,
        qualification?: Qualification,
    ): Promise<Release | undefined> {
        const response = await fetch(
            `https://api.github.com/repos/${this.repoId}/releases/latest`,
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
        if (current <= 0 || current < parseVersion(latest.tag_name)) {
            const release = nameBasedQualification(
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
                versionName: latest.tag_name,
                productName: this.profile.name
            };
        }
        return undefined;
    }
}

export default GithubProvider;

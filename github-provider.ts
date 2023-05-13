import alias from "./alias";
import {Octokit} from "octokit";
import {ReleaseAsset} from "@octokit/webhooks-types";

const ghToken = process.env["GITHUB_TOKEN"];
if (!ghToken) throw 'environment variables not adequate';

const octokit = new Octokit({auth: ghToken});

function getQualified(qualification: Qualification | undefined, assets: ReleaseAsset[]): ReleaseAsset | undefined {
    if (!qualification) return assets[0]
    for (const asset of assets) {
        if ((qualification.os && asset.name.includes(qualification.os) || !qualification.os)
            && (qualification.arch && asset.name.includes(qualification.arch) || !qualification.arch))
            return asset
    }
}

class GithubProvider implements ReleaseProvider {
    product: string

    constructor(product: string) {
        this.product = product
    }

    async getUpdate(current: number, qualification?: Qualification): Promise<Release | undefined> {
        const latest = await octokit.rest.repos.getLatestRelease({
            owner: 'zhufucdev',
            repo: alias[this.product],
        });
        if (current <= 0 || current < this.parseVersion(latest.data.tag_name)) {
            const release = getQualified(qualification, latest.data.assets as ReleaseAsset[])
            if (!release) return undefined;
            return {
                url: release.browser_download_url,
                name: latest.data.tag_name
            }
        }
        return undefined;
    }

    parseVersion(versionName: string): number {
        const matches = /v?([0-9]*)\.([0-9])\.([0-9])/g.exec(versionName);
        if (!matches)
            return 0;
        return parseInt(matches[1]) * 100 + parseInt(matches[2]) * 10 + parseInt(matches[3]);
    }
}

export default GithubProvider;
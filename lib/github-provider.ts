import alias from "./alias";

const ghToken = process.env["GITHUB_TOKEN"];
if (!ghToken) throw 'environment variables not adequate';


function getQualified(qualification: Qualification | undefined, assets: ReleaseAsset[]): ReleaseAsset | undefined {
    if (!qualification) return assets[0]
    for (const asset of assets) {
        if ((qualification.os && asset.name.includes(qualification.os) || !qualification.os)
            && (qualification.arch && asset.name.includes(qualification.arch) || !qualification.arch))
            return asset
    }
}

interface ReleaseAsset {
    name: string
    browser_download_url: string
}

interface ReleaseMeta {
    tag_name: string
    assets: ReleaseAsset[]
}

class GithubProvider implements ReleaseProvider {
    product: string

    constructor(product: string) {
        this.product = product
    }

    async getUpdate(current: number, qualification?: Qualification): Promise<Release | undefined> {
        const response =
            await fetch(
                `https://api.github.com/repos/zhufucdev/${alias[this.product]}/releases/latest`,
                {
                    headers: {
                        'Accept': 'application/vnd.github+json',
                        'Authorization': `Bearer ${ghToken}`,
                        'X-GitHub-Api-Version': '2022-11-28'
                    }
                }
            )
        if (!response.ok) return undefined
        const latest = await response.json() as ReleaseMeta
        if (current <= 0 || current < this.parseVersion(latest.tag_name)) {
            const release = getQualified(qualification, latest.assets as ReleaseAsset[])
            if (!release) return undefined;
            return {
                url: release.browser_download_url,
                name: latest.tag_name
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
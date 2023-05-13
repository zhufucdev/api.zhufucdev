const archAlias: {[key: string]: Architect} = {
    'armeabi': 'arm32',
    'x86_64': 'amd64'
}

const osAlias: {[key: string]: OperatingSystem} = {
    'win': 'windows',
    'macos': 'darwin'
}

function match<T extends string>(name: string, qualification: T, alias: {[key: string]: T}): boolean {
    if (name.includes(qualification)) return true
    for (const aliasName in alias) {
        if (alias[aliasName] == qualification && name.includes(aliasName)) return true
    }
    return false
}

function getQualified(qualification: Qualification | undefined, assets: ReleaseAsset[]): ReleaseAsset | undefined {
    if (!qualification) return assets[0]
    for (const asset of assets) {
        if ((qualification.os && match(asset.name, qualification.os, osAlias) || !qualification.os)
            && (qualification.arch && match(asset.name, qualification.arch, archAlias) || !qualification.arch))
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
                `https://api.github.com/repos/zhufucdev/${this.product}/releases/latest`,
                {
                    headers: {
                        'Accept': 'application/vnd.github+json',
                        'X-GitHub-Api-Version': '2022-11-28'
                    }
                }
            )
        if (!response.ok) {
            console.warn(`[Github Provider] Fetching ${response.url} responded with code ${response.status}`)
            return undefined
        }
        const latest = await response.json() as ReleaseMeta
        if (current <= 0 || current < this.parseVersion(latest.tag_name)) {
            const release = getQualified(qualification, latest.assets as ReleaseAsset[])
            if (!release) {
                console.warn(`[Github Provider] Qualification ${JSON.stringify(qualification)} wasn't met`)
                return undefined;
            }
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
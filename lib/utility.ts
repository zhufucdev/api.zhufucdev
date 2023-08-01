import {Architect, OperatingSystem, ProductProfile, Qualification} from "./common"

export const archAlias: { [key: string]: Architect } = {
    'armeabi': 'arm32',
    'armv71': 'arm32',
    'aarch64': 'arm64',
    'i686': 'x86',
    'x86_64': 'amd64'
}

export const osAlias: { [key: string]: OperatingSystem } = {
    'win': 'windows',
    'macos': 'darwin'
}

export function match<T extends string>(name: string, qualification: T, alias: { [key: string]: T }): boolean {
    if (name.includes(qualification)) return true
    for (const aliasName in alias) {
        if (alias[aliasName] == qualification && name.includes(aliasName)) return true
    }
    return false
}

/**
 * Parse a version name
 * @param versionName
 * @return the version code, the greater, the newer
 */
export function parseVersion(versionName: string): number {
    const matches = /v?([0-9]*)\.([0-9])\.([0-9])/g.exec(versionName);
    if (!matches) return 0;
    return (
        parseInt(matches[1]) * 100 +
        parseInt(matches[2]) * 10 +
        parseInt(matches[3])
    );
}

/**
 * Something that has a string name
 *
 * @see nameBasedQualification
 */
export interface Named {
    name: string;
}

/**
 * Get something that is best qualified for a certain standard
 * @param qualification the standard
 * @param profile what kind of product the standard applies to
 * @param assets all available assets to be judged
 */
export function nameBasedQualification<T extends Named>(
    qualification: Qualification | undefined,
    profile: ProductProfile,
    assets: T[],
): T | undefined {
    let best: [number, T] | undefined = undefined;
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

function sort<T extends Named>(
    asset: T,
    qualification: string,
    observe: string,
    alias: { [key: string]: string },
) {
    const matched = asset.name.match(new RegExp(observe));
    if (matched && matched[1] && match(matched[1], qualification, alias)) {
        return 1;
    }
    return 0;
}

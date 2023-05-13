interface ReleaseProvider {
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

type Architect = 'arm64' | 'arm32' | 'x86' | 'amd64' | 'universal'
type OperatingSystem = 'android' | 'linux' | 'windows' | 'darwin'

interface Qualification {
    arch?: Architect
    os?: OperatingSystem
}

interface Release {
    url: string
    name: string
}
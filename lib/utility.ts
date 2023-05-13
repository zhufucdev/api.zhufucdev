export const archAlias: {[key: string]: Architect} = {
    'armeabi': 'arm32',
    'armv71': 'arm32',
    'aarch64': 'arm64',
    'i686': 'x86',
    'x86_64': 'amd64'
}

export const osAlias: {[key: string]: OperatingSystem} = {
    'win': 'windows',
    'macos': 'darwin'
}

export function match<T extends string>(name: string, qualification: T, alias: {[key: string]: T}): boolean {
    if (name.includes(qualification)) return true
    for (const aliasName in alias) {
        if (alias[aliasName] == qualification && name.includes(aliasName)) return true
    }
    return false
}
const url = process.env.CONFIG_URL
const invalidationSec = parseInt(process.env.CACHE_INVALIDATION ?? '600')

let cache: { [key: string]: any } | undefined = undefined
let lastUpdate = Date.now()

async function getData() {
    if (typeof url === 'undefined') {
        throw 'CONFIG_URL is not specified'
    }

    if (typeof cache === 'undefined' || (Date.now() - lastUpdate) / 1000 >= invalidationSec) {
        const res = await fetch(url)
        if (!res.ok) {
            throw 'Configuration not available (' + res.statusText + ')'
        }
        cache = await res.json()
        lastUpdate = Date.now()
    }
    return cache!!
}

export async function has(name: string) {
    const data = await getData()
    return typeof data[name] !== 'undefined'
}

export function getAll(): Promise<{ [key: string]: any }> {
    return getData()
}

export async function get(name: string) {
    const data = await getData()
    return data[name]
}
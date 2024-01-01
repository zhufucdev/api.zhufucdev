import {Named} from "@/lib/utility";

const url = process.env.CONFIG_URL

let cache: { [key: string]: any } | undefined = undefined

async function getData() {
    if (typeof url === 'undefined') {
        throw 'CONFIG_URL is not specified'
    }

    if (typeof cache === 'undefined') {
        const res = await fetch(url)
        if (!res.ok) {
            throw 'Configuration not available (' + res.statusText + ')'
        }
        cache = await res.json()
    }
    return cache!!
}

export async function has(name: string) {
    const data = await getData()
    return typeof data[name] !== 'undefined'
}

export async function getAll(): Promise<Named[]> {
    return Object.entries(await getData()).map(([key, entry]) => ({name: key, ...entry}))
}

export async function get(name: string) {
    const data = await getData()
    return data[name]
}
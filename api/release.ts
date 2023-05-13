import querystring from "querystring";
import GithubProvider from "../github-provider";
import alias from "../alias";

export const config = {
    runtime: 'edge'
};

interface ReleaseQuery {
    os?: string
    arch?: string
    product?: string
    current?: string
}

export default async (req: Request) => {
    const query = querystring.parse(req.url) as ReleaseQuery
    if (!query.product) {
        return new Response('product is not optional', {status: 400})
    }
    if (query.product ! in alias) {
        return new Response(`unknown product: ${query.product}`, {status: 400})
    }
    if (query.os && !['android', 'linux', 'windows', 'darwin'].includes(query.os)) {
        return new Response(`unknown os: ${query.os}`, {status: 400})
    }
    if (query.arch && !['arm64', 'arm32', 'x86', 'amd64', 'universal'].includes(query.arch)) {
        return new Response(`unknown arch: ${query.arch}`, {status: 400})
    }

    const product = query.product
    const provider = new GithubProvider(alias[product])
    const current = query.current ? provider.parseVersion(query.current) : 0
    const qualification: Qualification = {
        os: query.os as OperatingSystem,
        arch: query.arch as Architect
    }

    const release = await provider.getUpdate(current, qualification)
    if (release)
        return new Response(JSON.stringify(release), {headers: {'Content-Type': 'application/json'}})
    else
        return new Response('not found', {status: 404})
}

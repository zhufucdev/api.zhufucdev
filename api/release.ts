import GithubProvider from "../github-provider";
import alias from "../alias";

export const config = {
    runtime: 'edge'
};

export default async (req: Request) => {
    const query = new URLSearchParams(/.*\?(.*)/g.exec(req.url)![1])
    const product = query.get('product'),
        os = query.get('os'),
        arch = query.get('arch')
    if (!product) {
        return new Response('product is not optional', {status: 400})
    }
    if (product !in alias) {
        return new Response(`unknown product: ${product}`, {status: 400})
    }
    if (os && !['android', 'linux', 'windows', 'darwin'].includes(os)) {
        return new Response(`unknown os: ${os}`, {status: 400})
    }
    if (arch && !['arm64', 'arm32', 'x86', 'amd64', 'universal'].includes(arch)) {
        return new Response(`unknown arch: ${arch}`, {status: 400})
    }

    const provider = new GithubProvider(alias[product])
    const current = query.has('current') ? provider.parseVersion(query.get('current')!) : 0
    const qualification: Qualification = {
        os: os as OperatingSystem,
        arch: arch as Architect
    }

    const release = await provider.getUpdate(current, qualification)
    if (release)
        return new Response(JSON.stringify(release), {headers: {'Content-Type': 'application/json'}})
    else
        return new Response('not found', {status: 404})
}

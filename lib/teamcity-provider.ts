import {ReleaseProvider} from "@/lib/providers";
import {ProductProfile, Qualification, Release} from "@/lib/common";
import {nameBasedQualification, Named, parseVersion} from "@/lib/utility";
import type {Document as Doc, Element as Ele} from "domhandler";
import * as xmlparser from "htmlparser2";

export class TeamcityProvider implements ReleaseProvider {
    product: string;
    private readonly profile: ProductProfile;
    private readonly serverUrl: string;
    private readonly accessToken: string;
    private readonly bucketUrl: string;
    private readonly buildType: string;

    constructor(product: string, profile: ProductProfile, serverUrl: string,
                bucketUrl: string, buildType: string, accessToken: string) {
        this.product = product;
        this.profile = profile;
        this.serverUrl = serverUrl;
        this.accessToken = accessToken;
        this.bucketUrl = bucketUrl;
        this.buildType = buildType;
    }

    async ping(): Promise<boolean> {
        const res = await this.fetchApi(`${this.serverUrl}/app/rest`)
        return res.ok
    }

    private async fetchApi(input: string): Promise<Response> {
        return fetch(input, {headers: {"Authorization": `Bearer ${this.accessToken}`}});
    }

    async getUpdate(current: number, qualify?: Qualification): Promise<Release | undefined> {
        // look for the latest version
        let iterated = 0;
        let version: string | undefined = undefined;
        let target: Doc | undefined = undefined;
        while (true) {
            const latestXml =
                await this.fetchApi(`${this.serverUrl}/app/rest/buildTypes/id:${this.buildType}/builds?locator=count:${iterated + 1}`)
                    .then(v => v.text());
            const build =
                xmlparser.DomUtils.getElementsByTagName("build", xmlparser.parseDocument(latestXml))[iterated];
            if (!build) return undefined;
            const infoXml =
                await this.fetchApi(`${this.serverUrl}${xmlparser.DomUtils.getAttributeValue(build, "href")}`)
                    .then(v => v.text());
            const info = xmlparser.parseDocument(infoXml);
            const tags = xmlparser.DomUtils.getElementsByTagName("tags", info)[0];
            if (tags) {
                for (const tag of tags.children) {
                    const code = xmlparser.DomUtils.getAttributeValue(tag as Ele, "name")!;
                    if (code.match(/^v([0-9]\.)*[0-9]$/)) {
                        version = code;
                        break;
                    }
                }
            }

            if (!version) {
                iterated++;
            } else {
                target = info;
                break;
            }
        }

        if (parseVersion(version) <= current) {
            return undefined;
        }

        const artifacts = xmlparser.DomUtils.getElementsByTagName("artifacts", target)[0];
        const artifactsXml =
            await this.fetchApi(`${this.serverUrl}${xmlparser.DomUtils.getAttributeValue(artifacts, "href")}`)
                .then(v => v.text());
        const files = xmlparser.DomUtils.getElementsByTagName("file", xmlparser.parseDocument(artifactsXml));
        const assets: Named[] = [];
        for (const file of files) {
            assets.push({name: xmlparser.DomUtils.getAttributeValue(file, "name")!});
        }
        const best = nameBasedQualification(qualify, this.profile, assets);
        if (!best) {
            console.warn("[TeamCity Provider] Qualification", qualify, "wasn't met");
            return undefined;
        }
        const build = xmlparser.DomUtils.getElementsByTagName("build", target)[0];
        const id = xmlparser.DomUtils.getAttributeValue(build, "id");
        return {
            url: `${this.bucketUrl}/${this.buildType}/${id}/${best.name}`,
            productName: this.profile.name,
            versionName: version
        }
    }
}

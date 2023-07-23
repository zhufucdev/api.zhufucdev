import { getAll } from "@vercel/edge-config";
import { VercelRequest, VercelResponse } from "@vercel/node";
import { handleRelease } from "lib/common";

export const config = {
    runtime: 'edge'
};

export default async (req: VercelRequest, res: VercelResponse) => {
    if (!req.query) {
        res.status(400).send('query must contain at least one category parameter')
    }
    const {category, os, arch, current} = req.query;
    if (!category) {
        res.status(400).send('category is not optional')
        return
    }
    const products = await getAll();
    let target: string | undefined = undefined;
    for (const key in products) {
        const categorized = products[key]
        if (Array.isArray(categorized) && categorized.includes(category)) {
            target = key;
            break
        }
    }
    if (!target) {
        res.status(404).send(`no item matching ${category}`)
        return
    }
    await handleRelease(req, res, target, os, arch, current)
}

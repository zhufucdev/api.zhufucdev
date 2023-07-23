import type { VercelRequest, VercelResponse } from "@vercel/node";
import handleRelease from "lib/handler";

export const config = {
    runtime: "edge",
};

/**
 * To match an exact product and supply direct download links
 */
export default async (req: VercelRequest, res: VercelResponse) => {
    if (!req.query) {
        res.status(400).send("query must contain at lest product");
        return;
    }
    const { product, os, arch, current } = req.query;
    await handleRelease(req, res, product, os, arch, current);
};

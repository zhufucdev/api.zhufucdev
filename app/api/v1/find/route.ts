import { NextRequest, NextResponse } from "next/server";
import { ProductProfile } from "@/lib/common";
import {getAll} from "@/lib/config";

export const runtime = "edge";

interface ProductQuery {
    name: string;
    key: string;
    category: string[];
}

export async function GET(req: NextRequest) {
    const params = req.nextUrl.searchParams;
    if (!params.has("category")) {
        return NextResponse.json("category is not optional", { status: 400 });
    }
    const categories = decodeURIComponent(params.get("category")!).split(",");
    const queried: ProductQuery[] = [];
    const available = (await getAll()) as ProductProfile[];
    for (const key in available) {
        const product = available[key];
        let content = true;
        for (const tag of categories) {
            if (product.category?.includes(tag) !== true) {
                content = false;
                break;
            }
        }
        if (content) {
            queried.push({
                name: product.name,
                key,
                category: product.category!,
            });
        }
    }
    return NextResponse.json(queried);
}

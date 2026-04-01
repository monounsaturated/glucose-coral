import { NextResponse } from "next/server";
import { getDemoAnalysis } from "../../../lib/demo-data";

export async function GET() {
    const data = getDemoAnalysis();
    return NextResponse.json(data);
}

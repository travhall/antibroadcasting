import { makeRouteHandler } from "@keystatic/next/route-handler";
import keystatic from "@/keystatic.config";

export const { POST, GET } = makeRouteHandler({ config: keystatic });

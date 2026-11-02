import { Capacitor, CapacitorHttp } from "@capacitor/core";

const HOSTED_ORIGIN = "https://sole-mates-network.lovable.app";

/** Only native RPCs need a bridge: the web keeps its original fetch behavior. */
export const nativeServerFetch: typeof fetch = async (input, init) => {
  if (!Capacitor.isNativePlatform()) return fetch(input, init);
  const request = new Request(new URL(input instanceof Request ? input.url : String(input), HOSTED_ORIGIN), init);
  if (new URL(request.url).origin !== HOSTED_ORIGIN) throw new Error("Unexpected server-function origin.");
  const headers = Object.fromEntries(request.headers.entries());
  // Native HTTP has no browser origin; identify the same trusted app origin.
  headers["Origin"] = HOSTED_ORIGIN;
  headers["Accept"] = "application/json";
  const body = request.method === "GET" || request.method === "HEAD" ? undefined : await request.text();
  const data = body === undefined ? undefined : JSON.parse(body);
  const result = await CapacitorHttp.request({
    url: request.url, method: request.method, headers,
    ...(data === undefined ? {} : { data }), responseType: "text",
  });
  return new Response(typeof result.data === "string" ? result.data : JSON.stringify(result.data), {
    status: result.status, headers: result.headers,
  });
};
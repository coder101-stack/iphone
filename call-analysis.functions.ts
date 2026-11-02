import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { analyzeCall } from "./call-analysis.server";

const schema = z.object({
  brand: z.string().max(80), model: z.string().max(80), colorway: z.string().max(120),
  score: z.number(), movement: z.number(), status: z.string().max(40), rocks: z.number(),
  communityPosts: z.number(), reason: z.string().trim().min(3).max(600),
});

export const analyzeCallFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => schema.parse(data))
  .handler(({ data }) => analyzeCall(data));

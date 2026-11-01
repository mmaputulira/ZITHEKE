import { z } from "zod";

const objectIdRegex = /^[a-f\d]{24}$/i;

export const createSubscriptionSchema = z
  .object({
    adId: z.string().trim().regex(objectIdRegex, "Valid adId is required").optional(),
    planId: z.string().trim().regex(objectIdRegex, "Valid planId is required"),
    scope: z.enum(["ad_boost", "seller_membership"]).default("ad_boost"),
  })
  .superRefine((value, ctx) => {
    if (value.scope === "ad_boost" && !value.adId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["adId"],
        message: "Valid adId is required for an advert boost",
      });
    }
  });

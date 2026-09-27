import { z } from "zod";

/** Indian mobile: 10 digits starting 6–9, stored as +91XXXXXXXXXX. */
export const phoneSchema = z
  .string()
  .trim()
  .transform((v) => v.replace(/[\s-]/g, ""))
  .transform((v) => (v.startsWith("+91") ? v : v.startsWith("91") && v.length === 12 ? `+${v}` : `+91${v}`))
  .refine((v) => /^\+91[6-9]\d{9}$/.test(v), {
    message: "Enter a valid Indian mobile number",
  });

export const emailSchema = z.string().trim().toLowerCase().email("Enter a valid email");

export const passwordSchema = z
  .string()
  .min(8, "At least 8 characters")
  .max(72, "At most 72 characters");

export const otpSchema = z
  .string()
  .trim()
  .regex(/^\d{6}$/, "Enter the 6-digit code");

export const signupDetailsSchema = z.object({
  fullName: z.string().trim().min(2, "Enter your name").max(80),
  dateOfBirth: z
    .string()
    .refine((v) => !Number.isNaN(Date.parse(v)), "Enter your date of birth")
    .refine((v) => {
      const dob = new Date(v);
      const age =
        (Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
      return age >= 18 && age < 100;
    }, "You must be at least 18"),
  gender: z
    .enum(["woman", "man", "nonbinary", "prefer_not_to_say"])
    .optional(),
  homeCity: z.string().trim().min(1, "Pick your city"),
});

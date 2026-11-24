import { defineCollection, z } from "astro:content";
import { file } from "astro/loaders";

const projects = defineCollection({
  loader: file("src/data/projects.json"),
  schema: z.object({
    id: z.string(),
    title: z.string(),
    summary: z.string(),
    domain: z.string(),
    lifecycle: z.enum(["active", "workspace", "archived", "lab"]),
    bucket: z.enum(["primary", "workspace", "archived", "lab"]),
    path: z.string(),
    updatedYear: z.number().int(),
    featured: z.boolean().default(false),
    stack: z.array(z.string()).default([]),
    githubUrl: z.url().optional(),
    liveUrl: z.url().optional(),
    coverImage: z.string().optional(),
    coverImageAlt: z.string().optional(),
    coverImageMobile: z.string().optional(),
    previewVideo: z.string().optional(),
    showcaseVideo: z.string().optional(),
    videoPoster: z.string().optional(),
    videoCaption: z.string().optional(),
    galleryImages: z
      .array(
        z.object({
          src: z.string(),
          alt: z.string(),
          aspect: z.enum(["wide", "mobile"]).optional(),
        }),
      )
      .optional(),
  }),
});

export const collections = {
  projects,
};

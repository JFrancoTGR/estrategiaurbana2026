import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

import { PROJECT_STATUS_VALUES } from './config/project-status';

const projects = defineCollection({
  loader: glob({
    pattern: '**/*.{yaml,yml}',
    base: './src/data/projects',
  }),

  schema: ({ image }) =>
    z.object({
      name: z.string(),

      status: z.enum(PROJECT_STATUS_VALUES),

      commercial: z.object({
        available: z.boolean(),
      }),

      location: z.object({
        label: z.string(),
      }),

      price: z
        .object({
          from: z.number().nonnegative(),
          currency: z.enum(['MXN', 'USD']).default('MXN'),
        })
        .optional(),

      card: z.object({
        image: image(),
        alt: z.string(),
      }),

      home: z.object({
        visible: z.boolean().default(false),
        order: z.number().int().nonnegative(),
      }),
    }),
});

const partners = defineCollection({
  loader: glob({
    pattern: '**/*.{yaml,yml}',
    base: './src/data/partners',
  }),

  schema: ({ image }) =>
    z.object({
      partner: z.string(),

      experience: z.string(),

      company: z.string().optional(),

      portrait: z.object({
        image: image(),
        alt: z.string(),
      }),

      description: z.string().optional(),

      home: z.object({
        visible: z.boolean().default(false),
        order: z.number().int().nonnegative(),
      }),
    }),
});

export const collections = {
  projects,
  partners,
};

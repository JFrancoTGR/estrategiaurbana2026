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
        zone: z.enum(['cdmx', 'tijuana']),
        label: z.string(),
      }),

      price: z
        .object({
          from: z.number().nonnegative(),
          currency: z.enum(['MXN', 'USD']).default('MXN'),
        })
        .optional(),

      /*
       * Contexto comercial.
       *
       * Los proyectos históricos pueden no necesitar
       * una ProjectCard comercial.
       */
      card: z
        .object({
          image: image(),
          alt: z.string(),
        })
        .optional(),

      /*
       * Contexto Home.
       *
       * Sólo existe cuando el desarrollo participa
       * en la composición del Home.
       */
      home: z
        .object({
          visible: z.boolean().default(false),
          order: z.number().int().nonnegative(),
        })
        .optional(),

      /*
       * Contexto portfolio de proyectos entregados.
       */
      delivered: z
        .discriminatedUnion('visible', [
          /*
           * Proyecto histórico registrado,
           * pero todavía no publicable.
           *
           * Conservamos las rutas como texto:
           * Astro NO intenta importar los archivos.
           */
          z.object({
            visible: z.literal(false),

            order: z.number().int().nonnegative().optional(),

            units: z.number().int().positive().optional(),

            levels: z.number().int().positive().optional(),

            cover: z
              .object({
                image: z.string(),
                alt: z.string(),
              })
              .optional(),

            gallery: z
              .array(
                z.object({
                  image: z.string(),
                  alt: z.string(),
                }),
              )
              .optional(),
          }),

          /*
           * Proyecto listo para publicarse.
           *
           * Aquí sí exigimos assets reales,
           * porque el componente va a utilizarlos.
           */
          z.object({
            visible: z.literal(true),

            order: z.number().int().nonnegative(),

            units: z.number().int().positive().optional(),

            levels: z.number().int().positive().optional(),

            cover: z.object({
              image: image(),
              alt: z.string(),
            }),

            gallery: z
              .array(
                z.object({
                  image: image(),
                  alt: z.string(),
                }),
              )
              .min(1),
          }),
        ])
        .optional(),
        
      /*
       * Contexto página individual.
       *
       * Los proyectos históricos no necesariamente
       * tendrán una página de detalle.
       */
      detail: z
        .object({
          hero: z.object({
            image: image(),
            alt: z.string(),
          }),
        })
        .optional(),
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

      discipline: z.string(),

      company: z.string().optional(),

      order: z.number().int().nonnegative(),

      portrait: z.object({
        image: image(),
        alt: z.string(),
      }),

      description: z.string().optional(),

      home: z.object({
        visible: z.boolean().default(false),
      }),
    }),
});

export const collections = {
  projects,
  partners,
};

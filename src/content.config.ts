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
        /*
         * Mercado comercial principal.
         *
         * Se utiliza para agrupaciones generales
         * y filtros como CDMX / Tijuana.
         */
        market: z.enum(['cdmx', 'tijuana']),

        /*
         * Zona geográfica específica.
         *
         * Debe utilizar un slug normalizado:
         * juarez, condesa, polanco, tijuana, etc.
         */
        zone: z
          .string()
          .trim()
          .min(1)
          .regex(
            /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
            'location.zone debe utilizar formato slug',
          ),

        /*
         * Texto humano utilizado en la interfaz.
         */
        label: z.string().trim().min(1),
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

const zones = defineCollection({
  loader: glob({
    pattern: '**/*.{yaml,yml}',
    base: './src/data/zones',
  }),

  schema: ({ image }) =>
    z.object({
      name: z.string().trim().min(1),

      market: z.enum(['cdmx', 'tijuana']),

      navigation: z.object({
        visible: z.boolean().default(true),
        order: z.number().int().nonnegative(),
      }),

      seo: z.object({
        title: z.string().trim().min(1),
        description: z.string().trim().min(1),
      }),

      hero: z.object({
        title: z.string().trim().min(1),
        subtitle: z.string().trim().min(1),

        image: image(),

        alt: z.string().trim().min(1),
      }),

      intro: z.object({
        index: z.string().trim().min(1),

        title: z.string().trim().min(1),

        body: z.array(z.string().trim().min(1)).min(1),

        image: image(),

        alt: z.string().trim().min(1),
      }),

      map: z.object({
        center: z.object({
          lat: z.number().min(-90).max(90),
          lng: z.number().min(-180).max(180),
        }),

        zoom: z.number().int().min(1).max(22),
      }),

      gallery: z
        .array(
          z.object({
            image: image(),
            alt: z.string().trim().min(1),
          }),
        )
        .min(1),
    }),
});

export const collections = {
  projects,
  zones,
  partners,
};

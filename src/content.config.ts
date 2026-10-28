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
    z
      .object({
        name: z.string(),

        status: z.enum(PROJECT_STATUS_VALUES),

        commercial: z.object({
          available: z.boolean(),
        }),

        location: z.object({
          /*
           * Mercado comercial principal.
           */
          market: z.enum(['cdmx', 'tijuana']),

          /*
           * Zona geográfica específica.
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
           * Nombre legible de la ubicación.
           */
          label: z.string().trim().min(1),

          /*
           * Dirección física.
           *
           * Temporalmente opcional mientras migramos legacy.
           * Para proyectos con detail.visible=true se exige
           * posteriormente mediante superRefine.
           */
          address: z.array(z.string().trim().min(1)).min(1).optional(),

          /*
           * Coordenadas geográficas del proyecto.
           *
           * Si existen, ambas deben ser coordenadas válidas.
           */
          coordinates: z
            .object({
              lat: z.number().min(-90).max(90),
              lng: z.number().min(-180).max(180),
            })
            .optional(),

          /*
           * Participación en los diferentes mapas del sitio.
           *
           * Temporalmente opcional mientras migramos legacy.
           */
          map: z
            .object({
              home: z.discriminatedUnion('visible', [
                z.object({
                  visible: z.literal(false),

                  /*
                   * Marca temporal de migración.
                   * No participa en ninguna lógica.
                   */
                  reconciled: z.boolean().optional(),
                }),

                z.object({
                  visible: z.literal(true),

                  category: z.enum(['venta', 'renta', 'oficina']),

                  /*
                   * Marca temporal de migración.
                   * No participa en ninguna lógica.
                   */
                  reconciled: z.boolean().optional(),
                }),
              ]),

              detail: z.discriminatedUnion('visible', [
                z.object({
                  visible: z.literal(false),
                }),

                z.object({
                  visible: z.literal(true),

                  zoom: z.number().int().min(1).max(22),
                }),
              ]),
            })
            .optional(),
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
         * Marca
         *
         * Logotipo de marca del desarrollo
         */
        brand: z
          .object({
            logo: z.object({
              image: image(),
              alt: z.string().trim().min(1),
            }),
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
          .discriminatedUnion('visible', [
            /*
             * Proyecto registrado en la colección pero sin
             * página individual pública.
             */
            z.object({
              visible: z.literal(false),
            }),

            /*
             * Proyecto con página individual pública.
             *
             * Si visible=true, todos los datos y recursos
             * requeridos por la ficha deben existir.
             */
            z.object({
              visible: z.literal(true),

              /*
               * Métricas compartidas por los diferentes
               * módulos de la página.
               */
              metrics: z
                .array(
                  z.object({
                    key: z
                      .string()
                      .trim()
                      .min(1)
                      .regex(
                        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
                        'metrics.key debe utilizar formato slug',
                      ),

                    value: z.string().trim().min(1),

                    label: z.string().trim().min(1),

                    unit: z.string().trim().min(1),
                  }),
                )
                .min(1)
                .max(4),

              /*
               * Hero principal del proyecto.
               */
              hero: z.object({
                image: image(),

                alt: z.string().trim().min(1),

                title: z.array(z.string().trim().min(1)).min(1).max(3),

                eyebrow: z.object({
                  primary: z.string().trim().min(1),

                  secondary: z.string().trim().min(1).optional(),
                }),

                cta: z
                  .object({
                    label: z.string().trim().min(1),

                    href: z.string().trim().min(1),
                  })
                  .optional(),
              }),

              /*
               * Overview / introducción del proyecto.
               */
              intro: z.object({
                index: z.string().trim().min(1),

                title: z.object({
                  lead: z.string().trim().min(1),

                  emphasis: z.string().trim().min(1),
                }),

                body: z.array(z.string().trim().min(1)).min(1),

                image: z.object({
                  image: image(),

                  alt: z.string().trim().min(1),
                }),

                decoration: z.object({
                  image: image(),
                }),
              }),

              /*
               * Sección editorial de ubicación.
               *
               * Los datos físicos/geográficos viven en project.location.
               * Aquí sólo vive el contenido editorial del componente.
               */
              location: z.object({
                index: z.string().trim().min(1),

                title: z.object({
                  lead: z.string().trim().min(1),

                  emphasis: z.string().trim().min(1),
                }),

                body: z.array(z.string().trim().min(1)).min(1),
              }),

              /*
               * Sección editorial de amenidades.
               *
               * Si visible=true, requiere contenido y assets
               * necesarios para renderizar el carrusel.
               */
              amenities: z
                .discriminatedUnion('visible', [
                  z.object({
                    visible: z.literal(false),
                  }),

                  z.object({
                    visible: z.literal(true),

                    index: z.string().trim().min(1),

                    title: z.object({
                      lead: z.string().trim().min(1),
                      emphasis: z.string().trim().min(1),
                    }),

                    eyebrow: z.string().trim().min(1).optional(),

                    items: z
                      .array(
                        z.object({
                          image: image(),
                          alt: z.string().trim().min(1),
                          title: z.string().trim().min(1),
                          meta: z.string().trim().min(1).optional(),
                        }),
                      )
                      .min(1),
                  }),
                ])
                .optional(),

              /*
               * Sección editorial de tipologías / plantas.
               *
               * Si visible=true, requiere contenido y assets
               * necesarios para renderizar el selector.
               */
              floorplans: z
                .discriminatedUnion('visible', [
                  z.object({
                    visible: z.literal(false),
                  }),

                  z.object({
                    visible: z.literal(true),

                    index: z.string().trim().min(1),

                    title: z.object({
                      lead: z.string().trim().min(1),
                      emphasis: z.string().trim().min(1),
                    }),

                    items: z
                      .array(
                        z.object({
                          name: z.string().trim().min(1),

                          variant: z.string().trim().min(1).optional(),

                          image: z.object({
                            image: image(),
                            alt: z.string().trim().min(1),
                          }),
                        }),
                      )
                      .min(1),
                  }),
                ])
                .optional(),
              gallery: z
                .discriminatedUnion('visible', [
                  z.object({
                    visible: z.literal(false),
                  }),

                  z.object({
                    visible: z.literal(true),

                    index: z.string().trim().min(1),

                    title: z.object({
                      lead: z.string().trim().min(1),
                      emphasis: z.string().trim().min(1),
                    }),

                    note: z
                      .object({
                        lead: z.string().trim().min(1),
                        action: z.string().trim().min(1),
                      })
                      .optional(),

                    items: z
                      .array(
                        z.object({
                          image: image(),

                          alt: z.string().trim().min(1),

                          variant: z
                            .enum(['standard', 'wide', 'tall', 'feature'])
                            .optional(),
                        }),
                      )
                      .min(1),
                  }),
                ])
                .optional(),
            }),
          ])
          .optional(),
      })
      .superRefine((project, ctx) => {
        const { location, detail } = project;

        const hasCoordinates = Boolean(location.coordinates);

        const homeMapVisible = location.map?.home.visible === true;

        const detailMapVisible = location.map?.detail.visible === true;

        /*
         * Cualquier mapa visible necesita coordenadas reales.
         */
        if ((homeMapVisible || detailMapVisible) && !hasCoordinates) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['location', 'coordinates'],
            message:
              'Todo proyecto visible en un mapa debe tener location.coordinates.',
          });
        }

        /*
         * Un proyecto con página pública debe tener
         * una dirección física centralizada.
         */
        if (
          detail?.visible === true &&
          (!location.address || location.address.length === 0)
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['location', 'address'],
            message:
              'Un proyecto con detail.visible=true debe tener location.address.',
          });
        }

        /*
         * Los proyectos con página pública deben declarar
         * explícitamente su configuración cartográfica.
         */
        if (detail?.visible === true && !location.map) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['location', 'map'],
            message:
              'Un proyecto con detail.visible=true debe definir location.map.',
          });
        }

        /*
         * Los proyectos actuales con página de detalle deben
         * tener coordenadas aunque posteriormente se decida
         * ocultar alguno de sus mapas.
         */
        if (detail?.visible === true && !hasCoordinates) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['location', 'coordinates'],
            message:
              'Un proyecto con detail.visible=true debe tener location.coordinates.',
          });
        }

        /*
         * No tiene sentido habilitar un mapa de detalle
         * para un proyecto sin página individual pública.
         */
        if (detailMapVisible && detail?.visible !== true) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['location', 'map', 'detail', 'visible'],
            message:
              'location.map.detail.visible=true requiere detail.visible=true.',
          });
        }
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

export const PROJECT_STATUS_VALUES = [
  'en-construccion',
  'entregado',
  'fase-proyecto',
] as const;

export type ProjectStatus =
  (typeof PROJECT_STATUS_VALUES)[number];

export const PROJECT_STATUS_META = {
  'en-construccion': {
    label: 'En construcción',
    icon: 'construction',
  },

  entregado: {
    label: 'Entregado',
    icon: 'delivered',
  },

  'fase-proyecto': {
    label: 'Fase proyecto',
    icon: 'planning',
  },
} satisfies Record<
  ProjectStatus,
  {
    label: string;
    icon: 'construction' | 'delivered' | 'planning';
  }
>;
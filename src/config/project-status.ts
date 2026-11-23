export const PROJECT_STATUS_VALUES = [
  'en-construccion',
  'entregado',
  'en-licencias',
] as const;

export type ProjectStatus = (typeof PROJECT_STATUS_VALUES)[number];

export type CommercialProjectStatus = Exclude<ProjectStatus, 'entregado'>;

export const COMMERCIAL_PROJECT_STATUS_VALUES = PROJECT_STATUS_VALUES.filter(
  (status): status is CommercialProjectStatus => status !== 'entregado',
);

export const PROJECT_STATUS_META = {
  'en-construccion': {
    label: 'En construcción',
  },

  entregado: {
    label: 'Entregado',
  },

  'en-licencias': {
    label: 'Licencias',
  },
} satisfies Record<
  ProjectStatus,
  {
    label: string;
  }
>;

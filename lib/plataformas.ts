/** Las plataformas de donde vienen las reseñas. */
export const PLATAFORMAS = ['airbnb', 'google'] as const

export type Plataforma = (typeof PLATAFORMAS)[number]

export const esPlataforma = (p: string): p is Plataforma => (PLATAFORMAS as readonly string[]).includes(p)

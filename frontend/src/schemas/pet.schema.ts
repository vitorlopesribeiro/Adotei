import { z } from 'zod';

// ─── Arrays as const (necessário para z.enum funcionar corretamente) ──────────

const SPECIES   = ['dog', 'cat']                    as const;
const SEX       = ['male', 'female']                as const;
const SIZE      = ['small', 'medium', 'large']      as const;
const FUR_LEN   = ['short', 'medium', 'long', 'none'] as const;

// ─── Sub-schema: localização do ponto de encontro ────────────────────────────

export const meetingLocationSchema = z.object({
  street:       z.string().min(1, 'Rua obrigatória'),
  number:       z.string().min(1, 'Número obrigatório'),
  complement:   z.string().optional(),
  neighborhood: z.string().min(1, 'Bairro obrigatório'),
  city:         z.string().min(1, 'Cidade obrigatória'),
  state:        z.string().length(2, 'Use a sigla do estado (ex: SP)'),
  zipCode:      z.string().regex(/^\d{8}$/, 'CEP inválido — informe 8 dígitos numéricos'),
  // formattedAddress é gerado automaticamente — não é campo de formulário
});

// ─── Schema principal: cadastro de pet ───────────────────────────────────────

export const petSchema = z.object({
  name:        z.string().min(1, 'Nome do pet obrigatório'),
  species:     z.enum(SPECIES),
  ageMonths:   z.number().int().min(0).max(300),
  sex:         z.enum(SEX),
  size:        z.enum(SIZE),
  furColor:    z.string().nullable().default(null),
  furLength:   z.enum(FUR_LEN),
  eyeColor:    z.string().min(1, 'Cor dos olhos obrigatória'),
  neutered:    z.boolean(),
  description: z.string().min(10, 'Descreva o pet com ao menos 10 caracteres'),
  meetingLocation: meetingLocationSchema,
});

// ─── Schema: filtros do catálogo (todos opcionais) ───────────────────────────

export const petFiltersSchema = z.object({
  species:      z.enum(SPECIES).optional(),
  sex:          z.enum(SEX).optional(),
  size:         z.enum(SIZE).optional(),
  furLength:    z.enum(FUR_LEN).optional(),
  furColor:     z.string().optional(),
  eyeColor:     z.string().optional(),
  neutered:     z.boolean().optional(),
  city:         z.string().optional(),
  neighborhood: z.string().optional(),
});

// ─── Tipos inferidos ──────────────────────────────────────────────────────────

export type PetFormData             = z.infer<typeof petSchema>;
export type MeetingLocationFormData = z.infer<typeof meetingLocationSchema>;
export type PetFiltersFormData      = z.infer<typeof petFiltersSchema>;

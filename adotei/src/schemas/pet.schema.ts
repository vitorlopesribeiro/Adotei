import { z } from 'zod';

// Schema Zod para validação do formulário de cadastro de pet
export const petSchema = z.object({
  name: z.string().min(1, 'Nome obrigatório'),
  species: z.enum(['dog', 'cat']),
  // Idade em meses (máx 300 = 25 anos)
  ageMonths: z.number({ error: 'Informe a idade' }).min(0).max(300),
  sex: z.enum(['male', 'female']),
  size: z.enum(['small', 'medium', 'large']),
  // Cor dos pelos é nullable (para pets sem pelo)
  furColor: z.string().nullable(),
  furLength: z.enum(['short', 'medium', 'long', 'none']),
  eyeColor: z.string().min(1, 'Cor dos olhos obrigatória'),
  neutered: z.boolean(),
  description: z.string().min(10, 'Descreva o pet com ao menos 10 caracteres'),
  // Ponto de encontro: local onde o doador entrega o pet (pode ser diferente do endereço pessoal — RN07)
  meetingLocation: z.object({
    street: z.string().min(1, 'Rua obrigatória'),
    number: z.string().min(1, 'Número obrigatório'),
    complement: z.string().optional(),
    neighborhood: z.string().min(1, 'Bairro obrigatório'),
    city: z.string().min(1, 'Cidade obrigatória'),
    state: z.string().length(2, 'Use a sigla do estado (ex: SP)'),
    zipCode: z.string().regex(/^\d{8}$/, 'CEP inválido (8 dígitos)'),
  }),
});

// Tipo inferido do schema para usar no React Hook Form
export type PetFormValues = z.infer<typeof petSchema>;

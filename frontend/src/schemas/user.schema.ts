// Biblioteca de validação de schemas com inferência de tipos TypeScript
import { z } from 'zod';

// Validador de CPF com verificação do dígito verificador
import { cpf } from 'cpf-cnpj-validator';

// ─── Schema do endereço ───────────────────────────────────────────────────────

// Reutilizado tanto no cadastro de usuário quanto no ponto de encontro do pet
export const addressSchema = z.object({
  street:       z.string().min(1, 'Rua obrigatória'),
  number:       z.string().min(1, 'Número obrigatório'),
  complement:   z.string().optional(),                                           // Campo não obrigatório
  neighborhood: z.string().min(1, 'Bairro obrigatório'),
  city:         z.string().min(1, 'Cidade obrigatória'),
  state:        z.string().length(2, 'Use a sigla do estado (ex: SP)'),         // Exatamente 2 caracteres
  zipCode:      z.string().regex(/^\d{8}$/, 'CEP inválido — use 8 dígitos'),    // Apenas 8 dígitos numéricos
});

// ─── Schema principal do formulário de cadastro ───────────────────────────────

export const userSchema = z.object({
  fullName: z.string().min(3, 'Nome deve ter ao menos 3 caracteres'),

  email: z.string().email('E-mail inválido'),

  // A senha é validada aqui mas NUNCA salva no Firestore — vai apenas para o Firebase Auth
  password: z.string().min(6, 'Senha deve ter ao menos 6 caracteres'),

  // Valida o CPF usando a biblioteca cpf-cnpj-validator (verifica dígito verificador)
  cpf: z.string().refine((v) => cpf.isValid(v), 'CPF inválido'),

  // Aceita apenas dígitos, com DDD obrigatório (mínimo 10 dígitos: 2 DDD + 8 número)
  phone: z
    .string()
    .min(10, 'Telefone deve ter DDD + número (mín. 10 dígitos)')
    .regex(/^\d+$/, 'Telefone deve conter apenas números'),

  // Reutiliza o schema de endereço definido acima
  address: addressSchema,
});

// Tipo TypeScript inferido automaticamente do schema — evita duplicação de código
export type UserFormData = z.infer<typeof userSchema>;

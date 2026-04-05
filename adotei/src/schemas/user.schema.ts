import { z } from 'zod';
import { cpf } from 'cpf-cnpj-validator';

// Schema Zod para validação do formulário de cadastro de usuário
export const userSchema = z.object({
  fullName: z.string().min(3, 'Nome deve ter ao menos 3 caracteres'),
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'Senha deve ter ao menos 6 caracteres'),
  // Valida CPF usando a lib cpf-cnpj-validator (dígitos verificadores)
  cpf: z.string().refine((val) => cpf.isValid(val), 'CPF inválido'),
  // Telefone: DDD + número, apenas dígitos
  phone: z.string().min(10, 'Telefone deve ter DDD + número (mín. 10 dígitos)').regex(/^\d+$/, 'Apenas números'),
  // Endereço residencial do usuário
  address: z.object({
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
export type UserFormValues = z.infer<typeof userSchema>;

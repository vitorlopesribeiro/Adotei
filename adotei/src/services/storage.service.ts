// Configuração do Cloudinary via variáveis de ambiente
const CLOUD_NAME = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME!;
const UPLOAD_PRESET = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET!;

// Faz upload da foto do pet para o Cloudinary e retorna a URL pública
// Usa upload_preset sem assinatura (unsigned upload)
export async function uploadPetPhoto(petId: string, imageUri: string): Promise<string> {
  const formData = new FormData();

  // Monta o arquivo para envio (formato esperado pelo React Native)
  formData.append('file', {
    uri: imageUri,
    type: 'image/jpeg',
    name: `${petId}.jpg`,
  } as unknown as Blob);

  // Preset configurado no Cloudinary (permite upload sem API secret)
  formData.append('upload_preset', UPLOAD_PRESET);
  // Organiza as fotos na pasta "pets/" com o ID do pet como nome
  formData.append('public_id', `pets/${petId}`);

  // Chamada à API REST do Cloudinary
  const uploadResponse = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: 'POST', body: formData }
  );

  if (!uploadResponse.ok) {
    const error = await uploadResponse.text();
    throw new Error(`Falha no upload da foto: ${error}`);
  }

  // Retorna a URL HTTPS segura da imagem hospedada
  const result = await uploadResponse.json();
  return result.secure_url as string;
}

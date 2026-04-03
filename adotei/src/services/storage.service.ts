const CLOUD_NAME = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME!;
const UPLOAD_PRESET = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET!;

export async function uploadPetPhoto(petId: string, imageUri: string): Promise<string> {
  const formData = new FormData();

  formData.append('file', {
    uri: imageUri,
    type: 'image/jpeg',
    name: `${petId}.jpg`,
  } as unknown as Blob);

  formData.append('upload_preset', UPLOAD_PRESET);
  formData.append('public_id', `pets/${petId}`);

  const uploadResponse = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: 'POST', body: formData }
  );

  if (!uploadResponse.ok) {
    const error = await uploadResponse.text();
    throw new Error(`Falha no upload da foto: ${error}`);
  }

  const result = await uploadResponse.json();
  return result.secure_url as string;
}

function readEnv(name: string, value: string | undefined): string {
  if (!value || value.trim().length === 0) {
    throw new Error(
      `Variável de ambiente ausente: ${name}. ` +
        `Defina ${name} no arquivo .env antes de iniciar o aplicativo.`,
    );
  }
  return value;
}

export const env = {
  supabaseUrl: readEnv(
    "EXPO_PUBLIC_SUPABASE_URL",
    process.env.EXPO_PUBLIC_SUPABASE_URL,
  ),
  supabaseAnonKey: readEnv(
    "EXPO_PUBLIC_SUPABASE_ANON_KEY",
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  ),
};

export const env = {
  API_URL: import.meta.env.VITE_API_URL,
}

export function assertEnv() {
  if (!env.API_URL) {
    throw new Error(
      'VITE_API_URL não definido. Crie um .env com VITE_API_URL=http://localhost:3000/api/v1',
    )
  }
}

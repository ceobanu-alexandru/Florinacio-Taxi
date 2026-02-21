const BASE_URL = process.env.EXPO_PUBLIC_API_URL;
export async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
    },
    ...options,
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "API error");
  }

  return data;
}
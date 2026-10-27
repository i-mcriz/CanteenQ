const GRAPHQL_ENDPOINT = process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:4000/graphql';

export async function fetchGraphQL<T = any>(
  query: string,
  variables: Record<string, any> = {},
  token?: string,
): Promise<T> {
  const authToken = token || (typeof window !== 'undefined' ? localStorage.getItem('sq_token') : null);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  try {
    const res = await fetch(GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers,
      body: JSON.stringify({ query, variables }),
      cache: 'no-store',
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`GraphQL HTTP error ${res.status}: ${errorText}`);
    }

    const json = await res.json();

    if (json.errors && json.errors.length > 0) {
      throw new Error(json.errors[0].message || 'GraphQL Error');
    }

    return json.data;
  } catch (err: any) {
    console.error('fetchGraphQL error:', err);
    throw err;
  }
}

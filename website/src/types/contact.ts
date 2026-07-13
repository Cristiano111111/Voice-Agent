export interface ContactRequestBody {
  name: string;
  email: string;
  phone?: string;
  service?: string;
  address?: string;
  message?: string;
}

export interface ContactResponseBody {
  success?: true;
  error?: string;
}

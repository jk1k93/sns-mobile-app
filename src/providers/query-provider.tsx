import { QueryClientProvider } from '@tanstack/react-query';
import React, { useState } from 'react';

import { createQueryClient } from '@/lib/query-client';

type Props = { children: React.ReactNode };

export function QueryProvider({ children }: Props) {
  const [queryClient] = useState(createQueryClient);
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

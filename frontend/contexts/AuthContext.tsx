'use client';

import { SessionProvider } from 'next-auth/react';

export interface AuthContextProps {
  children: React.ReactNode;
}

export default function AuthContext({ children }: AuthContextProps) {
  return (
    <SessionProvider basePath="/finsight-ai/api/auth">
      {children}
    </SessionProvider>
  );
}

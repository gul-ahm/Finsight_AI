// app/frontend/ui/NoDataPlaceholder.tsx

import Link from "next/link";
import { Button } from "@/frontend/ui/button";

interface NoDataPlaceholderProps {
  message: string;
  backLink: string;
}

export default function NoDataPlaceholder({ message, backLink }: NoDataPlaceholderProps) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <p className="mb-4 text-muted-foreground">{message}</p>
        <Link href={backLink}>
          <Button variant="outline">Back</Button>
        </Link>
      </div>
    </div>
  );
}

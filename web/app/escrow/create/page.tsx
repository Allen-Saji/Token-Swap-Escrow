import React from "react";
import CreateEscrowForm from "@/components/CreateEscrowForm";

function Page() {
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="min-h-[calc(100vh-4rem)] flex items-start justify-center">
        <CreateEscrowForm />
      </div>
    </main>
  );
}

export default Page;

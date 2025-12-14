import { SignIn } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="flex justify-center items-center h-screen">
      <SignIn
        appearance={{
          elements: {
            rootBox: "mx-auto",
          },
        }}
        routing="path"
        path="/sign-in"
        signUpUrl="/sign-up"
        afterSignInUrl="/dashboard"
        forceRedirectUrl="/dashboard"
      />
    </div>
  );
}

import { SignUp } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="flex justify-center items-center h-screen">
      <SignUp
        appearance={{
          elements: {
            rootBox: "mx-auto",
          },
        }}
        routing="path"
        path="/sign-up"
        signInUrl="/sign-in"
        afterSignUpUrl="/dashboard"
        forceRedirectUrl="/dashboard"
      />
    </div>
  );
}

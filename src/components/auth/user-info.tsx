import { auth, currentUser } from "@clerk/nextjs/server";
import { cache } from "react";

// Cache the user data fetch for better performance
export const getCachedUser = cache(async () => {
  const user = await currentUser();
  return user;
});

export const getCachedAuth = cache(async () => {
  const authData = await auth();
  return authData;
});

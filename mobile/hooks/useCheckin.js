import { useState } from "react";

export const useCheckIn = () => {
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [error, setError] = useState(null);

  const performCheckIn = () => {};
};

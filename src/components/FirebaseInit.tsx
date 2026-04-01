"use client";

import { useEffect } from "react";
import { getFirebaseAnalytics } from "@/lib/firebase";

export default function FirebaseInit() {
  useEffect(() => {
    let cleanup = false;

    async function init() {
      try {
        const analytics = await getFirebaseAnalytics();
        if (!cleanup && analytics) {
          console.log("Firebase Analytics initialized", analytics);
        }
      } catch (error) {
        console.warn("Firebase Analytics failed to initialize", error);
      }
    }

    init();

    return () => {
      cleanup = true;
    };
  }, []);

  return null;
}

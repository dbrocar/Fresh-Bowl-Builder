import { useState, useEffect } from "react";
import { AppData, loadAppData, saveAppData, Dog } from "@/lib/storage";

export function useAppData() {
  const [data, setData] = useState<AppData>({ dogs: [], activeDogId: null });
  const [loading, setLoading] = useState(true);

  const refresh = () => {
    setData(loadAppData());
  };

  useEffect(() => {
    setData(loadAppData());
    setLoading(false);
  }, []);

  const activeDog = data.activeDogId ? data.dogs.find(d => d.id === data.activeDogId) || null : null;

  return {
    data,
    activeDog,
    refresh,
    loading
  };
}

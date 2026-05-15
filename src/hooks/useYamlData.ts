import { useEffect, useState } from "react";
import yaml from "js-yaml";

export function useYamlData(url: string) {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch(url)
      .then(res => res.text())
      .then(text => setData(yaml.load(text)));
  }, [url]);

  return data;
}
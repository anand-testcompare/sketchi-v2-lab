export const productionApps = {
  excalidraw: {
    domainPatterns: ["excalidraw.sketchi.app"],
    title: "Sketchi Excalidraw",
    workerName: "sketchi-excalidraw",
  },
  icons: {
    domainPatterns: ["icons.sketchi.app"],
    title: "Sketchi Icons",
    workerName: "sketchi-icons",
  },
  playground: {
    domainPatterns: ["playground.sketchi.app"],
    title: "Sketchi Playground",
    workerName: "sketchi-playground",
  },
  studio: {
    domainPatterns: ["studio.sketchi.app"],
    title: "Sketchi Studio",
    workerName: "sketchi-studio",
  },
  web: {
    domainPatterns: ["sketchi.app", "www.sketchi.app"],
    title: "Sketchi Web",
    workerName: "sketchi-web",
  },
};

export function productionAppConfig(app = "playground") {
  const appId = String(app ?? "playground").trim();
  const config = productionApps[appId];

  if (!config) {
    throw new Error(
      `Unknown production app "${appId}". Expected one of ${Object.keys(productionApps).join(", ")}.`,
    );
  }

  return { appId, ...config };
}

export function productionDomainWranglerConfig(config, app) {
  const appConfig = productionAppConfig(app);
  const nextConfig = structuredClone(config);

  nextConfig.name = appConfig.workerName;
  nextConfig.topLevelName = appConfig.workerName;
  nextConfig.workers_dev = true;
  nextConfig.routes = appConfig.domainPatterns.map((pattern) => ({
    pattern,
    custom_domain: true,
  }));

  delete nextConfig.route;
  delete nextConfig.domains;
  delete nextConfig.custom_domain;
  delete nextConfig.custom_domains;

  return nextConfig;
}

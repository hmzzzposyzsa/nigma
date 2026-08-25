import type { OpenNextConfig } from "@opennextjs/aws/types/open-next.js";

const config: OpenNextConfig = {
  default: {
    override: {
      wrapper: "cloudflare-node",
      converter: "edge",
    },
  },
  buildCommand: "next build",
  edgeExternals: ["pg-cloudflare"],
};

export default config;

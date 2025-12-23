declare module "@vly-ai/integrations" {
  export class VlyIntegrations {
    constructor(config: { token: string } | { deploymentToken: string } | any);
    email: {
      send(options: { to: string; subject: string; html: string; from?: string }): Promise<any>;
    };
    ai: {
      completion(options: any): Promise<any>;
    };
  }
}

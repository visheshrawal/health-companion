declare module "@vly-ai/integrations" {
  export class VlyIntegrations {
    constructor(config: { token: string });
    email: {
      send(options: { to: string; subject: string; html: string }): Promise<any>;
    };
    ai: {
      completion(options: any): Promise<any>;
    };
  }
}

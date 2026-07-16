export interface AuthCredentialProvider {
  getCredential(): Promise<string | undefined>;
  setCredential(value: string): Promise<void>;
  clearCredential(): Promise<void>;
}

// Session cache only. Persistent credentials are delegated to HuksTokenStore.
export class SessionAuthCredentialProvider implements AuthCredentialProvider {
  private credential?: string;

  async getCredential(): Promise<string | undefined> {
    return this.credential;
  }

  async setCredential(value: string): Promise<void> {
    this.credential = value;
  }

  async clearCredential(): Promise<void> {
    this.credential = undefined;
  }
}

export let appAuthCredentialProvider: AuthCredentialProvider = new SessionAuthCredentialProvider();

export function configureAppAuthCredentialProvider(provider: AuthCredentialProvider): void {
  appAuthCredentialProvider = provider;
}

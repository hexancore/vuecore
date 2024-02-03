import { AR, AppError, ERR, OKA, P as ARW, R } from '@hexancore/common';
import { AbstractAuthDataService, AuthData } from './AbstractAuthDataService';
import { ApiHttpRequestConfig } from '../ApiHttpClient';

export interface LoginAuthWindowDataServiceConfig {
  authUrl: string;
  mainWindow: Window;
  windowFactory?: (url: string) => Window;
  loginPopupOpenFn: (openLoginWindow: () => AR<boolean>) => AR<boolean>;
}

const DEFAULT_WINDOW_FACTORY = (url: string) => {
  return window.open(url, '_blank');
};

interface State {
  window: Window;
  eventHandler: () => void;
  checkCloseInterval: any;
  resolve: (r) => any;
}

export class LoginWindowAuthDataService extends AbstractAuthDataService<AuthData> {
  private state: State;

  public constructor(private readonly serviceConfig: LoginAuthWindowDataServiceConfig) {
    super({ refreshAuthDataFn: () => this.openLoginPopup() });
    this.serviceConfig.windowFactory = this.serviceConfig.windowFactory ?? DEFAULT_WINDOW_FACTORY;

    this.state = {
      window: null,
      eventHandler: null,
      checkCloseInterval: null,
      resolve: null,
    };
  }

  private openLoginPopup(): AR<AuthData> {
    return ARW(new Promise((resolve) => {
      this.serviceConfig.loginPopupOpenFn(() => {
        this.state.window = this.serviceConfig.windowFactory(this.serviceConfig.authUrl);
        this.state.resolve = resolve as any;
        this.serviceConfig.mainWindow.addEventListener('message', this.onAuthWindowMessage.bind(this));
        this.setupAuthWindowCloseChecker();
        return OKA(true);
      });
    }),
    );
  }

  private setupAuthWindowCloseChecker() {
    this.state.checkCloseInterval = setInterval(() => {
      if (!this.state.window || this.state.window.closed) {
        clearInterval(this.state.checkCloseInterval);
        this.state.resolve(new AppError({ type: 'vuecore.infra.http.auth.login_window.closed_before_message', code: 401 }));
      }
    }, 1500);
  }

  private onAuthWindowMessage(event: MessageEvent<string>): void {
    if (event.source === this.state.window) {
      this.serviceConfig.mainWindow.removeEventListener('message', this.state.eventHandler);
      clearInterval(this.state.checkCloseInterval);
      if (event.data === 'ok') {
        this.state.resolve(true);
      } else {
        this.state.resolve(
          new AppError({ type: 'vuecore.infra.http.auth.login_window.auth_error_message', code: 401, data: event.data })
        );
      }
    }
  }

  public canRefreshOnUnauthorized(): boolean {
    return true;
  }

  public injectToRequest(req: ApiHttpRequestConfig): void {
    req.withCredentials = true;
  }
}

import { LoginWindowAuthDataService } from '@/Infrastructure/Http/Auth/LoginWindowAuthDataService';
import { AppErrorCode, ERR, OK, OKA } from '@hexancore/common';
import { TEST_SUIT_NAME } from '@hexancore/common/testutil';
import { JSDOM } from 'jsdom';

describe(TEST_SUIT_NAME(__filename), async () => {
  let service: LoginWindowAuthDataService;
  let popupJsDom: JSDOM;
  let mainJsDom: JSDOM;
  let afterOpenFn = null;

  function createAuthMessage(data) {
    return new MessageEvent('message', {
      source: popupJsDom.window as any,
      origin: popupJsDom.window.location.origin,
      data,
    });
  }

  beforeEach(() => {
    mainJsDom = new JSDOM('<!DOCTYPE html>', { url: 'http://localhost:3001' });
    popupJsDom = new JSDOM('<!DOCTYPE html>', { url: 'http://localhost:3000' });
    popupJsDom.window.opener = mainJsDom.window;

    service = new LoginWindowAuthDataService({
      authUrl: 'http://localhost:3000',
      mainWindow: mainJsDom.window as any,
      windowFactory: () => {
        return popupJsDom.window as any;
      },
      loginPopupOpenFn: (o) => {
          return o().onOk(() => {
            afterOpenFn();
            popupJsDom.window.close();
            (popupJsDom.window as any).closed = true;
            return OK(true);
          });
        },
      });
  });

  describe('refresh', () => {
    test('when popup window sent message, then refresh success', async () => {
      afterOpenFn = () => {
        popupJsDom.window.opener.dispatchEvent(createAuthMessage('ok'));
      };

      let current;
      const result = await service
        .refresh()
        .onOk((v) => {
          current = v;
          return OK(v);
        })
        .onErr((e) => {
          current = e;
          return ERR(e);
        });

      expect(current).toBeTruthy();
      expect(result).toEqual(OK(true));
    });

    test('when popup window sent error message, then error', async () => {
      afterOpenFn = () => {
        popupJsDom.window.opener.dispatchEvent(createAuthMessage('error'));
      };

      let current;
      const result = await service
        .refresh()
        .onOk((v) => {
          current = v;
          return OK(v);
        })
        .onErr((e) => {
          current = e;
          return ERR(e);
        });

      const expectedError = {
        type: 'vuecore.infra.http.auth.login_window.auth_error_message',
        code: AppErrorCode.UNAUTHORIZED,
        data: 'error',
      };
      expect(current).toMatchAppError(expectedError);
      expect(result).toMatchAppError(expectedError);
    });

    test('when popup window close, then error', async () => {
      afterOpenFn = () => {
        popupJsDom.window.close();
        (popupJsDom.window.closed as any) = true;
      };

      let current;
      const result = await service
        .refresh()
        .onOk((v) => {
          current = v;
          return OK(v);
        })
        .onErr((e) => {
          current = e;
          return ERR(e);
        });

      const expectedError = {
        type: 'vuecore.infra.http.auth.login_window.closed_before_message',
        code: AppErrorCode.UNAUTHORIZED,
      };
      expect(current).toMatchAppError(expectedError);
      expect(result).toMatchAppError(expectedError);
    });
  });
});

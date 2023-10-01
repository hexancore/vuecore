import 'jest-expect-message';
import '@hexancore/common/testutil';

process.on('unhandledRejection', (err) => {
  throw new Error("unhandledRejection: "+err);
});

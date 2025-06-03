import { DOWNLOAD_URLS, TEST_VERSIONS } from '../src/config';
import { getDownloadUrl } from '../src/installer';

describe('getDownloadUrl', () => {
  const testCases = [
    {
      version: TEST_VERSIONS.OSS,
      extension: 'tar.gz',
      description: 'latest OSS version'
    },
    {
      version: TEST_VERSIONS.OSS,
      extension: 'zip',
      description: 'Windows OSS version'
    }
  ];

  testCases.forEach(({ version, extension, description }) => {
    it(`should construct the correct download URL for ${description}`, () => {
      const expectedUrl = DOWNLOAD_URLS.OSS_TEMPLATE
        .replace(/{version}/g, version)
        .replace('{extension}', extension);
      expect(getDownloadUrl(version, extension)).toBe(expectedUrl);
    });
  });
}); 
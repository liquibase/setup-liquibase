import * as core from '@actions/core';
import { setupLiquibase } from '../src/installer';

jest.mock('@actions/core');
jest.mock('../src/installer');

const mockCore = core as jest.Mocked<typeof core>;
const mockSetupLiquibase = setupLiquibase as jest.MockedFunction<typeof setupLiquibase>;

describe('main action', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCore.getInput.mockImplementation((name: string) => {
      switch (name) {
        case 'version':
          return 'latest';
        case 'edition':
          return 'oss';
        case 'liquibase-pro-license-key':
          return '';
        default:
          return '';
      }
    });
    mockCore.getBooleanInput.mockReturnValue(false);
    mockSetupLiquibase.mockResolvedValue({
      version: '4.25.0',
      path: '/cache/liquibase'
    });
  });

  it('should run successfully with default inputs', async () => {
    const runModule = await import('../src/index');
    
    expect(mockSetupLiquibase).toHaveBeenCalledWith({
      version: 'latest',
      edition: 'oss',
      licenseKey: '',
      cache: false,
      checkLatest: false
    });
    
    expect(mockCore.setOutput).toHaveBeenCalledWith('liquibase-version', '4.25.0');
    expect(mockCore.setOutput).toHaveBeenCalledWith('liquibase-path', '/cache/liquibase');
  });

  it('should handle Pro edition with license key', async () => {
    mockCore.getInput.mockImplementation((name: string) => {
      switch (name) {
        case 'version':
          return 'latest';
        case 'edition':
          return 'pro';
        case 'liquibase-pro-license-key':
          return 'test-license';
        default:
          return '';
      }
    });

    const runModule = await import('../src/index');
    
    expect(mockSetupLiquibase).toHaveBeenCalledWith({
      version: 'latest',
      edition: 'pro',
      licenseKey: 'test-license',
      cache: false,
      checkLatest: false
    });
  });

  it('should fail when setup throws error', async () => {
    mockSetupLiquibase.mockRejectedValue(new Error('Setup failed'));
    
    const runModule = await import('../src/index');
    
    expect(mockCore.setFailed).toHaveBeenCalledWith('Setup failed');
  });
});
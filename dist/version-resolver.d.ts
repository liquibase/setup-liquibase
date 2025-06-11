export declare class VersionResolver {
    private static instance;
    private http;
    private versionCache;
    private latestVersionCache;
    private readonly FALLBACK_VERSION;
    private constructor();
    static getInstance(): VersionResolver;
    private isRateLimitError;
    resolveVersion(version: string, edition: string, checkLatest: boolean): Promise<string>;
    private getLatestVersion;
    private getAvailableVersions;
}

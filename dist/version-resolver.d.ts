export declare class VersionResolver {
    private static instance;
    private constructor();
    static getInstance(): VersionResolver;
    resolveVersion(version: string): Promise<string>;
}

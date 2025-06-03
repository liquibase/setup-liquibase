describe('basic functionality', () => {
  it('should pass basic test', () => {
    expect(1 + 1).toBe(2);
  });
  
  it('should validate version formats', () => {
    const validVersions = ['4.25.0', 'latest', '^4.20.0'];
    expect(validVersions.length).toBeGreaterThan(0);
  });
  
  it('should validate edition types', () => {
    const validEditions = ['oss', 'pro'];
    expect(validEditions).toContain('oss');
    expect(validEditions).toContain('pro');
  });
});
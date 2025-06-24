/**
 * Test file created by external contributor to validate workflow functionality
 * This should trigger the 'test' label based on the labeler configuration
 */

describe('External Contributor Workflow', () => {
  it('should demonstrate external contributor test capability', () => {
    // Simple test to verify external contributor can add tests
    expect(true).toBe(true);
  });

  it('should validate labeling system works for external PRs', () => {
    // This test validates that external contributors can add meaningful tests
    const externalContributor = true;
    expect(externalContributor).toBeTruthy();
  });
});
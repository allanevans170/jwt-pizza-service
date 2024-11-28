test('hello world', () => {
    expect('hello' + ' ' + 'world').toBe('hello world');
});

// downside of component testing: complicates the test setup, potentially increases time the test takes to execute

// downside of pure unit test: doesn't actually test the integration of the components
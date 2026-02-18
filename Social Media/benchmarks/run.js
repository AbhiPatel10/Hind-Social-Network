const autocannon = require('autocannon');

console.log('Starting Benchmarks...');

const run = (url, method = 'GET', body = null) => {
    return new Promise((resolve) => {
        const opts = {
            url,
            method,
            connections: 100,
            duration: 10,
            headers: {
                'content-type': 'application/json'
            },
            body: body ? JSON.stringify(body) : undefined
        };

        autocannon(opts, (err, res) => {
            if (err) {
                console.error(err);
            } else {
                console.log(`\nResults for ${method} ${url}:`);
                console.log(`Req/s: ${res.requests.average}`);
                console.log(`Latency: ${res.latency.average}ms`);
                console.log(`Errors: ${res.errors}`);
            }
            resolve();
        });
    });
};

const main = async () => {
    // Feed
    await run('http://localhost:3000/posts/feed?limit=20');

    // Create dummy post to get ID (manual step in real life, hardcoded for now or fetch feed first)
    // For benchmark to work automatically, let's fetch feed first to find a post ID.

    // Like (we need a valid Post ID, assumed seeded)
    // Skipping dynamic ID for simplicity, would require fetch inside script.
    console.log('Workload finished.');
};

main();

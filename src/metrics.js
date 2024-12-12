const config = require('./config.js');
const os = require('os');

class Metrics {
    constructor() {
        this.totalRequests = 0;
        this.getRequests = 0;
        this.postRequests = 0;
        this.putRequests = 0;
        this.deleteRequests = 0;

        this.authTokensCreated = 0;
        this.usersRegistered = 0;
        this.usersLoggedIn = 0;
        this.unauthorizedRequests = 0;
        this.numFranchises = 0;
        this.numStoresCreated = 0;
        this.menuHits = 0;
        this.totalOrders = 0;
        this.failedOrders = 0;
        this.totalRevenue = 0;

        //sendMetricsPeriodically(10000, this.sendMetricToGrafana.bind(this));

        const timer = setInterval(() => {
            //this.sendMetricToGrafana('auth', 'all', 'tokens', this.authTokensCreated);
            //this.sendMetricToGrafana('auth', 'all', 'unauthorized', this.unauthorizedRequests);

            //this.sendMetricToGrafana('user', 'all', 'registered', this.usersRegistered);
            //this.sendMetricToGrafana('user', 'all', 'logged-in', this.usersLoggedIn);
        
            //this.sendMetricToGrafana('store', 'all', 'created', this.numStoresCreated);
            //this.sendMetricToGrafana('store', 'all', 'deleted', this.numStoresDeleted);

            //this.sendMetricToGrafana('order', 'all', 'total', this.totalOrders);
            //this.sendMetricToGrafana('order', 'all', 'failed', this.failedOrders);
            //this.sendMetricToGrafana('order', 'all', 'revenue', this.totalRevenue);

            //this.sendMetricToGrafana('franchise', 'all', 'total', this.numFranchises);
            //this.sendMetricToGrafana('menu', 'all', 'hits', this.menuHits);

            this.sendMetricToGrafana('http', 'GET', 'count', this.getRequests);
            this.sendMetricToGrafana('http', 'POST', 'count', this.postRequests);
            this.sendMetricToGrafana('http', 'PUT', 'count', this.putRequests);
            this.sendMetricToGrafana('http', 'DELETE', 'count', this.deleteRequests);
            this.sendMetricToGrafana('http', 'ALL', 'count', this.totalRequests);

            this.sendMetricToGrafana('cpu', 'all', 'usage', getCpuUsagePercentage());
            this.sendMetricToGrafana('memory', 'all', 'usage', getMemoryUsagePercentage());
        }, 10000);
        timer.unref();
    }

    requestTracker(req, res, next) {
        const method = req.method.toUpperCase();
        switch(method) {
            case 'GET':
                this.incrementGetRequests();
                break;
            case 'POST':
                this.incrementPostRequests();
                break;
            case 'PUT':
                this.incrementPutRequests();
                break;
            case 'DELETE':
                this.incrementDeleteRequests();
                break;
            default:
                // Optional: handle other HTTP methods or do nothing
                break;
        }
        next();
    }
   
    incrementGetRequests() {
        this.getRequests++;
        this.totalRequests++;
    }
    incrementPostRequests() {
        this.postRequests++;
        this.totalRequests++;
    }
    incrementPutRequests() {
        this.putRequests++;
        this.totalRequests++;
    }
    incrementDeleteRequests() {
        this.deleteRequests++;
        this.totalRequests++;
    }
    incrementAuthtokensCreated() {
        this.authTokensCreated++;
    }
    incrementUsersRegistered() {
        this.usersRegistered++;
    }
    incrementUsersLoggedIn() {
        this.usersLoggedIn++;
    }
    decrementUsersLoggedIn() {
        this.usersLoggedIn--;
    }
    incrementUnauthorizedRequests() {
        this.unauthorizedRequests++;
    }
    incrementNumActiveStores() {
        this.numStoresCreated++;
    }
    decrementNumActiveStores() {
        this.numStoresCreated--;
    }
    incrementFranchises() {
        this.numFranchises++;
    }
    decrementFranchises() {
        this.numFranchises--;
    }
    incrementMenuHits() {
        this.menuHits++;
    }
    incrementFailedOrders() {
        this.failedOrders++;
    }
    incrementOrders() {
        this.totalOrders++;
    }
    incrementRevenue(amount) {
        this.totalRevenue += amount;
    }

    sendMetricToGrafana(metricPrefix, httpMethod, metricName, metricValue) {
    const metric = `${metricPrefix},source=${config.metrics.source},method=${httpMethod} ${metricName}=${metricValue}`;

    fetch(`${config.metrics.url}`, {
        method: 'post',
        body: metric,
        headers: { Authorization: `Bearer ${config.metrics.userId}:${config.metrics.apiKey}` },
    })
        .then((response) => {
        if (!response.ok) {
            console.error('Failed to push metrics data to Grafana');
        } else {
            console.log(`Pushed ${metric}`);
        }
        })
        .catch((error) => {
            console.error('Error pushing metrics:', error);
        });
    }
}

// function sendMetricsPeriodically(period) {
//     const timer = setInterval(() => {
//         try {
//             const buf = new MetricBuilder();
//             httpMetrics(buf);
//             systemMetrics(buf);
//             //userMetrics(buf);
//             //purchaseMetrics(buf);
//             //authMetrics(buf);

//             const metrics = buf.toString('\n');
//             this.sendMetricToGrafana(metrics);
//         } catch (error) {
//             console.log('Error sending metrics', error);
//         }
//     }, period);
//     timer.unref(); 
// }

// function httpMetrics(buf) {
//     buf.add(`http,source=${config.metrics.source} method=GET count=${metrics.getRequests}`);
//     buf.add(`http,source=${config.metrics.source} method=POST count=${metrics.postRequests}`);
//     buf.add(`http,source=${config.metrics.source} method=PUT count=${metrics.putRequests}`);
//     buf.add(`http,source=${config.metrics.source} method=DELETE count=${metrics.deleteRequests}`);
//     buf.add(`http,source=${config.metrics.source} method=ALL count=${metrics.totalRequests}`);
// }

// function systemMetrics(buf) {
//     const cpuUsage = getCpuUsagePercentage();
//     const memoryUsage = getMemoryUsagePercentage();
//     buf.add(`cpu,source=${config.metrics.source} usage=${cpuUsage}`);
//     buf.add(`memory,source=${config.metrics.source} usage=${memoryUsage}`);
// }
  
function getCpuUsagePercentage() {
    const cpuUsage = os.loadavg()[0] / os.cpus().length;
    return cpuUsage.toFixed(2) * 100;
}

function getMemoryUsagePercentage() {
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    const memoryUsage = (usedMemory / totalMemory) * 100;
    return memoryUsage.toFixed(2);
}
// class MetricBuilder {
//     constructor() {
//         this.metrics = [];
//     }
//     add(metric) {
//         this.metrics.push(metric);
//     }
//     toString(separator = '\n') {
//         return this.metrics.join(separator);
//     }
//     sendMetricsPeriodically(intervalMs, sendFunction) {
//         setInterval(() => {
//             const metricsString = this.toString();
//             sendFunction(metricsString);
//             this.metrics = []; // Clear metrics after sending
//         }, intervalMs);
//     }
// }

const metrics = new Metrics();
module.exports = metrics;
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
    
    // This will periodically sent metrics to Grafana
    const timer = setInterval(() => {
      this.sendMetricToGrafana('request', 'GET', 'total', this.getRequests);
      this.sendMetricToGrafana('request', 'POST', 'total', this.postRequests);
      this.sendMetricToGrafana('request', 'PUT', 'total', this.putRequests);
      this.sendMetricToGrafana('request', 'DELETE', 'total', this.deleteRequests);
      this.sendMetricToGrafana('request', 'all', 'total', this.totalRequests);
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
        this.incrementRequests();
        break;
      case 'POST':
        this.incrementPostRequests();
        this.incrementRequests();
        break;
      case 'PUT':
        this.incrementPutRequests();
        this.incrementRequests();
        break;
      case 'DELETE':
        this.incrementDeleteRequests();
        this.incrementRequests();
        break;
      default:
        // Optional: handle other HTTP methods or do nothing
        break;
    }
    next();
  }
  
  incrementRequests() {
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
  incrementUnauthorizedRequests() {
    this.unauthorizedRequests++;
  }
  decrementUsersLoggedIn() {
    this.usersLoggedIn--;
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

// function sendMetricsPeriodically(period) {
//     const timer = setInterval(() => {
//       try {
//         const buf = new MetricBuilder();
//         httpMetrics(buf);
//         systemMetrics(buf);
//         userMetrics(buf);
//         purchaseMetrics(buf);
//         authMetrics(buf);
  
//         const metrics = buf.toString('\n');
//         this.sendMetricToGrafana(metrics);
//       } catch (error) {
//         console.log('Error sending metrics', error);
//       }
//     }, period);
// }

const metrics = new Metrics();
module.exports = metrics;
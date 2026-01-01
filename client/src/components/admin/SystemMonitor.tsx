import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Activity, 
  Server, 
  Database, 
  Cpu, 
  HardDrive,
  Network,
  AlertTriangle,
  CheckCircle
} from "lucide-react";

interface SystemMetric {
  name: string;
  value: number;
  max: number;
  unit: string;
  status: 'good' | 'warning' | 'critical';
}

export default function SystemMonitor() {
  const [metrics, setMetrics] = useState<SystemMetric[]>([
    { name: 'CPU Usage', value: 45, max: 100, unit: '%', status: 'good' },
    { name: 'Memory Usage', value: 67, max: 100, unit: '%', status: 'warning' },
    { name: 'Disk Usage', value: 23, max: 100, unit: '%', status: 'good' },
    { name: 'API Response Time', value: 245, max: 1000, unit: 'ms', status: 'good' }
  ]);

  const [apiHealth, setApiHealth] = useState([
    { service: 'Printify API', status: 'healthy', responseTime: 245, uptime: '99.9%' },
    { service: 'Database', status: 'healthy', responseTime: 12, uptime: '100%' },
    { service: 'Shopify API', status: 'degraded', responseTime: 1200, uptime: '95.2%' },
    { service: 'Webhook Service', status: 'healthy', responseTime: 89, uptime: '99.8%' }
  ]);

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prev => prev.map(metric => ({
        ...metric,
        value: Math.max(0, Math.min(metric.max, metric.value + (Math.random() - 0.5) * 10))
      })));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good':
      case 'healthy':
        return 'text-green-600';
      case 'warning':
      case 'degraded':
        return 'text-yellow-600';
      case 'critical':
      case 'down':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'degraded':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'down':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default:
        return <CheckCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">System Monitor</h2>
        <p className="text-muted-foreground">
          Real-time system performance and health monitoring
        </p>
      </div>

      {/* System Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric) => (
          <Card key={metric.name}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{metric.name}</CardTitle>
              {metric.name === 'CPU Usage' && <Cpu className="h-4 w-4 text-muted-foreground" />}
              {metric.name === 'Memory Usage' && <HardDrive className="h-4 w-4 text-muted-foreground" />}
              {metric.name === 'Disk Usage' && <Database className="h-4 w-4 text-muted-foreground" />}
              {metric.name === 'API Response Time' && <Network className="h-4 w-4 text-muted-foreground" />}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.round(metric.value)}{metric.unit}
              </div>
              <Progress 
                value={(metric.value / metric.max) * 100} 
                className="mt-2"
              />
              <p className={`text-xs mt-1 ${getStatusColor(metric.status)}`}>
                {metric.status === 'good' ? 'Normal' : 
                 metric.status === 'warning' ? 'Warning' : 'Critical'}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* API Health Status */}
      <Card>
        <CardHeader>
          <CardTitle>Service Health</CardTitle>
          <CardDescription>
            Current status of all connected services and APIs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {apiHealth.map((service) => (
              <div key={service.service} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(service.status)}
                  <div>
                    <div className="font-medium">{service.service}</div>
                    <div className="text-sm text-muted-foreground">
                      Response time: {service.responseTime}ms
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <Badge 
                    variant={
                      service.status === 'healthy' ? 'default' :
                      service.status === 'degraded' ? 'secondary' : 'destructive'
                    }
                  >
                    {service.status}
                  </Badge>
                  <div className="text-sm text-muted-foreground mt-1">
                    Uptime: {service.uptime}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            System events and activity log
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[
              { time: '15:42:30', event: 'Printify API sync completed successfully', type: 'success' },
              { time: '15:40:15', event: 'New product created via API', type: 'info' },
              { time: '15:38:22', event: 'Shopify connection timeout - retrying', type: 'warning' },
              { time: '15:35:10', event: 'Database backup completed', type: 'success' },
              { time: '15:30:05', event: 'Custom function "Auto Product Sync" executed', type: 'info' }
            ].map((activity, index) => (
              <div key={index} className="flex items-center space-x-3 p-2 rounded">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                <div className="flex-1">
                  <div className="text-sm">{activity.event}</div>
                  <div className="text-xs text-muted-foreground">{activity.time}</div>
                </div>
                <Badge 
                  variant={
                    activity.type === 'success' ? 'default' :
                    activity.type === 'warning' ? 'secondary' : 'outline'
                  }
                >
                  {activity.type}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
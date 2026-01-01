import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Workflow, 
  Play, 
  Pause, 
  Plus, 
  Settings,
  Clock,
  Zap
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AutomationWorkflow {
  id: string;
  name: string;
  description: string;
  trigger: string;
  actions: string[];
  status: 'active' | 'paused' | 'error';
  lastRun?: string;
  nextRun?: string;
}

export default function WorkflowAutomation() {
  const [workflows, setWorkflows] = useState<AutomationWorkflow[]>([
    {
      id: '1',
      name: 'Daily Product Sync',
      description: 'Sync all products from Printify daily at 6 AM',
      trigger: 'schedule',
      actions: ['fetch_products', 'update_database', 'send_notification'],
      status: 'active',
      lastRun: '6 hours ago',
      nextRun: 'Tomorrow at 6:00 AM'
    },
    {
      id: '2',
      name: 'New Order Processing',
      description: 'Process new orders and update inventory',
      trigger: 'webhook',
      actions: ['validate_order', 'update_inventory', 'send_confirmation'],
      status: 'active',
      lastRun: '2 minutes ago'
    }
  ]);

  const { toast } = useToast();

  const handleToggleWorkflow = (id: string) => {
    setWorkflows(workflows.map(w => 
      w.id === id 
        ? { ...w, status: w.status === 'active' ? 'paused' : 'active' }
        : w
    ));
    
    const workflow = workflows.find(w => w.id === id);
    toast({
      title: `Workflow ${workflow?.status === 'active' ? 'paused' : 'activated'}`,
      description: `${workflow?.name} has been ${workflow?.status === 'active' ? 'paused' : 'activated'}`,
    });
  };

  const handleRunNow = (workflow: AutomationWorkflow) => {
    toast({
      title: "Workflow triggered",
      description: `Running ${workflow.name} now...`,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Workflow Automation</h2>
          <p className="text-muted-foreground">
            Automate your Printify integration workflows
          </p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          New Workflow
        </Button>
      </div>

      <div className="grid gap-6">
        {workflows.map((workflow) => (
          <Card key={workflow.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Workflow className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{workflow.name}</CardTitle>
                    <CardDescription>{workflow.description}</CardDescription>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge 
                    variant={
                      workflow.status === 'active' ? 'default' :
                      workflow.status === 'paused' ? 'secondary' : 'destructive'
                    }
                  >
                    {workflow.status}
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleWorkflow(workflow.id)}
                  >
                    {workflow.status === 'active' ? (
                      <Pause className="w-4 h-4" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRunNow(workflow)}
                  >
                    <Zap className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-medium">Trigger</Label>
                  <div className="flex items-center mt-1 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4 mr-1" />
                    {workflow.trigger === 'schedule' ? 'Scheduled' : 'Webhook'}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Actions</Label>
                  <div className="mt-1 text-sm text-muted-foreground">
                    {workflow.actions.length} steps configured
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Last Run</Label>
                  <div className="mt-1 text-sm text-muted-foreground">
                    {workflow.lastRun || 'Never'}
                  </div>
                  {workflow.nextRun && (
                    <>
                      <Label className="text-sm font-medium">Next Run</Label>
                      <div className="mt-1 text-sm text-muted-foreground">
                        {workflow.nextRun}
                      </div>
                    </>
                  )}
                </div>
              </div>
              
              <div className="mt-4">
                <Label className="text-sm font-medium">Workflow Steps</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {workflow.actions.map((action, index) => (
                    <Badge key={index} variant="outline">
                      {action.replace('_', ' ')}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Workflow Builder */}
      <Card>
        <CardHeader>
          <CardTitle>Create New Workflow</CardTitle>
          <CardDescription>
            Build custom automation workflows for your Printify integration
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="workflowName">Workflow Name</Label>
              <Input id="workflowName" placeholder="Enter workflow name" />
            </div>
            <div>
              <Label htmlFor="triggerType">Trigger Type</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select trigger" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="schedule">Scheduled</SelectItem>
                  <SelectItem value="webhook">Webhook</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                  <SelectItem value="event">Event-based</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div>
            <Label>Available Actions</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
              {[
                'Fetch Products',
                'Update Database',
                'Send Notification',
                'Process Orders',
                'Update Inventory',
                'Generate Reports',
                'Sync with Shopify',
                'Validate Data'
              ].map((action) => (
                <Button key={action} variant="outline" size="sm" className="justify-start">
                  {action}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline">Preview</Button>
            <Button>Create Workflow</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
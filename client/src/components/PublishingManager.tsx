import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import {
  usePublishPrintifyProduct,
  useHaltPrintifyPublishing,
  useResetPrintifyPublishing,
  usePrintifyPublishingStatus,
  useUnpublishPrintifyProduct
} from "@/hooks/use-printify";
import { Loader2, CheckCircle, XCircle, Clock, AlertTriangle } from "lucide-react";

interface PublishingManagerProps {
  shopId: string;
  productId: string;
  productTitle: string;
}

export function PublishingManager({ shopId, productId, productTitle }: PublishingManagerProps) {
  const { toast } = useToast();
  const [publishData, setPublishData] = useState({
    title: "",
    description: "",
    publish_to_storefront: true,
    external: {
      channels: {
        shopify: {
          publish: false,
          product_id: ""
        },
        etsy: {
          publish: false,
          product_id: ""
        },
        ebay: {
          publish: false,
          product_id: ""
        }
      }
    }
  });

  const publishMutation = usePublishPrintifyProduct(shopId, productId);
  const haltMutation = useHaltPrintifyPublishing(shopId, productId);
  const resetMutation = useResetPrintifyPublishing(shopId, productId);
  const unpublishMutation = useUnpublishPrintifyProduct(shopId, productId);
  const { data: publishingStatus, isLoading: statusLoading } = usePrintifyPublishingStatus(shopId, productId);

  const handlePublish = async () => {
    try {
      await publishMutation.mutateAsync(publishData);
      toast({
        title: "Publishing Started",
        description: `Started publishing "${productTitle}" to selected channels.`,
      });
    } catch (error) {
      toast({
        title: "Publishing Failed",
        description: error instanceof Error ? error.message : "Failed to start publishing",
        variant: "destructive",
      });
    }
  };

  const handleHaltPublishing = async () => {
    try {
      await haltMutation.mutateAsync();
      toast({
        title: "Publishing Halted",
        description: `Stopped publishing process for "${productTitle}".`,
      });
    } catch (error) {
      toast({
        title: "Failed to Halt",
        description: error instanceof Error ? error.message : "Failed to halt publishing",
        variant: "destructive",
      });
    }
  };

  const handleResetPublishing = async () => {
    try {
      await resetMutation.mutateAsync();
      toast({
        title: "Publishing Status Reset",
        description: `Reset publishing status for "${productTitle}". You can now edit and republish.`,
      });
    } catch (error) {
      toast({
        title: "Reset Failed",
        description: error instanceof Error ? error.message : "Failed to reset publishing status",
        variant: "destructive",
      });
    }
  };

  const handleUnpublish = async () => {
    try {
      await unpublishMutation.mutateAsync();
      toast({
        title: "Product Unpublished",
        description: `Unpublished "${productTitle}" from all channels.`,
      });
    } catch (error) {
      toast({
        title: "Unpublish Failed",
        description: error instanceof Error ? error.message : "Failed to unpublish product",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = () => {
    if (statusLoading) {
      return <Badge variant="outline"><Loader2 className="w-3 h-3 mr-1 animate-spin" />Checking...</Badge>;
    }

    if (publishingStatus?.status === "published") {
      return <Badge variant="default" className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Published</Badge>;
    }

    if (publishingStatus?.status === "publishing") {
      return <Badge variant="outline"><Clock className="w-3 h-3 mr-1" />Publishing...</Badge>;
    }

    if (publishingStatus?.status === "failed") {
      return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Failed</Badge>;
    }

    return <Badge variant="secondary"><AlertTriangle className="w-3 h-3 mr-1" />Not Published</Badge>;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Publishing Manager
          {getStatusBadge()}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Publishing Configuration */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="publish-title">Custom Title (optional)</Label>
            <Input
              id="publish-title"
              placeholder={productTitle}
              value={publishData.title}
              onChange={(e) => setPublishData(prev => ({ ...prev, title: e.target.value }))}
            />
          </div>

          <div>
            <Label htmlFor="publish-description">Custom Description (optional)</Label>
            <Textarea
              id="publish-description"
              placeholder="Enter custom description for publishing..."
              value={publishData.description}
              onChange={(e) => setPublishData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="storefront"
              checked={publishData.publish_to_storefront}
              onCheckedChange={(checked) => setPublishData(prev => ({ ...prev, publish_to_storefront: checked }))}
            />
            <Label htmlFor="storefront">Publish to Printify Storefront</Label>
          </div>
        </div>

        {/* External Channels */}
        <div className="space-y-4">
          <h4 className="font-medium">External Channels</h4>

          {/* Shopify */}
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center space-x-2">
              <Switch
                checked={publishData.external.channels.shopify.publish}
                onCheckedChange={(checked) => setPublishData(prev => ({
                  ...prev,
                  external: {
                    ...prev.external,
                    channels: {
                      ...prev.external.channels,
                      shopify: { ...prev.external.channels.shopify, publish: checked }
                    }
                  }
                }))}
              />
              <Label>Shopify</Label>
            </div>
            {publishData.external.channels.shopify.publish && (
              <Input
                placeholder="Product ID (optional)"
                className="w-32"
                value={publishData.external.channels.shopify.product_id}
                onChange={(e) => setPublishData(prev => ({
                  ...prev,
                  external: {
                    ...prev.external,
                    channels: {
                      ...prev.external.channels,
                      shopify: { ...prev.external.channels.shopify, product_id: e.target.value }
                    }
                  }
                }))}
              />
            )}
          </div>

          {/* Etsy */}
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center space-x-2">
              <Switch
                checked={publishData.external.channels.etsy.publish}
                onCheckedChange={(checked) => setPublishData(prev => ({
                  ...prev,
                  external: {
                    ...prev.external,
                    channels: {
                      ...prev.external.channels,
                      etsy: { ...prev.external.channels.etsy, publish: checked }
                    }
                  }
                }))}
              />
              <Label>Etsy</Label>
            </div>
            {publishData.external.channels.etsy.publish && (
              <Input
                placeholder="Product ID (optional)"
                className="w-32"
                value={publishData.external.channels.etsy.product_id}
                onChange={(e) => setPublishData(prev => ({
                  ...prev,
                  external: {
                    ...prev.external,
                    channels: {
                      ...prev.external.channels,
                      etsy: { ...prev.external.channels.etsy, product_id: e.target.value }
                    }
                  }
                }))}
              />
            )}
          </div>

          {/* eBay */}
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center space-x-2">
              <Switch
                checked={publishData.external.channels.ebay.publish}
                onCheckedChange={(checked) => setPublishData(prev => ({
                  ...prev,
                  external: {
                    ...prev.external,
                    channels: {
                      ...prev.external.channels,
                      ebay: { ...prev.external.channels.ebay, publish: checked }
                    }
                  }
                }))}
              />
              <Label>eBay</Label>
            </div>
            {publishData.external.channels.ebay.publish && (
              <Input
                placeholder="Product ID (optional)"
                className="w-32"
                value={publishData.external.channels.ebay.product_id}
                onChange={(e) => setPublishData(prev => ({
                  ...prev,
                  external: {
                    ...prev.external,
                    channels: {
                      ...prev.external.channels,
                      ebay: { ...prev.external.channels.ebay, product_id: e.target.value }
                    }
                  }
                }))}
              />
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          {/* Primary Actions */}
          <div className="flex gap-2">
            <Button
              onClick={handlePublish}
              disabled={publishMutation.isPending}
              className="flex-1"
            >
              {publishMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Publish Product
            </Button>

            <Button
              variant="outline"
              onClick={handleHaltPublishing}
              disabled={haltMutation.isPending}
            >
              {haltMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Halt Publishing
            </Button>
          </div>

          {/* Fix for Stuck Publishing */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <h5 className="font-medium text-yellow-800 mb-2">Stuck Publishing Fix</h5>
            <p className="text-sm text-yellow-700 mb-2">
              If your product is stuck in publishing state and you can't edit titles or pricing, use this reset function.
            </p>
            <Button
              variant="outline"
              onClick={handleResetPublishing}
              disabled={resetMutation.isPending}
              className="border-yellow-300 text-yellow-700 hover:bg-yellow-100"
            >
              {resetMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Reset Publishing Status
            </Button>
          </div>

          {/* Destructive Actions */}
          <div className="flex gap-2">
            <Button
              variant="destructive"
              onClick={handleUnpublish}
              disabled={unpublishMutation.isPending}
              className="flex-1"
            >
              {unpublishMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Unpublish
            </Button>
          </div>
        </div>

        {/* Status Information */}
        {publishingStatus && (
          <div className="p-3 bg-gray-50 rounded-lg">
            <h5 className="font-medium mb-2">Publishing Status</h5>
            <pre className="text-sm text-gray-600 whitespace-pre-wrap">
              {JSON.stringify(publishingStatus, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
}